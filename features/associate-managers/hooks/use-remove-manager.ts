import { useMutation, useQueryClient } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";
import type { AddRemoveManagerInput } from "@/lib/gql/graphql";
import { managerKeys } from "./query-keys";

const REMOVE_ASSOCIATE_MANAGER_MUTATION = graphql(`
  mutation RemoveAssociateManager($input: AddRemoveManagerInput!) {
    removeAssociateManager(input: $input) {
      managerId
      removed
    }
  }
`);

export const useRemoveManager = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AddRemoveManagerInput) =>
      execute(REMOVE_ASSOCIATE_MANAGER_MUTATION, { input }),
    onSuccess: (data) => {
      const removedId = data.removeAssociateManager.managerId;
      // Manager doc deleted → that detail entry is stale
      queryClient.invalidateQueries({ queryKey: managerKeys.detail(removedId) });
      // List + roster summaries change
      queryClient.invalidateQueries({ queryKey: managerKeys.lists() });
      // Their pros become unassigned
      queryClient.invalidateQueries({ queryKey: managerKeys.unassigned() });
      // Dashboards reading this manager are dead
      queryClient.invalidateQueries({ queryKey: managerKeys.dashboards() });
    },
  });
};
