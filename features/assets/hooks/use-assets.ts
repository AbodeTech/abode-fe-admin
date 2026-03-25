import { useQuery } from '@tanstack/react-query';
import { execute, executeRaw } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';
import { assetKeys } from './query-keys';

const GET_ALL_ADMIN_ASSETS_QUERY = graphql(`
  query GetFeatureAdminAssets($page: Int!, $limit: Int!) {
    getAllAdminAssets(page: $page, limit: $limit) {
      count
      data {
        _id
        ...AssetFlexTable_asset
        ...AssetFullOwnershipTable_asset
      }
    }
  }
`);

const GET_ASSET_INVENTORY_DATA_QUERY = graphql(`
  query FeatureAssetStatistics {
    getAssetInventoryData {
      statistics {
        ...AssetInventoryOverview_statistics
      }
    }
  }
`);

const GET_ASSET_BY_NAME_QUERY = graphql(`
  query ViewAssetByName($assetName: String!, $assetType: String) {
    viewAssetByName(assetName: $assetName, assetType: $assetType) {
      available_unit
      unit_sold
      expected_return
      total_value
      sizes
    }
  }
`);

const GET_ASSET_OPTION_DATA_BY_NAME_QUERY = graphql(`
  query ViewAssetOptionDataByName($assetName: String!, $assetType: String!) {
    viewAssetOptionDataByName(assetName: $assetName, assetType: $assetType) {
      sizes {
        size
        available_unit
        value
        unit_sold
        expected_return
      }
    }
  }
`);

interface UseAssetsParams {
  page?: number;
  limit?: number;
}

export const useAssets = (params?: UseAssetsParams) => {
  const { page = 1, limit = 5000 } = params ?? {};

  return useQuery({
    queryKey: assetKeys.list({ page, limit }),
    queryFn: () => execute(GET_ALL_ADMIN_ASSETS_QUERY, { page, limit }),
    select: (data) => data.getAllAdminAssets,
  });
};

export const useAssetInventory = () => {
  return useQuery({
    queryKey: assetKeys.inventory(),
    queryFn: () => execute(GET_ASSET_INVENTORY_DATA_QUERY, {}),
    select: (data) => data.getAssetInventoryData?.statistics,
  });
};

export const useAssetByName = (assetName: string, assetType: string) => {
  return useQuery({
    queryKey: assetKeys.byName(assetName, assetType),
    queryFn: () => execute(GET_ASSET_BY_NAME_QUERY, { assetName, assetType }),
    select: (data) => data.viewAssetByName,
    enabled: !!assetName && !!assetType,
  });
};

export const useAssetOptionsByName = (assetName: string, assetType: string) => {
  return useQuery({
    queryKey: assetKeys.optionsByName(assetName, assetType),
    queryFn: () => execute(GET_ASSET_OPTION_DATA_BY_NAME_QUERY, { assetName, assetType }),
    select: (data) => data.viewAssetOptionDataByName,
    enabled: !!assetName && !!assetType,
  });
};

const GET_ASSET_DETAILS_QUERY = `
  query ViewAsset($id: ID!) {
    viewAsset(id: $id) {
      _id
      asset_name
      asset_location
      asset_type
      description
      title
      basic_details {
        allocation_qualification
      }
      asset_pictures
      amenities
      asset_purpose
      google_map: gogle_map
      gogle_map
      topography
      landmark
      asset_history
      asset_documents
      documents {
        deed_of_assignment
        survey
        contract_of_sales
        estate_layout
      }
      asset_option {
        size
        unit
        price
        flex_payment_plans {
          description
          duration_months
          initial_payment
          monthly_installment
          price
          unit
        }
        zero_months
        three_months
        six_months
        twelve_months
        one_month
        five_months
        seven_months
        development_fee
        initial_payment
        monthly_installment
        one_month_initial_payment
        five_months_initial_payment
        seven_months_initial_payment
      }
    }
  }
`;

export const useAssetDetails = (id: string) => {
  return useQuery({
    queryKey: ['asset', 'details', id],
    queryFn: () => executeRaw<{ viewAsset: any }>(GET_ASSET_DETAILS_QUERY, { id }),
    select: (data) => data.viewAsset,
    enabled: !!id,
  });
};

export type AssetsData = NonNullable<ReturnType<typeof useAssets>['data']>;
export type AssetInventoryData = NonNullable<ReturnType<typeof useAssetInventory>['data']>;
