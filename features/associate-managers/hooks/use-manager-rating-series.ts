import { useQuery } from "@tanstack/react-query";
import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { parse } from "graphql";
import { execute } from "@/lib/graphql-client";
import { managerKeys } from "./query-keys";

/** Server-shaped rating series point. Missing months arrive server-filled
 * as `{ average: 0, count: 0 }` so charts render every bar. */
export interface ManagerRatingSeriesPoint {
  month: number;
  year: number;
  average: number;
  count: number;
}

interface GetManagerRatingSeriesResult {
  getManagerRatingSeries: ManagerRatingSeriesPoint[];
}

interface GetManagerRatingSeriesVars {
  managerId: string | null;
  monthsBack: number;
}

// NOTE: this file is excluded from codegen (see codegen.ts) until the BE
// deploys. The codegen `graphql()` helper returns `{}` at runtime for
// unknown operations, which crashes execute() with "Invalid AST Node: {}."
// Parse manually with `graphql`'s `parse` — same pattern as
// features/associates/hooks/use-top-associates.ts.
const GET_MANAGER_RATING_SERIES_QUERY = parse(`
  query GetManagerRatingSeries($managerId: ID, $monthsBack: Int) {
    getManagerRatingSeries(managerId: $managerId, monthsBack: $monthsBack) {
      month
      year
      average
      count
    }
  }
`) as unknown as TypedDocumentNode<GetManagerRatingSeriesResult, GetManagerRatingSeriesVars>;

export interface UseManagerRatingSeriesParams {
  /** Super admins pass a target manager id; managers pass null → self. */
  managerId: string | null;
  monthsBack?: number;
  enabled?: boolean;
}

export const DEFAULT_RATING_SERIES_MONTHS = 6;

/** Fetches a monthly rating trend for a manager. Missing months arrive
 * server-filled as `{ average: 0, count: 0 }` so charts render every bar. */
export const useManagerRatingSeries = ({
  managerId,
  monthsBack = DEFAULT_RATING_SERIES_MONTHS,
  enabled = true,
}: UseManagerRatingSeriesParams) => {
  return useQuery({
    queryKey: managerKeys.ratingSeries(managerId ?? "self", monthsBack),
    queryFn: () =>
      execute(GET_MANAGER_RATING_SERIES_QUERY, {
        managerId,
        monthsBack,
      }),
    enabled,
    select: (data) => data.getManagerRatingSeries,
    staleTime: 5 * 60 * 1000,
  });
};
