import { MockHttpError, type MockRoutes } from '../router';
import { body, paged } from './util';

/* ============================================================
 * Portfolio standing — /admin/standing/*.
 *
 *   GET /admin/standing/config    the ladder
 *   PUT /admin/standing/config    replace the ladder
 *   GET /admin/standing/summary   every tier with how many buyers are on it
 *   GET /admin/standing/members   who is on one tier (?checkpoint=&page=&limit=&search=)
 *
 * Mirrors abode-be-v2 `src/modules/standing`. The two things worth keeping
 * faithful, because the UI behaves differently for each:
 *
 *  - the ladder is validated as a SET on save (unique keys, unique thresholds,
 *    an entry rung at 0 sqm), and each failure has its own error code;
 *  - membership is DERIVED from the holdings below, never stored — so editing a
 *    threshold here moves buyers between tiers on the very next read, which is
 *    exactly what it does in production.
 * ============================================================ */

type MockCheckpoint = {
  key: string;
  name: string;
  min_sqm: number;
  tagline: string;
  benefits: { label: string; enabled: boolean }[];
};

let checkpoints: MockCheckpoint[] = [
  {
    key: 'groundbreaker',
    name: 'Groundbreaker',
    min_sqm: 0,
    tagline: 'Your first plot with Abode — you own land.',
    benefits: [],
  },
  {
    key: 'landholder',
    name: 'Landholder',
    min_sqm: 1_000,
    tagline: 'A thousand square metres held across your plans.',
    benefits: [],
  },
  {
    key: 'estate_builder',
    name: 'Estate Builder',
    min_sqm: 2_500,
    tagline: 'Enough land for several homes, or one substantial one.',
    benefits: [],
  },
  {
    key: 'land_banker',
    name: 'Land Banker',
    min_sqm: 5_000,
    tagline: 'Half a hectare, held as a long-term store of value.',
    benefits: [],
  },
  {
    key: 'hectare_club',
    name: 'Hectare Club',
    min_sqm: 10_000,
    tagline: 'A full hectare — about 1.4 football pitches.',
    benefits: [],
  },
];

/**
 * Buyers and the land they hold. Spread across the ladder on purpose, including
 * one just under a boundary (Ada, 980sqm) so that nudging a threshold in the
 * editor visibly moves somebody — the behaviour most worth being able to try
 * before doing it to production.
 */
const HOLDINGS = [
  { user_id: 'u-001', first_name: 'Chidi', last_name: 'Okafor', email: 'chidi@example.com', phone: '08031000001', sqm: 500, plots: 1, since: '2026-01-14T00:00:00.000Z' },
  { user_id: 'u-002', first_name: 'Ada', last_name: 'Nwosu', email: 'ada@example.com', phone: '08031000002', sqm: 980, plots: 2, since: '2025-11-02T00:00:00.000Z' },
  { user_id: 'u-003', first_name: 'Bola', last_name: 'Ade', email: 'bola@example.com', phone: null, sqm: 1_200, plots: 2, since: '2025-08-20T00:00:00.000Z' },
  { user_id: 'u-004', first_name: 'Folake', last_name: 'Adeyemi', email: 'folake@example.com', phone: '08031000004', sqm: 1_800, plots: 3, since: '2025-06-11T00:00:00.000Z' },
  { user_id: 'u-005', first_name: 'Emeka', last_name: 'Obi', email: 'emeka@example.com', phone: '08031000005', sqm: 2_600, plots: 4, since: '2025-03-01T00:00:00.000Z' },
  { user_id: 'u-006', first_name: 'Ngozi', last_name: 'Eze', email: 'ngozi@example.com', phone: null, sqm: 5_400, plots: 6, since: '2024-09-19T00:00:00.000Z' },
  { user_id: 'u-007', first_name: 'Tunde', last_name: 'Bakare', email: 'tunde@example.com', phone: '08031000007', sqm: 12_500, plots: 11, since: '2024-02-07T00:00:00.000Z' },
  { user_id: 'u-008', first_name: 'Amara', last_name: 'Ibe', email: 'amara@example.com', phone: '08031000008', sqm: 30_000, plots: 24, since: '2023-05-30T00:00:00.000Z' },
];

