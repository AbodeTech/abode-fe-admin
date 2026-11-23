import type { RecoveryTab } from "../schemas/recovery-window.schema";

export type RecoveryListFilters = {
  tab: RecoveryTab;
  search: string;
  page: number;
  limit: number;
};

export const recoveryKeys = {
  all: ["recovery-windows"] as const,
  list: (filters: RecoveryListFilters) => [...recoveryKeys.all, "list", filters] as const,
  stats: () => [...recoveryKeys.all, "stats"] as const,
  detail: (id: string) => [...recoveryKeys.all, "detail", id] as const,
  assetOptions: (type: string) => [...recoveryKeys.all, "asset-options", type] as const,
  assetTree: (assetId: string) => [...recoveryKeys.all, "asset-tree", assetId] as const,
};
