import { graphql } from "@/lib/gql/gql";
import { fetchServerGraphql } from "@/lib/api/server-utils";
import { fetchGraphql } from "@/lib/graphql-client";
import { ReadonlyURLSearchParams } from "next/navigation";
import {
  AdminAssetsData,
  AssetInventoryData,
  CreateFlexAssetInput,
  CreateFullOwnershipAssetInput,
  AssetByNameData,
  AssetOptionDataByNameData,
  AssetSubscribersData,
  Subscriber
} from "./assets.types";


// Re-export types for backward compatibility
export * from "./assets.types";

const GET_ALL_ADMIN_ASSETS_QUERY = graphql(`
  query GetAllAdminAssets($page: Int!, $limit: Int!) {
    getAllAdminAssets(page: $page, limit: $limit) {
      count
      data {
        _id
        asset_location
        asset_name
        asset_price
        asset_size
        asset_type
        asset_unit
        asset_pictures
        sold
        description
        title
        newAsset
        asset_option {
          size
          unit
          price
          zero_months
          three_months
          six_months
          five_months
          seven_months
          one_month
          one_month_initial_payment
          twelve_months
          initial_payment
          five_months_initial_payment
          seven_months_initial_payment
          development_fee
          monthly_installment
          flex_payment_plans {
            description
            duration_months
            initial_payment
            monthly_installment
            price
            unit
          }
        }
      }
    }
  }
`);

const GET_ASSET_INVENTORY_DATA_QUERY = graphql(`
  query Statistics {
    getAssetInventoryData {
      statistics {
        totalAssets
        totalWorth
        totalFlexAssets
        totalFlexWorth
        totalFullOwnershipAssets
        totalFullOwnershipWorth
      }
    }
  }
`);

const CREATE_FLEX_ASSET_MUTATION = graphql(`
  mutation CreateFlexAsset($createFlexAssetInput: CreateFlexAssetInput!) {
    createFlexAsset(createFlexAssetInput: $createFlexAssetInput) {
      _id
      asset_name
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


export const getAssetInventoryData = async () => {
  return fetchServerGraphql<AssetInventoryData>(GET_ASSET_INVENTORY_DATA_QUERY as any, undefined, []);
};

export const getAllAdminAssets = async (page: number = 1, limit: number = 5000) => {
  return fetchServerGraphql<AdminAssetsData>(GET_ALL_ADMIN_ASSETS_QUERY as any, { page, limit }, ["assets"]);
};

export const getAssetByName = async (assetName: string, assetType: string) => {
  return fetchServerGraphql<AssetByNameData>(GET_ASSET_BY_NAME_QUERY as any, { assetName, assetType }, ["assets"]);
}

export const createFlexAsset = async (payload: CreateFlexAssetInput) => {
  return fetchServerGraphql(CREATE_FLEX_ASSET_MUTATION as any, {
    createFlexAssetInput: payload,
  });
};

const CREATE_FULL_OWNERSHIP_ASSET_MUTATION = graphql(`
  mutation CreateFullOwnershipAsset($createFullOwnershipAssetInput: CreateFullOwnershipAssetInput!) {
    createFullOwnershipAsset(createFullOwnershipAssetInput: $createFullOwnershipAssetInput) {
      _id
      asset_name
    }
  }
`);

export const createFullOwnershipAsset = async (payload: CreateFullOwnershipAssetInput) => {
  return fetchServerGraphql(CREATE_FULL_OWNERSHIP_ASSET_MUTATION as any, {
    createFullOwnershipAssetInput: payload,
  });
};


export const getAssetOptionDataByName = async (assetName: string, assetType: string) => {
  return fetchServerGraphql<AssetOptionDataByNameData>(GET_ASSET_OPTION_DATA_BY_NAME_QUERY as any, { assetName, assetType });
};


