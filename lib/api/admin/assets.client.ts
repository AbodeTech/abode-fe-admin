import { graphql } from "@/lib/gql/gql";
import { fetchGraphql, execute } from "@/lib/graphql-client";
import { ReadonlyURLSearchParams } from "next/navigation";
import { GetAssetTransactionData, GetAssetTransactionVariables, UpdateFlexAssetInput, ViewAssetData } from "./assets.types";
import type { EditFullOwnershipAssetInput } from "@/lib/gql/graphql";

const VIEW_SUBSCRIBED_CUSTOMERS_ON_ASSET_QUERY = graphql(`
  query ViewSubscribedCustomersOnAsset($assetName: String!, $assetType: String, $filter: String, $size: Int, $startDate: String, $endDate: String, $subscriberType: String) {
    viewSubscribedCustomersOnAsset(assetName: $assetName, assetType: $assetType, filter: $filter, size: $size, startDate: $startDate, endDate: $endDate, subscriberType: $subscriberType) {
      totalSubscribers
      userDetails {
        _id
        name
        email
        phone_number
        salesPerson
        assetName
        sizeBought
        unitPurchased
        landPrice
        landAmountPaid
        documentPrice
        documentAmountPaid
        month_subscription
        startDate
        nextPaymentDate
        isDefaulted
        isSuspended
      }
      unitSold
      earningReceived
      expectedEarning
      defaultedUsers
      suspendedUsers
      completedPayments
      totalPlotsSold
    }
  }
`);

export const getAssetSubscribers = async (assetName: string, assetType: string, searchParams?: ReadonlyURLSearchParams) => {
  const filters = {
    // assetName and assetType are passed as direct variables, not in the filter object for now based on query
    size: searchParams?.get("size") ? Number(searchParams.get("size")) : null,
    startDate: searchParams?.get("start_date") ? new Date(searchParams.get("start_date")!).toISOString() : null, // Ensure ISO string for dates if needed, or keep as string if backend expects string
    endDate: searchParams?.get("end_date") ? new Date(searchParams.get("end_date")!).toISOString() : null,
    subscriberType: searchParams?.get("subscriber_type") || null,
  };

  const variables = {
    assetName,
    assetType,
    ...filters
  };

  // Remove null values
  const cleanVariables = Object.fromEntries(
    Object.entries(variables).filter(([_, v]) => v !== null)
  );

  const response = await execute(
    VIEW_SUBSCRIBED_CUSTOMERS_ON_ASSET_QUERY,
    cleanVariables as any
  );

  return response.viewSubscribedCustomersOnAsset;
};

// --- Asset Transactions ---

// Note: Using string directly to avoid codegen dependency issues for now
const GET_ASSET_TRANSACTION_QUERY = `
  query GetAssetTransaction($assetType: String, $transactionType: String, $status: String, $startDate: Date, $endDate: Date, $salesType: String, $page: Int!, $limit: Int!, $search: String) {
    getAssetTransaction(assetType: $assetType, transactionType: $transactionType, status: $status, startDate: $startDate, endDate: $endDate, salesType: $salesType, page: $page, limit: $limit, search: $search) {
      data {
        amount
        description
        admin_status
        plot_size
        asset_type
        referral
        transaction_type
        transfer_file {
          file
        }
        user {
          firstName
          lastName
          _id
        }
        type
        _id
        time_of_transaction
      }
      count
    }
  }
`;

export const getAssetTransactions = async (page: number, limit: number, searchParams?: ReadonlyURLSearchParams) => {
  const variables: GetAssetTransactionVariables = {
    page,
    limit,
    transactionType: searchParams?.get("transactiontype") || null,
    assetType: searchParams?.get("assettype") || null,
    salesType: searchParams?.get("salestype") || null,
    status: searchParams?.get("transactionstatus") || null,
    startDate: searchParams?.get("start_date") ? new Date(searchParams.get("start_date")!).toISOString() : null,
    endDate: searchParams?.get("end_date") ? new Date(searchParams.get("end_date")!).toISOString() : null,
    search: searchParams?.get("search") || null,
  };

  const cleanVariables = Object.fromEntries(
    Object.entries(variables).filter(([_, v]) => v !== null)
  );

  const response = await fetchGraphql<GetAssetTransactionData>(
    GET_ASSET_TRANSACTION_QUERY as any,
    cleanVariables as any
  );

  return response.getAssetTransaction;
};

