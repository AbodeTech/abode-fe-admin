"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";
import type { AssignCustomersToCsmInput } from "@/lib/gql/graphql";
import { csManagerKeys } from "./use-cs-manager-dashboard";
import { csManagersListKeys } from "./use-cs-managers-list";

/**
 * Super-admin mutations for CS Manager role + customer assignment.
 * See guidelines/CS_Manager_Dashboard.md.
 */

const ADD_CS_MANAGER_MUTATION = graphql(`
  mutation AddCSManager($managerId: ID!) {
    addCSManager(managerId: $managerId) {
      _id
      manager
      assigned_from
      assigned_to
      created_by
      createdAt
      updatedAt
    }
  }
`);

const REMOVE_CS_MANAGER_MUTATION = graphql(`
  mutation RemoveCSManager($managerId: ID!) {
    removeCSManager(managerId: $managerId) {
      _id
      manager
      assigned_from
      assigned_to
      created_by
      createdAt
      updatedAt
    }
  }
`);

const ASSIGN_CUSTOMERS_TO_CSM_MUTATION = graphql(`
  mutation AssignCustomersToCSManager($input: AssignCustomersToCSMInput!) {
    assignCustomersToCSManager(input: $input) {
      assigned
      managerId
    }
  }
`);

const invalidateAll = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: csManagersListKeys.managers() });
  qc.invalidateQueries({
    queryKey: ["cs-managers", "unassigned"],
  });
  qc.invalidateQueries({ queryKey: csManagerKeys.dashboards() });
};

export const useAddCSManager = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (managerId: string) =>
      execute(ADD_CS_MANAGER_MUTATION, { managerId }),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useRemoveCSManager = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (managerId: string) =>
      execute(REMOVE_CS_MANAGER_MUTATION, { managerId }),
    onSuccess: () => invalidateAll(qc),
  });
};

export type AssignCustomersToCSMInput = AssignCustomersToCsmInput;

export const useAssignCustomersToCSM = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AssignCustomersToCsmInput) =>
      execute(ASSIGN_CUSTOMERS_TO_CSM_MUTATION, { input }),
    onSuccess: () => invalidateAll(qc),
  });
};
