import { useQuery } from "@tanstack/react-query";

// NOTE: GraphQL query commented out until backend deploys suggestNextAllocation.
// Re-enable after BE merges the structured plot allocation API.
//
// const SUGGEST_NEXT_ALLOCATION_QUERY = graphql(`
//   query SuggestNextAllocation(
//     $assetName: String!
//     $assetType: String!
//     $requestedUnits: Int!
//   ) {
//     suggestNextAllocation(
//       assetName: $assetName
//       assetType: $assetType
//       requestedUnits: $requestedUnits
//     ) {
//       plotLabel
//       blockNumbers
//     }
//   }
// `);

export interface SuggestedAllocation {
  plotLabel: string;
  blockNumbers: number[];
}

export interface SuggestNextAllocationParams {
  assetName: string;
  assetType: string;
  requestedUnits: number;
  enabled?: boolean;
}

export const useSuggestNextAllocation = ({
  assetName,
  assetType,
  requestedUnits,
}: SuggestNextAllocationParams) => {
  return useQuery<SuggestedAllocation[] | null>({
    queryKey: [
      "allocation",
      "suggest",
      assetName,
      assetType,
      requestedUnits,
    ] as const,
    queryFn: () => Promise.resolve(null),
    enabled: false,
  });
};
