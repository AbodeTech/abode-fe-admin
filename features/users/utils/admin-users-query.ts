/**
 * GET /admin/users, /overview, /analytics query helpers.
 * Dates are both-or-neither (INVALID_DATE_RANGE if only one is sent).
 */

export function boolQuery(value: boolean | undefined): string | undefined {
  if (value === undefined) return undefined;
  return value ? 'true' : 'false';
}

/** Inverse of `boolQuery` — reads a tri-state boolean back off the URL. */
export function boolFromParam(value: string | null | undefined): boolean | undefined {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return undefined;
}

export function bothOrNeitherDates(
  from?: string | null,
  to?: string | null
): { date_from?: string; date_to?: string } {
  const date_from = from?.trim() || undefined;
  const date_to = to?.trim() || undefined;
  if (date_from && date_to) return { date_from, date_to };
  return {};
}
