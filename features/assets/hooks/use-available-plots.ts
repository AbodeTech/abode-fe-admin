import { useQuery } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";
import type { Plot } from "./use-plots";

const GET_AVAILABLE_PLOTS_FOR_ASSET_QUERY = graphql(`
  query GetAvailablePlotsForAsset($assetId: ID!) {
    getAvailablePlotsForAsset(assetId: $assetId) {
      _id
      block
      block_label
      plot_number
      size
      status
    }
  }
`);

export const availablePlotsKeys = {
  all: ["availablePlots"] as const,
  list: (assetId: string) =>
    [...availablePlotsKeys.all, "list", assetId] as const,
};

export interface UseAvailablePlotsParams {
  assetId: string;
  enabled?: boolean;
}

export const useAvailablePlotsForAsset = ({
  assetId,
  enabled = true,
}: UseAvailablePlotsParams) => {
  return useQuery({
    queryKey: availablePlotsKeys.list(assetId),
    queryFn: () =>
      execute(GET_AVAILABLE_PLOTS_FOR_ASSET_QUERY, {
        assetId,
      }),
    select: (data) => data.getAvailablePlotsForAsset as Plot[],
    enabled: enabled && !!assetId,
  });
};