const APPROVE_ASSET_TRANSACTION_MUTATION = `
  mutation ApproveAssetTransaction($id: String!) {
    approveAssetTransaction(id: $id) {
      message
      success
    }
  }
`;

export const approveAssetTransaction = async (id: string) => {
  return fetchGraphql(APPROVE_ASSET_TRANSACTION_MUTATION as any, { id });
};


const DECLINE_ASSET_TRANSACTION_MUTATION = `
  mutation DeclineAssetTransaction($id: String!) {
    declineAssetTransaction(id: $id) {
      message
      success
    }
  }
`;

export const declineAssetTransaction = async (id: string) => {
  return fetchGraphql(DECLINE_ASSET_TRANSACTION_MUTATION as any, { id });
};

// --- Asset Transaction Statistics ---

const GET_ASSET_TRANSACTION_STATS_QUERY = `
  query Statistics($filters: AssetTransactionFilters) {
    getAssetTransactionData(filters: $filters) {
      statistics {
        totalTransactions
        approvedTransactions
        totalApprovedAmount
        pendingTransactions
        totalPendingAmount
        declinedTransactions
        totalDeclinedAmount
        new_sales
        total_new_sales
        flexTransactions
        totalFlexAmount
        new_flex_sales
        flex_recurring_sales
        total_flex_recurring_sales
        fullOwnershipTransactions
        totalFullOwnershipAmount
        new_fullOwnership_sales
        total_new_fullOwnership_sales
        fullOwnership_recurring_sales
        total_fullOwnership_recurring_sales
      }
    }
  }
`;

export type AssetTransactionStats = {
  totalTransactions?: number;
  approvedTransactions?: number;
  totalApprovedAmount?: number;
  pendingTransactions?: number;
  totalPendingAmount?: number;
  declinedTransactions?: number;
  totalDeclinedAmount?: number;
  new_sales?: number;
  total_new_sales?: number;
  flexTransactions?: number;
  totalFlexAmount?: number;
  new_flex_sales?: number;
  flex_recurring_sales?: number;
  total_flex_recurring_sales?: number;
  fullOwnershipTransactions?: number;
  totalFullOwnershipAmount?: number;
  new_fullOwnership_sales?: number;
  total_new_fullOwnership_sales?: number;
  fullOwnership_recurring_sales?: number;
  total_fullOwnership_recurring_sales?: number;
};

export const getAssetTransactionStats = async (searchParams?: ReadonlyURLSearchParams) => {
  const filters = {
    transactionType: searchParams?.get("transactiontype") || null,
    assetType: searchParams?.get("assettype") || null,
    salesType: searchParams?.get("salestype") || null,
    status: searchParams?.get("transactionstatus") || null,
    startDate: searchParams?.get("start_date") ? new Date(searchParams.get("start_date")!).toISOString() : null,
    endDate: searchParams?.get("end_date") ? new Date(searchParams.get("end_date")!).toISOString() : null,
  };

  // Remove null values
  const cleanFilters = Object.fromEntries(
    Object.entries(filters).filter(([_, v]) => v !== null)
  );

  const response = await fetchGraphql<{ getAssetTransactionData: { statistics: AssetTransactionStats } }>(
    GET_ASSET_TRANSACTION_STATS_QUERY as any,
    { filters: cleanFilters } as any
  );

  return response.getAssetTransactionData;
};
// --- View & Update Asset ---



const UPDATE_FLEX_ASSET_MUTATION = `
  mutation UpdateAsset($updateAssetInput: UpdateFlexAssetInput!) {
    updateAsset(updateAssetInput: $updateAssetInput)
  }
`;

export const updateFlexAsset = async (payload: UpdateFlexAssetInput) => {
  return fetchGraphql(UPDATE_FLEX_ASSET_MUTATION as any, {
    updateAssetInput: payload,
  });
};

const EDIT_FULL_OWNERSHIP_ASSET_MUTATION = `
  mutation EditFullOwnershipAsset($editFullOwnershipAssetInput: EditFullOwnershipAssetInput!) {
    editFullOwnershipAsset(editFullOwnershipAssetInput: $editFullOwnershipAssetInput)
  }
`;

export const editFullOwnershipAsset = async (payload: EditFullOwnershipAssetInput) => {
  return fetchGraphql(EDIT_FULL_OWNERSHIP_ASSET_MUTATION as any, {
    editFullOwnershipAssetInput: payload,
  });
};
