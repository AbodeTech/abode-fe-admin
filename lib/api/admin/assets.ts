import { graphql } from "@/lib/gql";
import { cookies } from "next/headers";

const API_URL =
  process.env.API_BASE_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  process.env.NEXT_API_BASE_URL ||
  "";

if (!API_URL) {
  console.error("API_BASE_URL is not defined");
}

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

async function fetchServerGraphql<T>(query: any, variables: any = {}) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken");

  if (!accessToken?.value) {
    throw new Error("Unauthorized");
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken.value}`,
    },
    body: JSON.stringify({
      query: typeof query === 'string' ? query : query.loc?.source.body,
      variables,
    }),
    next: { tags: ["assets"] }, // Simple caching tag
  });

  if (!response.ok) {
    throw new Error(`Example API Error: ${response.statusText}`);
  }

  const json = await response.json();
  if (json.errors) {
    throw new Error(json.errors[0].message);
  }

  return json.data as T;
}

export type AssetInventoryData = {
  getAssetInventoryData: {
    statistics: {
      totalAssets: number;
      totalWorth: number;
      totalFlexAssets: number;
      totalFlexWorth: number;
      totalFullOwnershipAssets: number;
      totalFullOwnershipWorth: number;
    };
  };
};

export type AdminAsset = {
  _id: string;
  asset_name: string;
  asset_location: string;
  asset_type: string;
  sold: string;
  asset_pictures: string[];
  asset_option: Array<{
    size: number;
    unit: number;
    price: number;
    one_month: number;
    flex_payment_plans?: Array<{
      price: number;
      unit: number;
    }>;
  }>;
};

export type AdminAssetsData = {
  getAllAdminAssets: {
    count: number;
    data: AdminAsset[];
  };
};

export const getAssetInventoryData = async () => {
  return fetchServerGraphql<AssetInventoryData>(GET_ASSET_INVENTORY_DATA_QUERY);
};

export const getAllAdminAssets = async (page: number = 1, limit: number = 5000) => {
  return fetchServerGraphql<AdminAssetsData>(GET_ALL_ADMIN_ASSETS_QUERY, { page, limit });
};
