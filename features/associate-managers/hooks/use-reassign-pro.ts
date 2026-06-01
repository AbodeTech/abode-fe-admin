import { useMutation, useQueryClient } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";
import type { ReassignAssociateProInput } from "@/lib/gql/graphql";
import { managerKeys } from "./query-keys";

const REASSIGN_ASSOCIATE_PRO_MUTATION = graphql(`
  mutation ReassignAssociatePro($input: ReassignAssociateProInput!) {
    reassignAssociatePro(input: $input) {
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

export const useReassignPro = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ReassignAssociateProInput) =>
      execute(REASSIGN_ASSOCIATE_PRO_MUTATION, { input }),
    onSuccess: () => {
      // Both source + target manager roster + counts change → nuke all of it
      queryClient.invalidateQueries({ queryKey: managerKeys.all });
    },
  });
};
