import { MockHttpError, type MockRoutes } from '../router';
import { body, paged } from './util';

/* ============================================================
 * Division — /admin/division/*.
 *
 *   GET /admin/division/config    the ladder
 *   PUT /admin/division/config    replace the ladder
 *   GET /admin/division/summary   every division with how many associates are in it
 *   GET /admin/division/members   who is in one (?tier=&season_year=&page=&limit=&search=)
 *
 * Mirrors abode-be-v2 `src/modules/division`. Three things kept faithful
 * because the UI behaves differently for each:
 *
 *  - the ladder is validated as a SET on save (unique keys, unique thresholds,
 *    an entry rung at 0 sqm), each failure with its own error code;
 *  - membership is derived from the season rows below, so nudging a threshold
 *    in the editor visibly moves somebody — the behaviour most worth trying
 *    before doing it to production;
 *  - SEASONS. 2026 is live; 2025 is closed and deliberately carries a different
 *    spread, so switching the year picker plainly changes the answer rather
 *    than re-rendering the same table.
 * ============================================================ */

type MockTier = {
  key: string;
  name: string;
  min_sqm: number;
  tagline: string;
  benefits: { label: string; enabled: boolean }[];
};

const LIVE_SEASON = 2026;

let tiers: MockTier[] = [
  {
    key: 'bronze',
    name: 'Bronze',
    min_sqm: 0,
    tagline: 'Your first land placed this season.',
    benefits: [],
  },
  {
    key: 'silver',
    name: 'Silver',
    min_sqm: 5_000,
    tagline: 'Half a hectare placed — a steady season under way.',
    benefits: [],
  },
  {
    key: 'gold',
    name: 'Gold',
    min_sqm: 15_000,
    tagline: 'More than a hectare and a half moved.',
    benefits: [],
  },
  {
    key: 'diamond',
    name: 'Diamond',
    min_sqm: 30_000,
    tagline: 'Three hectares in a single season.',
    benefits: [],
  },
];

type MockStanding = {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  sqm: number;
  deals: number;
  division_visible: boolean;
};

/**
 * One row per associate per season.
 *
 * Seeded adversarially, like the standing fixture: Kelechi sits at 4,900 sqm,
 * just under the Silver boundary, so moving that threshold in the editor
 * visibly moves him. Ngozi is opted out — she still holds a rank and still
 * appears to admin, with a "Hidden" marker, which is the case that otherwise
 * looks like missing data.
 */
const SEASONS: Record<number, MockStanding[]> = {
  2026: [
    { user_id: 'a-001', first_name: 'Amaka', last_name: 'Mba', email: 'amaka@example.com', phone: '08032000001', sqm: 34_200, deals: 21, division_visible: true },
    { user_id: 'a-002', first_name: 'Seyi', last_name: 'Ekundayo', email: 'seyi@example.com', phone: '08032000002', sqm: 21_500, deals: 14, division_visible: true },
    { user_id: 'a-003', first_name: 'Ngozi', last_name: 'Eze', email: 'ngozi.a@example.com', phone: null, sqm: 19_000, deals: 12, division_visible: false },
    { user_id: 'a-004', first_name: 'Femi', last_name: 'Alabi', email: 'femi@example.com', phone: '08032000004', sqm: 16_400, deals: 11, division_visible: true },
    { user_id: 'a-005', first_name: 'Chioma', last_name: 'Udo', email: 'chioma@example.com', phone: '08032000005', sqm: 12_000, deals: 9, division_visible: true },
    { user_id: 'a-006', first_name: 'Bayo', last_name: 'Kuti', email: 'bayo@example.com', phone: null, sqm: 8_500, deals: 7, division_visible: true },
    { user_id: 'a-007', first_name: 'Kelechi', last_name: 'Anya', email: 'kelechi@example.com', phone: '08032000007', sqm: 4_900, deals: 4, division_visible: true },
    { user_id: 'a-008', first_name: 'Tolu', last_name: 'Jaiyeola', email: 'tolu@example.com', phone: '08032000008', sqm: 2_000, deals: 2, division_visible: true },
    { user_id: 'a-009', first_name: 'Ifeoma', last_name: 'Nnaji', email: 'ifeoma@example.com', phone: null, sqm: 600, deals: 1, division_visible: true },
  ],
  2025: [
    { user_id: 'a-002', first_name: 'Seyi', last_name: 'Ekundayo', email: 'seyi@example.com', phone: '08032000002', sqm: 41_000, deals: 27, division_visible: true },
    { user_id: 'a-001', first_name: 'Amaka', last_name: 'Mba', email: 'amaka@example.com', phone: '08032000001', sqm: 18_300, deals: 13, division_visible: true },
    { user_id: 'a-005', first_name: 'Chioma', last_name: 'Udo', email: 'chioma@example.com', phone: '08032000005', sqm: 6_200, deals: 5, division_visible: true },
    { user_id: 'a-006', first_name: 'Bayo', last_name: 'Kuti', email: 'bayo@example.com', phone: null, sqm: 1_400, deals: 2, division_visible: true },
  ],
};

