export * from './components/TopAssociatesTable';
export * from './components/TopAssociatesHeader';
export { DashboardTopAssociatesTable } from './components/DashboardTopAssociatesTable';

// The full leaderboard — GET /admin/associates/top (+ /top/export). Distinct
// from the dashboard's five-field tile, which lives in features/dashboard.
export {
  useTopAssociates,
  DEFAULT_LEADERBOARD_LIMIT,
} from './hooks/use-top-associates';
export { useTopAssociatesExport } from './hooks/use-top-associates-export';
export {
  ASSOCIATE_SORT_FIELDS,
  ASSOCIATE_SORT_LABELS,
  LEADERBOARD_ASSET_TYPES,
  LEADERBOARD_ASSET_TYPE_LABELS,
  LEADERBOARD_TIERS,
  LEADERBOARD_TIER_LABELS,
  TopAssociateSchema,
} from './schemas/top-associate.schema';
export type {
  AssociateSortField,
  LeaderboardAssetType,
  LeaderboardTier,
  SortDirection,
  TopAssociate,
  TopAssociateFilters,
  TopAssociateListParams,
} from './schemas/top-associate.schema';
