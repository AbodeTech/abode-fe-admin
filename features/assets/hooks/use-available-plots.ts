import { useQuery } from "@tanstack/react-query";
import type { Plot } from "./use-plots";

// NOTE: GraphQL query commented out until staging deploys v2 block/plot API.
//
// const GET_AVAILABLE_PLOTS_FOR_ASSET_QUERY = graphql(`
//   query GetAvailablePlotsForAsset($assetId: ID!, $size: Int) {
//     getAvailablePlotsForAsset(assetId: $assetId, size: $size) {
//       _id
//       block
//       block_label
//       plot_number
//       size
//       status
//     }
//   }
// `);

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
  return useQuery<Plot[]>({
    queryKey: availablePlotsKeys.list(assetId, size),
    queryFn: () => Promise.resolve([] as Plot[]),
    enabled: enabled && !!assetId && false,
  });
};
