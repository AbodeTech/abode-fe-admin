import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// NOTE: GraphQL operations commented out until staging deploys v2 block/plot allocation API.
// Re-enable after staging picks up the feature/block-plot-allocation-v2 branch.
//
// const GET_ASSET_BLOCKS_QUERY = graphql(`
//   query GetAssetBlocks($assetId: ID!) {
//     getAssetBlocks(assetId: $assetId) {
//       _id
//       asset
//       label
//       description
//       createdAt
//     }
//   }
// `);
//
// const CREATE_BLOCK_MUTATION = graphql(`
//   mutation CreateBlock($assetId: ID!, $label: String!, $description: String) {
//     createBlock(assetId: $assetId, label: $label, description: $description) {
//       _id
//       asset
//       label
//       description
//       createdAt
//     }
//   }
// `);
//
// const DELETE_BLOCK_MUTATION = graphql(`
//   mutation DeleteBlock($blockId: ID!) {
//     deleteBlock(blockId: $blockId)
//   }
// `);

export interface Block {
  _id: string;
  asset: string;
  label: string;
  description: string | null;
  createdAt: string | null;
}

export const blockKeys = {
  all: ["blocks"] as const,
  list: (assetId: string) => [...blockKeys.all, "list", assetId] as const,
};

const NOT_DEPLOYED = new Error(
  "Block/plot allocation v2 API is not yet available on the backend"
);

export const useAssetBlocks = (assetId: string) => {
  return useQuery<Block[]>({
    queryKey: blockKeys.list(assetId),
    queryFn: () => Promise.resolve([] as Block[]),
    enabled: false,
  });
};

export interface CreateBlockInput {
  assetId: string;
  label: string;
  description?: string;
}

export const useCreateBlock = (assetId: string) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (_input: CreateBlockInput) => Promise.reject<Block>(NOT_DEPLOYED),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: blockKeys.list(assetId) });
    },
  });
};

export const useDeleteBlock = (assetId: string) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (_blockId: string) => Promise.reject<boolean>(NOT_DEPLOYED),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: blockKeys.list(assetId) });
    },
  });
};
