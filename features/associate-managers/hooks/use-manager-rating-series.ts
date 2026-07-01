import { useQuery } from "@tanstack/react-query";
import type { TypedDocumentNode } from "@graphql-typed-document-node/core";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";
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

// Cast required because codegen runs against the deployed BE schema which does
// not yet include `getManagerRatingSeries`. Drop the cast + re-run codegen once
// the BE change ships. See `use-team-sales.ts` for the same pattern.
const GET_MANAGER_RATING_SERIES_QUERY = graphql(`
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
