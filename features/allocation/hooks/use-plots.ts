import { useQuery } from "@tanstack/react-query";

import { graphql } from "@/lib/gql";
import { execute } from "@/lib/graphql-client";

/* ============================================================
 * Plot lookup for the allocation modal.
 *
 * ⚠️ Still GraphQL. These lived in `features/assets` until that feature moved
 * to REST; they were the only pieces of it that allocation depended on, and
 * plot allocation is an allocation concern rather than an asset one, so they
 * moved here instead of holding the assets migration open.
 *
 * There is no Block or Plot model on abode-be-v2 at all (⛔ ticket 17a), so
 * these have no REST equivalent to migrate to yet — they go when allocation
 * itself is rebuilt. Don't extend them.
 * ============================================================ */

export type PlotStatus = "available" | "allocated";

export interface Plot {
  _id: string;
  block: string;
  block_label: string;
  plot_number: number;
  size: number;
  status: PlotStatus;
  payment_plan: string | null;
  allocated_date: string | null;
}

/* -------------------- resolve an asset id from its name -------------------- */

// The v1 allocation screens address assets by name, but the plot query needs
// an id — hence this lookup. Kept verbatim from the assets feature so the
// codegen `graphql()` helper still resolves it from the generated document map.
const GET_ASSET_ID_BY_NAME_QUERY = graphql(`
  query GetAssetIdByName($page: Int!, $limit: Int!) {
    getAllAdminAssets(page: $page, limit: $limit) {
      data {
        _id
        asset_name
        asset_type
      }
    }
  }
`);

export const useAssetIdByName = (assetName: string, assetType: string) => {
  const decodedName = decodeURIComponent(assetName ?? "").trim().toLowerCase();
  const normalizedType = (assetType ?? "").trim().toLowerCase();

  return useQuery({
    queryKey: ["allocationAssets", "idByName", decodedName, normalizedType] as const,
    queryFn: () => execute(GET_ASSET_ID_BY_NAME_QUERY, { page: 1, limit: 5000 }),
    select: (data) => {
      const match = data.getAllAdminAssets?.data?.find((asset) => {
        if (!asset) return false;
        const name = (asset.asset_name ?? "").trim().toLowerCase();
        const type = (asset.asset_type ?? "").trim().toLowerCase();
        return name === decodedName && type === normalizedType;
      });
      return match?._id ?? null;
    },
    enabled: !!decodedName && !!normalizedType,
    staleTime: 5 * 60 * 1000,
  });
};

/* -------------------- available plots -------------------- */

const GET_AVAILABLE_PLOTS_FOR_ASSET_QUERY = graphql(`
  query GetAvailablePlotsForAsset($assetId: ID!, $size: Int) {
    getAvailablePlotsForAsset(assetId: $assetId, size: $size) {
      _id
      block
      block_label
      plot_number
      size
      status
    }
  }
`);

export const availablePlotsKeys = {
  all: ["availablePlots"] as const,
  list: (assetId: string, size?: number) =>
    [...availablePlotsKeys.all, "list", assetId, size ?? null] as const,
};

export interface UseAvailablePlotsParams {
  assetId: string;
  size?: number;
  enabled?: boolean;
}

export const useAvailablePlotsForAsset = ({
  assetId,
  size,
  enabled = true,
}: UseAvailablePlotsParams) => {
  return useQuery({
    queryKey: availablePlotsKeys.list(assetId, size),
    queryFn: () => execute(GET_AVAILABLE_PLOTS_FOR_ASSET_QUERY, { assetId, size }),
    // The query selects a subset of Plot's fields; the modal only reads those.
    select: (data) => data.getAvailablePlotsForAsset as Plot[],
    enabled: enabled && !!assetId,
  });
};
