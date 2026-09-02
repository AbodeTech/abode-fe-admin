import { z } from 'zod';

/* ============================================================
 * Manager dashboard — the five scopes, all returning one shape:
 *   GET /admin/managers/dashboard            (own team, id from JWT)
 *   GET /admin/managers/:manager_id/dashboard
 *   GET /admin/managers/dashboard/all        (every manager's roster)
 *   GET /admin/managers/dashboard/system     (the whole associate tier)
 * plus the roster CSV exports.
 *
 * Filters go as FLAT snake_case query params — there is no nested `filter`
 * object. `forbidNonWhitelisted` is on, so an unknown param is a 400.
 * ============================================================ */

/* -------------------- roster grouping / sorting -------------------- */

/**
 * The roster groups the BE implements (`PRO_GROUPS`), in three families:
 *
 *  - activity buckets (`active | inactive | abandoned`) — a property of the
 *    pro, read off the row's status, not of the period;
 *  - what happened TO the pro in the window (`*_in_period`);
 *  - what the pro DROVE in the window (the `active_*` contributor groups).
 *
 * `recruiting` and `selling` are v2-era aliases for `active_recruiter` and
 * `selling_in_period`; prefer the explicit names in new code.
 */
export const PRO_GROUPS = [
  'all',
  'active',
  'inactive',
  'abandoned',
  'recruited_in_period',
  'upgraded_in_period',
  'onboarded_in_period',
  'selling_in_period',
  'recruited_not_onboarded',
  'active_recruiter',
  'active_promoter',
  'active_revenue_generator',
  'recruiting',
  'selling',
] as const;
export const ProGroupSchema = z.enum(PRO_GROUPS);
export type ProGroup = z.infer<typeof ProGroupSchema>;

/** The roster sorts the BE implements (`PRO_SORTS`). Default is `name_asc`. */
export const PRO_SORTS = [
  'name_asc',
  'name_desc',
  'sales_desc',
  'revenue_desc',
  'recruited_desc',
  'last_login_desc',
  'onboarded_at_desc',
  'last_recruit_desc',
  'last_sale_desc',
] as const;
export const ProSortSchema = z.enum(PRO_SORTS);
export type ProSort = z.infer<typeof ProSortSchema>;

/**
 * Groups that credit an INDIVIDUAL pro for a contribution. The BE returns an
 * empty roster for these on the combined and system scopes — "who drove this"
 * is a question about one manager's book, and across dozens of managers the
 * answer is meaningless (v1 §6.2). Don't offer them in the org-wide views:
 * the request succeeds and comes back empty, which reads as "nobody" rather
 * than "not applicable".
 */
export const SINGLE_SCOPE_ONLY_GROUPS = [
  'active_recruiter',
  'active_promoter',
  'active_revenue_generator',
  'recruiting',
] as const;

export const isSingleScopeOnlyGroup = (group: ProGroup): boolean =>
  (SINGLE_SCOPE_ONLY_GROUPS as readonly string[]).includes(group);

/* -------------------- payload -------------------- */

export const ACTIVITY_BUCKETS = ['active', 'inactive', 'abandoned'] as const;
export const ActivityBucketSchema = z.enum(ACTIVITY_BUCKETS);
export type ActivityBucket = z.infer<typeof ActivityBucketSchema>;

