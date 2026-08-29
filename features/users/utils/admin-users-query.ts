/**
 * GET /admin/users, /overview, /analytics query helpers.
 * Dates are both-or-neither (INVALID_DATE_RANGE if only one is sent).
 */

export function boolQuery(value: boolean | undefined): string | undefined {
  if (value === undefined) return undefined;
  return value ? 'true' : 'false';
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
