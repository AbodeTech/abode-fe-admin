import { useMutation, useQueryClient } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";
import type { AssignManagerTargetInput } from "@/lib/gql/graphql";
import { managerKeys } from "./query-keys";

const ASSIGN_ASSOCIATE_MANAGER_TARGET_MUTATION = graphql(`
  mutation AssignAssociateManagerTarget($input: AssignManagerTargetInput!) {
    assignAssociateManagerTarget(input: $input) {
      _id
      manager
      month
      year
      associate_pro_recruited_target
      selling_associate_pro_target
      revenue_target
      performance_score_target
      createdAt
      updatedAt
    }
  }
`);

export const useAssignManagerTarget = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AssignManagerTargetInput) =>
      execute(ASSIGN_ASSOCIATE_MANAGER_TARGET_MUTATION, { input }),
    onSuccess: (data) => {
      const managerId = data.assignAssociateManagerTarget.manager;
      // Target list/lookup for that manager is stale
      queryClient.invalidateQueries({
        queryKey: managerKeys.targetsAll(managerId),
      });
      // Dashboard target sub-block reads from the target → stale across dashboards
      queryClient.invalidateQueries({ queryKey: managerKeys.dashboards() });
    },
  });
};
