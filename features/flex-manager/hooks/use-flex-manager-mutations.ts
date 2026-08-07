"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { executeRaw } from "@/lib/graphql-client";
import type {
  FlexManagerAssignmentRecord,
  FlexManagerTargetRecord,
} from "../types";
import { flexManagerKeys } from "./use-flex-manager-dashboard";

/**
 * Super-admin mutations for the FLEX Manager role.
 * See guidelines/Flex_Manager_Dashboard.md for the contract.
 */

const ASSIGN_FLEX_MANAGER = `
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
`;

const UNASSIGN_FLEX_MANAGER = `
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
`;

const ASSIGN_FLEX_MANAGER_TARGET = `
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
`;

const invalidateDashboards = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: flexManagerKeys.dashboards() });
  qc.invalidateQueries({ queryKey: flexManagerKeys.current() });
};

export const useAssignFlexManager = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (managerId: string) => {
      const data = await executeRaw<{
        assignFlexManager: FlexManagerAssignmentRecord;
      }>(ASSIGN_FLEX_MANAGER, { managerId });
      return data.assignFlexManager;
    },
    onSuccess: () => invalidateDashboards(qc),
  });
};

export const useUnassignFlexManager = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const data = await executeRaw<{
        unassignFlexManager: FlexManagerAssignmentRecord;
      }>(UNASSIGN_FLEX_MANAGER);
      return data.unassignFlexManager;
    },
    onSuccess: () => invalidateDashboards(qc),
  });
};

export interface AssignFlexManagerTargetInput {
  managerId: string;
  month: number;
  year: number;
  new_customers_target?: number;
  new_sales_value_target?: number;
  recurring_target?: number;
}

export const useAssignFlexManagerTarget = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: AssignFlexManagerTargetInput) => {
      const data = await executeRaw<{
        assignFlexManagerTarget: FlexManagerTargetRecord;
      }>(ASSIGN_FLEX_MANAGER_TARGET, { input });
      return data.assignFlexManagerTarget;
    },
    onSuccess: (target) => {
      qc.invalidateQueries({ queryKey: flexManagerKeys.dashboards() });
      qc.invalidateQueries({
        queryKey: flexManagerKeys.targets(target.manager),
      });
    },
  });
};
