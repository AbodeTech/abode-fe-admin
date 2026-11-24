/* ============================================================
 * Landing pages — where a role starts after sign-in.
 *
 * The values are the backend's own list (`LANDING_PAGES` in
 * abode-be-v2 `src/common/permissions.ts`); the API rejects anything else.
 * Each value maps to a route through the page registry (`landing` on an
 * entry), so a new landing page is one registry entry plus one value here.
 *
 * The session already carries the answer: `start_page` is the person's own
 * choice when it still matches one of their roles, otherwise the primary
 * role's landing page. The frontend reads it. It never works it out from the
 * roles itself — that rule lives in one place, on the server.
 * ============================================================ */

export const LANDING_PAGES = [
  'dashboard',
  'manager_performance',
  'associate_pro_tracker',
  'cs_manager_performance',
  'financial_officer_performance',
  'recruitment',
] as const;

export type LandingPage = (typeof LANDING_PAGES)[number];

/** Where an unknown or missing landing value goes. Always reachable for a signed-in admin. */
export const FALLBACK_LANDING_ROUTE = '/';

export function isLandingPage(value: unknown): value is LandingPage {
  return typeof value === 'string' && (LANDING_PAGES as readonly string[]).includes(value);
}
