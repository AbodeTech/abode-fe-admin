"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";
import type {
  AssignCustomersToCsmInput,
  AssignCsManagerTargetInput,
} from "@/lib/gql/graphql";
import { csManagerKeys } from "./use-cs-manager-dashboard";
import { csManagersListKeys } from "./use-cs-managers-list";
import { csManagerTargetKeys } from "./use-cs-manager-targets";

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

const ASSIGN_CS_MANAGER_TARGET_MUTATION = graphql(`
  mutation AssignCSManagerTarget($input: AssignCSManagerTargetInput!) {
    assignCSManagerTarget(input: $input) {
      _id
      manager
      month
      year
      customers_allocated_target
      customers_onboarded_target
      deeds_delivered_target
      createdAt
      updatedAt
    }
  }
`);

export type { AssignCsManagerTargetInput };

export const useAssignCSManagerTarget = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AssignCsManagerTargetInput) =>
      execute(ASSIGN_CS_MANAGER_TARGET_MUTATION, { input }),
    onSuccess: (data) => {
      // Refresh both the target list and the dashboard so KPI benchmarks
      // pick up the new numbers immediately.
      qc.invalidateQueries({
        queryKey: csManagerTargetKeys.all(
          data.assignCSManagerTarget.manager
        ),
      });
      qc.invalidateQueries({ queryKey: csManagerKeys.dashboards() });
    },
  });
};
