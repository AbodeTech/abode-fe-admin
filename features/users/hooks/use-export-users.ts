import { useMutation } from "@tanstack/react-query";

import { executeRaw } from "@/lib/graphql-client";

const EXPORT_USERS_BY_FILTER_QUERY = `
  query ExportUsersByFilter(
    $page: Int!
    $limit: Int!
    $hasReferral: Boolean
    $hasAsset: Boolean
    $referralStatus: String
  ) {
    getAllUsersWithFilters(
      page: $page
      limit: $limit
      hasReferral: $hasReferral
      hasAsset: $hasAsset
      referralStatus: $referralStatus
    ) {
      data {
        _id
        firstName
        lastName
        last_login
        email
        gender
        occupation
        phoneNumber
        address
        country
        createdAt
        referral {
          firstName
          lastName
          email
        }
      }
    }
  }
`;

const EXPORT_USERS_WITH_ASSET_QUERY = `
  query ExportUsersWithAsset(
    $page: Int
    $limit: Int
    $assetType: String
  ) {
    usersWithAsset(page: $page, limit: $limit, assetType: $assetType) {
      data {
        id
        firstName
        lastName
        email
        gender
        occupation
        dateOfBirth
        phone
        referral {
          name
          email
        }
        customer_assets {
          asset_name
          asset_type
          balance
          document_price
          land_price
          month_subscription
          months_remaining
          next_date_of_payment
          no_of_units
          size
          start_date
          land_amount_paid
          document_amount_paid
        }
      }
    }
  }
`;

const EXPORT_LIMIT = 50_000;

export interface ExportUsersByFilterInput {
  referralStatus?: string;
  hasAsset?: boolean;
  hasReferral?: boolean;
}

interface ExportUsersByFilterResponse {
  getAllUsersWithFilters?: {
    data?: Array<{
      _id?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      email?: string | null;
      gender?: string | null;
      occupation?: string | null;
      phoneNumber?: string | null;
      address?: string | null;
      country?: string | null;
      createdAt?: string | null;
      last_login?: string | null;
      referral?: {
        firstName?: string | null;
        lastName?: string | null;
        email?: string | null;
      } | null;
    } | null> | null;
  } | null;
}

export type ExportFilteredUserRow = NonNullable<
  NonNullable<NonNullable<ExportUsersByFilterResponse["getAllUsersWithFilters"]>["data"]>[number]
>;

export interface ExportUsersWithAssetInput {
  assetType?: string;
}

interface ExportUsersWithAssetResponse {
  usersWithAsset?: {
    data?: Array<{
      id?: string | null;
      firstName?: string | null;
      lastName?: string | null;
      email?: string | null;
      gender?: string | null;
      occupation?: string | null;
      dateOfBirth?: string | null;
      phone?: string | null;
      referral?: {
        name?: string | null;
        email?: string | null;
      } | null;
      customer_assets?: Array<{
        asset_name?: string | null;
        asset_type?: string | null;
        balance?: number | null;
        document_price?: number | null;
        land_price?: number | null;
        month_subscription?: number | null;
        months_remaining?: number | null;
        next_date_of_payment?: string | null;
        no_of_units?: number | null;
        size?: number | null;
        start_date?: string | null;
        land_amount_paid?: number | null;
        document_amount_paid?: number | null;
      } | null> | null;
    } | null> | null;
  } | null;
}

export type ExportUserWithAssetRow = NonNullable<
  NonNullable<NonNullable<ExportUsersWithAssetResponse["usersWithAsset"]>["data"]>[number]
>;

export const useExportUsersByFilter = () => {
  return useMutation({
    mutationFn: (input: ExportUsersByFilterInput) =>
      executeRaw<ExportUsersByFilterResponse>(EXPORT_USERS_BY_FILTER_QUERY, {
        page: 1,
        limit: EXPORT_LIMIT,
        referralStatus: input.referralStatus,
        hasAsset: input.hasAsset,
        hasReferral: input.hasReferral,
      }),
  });
};

export const useExportUsersWithAsset = () => {
  return useMutation({
    mutationFn: (input: ExportUsersWithAssetInput) =>
      executeRaw<ExportUsersWithAssetResponse>(EXPORT_USERS_WITH_ASSET_QUERY, {
        page: 1,
        limit: EXPORT_LIMIT,
        assetType: input.assetType,
      }),
  });
};
