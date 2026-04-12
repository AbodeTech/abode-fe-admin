import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { executeRaw } from "@/lib/graphql-client";

// ── Types ──────────────────────────────────────────────────────────────────

interface CommissionTier {
  founder: number;
  associate_pro: number;
  premium: number;
  default: number;
}

interface UplineTier {
  founder: number;
  associate_pro: number;
  premium: number;
}

interface ToplineTier {
  associate_pro: number;
  founder: number;
}

interface FlexCommission {
  direct: CommissionTier;
}

interface FullOwnershipCommission {
  direct: CommissionTier;
  upline: UplineTier;
  topline: ToplineTier;
}

interface RemovalDirectRates {
  associate_pro: number;
  default: number;
}

interface FlexRemoval {
  direct: RemovalDirectRates;
}

interface FullOwnershipRemoval {
  direct: RemovalDirectRates;
  upline: number;
  topline: number;
}

export interface CommissionConfig {
  _id: string;
  flexCommission: FlexCommission;
  fullOwnershipCommission: FullOwnershipCommission;
  flexRemoval: FlexRemoval;
  fullOwnershipRemoval: FullOwnershipRemoval;
  whtPercentage: number;
  highCommissionAlertThreshold: number;
  upgradeCommissionPercentage: number;
  associateProFee: number;
  marketplacePlatformFeePercentage: number;
  version: number;
  updatedAt: string;
  createdAt: string;
}

interface HistoryEntry {
  _id: string;
  version: number;
  changedBy: string;
  changedByEmail: string;
  changedFields: string[];
  changeDescription: string;
  createdAt: string;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

interface CommissionConfigHistoryResponse {
  history: HistoryEntry[];
  pagination: Pagination;
}

// ── Queries ────────────────────────────────────────────────────────────────

const GET_COMMISSION_CONFIG = `
  query GetCommissionConfig {
    getCommissionConfig {
      _id
      flexCommission {
        direct {
          founder
          associate_pro
          premium
          default
        }
      }
      fullOwnershipCommission {
        direct { founder associate_pro premium default }
        upline { founder associate_pro premium }
        topline { associate_pro founder }
      }
      flexRemoval {
        direct { associate_pro default }
      }
      fullOwnershipRemoval {
        direct { associate_pro default }
        upline
        topline
      }
      whtPercentage
      highCommissionAlertThreshold
      upgradeCommissionPercentage
      associateProFee
      marketplacePlatformFeePercentage
      version
      updatedAt
      createdAt
    }
  }
`;

const GET_COMMISSION_CONFIG_HISTORY = `
  query GetCommissionConfigHistory($page: Int!, $limit: Int!) {
    getCommissionConfigHistory(page: $page, limit: $limit) {
      history {
        _id
        version
        changedBy
        changedByEmail
        changedFields
        changeDescription
        createdAt
      }
      pagination {
        total
        page
        limit
        pages
      }
    }
  }
`;

const UPDATE_COMMISSION_CONFIG = `
  mutation UpdateCommissionConfig($input: UpdateCommissionConfigInput!) {
    updateCommissionConfig(input: $input) {
      _id
      version
      updatedAt
    }
  }
`;

// ── Query Keys ─────────────────────────────────────────────────────────────

export const commissionConfigKeys = {
  all: ["commission-config"] as const,
  config: () => [...commissionConfigKeys.all, "current"] as const,
  history: () => [...commissionConfigKeys.all, "history"] as const,
  historyPage: (page: number, limit: number) =>
    [...commissionConfigKeys.history(), { page, limit }] as const,
};

// ── Hooks ──────────────────────────────────────────────────────────────────

export const useCommissionConfig = () => {
  return useQuery({
    queryKey: commissionConfigKeys.config(),
    queryFn: () =>
      executeRaw<{ getCommissionConfig: CommissionConfig }>(GET_COMMISSION_CONFIG),
    select: (data) => data.getCommissionConfig,
  });
};

export const useCommissionConfigHistory = (page: number, limit: number) => {
  return useQuery({
    queryKey: commissionConfigKeys.historyPage(page, limit),
    queryFn: () =>
      executeRaw<{ getCommissionConfigHistory: CommissionConfigHistoryResponse }>(
        GET_COMMISSION_CONFIG_HISTORY,
        { page, limit }
      ),
    select: (data) => data.getCommissionConfigHistory,
  });
};

export interface UpdateCommissionConfigInput {
  flexCommission?: { direct?: Partial<CommissionTier> };
  fullOwnershipCommission?: {
    direct?: Partial<CommissionTier>;
    upline?: Partial<UplineTier>;
    topline?: Partial<ToplineTier>;
  };
  flexRemoval?: { direct?: Partial<RemovalDirectRates> };
  fullOwnershipRemoval?: {
    direct?: Partial<RemovalDirectRates>;
    upline?: number;
    topline?: number;
  };
  whtPercentage?: number;
  highCommissionAlertThreshold?: number;
  upgradeCommissionPercentage?: number;
  associateProFee?: number;
  marketplacePlatformFeePercentage?: number;
  changeDescription: string;
}

export const useUpdateCommissionConfig = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateCommissionConfigInput) =>
      executeRaw<{ updateCommissionConfig: CommissionConfig }>(
        UPDATE_COMMISSION_CONFIG,
        { input }
      ),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: commissionConfigKeys.all });
    },
  });
};
