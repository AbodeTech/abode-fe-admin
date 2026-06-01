import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";

const GET_ASSET_BLOCKS_QUERY = graphql(`
  query GetAssetBlocks($assetId: ID!) {
    getAssetBlocks(assetId: $assetId) {
      _id
      asset
      label
      description
      createdAt
    }
  }
`);

const CREATE_BLOCK_MUTATION = graphql(`
  mutation CreateBlock($assetId: ID!, $label: String!, $description: String) {
    createBlock(assetId: $assetId, label: $label, description: $description) {
      _id
      asset
      label
      description
      createdAt
    }
  }
`);

const DELETE_BLOCK_MUTATION = graphql(`
  mutation DeleteBlock($blockId: ID!) {
    deleteBlock(blockId: $blockId)
  }
`);

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

export const useAssetBlocks = (assetId: string) => {
  return useQuery({
    queryKey: blockKeys.list(assetId),
    queryFn: () => execute(GET_ASSET_BLOCKS_QUERY, { assetId }),
    select: (data) => data.getAssetBlocks as Block[],
    enabled: !!assetId,
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
    mutationFn: (input: CreateBlockInput) =>
      execute(CREATE_BLOCK_MUTATION, {
        assetId: input.assetId,
        label: input.label,
        description: input.description ?? null,
      }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: blockKeys.list(assetId) });
    },
  });
};

export const useDeleteBlock = (assetId: string) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (blockId: string) =>
      execute(DELETE_BLOCK_MUTATION, { blockId }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: blockKeys.list(assetId) });
    },
  });
};
