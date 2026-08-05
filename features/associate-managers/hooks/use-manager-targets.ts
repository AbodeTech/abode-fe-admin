import { useQuery } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";
import { managerKeys } from "./query-keys";

const LIST_MANAGER_TARGETS_QUERY = graphql(`
  query ListAssociateManagerTargets($managerId: ID!) {
    listAssociateManagerTargets(managerId: $managerId) {
      _id
      manager
      month
      year
      associate_pro_recruited_target
      selling_associate_pro_target
      revenue_target
      performance_score_target
      createdAt
      updatedAt
    }
  }
`);

export const useManagerTargets = (managerId: string | null | undefined) => {
  return useQuery({
    queryKey: managerKeys.targetsAll(managerId ?? ""),
    queryFn: () =>
      execute(LIST_MANAGER_TARGETS_QUERY, { managerId: managerId as string }),
    select: (data) => data.listAssociateManagerTargets,
    enabled: !!managerId,
  });
};

const GET_MANAGER_TARGET_QUERY = graphql(`
  query GetAssociateManagerTarget($managerId: ID!, $month: Int, $year: Int) {
    getAssociateManagerTarget(
      managerId: $managerId
      month: $month
      year: $year
    ) {
      _id
      manager
      month
      year
      associate_pro_recruited_target
      selling_associate_pro_target
      revenue_target
      performance_score_target
      createdAt
      updatedAt
    }
  }
`);

/** Lookup a single target by (manager, month, year). Useful for the "active" target. */
export const useManagerTarget = (
  managerId: string | null | undefined,
  month?: number | null,
  year?: number | null
) => {
  return useQuery({
    queryKey: managerKeys.target(managerId ?? "", month, year),
    queryFn: () =>
      execute(GET_MANAGER_TARGET_QUERY, {
        managerId: managerId as string,
        month: month ?? null,
        year: year ?? null,
      }),
    select: (data) => data.getAssociateManagerTarget,
    enabled: !!managerId,
  });
};
