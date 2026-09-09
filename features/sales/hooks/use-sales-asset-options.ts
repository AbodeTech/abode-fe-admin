"use client";

import { useQuery } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";
import { salesKeys } from "./query-keys";

/**
 * Estate names and locations, for the two sales filters.
 *
 * The sales feature keeps its own query rather than reusing the assets one:
 * features are self-contained here, and this needs three fields where that one
 * pulls the whole asset record.
 *
 * Locations are de-duplicated client-side because there is no endpoint for
 * distinct locations and several estates share one. Both filters send the raw
 * string, not an id — the BE matches loosely on purpose, so "Woodgate" finding
 * both Woodgate Prime and Woodgate City is the feature, not a rounding error.
 */

const GET_SALES_ASSET_OPTIONS = graphql(`
  query GetSalesAssetOptions($page: Int!, $limit: Int!) {
    getAllAdminAssets(page: $page, limit: $limit) {
      data {
        _id
        asset_name
        asset_location
      }
    }
  }
`);

export interface SalesAssetOptions {
  estates: { id: string; name: string }[];
  locations: string[];
}

export const useSalesAssetOptions = (enabled = true) => {
  const query = useQuery({
    // One page big enough for the whole estate list; there is no search
    // endpoint behind this and the list is small enough to hold.
    queryKey: [...salesKeys.all, "asset-options"] as const,
    queryFn: () => execute(GET_SALES_ASSET_OPTIONS, { page: 1, limit: 500 }),
    // Estates change rarely — no reason to refetch on every mount.
    staleTime: 10 * 60 * 1000,
    enabled,
  });

  const rows = (query.data?.getAllAdminAssets?.data ?? []).filter(
    (a): a is NonNullable<typeof a> => a !== null
  );

  const estates = rows
    .filter((a) => !!a.asset_name)
    .map((a) => ({ id: a._id as string, name: a.asset_name as string }))
    .sort((a, b) => a.name.localeCompare(b.name));

  const locations = Array.from(
    new Set(
      rows
        .map((a) => a.asset_location)
        .filter((l): l is string => !!l && l.trim().length > 0)
        .map((l) => l.trim())
    )
  ).sort((a, b) => a.localeCompare(b));

  return { estates, locations, isLoading: query.isLoading };
};
