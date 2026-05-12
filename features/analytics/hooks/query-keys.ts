export interface SalesAnalyticsFiltersKey {
  startDate?: string | null;
  endDate?: string | null;
  assetType?: string | null;
  location?: string | null;
}

export const salesAnalyticsKeys = {
  all: ["sales-analytics"] as const,
  kpis: (filters?: SalesAnalyticsFiltersKey) =>
    [...salesAnalyticsKeys.all, "kpis", filters] as const,
  assetBreakdown: (filters?: SalesAnalyticsFiltersKey) =>
    [...salesAnalyticsKeys.all, "asset-breakdown", filters] as const,
  monthlyTimeline: (filters?: SalesAnalyticsFiltersKey) =>
    [...salesAnalyticsKeys.all, "monthly-timeline", filters] as const,
};
