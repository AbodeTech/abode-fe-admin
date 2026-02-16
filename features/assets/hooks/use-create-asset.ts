import { useMutation, useQueryClient } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';
import { CreateFlexAssetInput, CreateFullOwnershipAssetInput } from '@/lib/gql/graphql';
import { assetKeys } from './query-keys';

const CREATE_FLEX_ASSET_MUTATION = graphql(`
  mutation CreateFlexAsset($createFlexAssetInput: CreateFlexAssetInput!) {
    createFlexAsset(createFlexAssetInput: $createFlexAssetInput) {
      _id
      asset_name
    }
  }
`);

const CREATE_FULL_OWNERSHIP_ASSET_MUTATION = graphql(`
  mutation CreateFullOwnershipAsset($createFullOwnershipAssetInput: CreateFullOwnershipAssetInput!) {
    createFullOwnershipAsset(createFullOwnershipAssetInput: $createFullOwnershipAssetInput) {
      _id
      asset_name
    }
  }
`);

export const useCreateFlexAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateFlexAssetInput) =>
      execute(CREATE_FLEX_ASSET_MUTATION, { createFlexAssetInput: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetKeys.inventory() });
    },
  });
};

export const useCreateFullOwnershipAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateFullOwnershipAssetInput) =>
      execute(CREATE_FULL_OWNERSHIP_ASSET_MUTATION, { createFullOwnershipAssetInput: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetKeys.inventory() });
    },
  });
};
