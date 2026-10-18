import {
  PLAN_SORT_KEYS,
  type PlanFilterKey,
  type PlanSortKey,
} from '../schemas/cs-manager.schema';

/**
 * Sorting for the plans table. Server-side: the BE takes these five as
 * `?sort=` (PLAN_SORT_KEYS in abode-be-v2's cs-manager-requests.dto.ts) and
 * the page has always forwarded it, but nothing in the UI wrote it — so every
 * book was read in the BE's default order unless the URL was edited by hand.
 */
export const PLAN_SORTS: { value: PlanSortKey; label: string }[] = [
  { value: 'last_activity_desc', label: 'Recently active' },
  { value: 'last_activity_asc', label: 'Least recently active' },
  { value: 'purchase_date_asc', label: 'Bought first' },
  { value: 'purchase_date_desc', label: 'Bought last' },
  { value: 'customer_asc', label: 'Customer A–Z' },
];

/** Onboarding pending and the three chips inside it — all one call list. */
const CALL_LIST_FILTERS: ReadonlySet<PlanFilterKey> = new Set<PlanFilterKey>([
  'onboarding_pending',
  'never_attempted',
  'no_answer',
  'rescheduled',
]);

/**
 * Which sort a queue starts in when the URL doesn't say.
 *
 * The onboarding queues are call lists, so they open oldest purchase first:
 * the buyer who has waited longest to be called belongs at the top. The BE's
 * own default — most recently active — is close to useless there, because a
 * plan with no completed call has no call activity to order by, leaving the
 * last payment or admin edit, none of which is the CSM's queue.
 *
 * Every other queue keeps the BE default, which this mirrors rather than
 * writes, so an untouched URL stays clean.
 */
export const defaultPlanSort = (filter: PlanFilterKey): PlanSortKey =>
  CALL_LIST_FILTERS.has(filter) ? 'purchase_date_asc' : 'last_activity_desc';

/**
 * The sort actually in force: the URL's, else the queue default. A value the
 * BE doesn't know falls back too — sent as is, it would be a 400.
 */
export const effectivePlanSort = (filter: PlanFilterKey, sort?: string | null): PlanSortKey =>
  (PLAN_SORT_KEYS as readonly string[]).includes(sort ?? '')
    ? (sort as PlanSortKey)
    : defaultPlanSort(filter);
