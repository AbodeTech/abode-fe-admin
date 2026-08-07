"use client";

import { useQuery } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";
import { flexManagerKeys } from "./use-flex-manager-dashboard";

const LIST_FLEX_MANAGER_TARGETS_QUERY = graphql(`
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
`);

const GET_FLEX_MANAGER_TARGET_QUERY = graphql(`
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
`);

export const useFlexManagerTargets = (managerId: string | null | undefined) => {
  return useQuery({
    queryKey: flexManagerKeys.targets(managerId ?? ""),
    queryFn: () =>
      execute(LIST_FLEX_MANAGER_TARGETS_QUERY, {
        managerId: managerId as string,
      }),
    select: (data) => data.listFlexManagerTargets,
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
    queryFn: () =>
      execute(GET_FLEX_MANAGER_TARGET_QUERY, {
        managerId: managerId as string,
        month: month ?? null,
        year: year ?? null,
      }),
    select: (data) => data.getFlexManagerTarget ?? null,
    enabled: !!managerId,
  });
};
