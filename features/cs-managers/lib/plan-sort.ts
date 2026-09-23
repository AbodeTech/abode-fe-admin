import { CsPlanFilter, CsPlanSort } from "@/lib/gql/graphql";

/**
 * Sorting for the plans table.
 *
 * The BE has always accepted these five (CSPlanSort in adminTypeDefs) and the
 * page has always forwarded `?sort=`, but nothing in the UI wrote it — so in
 * practice every book was read in the BE's default order and the only way to
 * change it was editing the URL by hand.
 */
export const PLAN_SORTS: { value: CsPlanSort; label: string }[] = [
  { value: CsPlanSort.LastActivityDesc, label: "Recently active" },
  { value: CsPlanSort.LastActivityAsc, label: "Least recently active" },
  { value: CsPlanSort.PurchaseDateAsc, label: "Bought first" },
  { value: CsPlanSort.PurchaseDateDesc, label: "Bought last" },
  { value: CsPlanSort.CustomerAsc, label: "Customer A–Z" },
];

/**
 * Which sort a queue starts in when the URL doesn't say.
 *
 * Onboarding pending is a call list, so it opens oldest purchase first: the
 * buyer who has waited longest to be called belongs at the top. The BE's own
 * default — most recently active — is close to useless there, because a plan
 * with no completed call has no call activity to order by, leaving `updatedAt`:
 * a payment, an admin edit, or a bulk write, none of which is the CSM's queue.
 *
 * Every other queue keeps the BE default, which this mirrors rather than sends,
 * so an untouched URL stays clean.
 */
export const defaultPlanSort = (filter: CsPlanFilter): CsPlanSort =>
  filter === CsPlanFilter.OnboardingPending
    ? CsPlanSort.PurchaseDateAsc
    : CsPlanSort.LastActivityDesc;

/** The sort actually in force: what the URL asked for, else the queue default. */
export const effectivePlanSort = (
  filter: CsPlanFilter,
  sort?: CsPlanSort | null
): CsPlanSort => sort ?? defaultPlanSort(filter);
