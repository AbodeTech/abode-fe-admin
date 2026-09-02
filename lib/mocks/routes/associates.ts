import type { MockRoutes } from '../router';
import { PEOPLE } from './people';

/* ============================================================
 * Associate leaderboard mocks — GET /admin/associates/top.
 *
 * Rows are derived from the shared PEOPLE fixtures so a name here is the same
 * person it is everywhere else in the mock world, rather than a second cast.
 * The figures are deterministic functions of the person's index: stable across
 * reloads, and varied enough that sorting visibly reorders the table.
 *
 * The export route is deliberately NOT mocked — it streams a real CSV, and the
 * FE refuses exports in mock mode rather than downloading a fake file.
 * ============================================================ */

/** Only the tiers a leaderboard ranks, matching the BE's LEADERBOARD_TIERS. */
const LEADERBOARD_TIERS = ['associate', 'associate-pro', 'founder', 'management', 'premium'];

const ASSET_TYPES = ['flex', 'full-ownership', 'commercial', 'developer_plot'];

const round2 = (value: number) => Math.round(value * 100) / 100;

type LeaderboardRow = {
  user_id: string;
  name: string;
  status: string;
  email: string;
  profile_pic: string | null;
  sales_person: string;
  last_login: string | null;
  no_of_clients: number;
  referred_user_count: number;
  referred_associate_count: number;
  referred_associate_pro_count: number;
  units_sold: number;
  size_sold: number;
  expected: number;
  received: number;
  balance: number;
  commission: number;
  collection_rate: number;
  /** Not part of the response — only so the mock can honour the filters. */
  _asset_type: string;
  _suspended: boolean;
};

const ROWS: LeaderboardRow[] = PEOPLE.filter((person) =>
  LEADERBOARD_TIERS.includes(person.referral_status),
).map((person, idx) => {
  const users = 4 + idx * 3;
  const associates = 2 + idx;
  const pros = idx % 3;
  const expected = round2(2_400_000 * (idx + 1) + 350_000);
  // Collection rate lands between 55% and 95% across the set, so the efficiency
  // bar shows all three of its colour bands rather than one.
  const received = round2(expected * (0.55 + (idx % 5) * 0.1));

  return {
    user_id: person._id,
    name: `${person.firstName} ${person.lastName}`,
    status: person.referral_status,
    email: person.email,
    profile_pic: null,
    // The first row has nobody above them — the BE sends this literal.
    sales_person: idx === 0 ? 'No referrer' : `${PEOPLE[idx - 1].firstName} ${PEOPLE[idx - 1].lastName}`,
    last_login: new Date(Date.now() - idx * 36 * 3_600_000).toISOString(),
    no_of_clients: users + associates + pros,
    referred_user_count: users,
    referred_associate_count: associates,
    referred_associate_pro_count: pros,
    units_sold: 3 + idx * 2,
    size_sold: round2(450 + idx * 275.5),
    expected,
    received,
    balance: round2(expected - received),
    commission: round2(received * 0.05),
    collection_rate: expected ? round2((received / expected) * 100) : 0,
    _asset_type: ASSET_TYPES[idx % ASSET_TYPES.length],
    // One suspended associate, so `include_suspended` visibly changes the set.
    _suspended: idx === 2,
  };
});

const SORTABLE = new Set([
  'sales_person',
  'no_of_clients',
  'units_sold',
  'size_sold',
  'expected',
  'received',
  'commission',
  'collection_rate',
]);

export const associateRoutes: MockRoutes = {
  'GET /admin/associates/top': ({ query }) => {
    const assetType = String(query.asset_type ?? '');
    const tier = String(query.referral_status ?? '');
    const includeSuspended = String(query.include_suspended ?? '') === 'true';
    const sortBy = String(query.sort_by ?? 'commission');
    const sortDir = String(query.sort_dir ?? 'desc') === 'asc' ? 1 : -1;
    const page = Math.max(1, Number(query.page ?? 1) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 25) || 25));

    let rows = ROWS;
    if (!includeSuspended) rows = rows.filter((row) => !row._suspended);
    if (assetType) rows = rows.filter((row) => row._asset_type === assetType);
    // Filters the associates being RANKED, never their clients.
    if (tier) rows = rows.filter((row) => row.status === tier);

    const key = SORTABLE.has(sortBy) ? sortBy : 'commission';
    rows = rows.slice().sort((a, b) => {
      const left = a[key as keyof LeaderboardRow];
      const right = b[key as keyof LeaderboardRow];
      if (typeof left === 'string' && typeof right === 'string') {
        return left.localeCompare(right) * sortDir;
      }
      return ((left as number) - (right as number)) * sortDir;
    });

    const start = (page - 1) * limit;
    const pageRows = rows.slice(start, start + limit).map(({ _asset_type, _suspended, ...row }) => {
      void _asset_type;
      void _suspended;
      return row;
    });

    // NO `meta`, deliberately. The BE returns `{ count, data }` and the global
    // TransformInterceptor drops `count` on the way out, so the real response
    // carries no total either. Adding one here would make mock mode paginate
    // better than production and hide the gap.
    return { data: pageRows };
  },
};
