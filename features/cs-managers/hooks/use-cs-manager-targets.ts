"use client";

import { useQuery } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";

/**
 * CS Manager target reads — typed via codegen.
 * BE contract: guidelines/CS_Manager_Dashboard.md §5.
 */

const LIST_CS_MANAGER_TARGETS_QUERY = graphql(`
  query ListCSManagerTargets($managerId: ID!) {
    listCSManagerTargets(managerId: $managerId) {
      _id
      manager
      month
      year
      customers_allocated_target
      customers_onboarded_target
      deeds_delivered_target
      performance_score_target
      createdAt
      updatedAt
    }
  }
`);

const GET_CS_MANAGER_TARGET_QUERY = graphql(`
  query GetCSManagerTarget($managerId: ID!, $month: Int, $year: Int) {
    getCSManagerTarget(managerId: $managerId, month: $month, year: $year) {
      _id
      manager
      month
      year
      customers_allocated_target
      customers_onboarded_target
      deeds_delivered_target
      performance_score_target
      createdAt
      updatedAt
    }
  }
`);

export const csManagerTargetKeys = {
  all: (managerId: string) => ["cs-manager", "targets", managerId] as const,
  detail: (managerId: string, month?: number, year?: number) =>
    [
      "cs-manager",
      "targets",
      managerId,
      month ?? null,
      year ?? null,
    ] as const,
};

export const useCSManagerTargets = (managerId: string | null | undefined) => {
  return useQuery({
    queryKey: csManagerTargetKeys.all(managerId ?? ""),
    queryFn: () =>
      execute(LIST_CS_MANAGER_TARGETS_QUERY, {
        managerId: managerId as string,
      }),
    select: (data) => data.listCSManagerTargets,
    enabled: !!managerId,
  });
};

export const useCSManagerTarget = (
  managerId: string | null | undefined,
  month?: number,
  year?: number
) => {
  return useQuery({
    queryKey: csManagerTargetKeys.detail(managerId ?? "", month, year),
    queryFn: () =>
      execute(GET_CS_MANAGER_TARGET_QUERY, {
        managerId: managerId as string,
        month: month ?? null,
        year: year ?? null,
      }),
    select: (data) => data.getCSManagerTarget ?? null,
    enabled: !!managerId,
  });
};
