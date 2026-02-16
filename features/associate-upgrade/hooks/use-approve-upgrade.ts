import { useMutation, useQueryClient } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';
import { upgradeKeys } from './query-keys';

const APPROVE_UPGRADE = graphql(`
  mutation ApproveUpgradeToAssociate($id: ID!) {
    approveUpgradeToAssociate(id: $id)
  }
`);

const APPROVE_UPGRADE_PRO = graphql(`
  mutation ApproveUpgradeToAssociatePro($id: ID!) {
    approveUpgradeToAssociatePro(id: $id)
  }
`);

interface ApproveInput {
  id: string;
  upgradeType?: string | null;
}

export const useApproveUpgrade = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, upgradeType }: ApproveInput) => {
      const isPro = (upgradeType || '').toLowerCase().includes('pro');
      if (isPro) {
        return execute(APPROVE_UPGRADE_PRO, { id }) as Promise<any>;
      }
      return execute(APPROVE_UPGRADE, { id }) as Promise<any>;
    },
    onSuccess: () => {
      client.invalidateQueries({ queryKey: upgradeKeys.all });
    },
  });
};
