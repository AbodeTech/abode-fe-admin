import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { executeRaw } from "@/lib/graphql-client";

// ── Types ──────────────────────────────────────────────────────────────────

export interface AssetOverrideSummary {
  _id: string;
  asset_name: string;
  asset_type: string;
}

interface OptionalCommissionTier {
  founder?: number | null;
  associate_pro?: number | null;
  premium?: number | null;
  default?: number | null;
}

interface OptionalUplineTier {
  founder?: number | null;
  associate_pro?: number | null;
  premium?: number | null;
}

interface OptionalToplineTier {
  associate_pro?: number | null;
  founder?: number | null;
}

interface OptionalRemovalDirectRates {
  associate_pro?: number | null;
  default?: number | null;
}

export interface AssetCommissionOverride {
  _id: string;
  asset: AssetOverrideSummary;
  flexCommission?: {
    direct?: OptionalCommissionTier;
  } | null;
  fullOwnershipCommission?: {
    direct?: OptionalCommissionTier;
    upline?: OptionalUplineTier;
    topline?: OptionalToplineTier;
  } | null;
  flexRemoval?: {
    direct?: OptionalRemovalDirectRates;
  } | null;
  fullOwnershipRemoval?: {
    direct?: OptionalRemovalDirectRates;
    upline?: number | null;
    topline?: number | null;
  } | null;
  lastModifiedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface AssetCommissionOverrideListResponse {
  overrides: AssetCommissionOverride[];
  pagination: Pagination;
}

export interface UpsertAssetOverrideInput {
  assetId: string;
  flexCommission?: {
    direct?: Partial<{ founder: number; associate_pro: number; premium: number; default: number }>;
  };
  fullOwnershipCommission?: {
    direct?: Partial<{ founder: number; associate_pro: number; premium: number; default: number }>;
    upline?: Partial<{ founder: number; associate_pro: number; premium: number }>;
    topline?: Partial<{ associate_pro: number; founder: number }>;
  };
  flexRemoval?: {
    direct?: Partial<{ associate_pro: number; default: number }>;
  };
  fullOwnershipRemoval?: {
    direct?: Partial<{ associate_pro: number; default: number }>;
    upline?: number;
    topline?: number;
  };
  changeDescription: string;
}

// ── Queries ────────────────────────────────────────────────────────────────

const OVERRIDE_FIELDS = `
  _id
  asset { _id asset_name asset_type }
  flexCommission { direct { founder associate_pro premium default } }
  fullOwnershipCommission {
    direct { founder associate_pro premium default }
    upline { founder associate_pro premium }
    topline { associate_pro founder }
  }
  flexRemoval { direct { associate_pro default } }
  fullOwnershipRemoval {
    direct { associate_pro default }
    upline
    topline
  }
  lastModifiedBy
  createdAt
  updatedAt
`;

const GET_ASSET_OVERRIDES = `
  query GetAssetCommissionOverrides($page: Int!, $limit: Int!) {
    getAssetCommissionOverrides(page: $page, limit: $limit) {
      overrides { ${OVERRIDE_FIELDS} }
      pagination { total page limit pages }
    }
  }
`;

const GET_ASSET_OVERRIDE = `
  query GetAssetCommissionOverride($assetId: ID!) {
    getAssetCommissionOverride(assetId: $assetId) {
      ${OVERRIDE_FIELDS}
    }
  }
`;

const UPSERT_ASSET_OVERRIDE = `
  mutation UpsertAssetCommissionOverride($input: UpsertAssetCommissionOverrideInput!) {
    upsertAssetCommissionOverride(input: $input) {
      ${OVERRIDE_FIELDS}
    }
  }
`;

const DELETE_ASSET_OVERRIDE = `
  mutation DeleteAssetCommissionOverride($assetId: ID!) {
    deleteAssetCommissionOverride(assetId: $assetId)
  }
`;

// ── Query Keys ─────────────────────────────────────────────────────────────

export const assetOverrideKeys = {
  all: ["asset-commission-overrides"] as const,
  list: () => [...assetOverrideKeys.all, "list"] as const,
  listPage: (page: number, limit: number) =>
    [...assetOverrideKeys.list(), { page, limit }] as const,
  detail: (assetId: string) =>
    [...assetOverrideKeys.all, "detail", assetId] as const,
};

// ── Hooks ──────────────────────────────────────────────────────────────────

export const useAssetCommissionOverrides = (page: number, limit: number) => {
  return useQuery({
    queryKey: assetOverrideKeys.listPage(page, limit),
    queryFn: () =>
      executeRaw<{ getAssetCommissionOverrides: AssetCommissionOverrideListResponse }>(
        GET_ASSET_OVERRIDES,
        { page, limit }
      ),
    select: (data) => data.getAssetCommissionOverrides,
  });
};

export const useAssetCommissionOverride = (assetId: string) => {
  return useQuery({
    queryKey: assetOverrideKeys.detail(assetId),
    queryFn: () =>
      executeRaw<{ getAssetCommissionOverride: AssetCommissionOverride | null }>(
        GET_ASSET_OVERRIDE,
        { assetId }
      ),
    select: (data) => data.getAssetCommissionOverride,
    enabled: !!assetId,
  });
};

export const useUpsertAssetCommissionOverride = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: UpsertAssetOverrideInput) =>
      executeRaw<{ upsertAssetCommissionOverride: AssetCommissionOverride }>(
        UPSERT_ASSET_OVERRIDE,
        { input }
      ),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: assetOverrideKeys.all });
    },
  });
};

export const useDeleteAssetCommissionOverride = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (assetId: string) =>
      executeRaw<{ deleteAssetCommissionOverride: boolean }>(
        DELETE_ASSET_OVERRIDE,
        { assetId }
      ),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: assetOverrideKeys.all });
    },
  });
};
