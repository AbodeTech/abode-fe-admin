import { graphql } from "@/lib/gql/gql";
import { fetchGraphql } from "@/lib/graphql-client";
import { ReadonlyURLSearchParams } from "next/navigation";

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

  const response = await fetchGraphql(
    VIEW_SUBSCRIBED_CUSTOMERS_ON_ASSET_QUERY,
    cleanVariables as any
  );

  return response.viewSubscribedCustomersOnAsset;
};
