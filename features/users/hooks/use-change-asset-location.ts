import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";
import type {
  ChangeAssetLocationInput,
  DestinationAssetsForTransferQuery,
} from "@/lib/gql/graphql";

type AssetResponseData = NonNullable<
  NonNullable<DestinationAssetsForTransferQuery["viewAllWebsiteAssets"]>["data"]
>;
export type DestinationAsset = NonNullable<AssetResponseData[number]>;
export type DestinationAssetOption = NonNullable<
  NonNullable<DestinationAsset["asset_option"]>[number]
>;
export type DestinationFlexPlan = NonNullable<
  NonNullable<DestinationAssetOption["flex_payment_plans"]>[number]
>;

const CHANGE_ASSET_LOCATION_MUTATION = graphql(`
  mutation ChangeAssetLocation($input: ChangeAssetLocationInput!) {
    changeAssetLocation(input: $input) {
      success
      message
      newUniqueAssetId
    }
  }
`);

const DESTINATION_ASSETS_QUERY = graphql(`
  query DestinationAssetsForTransfer {
    viewAllWebsiteAssets {
      data {
        _id
        asset_name
        asset_location
        asset_type
        sold
        new_asset
        asset_option {
          size
          unit
          price
          flex_payment_plans {
            duration_months
            monthly_installment
            price
            unit
          }
          zero_months
          one_month
          three_months
          six_months
          five_months
          twelve_months
        }
      }
    }
  }
`);

export const useDestinationAssets = (enabled: boolean) => {
  return useQuery({
    queryKey: ["destinationAssetsForTransfer"],
    queryFn: () => execute(DESTINATION_ASSETS_QUERY, {}),
    enabled,
    staleTime: 1000 * 60 * 5,
    select: (data) => data.viewAllWebsiteAssets?.data ?? [],
  });
};

export const useChangeAssetLocation = (userId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ChangeAssetLocationInput) =>
      execute(CHANGE_ASSET_LOCATION_MUTATION, { input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userAssets", userId] });
      queryClient.invalidateQueries({ queryKey: ["user", userId] });
    },
  });
};
