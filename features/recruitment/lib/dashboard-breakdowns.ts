/**
 * Shapes the cohort dashboard's raw breakdowns for display.
 *
 * The backend groups `region` by its raw "LGA, State" string and `referral`
 * by individual referrer username, so on real data both lists run to hundreds
 * of rows. These helpers collapse them into something a chart can show.
 */

interface BreakdownDatum {
  name: string;
  value: number;
}

export interface StateBreakdown {
  name: string;
  value: number;
  /** Largest LGAs inside this state — only the ones that were reported (no LGA = not listed). */
  lgas: BreakdownDatum[];
}

const STATE_ALIASES: Record<string, string> = {
  fct: 'FCT',
  'federal capital territory': 'FCT',
};

function normaliseState(raw: string): string {
  const stripped = raw.replace(/\s+state$/i, '').replace(/\s+/g, ' ').trim();
  return STATE_ALIASES[stripped.toLowerCase()] ?? stripped;
}

/**
 * "Mushin, Lagos State" → { state: "Lagos", lga: "Mushin" }.
 * A value with no comma is taken as a state on its own (no LGA).
 */
export function parseRegion(region: string): { state: string; lga: string | null } {
  const parts = region.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return { state: region.trim(), lga: null };
  const state = normaliseState(parts[parts.length - 1]);
  const lga = parts.length > 1 ? parts.slice(0, -1).join(', ') : null;
  return { state, lga };
}

/** Sums the per-LGA rows into states, largest first. Never drops or invents registrations. */
export function groupRegionsByState(data: BreakdownDatum[]): StateBreakdown[] {
  const byState = new Map<string, { name: string; value: number; lgas: Map<string, number> }>();
  for (const row of data) {
    const { state, lga } = parseRegion(row.name);
    const key = state.toLowerCase();
    const entry = byState.get(key) ?? { name: state, value: 0, lgas: new Map<string, number>() };
    entry.value += row.value;
    if (lga) entry.lgas.set(lga, (entry.lgas.get(lga) ?? 0) + row.value);
    byState.set(key, entry);
  }
  return [...byState.values()]
    .map((s) => ({
      name: s.name,
      value: s.value,
      lgas: [...s.lgas.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
    }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
}

/** Keeps the `limit` largest rows; everything else is summed into one trailing row so totals still add up. */
export function topWithRemainder(
  data: BreakdownDatum[],
  limit: number,
): { top: BreakdownDatum[]; otherCount: number; otherValue: number } {
  const sorted = [...data].sort((a, b) => b.value - a.value);
  const rest = sorted.slice(limit);
  return {
    top: sorted.slice(0, limit),
    otherCount: rest.length,
    otherValue: rest.reduce((sum, r) => sum + r.value, 0),
  };
}
