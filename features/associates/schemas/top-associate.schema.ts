import { z } from 'zod';

/* ============================================================
 * Associate leaderboard — GET /admin/associates/top
 *                         GET /admin/associates/top/export
 *
 * Distinct from the dashboard's top-associates TILE
 * (`features/dashboard`, GET /admin/dashboard/top-associates), which is a
 * five-field lifetime-commission list with no filters or paging. This is the
 * full leaderboard: 17 fields, eight sorts, date/tier/asset filters, CSV.
 * ============================================================ */

/**
 * One leaderboard row.
 *
 * TWO SCOPES IN ONE ROW, which the labels don't reveal: `no_of_clients` and the
 * three `referred_*` counts are LIFETIME and ignore the date filter, while
 * everything from `units_sold` down is scoped to the selected range. A date
 * range therefore changes the money columns and not the client columns.
 */
export const TopAssociateSchema = z.object({
  user_id: z.string(),
  name: z.string(),
  /** The referral tier — `associate`, `associate-pro`, `founder`… */
  status: z.string(),
  email: z.string(),
  profile_pic: z.string().nullable(),
  /** The associate's own upline, or the literal "No referrer". */
  sales_person: z.string(),
  last_login: z.string().nullable(),

  // Lifetime, never date-scoped.
  no_of_clients: z.number(),
  referred_user_count: z.number(),
  referred_associate_count: z.number(),
  referred_associate_pro_count: z.number(),

  // Date-scoped from here down.
  units_sold: z.number(),
  size_sold: z.number(),
  expected: z.number(),
  received: z.number(),
  balance: z.number(),
  commission: z.number(),
  /** `received / expected × 100`, 2dp. Zero expected reads as 0, never NaN. */
  collection_rate: z.number(),
});

export type TopAssociate = z.infer<typeof TopAssociateSchema>;

/* -------------------- sorting -------------------- */

export const ASSOCIATE_SORT_FIELDS = [
  'sales_person',
  'no_of_clients',
  'units_sold',
  'size_sold',
  'expected',
  'received',
  'commission',
  'collection_rate',
] as const;

export const AssociateSortFieldSchema = z.enum(ASSOCIATE_SORT_FIELDS);
export type AssociateSortField = z.infer<typeof AssociateSortFieldSchema>;

export const ASSOCIATE_SORT_LABELS: Record<AssociateSortField, string> = {
  sales_person: 'Sales Person',
  no_of_clients: 'Number of Clients',
  units_sold: 'Units Sold',
  size_sold: 'Total Size',
  expected: 'Expected Revenue',
  received: 'Received Revenue',
  commission: 'Commission',
  collection_rate: 'Collection Rate',
};

export type SortDirection = 'asc' | 'desc';

/* -------------------- filters -------------------- */

/**
 * The tiers that can earn on the platform, and so the ones a leaderboard ranks.
 * `user` and `guest` are buyers; an agency earns through an Agency record and
 * has its own screens. Mirrors the BE's `LEADERBOARD_TIERS`.
 */
export const LEADERBOARD_TIERS = [
  'associate',
  'associate-pro',
  'founder',
  'management',
  'premium',
] as const;

export const LeaderboardTierSchema = z.enum(LEADERBOARD_TIERS);
export type LeaderboardTier = z.infer<typeof LeaderboardTierSchema>;

export const LEADERBOARD_TIER_LABELS: Record<LeaderboardTier, string> = {
  associate: 'Associate',
  'associate-pro': 'Associate Pro',
  founder: 'Founder',
  management: 'Management',
  premium: 'Premium',
};

/**
 * Note `developer_plot` is underscored while `full-ownership` is hyphenated —
 * that is what `PaymentPlan.asset_type` actually stores, not a typo. Legacy
 * plan types (`co-ownership`, `land-banking`) have no live purchase path and
 * aren't offered as filters, but still count toward totals when unfiltered.
 */
export const LEADERBOARD_ASSET_TYPES = [
  'flex',
  'full-ownership',
  'commercial',
  'developer_plot',
] as const;

export const LeaderboardAssetTypeSchema = z.enum(LEADERBOARD_ASSET_TYPES);
export type LeaderboardAssetType = z.infer<typeof LeaderboardAssetTypeSchema>;

export const LEADERBOARD_ASSET_TYPE_LABELS: Record<LeaderboardAssetType, string> = {
  flex: 'Flex',
  'full-ownership': 'Full Ownership',
  commercial: 'Commercial',
  developer_plot: 'Developer Plot',
};

/** Mirrors `TopAssociatesFilterDto` — shared by the list and the export. */
export type TopAssociateFilters = {
  start_date?: string;
  end_date?: string;
  asset_type?: LeaderboardAssetType;
  /** Filters the associates being RANKED, never their clients. */
  referral_status?: LeaderboardTier;
  /** Audit opt-in — suspended associates are excluded by default. */
  include_suspended?: boolean;
  sort_by?: AssociateSortField;
  sort_dir?: SortDirection;
};

export type TopAssociateListParams = TopAssociateFilters & {
  page?: number;
  limit?: number;
};
