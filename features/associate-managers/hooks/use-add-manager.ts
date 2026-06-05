import { useMutation, useQueryClient } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";
import type { AddRemoveManagerInput } from "@/lib/gql/graphql";
import { managerKeys } from "./query-keys";

const ADD_ASSOCIATE_MANAGER_MUTATION = graphql(`
  mutation AddAssociateManager($input: AddRemoveManagerInput!) {
    addAssociateManager(input: $input) {
      _id
      manager {
        _id
        userName
        firstName
        lastName
        email
        role
      }
      associate_pros {
        _id
      }
      createdAt
      updatedAt
    }
  }
`);

export const useAddManager = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: AddRemoveManagerInput) =>
      execute(ADD_ASSOCIATE_MANAGER_MUTATION, { input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: managerKeys.lists() });
    },
  });
};
