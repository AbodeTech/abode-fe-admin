import { isMockApiEnabled } from "@/lib/mocks/config";

/**
 * Admin UI built ahead of its backend change (see the "Admin v2 — Backend
 * Requirements" doc). The BE rejects unknown query params with a 400, so a
 * control that sends a param the BE doesn't accept yet would break its page.
 *
 * Each item is on in mock mode, and on a real BE only once its key is listed in
 * NEXT_PUBLIC_BACKEND_READY (comma-separated), e.g.
 *   NEXT_PUBLIC_BACKEND_READY=cs_completed_filter,campaign_sort
 * When an item has shipped everywhere, delete its key here and the gate with it.
 */
export const PENDING_BACKEND = {
  /** Item 9: `completed_from` / `completed_to` on the CS dashboard + export. */
  cs_completed_filter: "cs_completed_filter",
  /** Item 15: `sort_by` / `sort_dir` on GET /admin/campaigns. */
  campaign_sort: "campaign_sort",
  /** Item 13: YEAR scored on summed targets + `all_time` on the manager dashboards. */
  manager_long_periods: "manager_long_periods",
  /** Item 11: `status=resolved` on purchase confirmations (+ `resolved_by`). */
  disputes_resolved: "disputes_resolved",
  /** Item 10: `active_from` / `active_to` on allocation eligible clients. */
  last_active: "last_active",
  /** Item 7: plans carry `agency_id`, and the analytics endpoints accept it. */
  agency_sales: "agency_sales",
  /** Item 8: `GET /admin/agencies/:agency_id/stats`. */
  agency_stats: "agency_stats",
  /** Item 12: `GET /admin/referrals/upgrades/eligible` (course-based eligibility). */
  upgrade_eligibility: "upgrade_eligibility",
  /** Item 16: three company targets on the yearly goal (body keys + dashboard block). */
  yearly_goals_v2: "yearly_goals_v2",
} as const;

export type PendingBackendKey = keyof typeof PENDING_BACKEND;

export function readyKeys(raw = process.env.NEXT_PUBLIC_BACKEND_READY): Set<string> {
  return new Set(
    (raw ?? "")
      .split(",")
      .map((key) => key.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function isBackendReady(key: PendingBackendKey): boolean {
  return isMockApiEnabled() || readyKeys().has(key);
}
