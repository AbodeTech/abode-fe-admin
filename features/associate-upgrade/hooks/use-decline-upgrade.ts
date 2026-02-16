import { useMutation, useQueryClient } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';
import { upgradeKeys } from './query-keys';

const DECLINE_UPGRADE = graphql(`
  mutation DeclineUpgradeRequest($id: ID!) {
    declineUpgradeRequest(id: $id)
  }
`);

export const useDeclineUpgrade = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => execute(DECLINE_UPGRADE, { id }),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: upgradeKeys.all });
    },
  });
};
