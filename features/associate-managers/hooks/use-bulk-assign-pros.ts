import { useMutation, useQueryClient } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";
import type { BulkAssignAssociateProsInput } from "@/lib/gql/graphql";
import { managerKeys } from "./query-keys";

const BULK_ASSIGN_ASSOCIATE_PROS_MUTATION = graphql(`
  mutation BulkAssignAssociateProsToManager(
    $input: BulkAssignAssociateProsInput!
  ) {
    bulkAssignAssociateProsToManager(input: $input) {
      _id
      manager {
        _id
      }
      associate_pros {
        _id
      }
      updatedAt
    }
  }
`);

export const useBulkAssignPros = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: BulkAssignAssociateProsInput) =>
      execute(BULK_ASSIGN_ASSOCIATE_PROS_MUTATION, { input }),
    onSuccess: () => {
      // Multiple pros moved across managers → invalidate the whole feature
      queryClient.invalidateQueries({ queryKey: managerKeys.all });
    },
  });
};
