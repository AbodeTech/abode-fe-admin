import { useQuery, useMutation } from "@tanstack/react-query";

// NOTE: GraphQL operations commented out until backend deploys structured plot allocation API.
// Re-enable after BE merges getAssetPlots/createAssetPlot/updateAssetPlot/deleteAssetPlot.
//
// const GET_ASSET_PLOTS_QUERY = graphql(`
//   query GetAssetPlots($assetName: String!, $assetType: String!) {
//     getAssetPlots(assetName: $assetName, assetType: $assetType) {
//       label
//       totalBlocks
//       allocatedBlockNumbers
//     }
//   }
// `);
//
// const CREATE_ASSET_PLOT_MUTATION = graphql(`
//   mutation CreateAssetPlot($assetId: ID!, $label: String!, $totalBlocks: Int!) {
//     createAssetPlot(assetId: $assetId, label: $label, totalBlocks: $totalBlocks) {
//       label
//       totalBlocks
//       allocatedBlockNumbers
//     }
//   }
// `);
//
// const UPDATE_ASSET_PLOT_MUTATION = graphql(`
//   mutation UpdateAssetPlot(
//     $assetId: ID!
//     $plotId: ID!
//     $label: String!
//     $newTotalBlocks: Int
//   ) {
//     updateAssetPlot(
//       assetId: $assetId
//       plotId: $plotId
//       label: $label
//       newTotalBlocks: $newTotalBlocks
//     ) {
//       label
//       totalBlocks
//       allocatedBlockNumbers
//     }
//   }
// `);
//
// const DELETE_ASSET_PLOT_MUTATION = graphql(`
//   mutation DeleteAssetPlot($assetId: ID!, $label: String!) {
//     deleteAssetPlot(assetId: $assetId, label: $label) {
//       success
//       message
//     }
//   }
// `);

export interface AssetPlot {
  label: string;
  totalBlocks: number;
  allocatedBlockNumbers: number[];
}

export const plotKeys = {
  all: ["assetPlots"] as const,
  list: (assetName: string, assetType: string) =>
    [...plotKeys.all, "list", assetName, assetType] as const,
};

const NOT_DEPLOYED = new Error(
  "Plot allocation API is not yet available on the backend"
);

export const useAssetPlots = (assetName: string, assetType: string) => {
  return useQuery<AssetPlot[]>({
    queryKey: plotKeys.list(assetName, assetType),
    queryFn: () => Promise.resolve([] as AssetPlot[]),
    enabled: false,
  });
};

export interface CreateAssetPlotInput {
  assetId: string;
  label: string;
  totalBlocks: number;
}

export const useCreateAssetPlot = (_assetName: string, _assetType: string) => {
  return useMutation({
    mutationFn: (_input: CreateAssetPlotInput) => Promise.reject(NOT_DEPLOYED),
  });
};

export interface UpdateAssetPlotInput {
  assetId: string;
  plotId: string;
  label: string;
  newTotalBlocks?: number;
}

export const useUpdateAssetPlot = (_assetName: string, _assetType: string) => {
  return useMutation({
    mutationFn: (_input: UpdateAssetPlotInput) => Promise.reject(NOT_DEPLOYED),
  });
};

export interface DeleteAssetPlotInput {
  assetId: string;
  label: string;
}

export const useDeleteAssetPlot = (_assetName: string, _assetType: string) => {
  return useMutation({
    mutationFn: (_input: DeleteAssetPlotInput) => Promise.reject(NOT_DEPLOYED),
  });
};