/** One roster row. Note `id` — the standalone pro summary uses `pro_id`. */
export const RosterRowSchema = z.object({
  id: z.string(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  email: z.string().nullable(),
  phone_number: z.string().nullable(),
  status: ActivityBucketSchema,
  date_recruited: z.string().nullable(),
  /** LIFETIME, not period — the column must not empty itself on a month switch. */
  total_sales: z.number(),
  revenue_generated: z.number(),
  last_login: z.string().nullable(),
  onboarded_at: z.string().nullable(),
});

export type RosterRow = z.infer<typeof RosterRowSchema>;

/** Where a signup/sale came from. Only populated on the org-wide scopes. */
const SourceBreakdownSchema = z.object({
  managed: z.number(),
  unassigned: z.number(),
  users: z.number(),
  associate: z.number(),
});

const ContributorBaseSchema = {
  pro_id: z.string(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  email: z.string().nullable(),
};

const ContributorCountSchema = z.object({ ...ContributorBaseSchema, count: z.number() });
const ContributorAmountSchema = z.object({ ...ContributorBaseSchema, amount: z.number() });

export type ContributorCount = z.infer<typeof ContributorCountSchema>;
export type ContributorAmount = z.infer<typeof ContributorAmountSchema>;

export const ManagerDashboardSchema = z.object({
  period: z.object({
    period_type: z.string(),
    month: z.number().nullable(),
    year: z.number().nullable(),
    start: z.string(),
    end: z.string(),
  }),

  target: z.object({
    recruited_target: z.number(),
    recruited_so_far: z.number(),
    selling_target: z.number(),
    selling_so_far: z.number(),
    revenue_target: z.number(),
    revenue_so_far: z.number(),
    performance_score_target: z.number(),
    performance_score_so_far: z.number(),
  }),

  recruitment: z.object({
    new_signups_in_period: z.number(),
    upgrades_in_period: z.number(),
    onboarded_in_period: z.number(),
    onboarded_fresh_in_period: z.number(),
    onboarded_carryover_in_period: z.number(),
    total_assigned: z.number(),
    onboarding_queue_count: z.number(),
    // §6.2 — attribution and contributors answer different questions and are
    // never both populated: a single manager gets per-pro credit, the org-wide
    // scopes get channels. The other side arrives zeroed, not absent.
    new_signups_by_source: SourceBreakdownSchema,
    upgrades_by_source: SourceBreakdownSchema,
    top_new_signups_contributors: z.array(ContributorCountSchema),
    top_upgrades_contributors: z.array(ContributorCountSchema),
    others_new_signups_count: z.number(),
    others_upgrades_count: z.number(),
    active_recruiting_pros_count: z.number(),
    active_promoting_pros_count: z.number(),
  }),

  sales_and_revenue: z.object({
    selling_pros: z.number(),
    selling_pros_target: z.number(),
    total_revenue: z.number(),
    initial_sales_revenue: z.number(),
    recurring_revenue: z.number(),
    revenue_per_selling_pro: z.number(),
    sales_count_by_source: SourceBreakdownSchema,
    revenue_by_source: SourceBreakdownSchema,
    top_selling_contributors: z.array(ContributorAmountSchema),
    others_selling_revenue: z.number(),
    active_revenue_generating_pros_count: z.number(),
  }),

  activity: z.object({
    active_count: z.number(),
    active_pct: z.number(),
    recent_login_count: z.number(),
    recent_sale_count: z.number(),
    recent_recruit_count: z.number(),
    inactive_count: z.number(),
    inactive_pct: z.number(),
    abandoned_count: z.number(),
    abandoned_pct: z.number(),
  }),

  milestones: z.object({
    early_sellers: z.number(),
    late_first_sellers: z.number(),
  }),

  performance_score: z.object({
    /** The computed 50-30-20 score. */
    score: z.number(),
    selling_component: z.number(),
    revenue_component: z.number(),
    recruitment_component: z.number(),
    /** The MANUAL peer-rating target — same 0-100 range, different meaning. */
    target: z.number(),
    actual: z.number(),
    /**
     * 0 means NOBODY HAS RATED. Never render that as a real score of zero —
     * it is the difference between "unrated" and "terrible".
     */
    rating_count: z.number(),
  }),

  associate_pros: z.array(RosterRowSchema),
  associate_pros_group_total: z.number(),
});

export type ManagerDashboard = z.infer<typeof ManagerDashboardSchema>;

/* -------------------- request params -------------------- */

/**
 * Flat query params for every dashboard and roster-export route.
 *
 * `period_type` accepts the BE's own vocabulary (`this_month`, `last_month`,
 * `this_year`, `last_year`, `custom`) AND the v1 spellings this FE sends
 * (`WEEK | MONTH | YEAR | CUSTOM`), which the BE whitelists deliberately and
 * lowercases on read. The v1 `MONTH` form is not redundant: it carries an
 * explicit month/year, which is the only way to ask for an ARBITRARY month —
 * the canonical set only reaches this month and last.
 */
// A `type`, not an `interface`: only type aliases get an implicit index
// signature, which is what lets these be passed as the request `params`
// (`Record<string, unknown>`) without a cast at every call site.
export type ManagerDashboardParams = {
  period_type?: string;
  month?: number;
  year?: number;
  start_date?: string;
  end_date?: string;
  pro_group?: ProGroup;
  pro_sort?: ProSort;
  page?: number;
  limit?: number;
};
