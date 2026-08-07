"use client";

import { useQuery } from "@tanstack/react-query";
import { executeRaw } from "@/lib/graphql-client";
import type { FlexManagerTargetRecord } from "../types";
import { flexManagerKeys } from "./use-flex-manager-dashboard";

const LIST_FLEX_MANAGER_TARGETS = `
  query ListFlexManagerTargets($managerId: ID!) {
    listFlexManagerTargets(managerId: $managerId) {
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

const GET_FLEX_MANAGER_TARGET = `
  query GetFlexManagerTarget($managerId: ID!, $month: Int, $year: Int) {
    getFlexManagerTarget(managerId: $managerId, month: $month, year: $year) {
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

export const useFlexManagerTargets = (managerId: string | null | undefined) => {
  return useQuery({
    queryKey: flexManagerKeys.targets(managerId ?? ""),
    queryFn: async () => {
      const data = await executeRaw<{
        listFlexManagerTargets: FlexManagerTargetRecord[];
      }>(LIST_FLEX_MANAGER_TARGETS, { managerId });
      return data.listFlexManagerTargets;
    },
    enabled: !!managerId,
  });
};

export const useFlexManagerTarget = (
  managerId: string | null | undefined,
  month?: number,
  year?: number
) => {
  return useQuery({
    queryKey: [
      ...flexManagerKeys.targets(managerId ?? ""),
      month ?? null,
      year ?? null,
    ] as const,
    queryFn: async () => {
      const data = await executeRaw<{
        getFlexManagerTarget: FlexManagerTargetRecord | null;
      }>(GET_FLEX_MANAGER_TARGET, {
        managerId,
        month: month ?? null,
        year: year ?? null,
      });
      return data.getFlexManagerTarget;
    },
    enabled: !!managerId,
  });
};