const ladder = () => [...tiers].sort((a, b) => a.min_sqm - b.min_sqm);

/** The division a season total reaches. Mirrors `currentTier` in the BE rules. */
function tierFor(sqm: number, deals: number): MockTier | null {
  if (deals <= 0) return null;
  let reached: MockTier | null = null;
  for (const t of ladder()) if (sqm >= t.min_sqm) reached = t;
  return reached;
}

function rangeFor(key: string): { min: number; max: number | null } | null {
  const rows = ladder();
  const i = rows.findIndex((t) => t.key === key);
  if (i === -1) return null;
  return { min: rows[i].min_sqm, max: i + 1 < rows.length ? rows[i + 1].min_sqm : null };
}

const seasonOf = (query: Record<string, unknown>): number => {
  const raw = Number(query.season_year);
  return Number.isInteger(raw) && raw > 0 ? raw : LIVE_SEASON;
};

export const divisionRoutes: MockRoutes = {
  'GET /admin/division/config': () => ({
    tiers: ladder(),
    updated_at: new Date().toISOString(),
  }),

  'PUT /admin/division/config': ({ body: raw }) => {
    const dto = body<{ tiers?: MockTier[] }>(raw);
    const next = dto.tiers ?? [];

    if (next.length === 0) {
      throw new MockHttpError(
        400,
        'The division ladder must have at least one division',
        'NO_TIERS'
      );
    }

    const keys = new Set<string>();
    const thresholds = new Set<number>();
    for (const t of next) {
      if (keys.has(t.key)) {
        throw new MockHttpError(400, 'Two divisions share the same key', 'DUPLICATE_TIER_KEY');
      }
      if (thresholds.has(t.min_sqm)) {
        throw new MockHttpError(
          400,
          'Two divisions share the same square-metre threshold',
          'DUPLICATE_THRESHOLD'
        );
      }
      keys.add(t.key);
      thresholds.add(t.min_sqm);
    }
    if (!thresholds.has(0)) {
      throw new MockHttpError(
        400,
        'The lowest division must start at 0 sqm, so every first sale earns a division',
        'NO_ENTRY_TIER'
      );
    }

    tiers = next
      .map((t) => ({
        key: t.key,
        name: t.name,
        min_sqm: t.min_sqm,
        tagline: t.tagline ?? '',
        // Benefits ship off unless explicitly switched on, as the BE does.
        benefits: (t.benefits ?? []).map((b) => ({
          label: b.label,
          enabled: b.enabled === true,
        })),
      }))
      .sort((a, b) => a.min_sqm - b.min_sqm);

    return { tiers: ladder() };
  },

  'GET /admin/division/summary': ({ query }) => {
    const season = seasonOf(query);
    const rows = ladder();
    const standings = SEASONS[season] ?? [];
    const counts = new Map(rows.map((t) => [t.key, { members: 0, sqm: 0 }]));
    let unranked = 0;

    for (const row of standings) {
      const reached = tierFor(row.sqm, row.deals);
      if (!reached) {
        unranked += 1;
        continue;
      }
      const bucket = counts.get(reached.key);
      if (!bucket) continue;
      bucket.members += 1;
      bucket.sqm += row.sqm;
    }

    return {
      season_year: season,
      live_season_year: LIVE_SEASON,
      // Populated seasons plus the live one, newest first — so a new season is
      // reachable in the picker before its first sale lands.
      seasons: [...new Set([LIVE_SEASON, ...Object.keys(SEASONS).map(Number)])].sort(
        (a, b) => b - a
      ),
      tiers: rows.map((t) => {
        const range = rangeFor(t.key);
        const bucket = counts.get(t.key) ?? { members: 0, sqm: 0 };
        return {
          ...t,
          max_sqm: range?.max === null || range?.max === undefined ? null : range.max - 1,
          members: bucket.members,
          total_sqm: bucket.sqm,
        };
      }),
      unranked,
      total_members: standings.filter((r) => tierFor(r.sqm, r.deals)).length,
    };
  },

  'GET /admin/division/members': ({ query }) => {
    const season = seasonOf(query);
    const key = String(query.tier ?? '');
    const range = rangeFor(key);
    if (!range) throw new MockHttpError(404, 'No division with that key', 'TIER_NOT_FOUND');

    const needle = String(query.search ?? '')
      .trim()
      .toLowerCase();

    const rows = (SEASONS[season] ?? [])
      .filter((r) => {
        if (r.deals <= 0) return false;
        if (r.sqm < range.min) return false;
        if (range.max !== null && r.sqm >= range.max) return false;
        if (!needle) return true;
        return (
          `${r.first_name} ${r.last_name}`.toLowerCase().includes(needle) ||
          r.email.toLowerCase().includes(needle)
        );
      })
      .map((r) => ({ ...r, tier_key: key }))
      .sort((a, b) => b.sqm - a.sqm);

    return paged(rows, query);
  },
};
