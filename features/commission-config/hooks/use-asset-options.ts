import { useQuery } from "@tanstack/react-query";
import { executeRaw } from "@/lib/graphql-client";

export interface AssetOption {
  _id: string;
  asset_name: string;
  asset_type: string;
}

interface ViewAllWebsiteAssetsResponse {
  viewAllWebsiteAssets: {
    data: AssetOption[];
  };
}

const VIEW_ALL_WEBSITE_ASSETS = `
  query ViewAllWebsiteAssets {
    viewAllWebsiteAssets {
      data {
        _id
        asset_name
        asset_type
      }
    }
  }
`;

export const useAssetOptions = (enabled: boolean) => {
  return useQuery({
    queryKey: ["asset-options"],
    queryFn: () =>
      executeRaw<ViewAllWebsiteAssetsResponse>(VIEW_ALL_WEBSITE_ASSETS),
    select: (data) => data.viewAllWebsiteAssets.data,
    enabled,
    staleTime: 5 * 60 * 1000,
  });
};
