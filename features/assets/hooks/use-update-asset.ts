import { useMutation, useQueryClient } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';
import { assetKeys } from './query-keys';
import type { UpdateFlexAssetInput } from '@/lib/gql/graphql';

const UPDATE_FLEX_ASSET_MUTATION = graphql(`
  mutation UpdateAsset($updateAssetInput: UpdateFlexAssetInput!) {
    updateAsset(updateAssetInput: $updateAssetInput)
  }
`);

export const useUpdateFlexAsset = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateFlexAssetInput) =>
      execute(UPDATE_FLEX_ASSET_MUTATION, { updateAssetInput: input }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: assetKeys.lists() });
      queryClient.invalidateQueries({ queryKey: assetKeys.detail(variables.id) });
    },
  });
};