const ladder = () => [...checkpoints].sort((a, b) => a.min_sqm - b.min_sqm);

/** The tier a holding reaches. Mirrors `currentCheckpoint` in the BE rules. */
function checkpointFor(sqm: number, plots: number): MockCheckpoint | null {
  if (plots <= 0) return null;
  let reached: MockCheckpoint | null = null;
  for (const c of ladder()) if (sqm >= c.min_sqm) reached = c;
  return reached;
}

function rangeFor(key: string): { min: number; max: number | null } | null {
  const rows = ladder();
  const i = rows.findIndex((c) => c.key === key);
  if (i === -1) return null;
  return { min: rows[i].min_sqm, max: i + 1 < rows.length ? rows[i + 1].min_sqm : null };
}

export const standingRoutes: MockRoutes = {
  'GET /admin/standing/config': () => ({
    checkpoints: ladder(),
    updated_at: new Date().toISOString(),
  }),

  'PUT /admin/standing/config': ({ body: raw }) => {
    const dto = body<{ checkpoints?: MockCheckpoint[] }>(raw);
    const next = dto.checkpoints ?? [];

    if (next.length === 0) {
      throw new MockHttpError(
        400,
        'The standing ladder must have at least one checkpoint',
        'NO_CHECKPOINTS'
      );
    }

    const keys = new Set<string>();
    const thresholds = new Set<number>();
    for (const c of next) {
      if (keys.has(c.key)) {
        throw new MockHttpError(400, 'Two checkpoints share the same key', 'DUPLICATE_CHECKPOINT_KEY');
      }
      if (thresholds.has(c.min_sqm)) {
        throw new MockHttpError(
          400,
          'Two checkpoints share the same square-metre threshold',
          'DUPLICATE_THRESHOLD'
        );
      }
      keys.add(c.key);
      thresholds.add(c.min_sqm);
    }
    if (!thresholds.has(0)) {
      throw new MockHttpError(
        400,
        'The lowest checkpoint must start at 0 sqm, so every owner has a standing',
        'NO_ENTRY_CHECKPOINT'
      );
    }

    checkpoints = next
      .map((c) => ({
        key: c.key,
        name: c.name,
        min_sqm: c.min_sqm,
        tagline: c.tagline ?? '',
        // Benefits ship off unless explicitly switched on, as the BE does.
        benefits: (c.benefits ?? []).map((b) => ({
          label: b.label,
          enabled: b.enabled === true,
        })),
      }))
      .sort((a, b) => a.min_sqm - b.min_sqm);

    return { checkpoints: ladder() };
  },

  'GET /admin/standing/summary': () => {
    const rows = ladder();
    const counts = new Map(rows.map((c) => [c.key, { members: 0, sqm: 0 }]));

    for (const holding of HOLDINGS) {
      const reached = checkpointFor(holding.sqm, holding.plots);
      if (!reached) continue;
      const bucket = counts.get(reached.key);
      if (!bucket) continue;
      bucket.members += 1;
      bucket.sqm += holding.sqm;
    }

    return {
      checkpoints: rows.map((c) => {
        const range = rangeFor(c.key);
        const bucket = counts.get(c.key) ?? { members: 0, sqm: 0 };
        return {
          ...c,
          max_sqm: range?.max === null || range?.max === undefined ? null : range.max - 1,
          members: bucket.members,
          total_sqm: bucket.sqm,
        };
      }),
      total_members: HOLDINGS.filter((h) => checkpointFor(h.sqm, h.plots)).length,
    };
  },

  'GET /admin/standing/members': ({ query }) => {
    const key = String(query.checkpoint ?? '');
    const range = rangeFor(key);
    if (!range) throw new MockHttpError(404, 'No checkpoint with that key', 'CHECKPOINT_NOT_FOUND');

    const needle = String(query.search ?? '').trim().toLowerCase();
    const rows = HOLDINGS.filter((h) => {
      if (h.sqm < range.min) return false;
      if (range.max !== null && h.sqm >= range.max) return false;
      if (!needle) return true;
      return (
        `${h.first_name} ${h.last_name}`.toLowerCase().includes(needle) ||
        h.email.toLowerCase().includes(needle)
      );
    }).sort((a, b) => b.sqm - a.sqm);

    return paged(rows, query);
  },
};
