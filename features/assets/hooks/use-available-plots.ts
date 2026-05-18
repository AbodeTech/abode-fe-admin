import { useQuery } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";
import type { Plot } from "./use-plots";

const GET_AVAILABLE_PLOTS_FOR_ASSET_QUERY = graphql(`
  query GetAvailablePlotsForAsset($assetId: ID!, $size: Int) {
    getAvailablePlotsForAsset(assetId: $assetId, size: $size) {
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
  list: (assetId: string, size?: number) =>
    [...availablePlotsKeys.all, "list", assetId, size ?? null] as const,
};

export interface UseAvailablePlotsParams {
  assetId: string;
  size?: number;
  enabled?: boolean;
}

export const useAvailablePlotsForAsset = ({
  assetId,
  size,
  enabled = true,
}: UseAvailablePlotsParams) => {
  return useQuery({
    queryKey: availablePlotsKeys.list(assetId, size),
    queryFn: () =>
      execute(GET_AVAILABLE_PLOTS_FOR_ASSET_QUERY, {
        assetId,
        size,
      }),
    select: (data) => data.getAvailablePlotsForAsset as Plot[],
    enabled: enabled && !!assetId,
  });
};
