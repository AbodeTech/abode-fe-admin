"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";
import type { AssignFlexManagerTargetInput } from "@/lib/gql/graphql";
import { flexManagerKeys } from "./use-flex-manager-dashboard";

/**
 * Super-admin mutations for the FLEX Manager role.
 * See guidelines/Flex_Manager_Dashboard.md for the contract.
 */

const ASSIGN_FLEX_MANAGER_MUTATION = graphql(`
  mutation AssignFlexManager($managerId: ID!) {
    assignFlexManager(managerId: $managerId) {
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

const UNASSIGN_FLEX_MANAGER_MUTATION = graphql(`
  mutation UnassignFlexManager {
    unassignFlexManager {
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

const ASSIGN_FLEX_MANAGER_TARGET_MUTATION = graphql(`
  mutation AssignFlexManagerTarget($input: AssignFlexManagerTargetInput!) {
    assignFlexManagerTarget(input: $input) {
      _id
      manager
      month
      year
      new_customers_target
      new_sales_value_target
      recurring_target
      createdAt
      updatedAt
    }
  }
`);

const invalidateDashboards = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: flexManagerKeys.dashboards() });
  qc.invalidateQueries({ queryKey: flexManagerKeys.current() });
};

export const useAssignFlexManager = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (managerId: string) =>
      execute(ASSIGN_FLEX_MANAGER_MUTATION, { managerId }),
    onSuccess: () => invalidateDashboards(qc),
  });
};

export const useUnassignFlexManager = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => execute(UNASSIGN_FLEX_MANAGER_MUTATION, {}),
    onSuccess: () => invalidateDashboards(qc),
  });
};

export type { AssignFlexManagerTargetInput };

export const useAssignFlexManagerTarget = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AssignFlexManagerTargetInput) =>
      execute(ASSIGN_FLEX_MANAGER_TARGET_MUTATION, { input }),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: flexManagerKeys.dashboards() });
      qc.invalidateQueries({
        queryKey: flexManagerKeys.targets(
          data.assignFlexManagerTarget.manager
        ),
      });
    },
  });
};
