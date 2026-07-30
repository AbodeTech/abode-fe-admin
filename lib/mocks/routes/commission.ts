import { MockHttpError, type MockRoutes } from '../router';
import { body } from './util';

/* ============================================================
 * Commission mock routes — "METHOD /path", inner payload only.
 *
 * Rates mirror the BE's CommissionConfig schema defaults so mock mode and a
 * fresh backend agree. Note the tier key `'associate-pro'` is hyphenated,
 * exactly as the BE stores it.
 *
 * Money fields are decimal naira.
 * ============================================================ */

const ADMIN_ID = '665fbbbb00000000000000bb';

type MockConfig = {
  _id: string;
  version: number;
  flexCommission: { direct: Record<string, number> };
  fullOwnershipCommission: {
    direct: Record<string, number>;
    upline: Record<string, number>;
    topline: Record<string, number>;
  };
  wht_rate: number;
  marketplace_platform_fee_pct: number;
  upgrade_commission_pct: number;
  associate_pro_fee: number;
  high_commission_alert_threshold: number;
  reason: string | null;
  changed_fields: string[];
  last_modified_by:
    | string
    | { _id: string; firstName?: string; lastName?: string; email?: string }
    | null;
  createdAt: string;
  updatedAt: string;
};

/** Populated shape `findConfigVersions` returns for `last_modified_by`. */
const ADMIN_REF = {
  _id: ADMIN_ID,
  firstName: 'Tolu',
  lastName: 'Adeyemi',
  email: 'tolu@abodeflex.com',
};

const activeConfig: MockConfig = {
  _id: '665fdddd0000000000000003',
  version: 3,
  flexCommission: {
    direct: { founder: 0.12, 'associate-pro': 0.1, premium: 0.05, default: 0.05 },
  },
  fullOwnershipCommission: {
    direct: { founder: 0.18, 'associate-pro': 0.15, premium: 0.17, default: 0.1 },
    upline: { founder: 0.03, 'associate-pro': 0.02, premium: 0.02 },
    // Deliberately only two tiers — exercises TierRateTable's partial tables.
    topline: { founder: 0.01, 'associate-pro': 0.01 },
  },
  wht_rate: 0.05,
  marketplace_platform_fee_pct: 0.02,
  upgrade_commission_pct: 0.5,
  associate_pro_fee: 20_000,
  high_commission_alert_threshold: 50_000,
  reason: 'Raised founder flex rate; alert threshold up to ₦50k',
  changed_fields: ['flexCommission', 'high_commission_alert_threshold'],
  last_modified_by: ADMIN_REF,
  createdAt: '2026-06-01T09:12:00.000Z',
  updatedAt: '2026-07-14T11:04:00.000Z',
};

const olderConfigs: MockConfig[] = [
  {
    ...activeConfig,
    _id: '665fdddd0000000000000002',
    version: 2,
    flexCommission: {
      direct: { founder: 0.1, 'associate-pro': 0.08, premium: 0.05, default: 0.05 },
    },
    high_commission_alert_threshold: 40_000,
    reason: 'Quarterly review — flex founder up 2 points',
    changed_fields: ['flexCommission', 'wht_rate', 'associate_pro_fee'],
    // A bare ObjectId — versions published before populate landed.
    last_modified_by: ADMIN_ID,
    createdAt: '2026-04-02T10:00:00.000Z',
    updatedAt: '2026-06-01T09:12:00.000Z',
  },
  {
    ...activeConfig,
    _id: '665fdddd0000000000000001',
    version: 1,
    flexCommission: {
      direct: { founder: 0.1, 'associate-pro': 0.08, premium: 0.05, default: 0.04 },
    },
    wht_rate: 0.075,
    associate_pro_fee: 15_000,
    high_commission_alert_threshold: 40_000,
    reason: null,
    changed_fields: [],
    last_modified_by: null,
    createdAt: '2026-01-15T08:30:00.000Z',
    updatedAt: '2026-04-02T10:00:00.000Z',
  },
];

/** Published versions, newest first. Mutated by the POST route. */
let versions: MockConfig[] = [activeConfig, ...olderConfigs];

/* -------------------- overrides -------------------- */

const ASSET_AVIATION = '665faaaa00000000000000a1';
const ASSET_HARMONY = '665faaaa00000000000000a2';
const USER_JOHN = '665fcccc00000000000000c1';
const USER_UCHE = '665fcccc00000000000000c2';

const inDays = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString();

/** What the BE's `.populate()` resolves each ref to. */
const USER_REFS: Record<string, object> = {
  [USER_JOHN]: {
    _id: USER_JOHN,
    firstName: 'John',
    lastName: 'Okafor',
    email: 'john.okafor@example.com',
    referral_status: 'associate-pro',
  },
  [USER_UCHE]: {
    _id: USER_UCHE,
    firstName: 'Uche',
    lastName: 'Eze',
    email: 'uche.eze@example.com',
    referral_status: 'premium',
  },
};

const ASSET_REFS: Record<string, object> = {
  [ASSET_AVIATION]: { _id: ASSET_AVIATION, name: 'Aviation City' },
  [ASSET_HARMONY]: { _id: ASSET_HARMONY, name: 'Harmony Gardens' },
};

/** A ref outside the map stays a bare id — the union schema's other arm. */
const populate = (row: Record<string, unknown>) => ({
  ...row,
  ...(typeof row.user_id === 'string' && USER_REFS[row.user_id]
    ? { user_id: USER_REFS[row.user_id] }
    : {}),
  ...(typeof row.asset_id === 'string' && ASSET_REFS[row.asset_id]
    ? { asset_id: ASSET_REFS[row.asset_id] }
    : {}),
});

/**
 * Fixtures store bare ObjectIds; the GET route populates them at response
 * time, exactly as the BE has since 2026-07-28 (ticket 9a) — user refs with
 * `firstName lastName email referral_status`, asset refs with `name`.
 */
type MockAssetOverride = {
  _id: string;
  offer_type: string;
  asset_id: string;
  direct: Record<string, number>;
  upline?: Record<string, number>;
  topline?: Record<string, number>;
  reason: string | null;
  granted_by: string;
  expires_at: string | null;
  revoked_at: string | null;
  createdAt: string;
};

const assetOverrides: MockAssetOverride[] = [
  {
    _id: '665f0000000000000000e001',
    offer_type: 'full-ownership',
    asset_id: ASSET_AVIATION,
    direct: { founder: 0.2, 'associate-pro': 0.17, premium: 0.18, default: 0.12 },
    upline: { founder: 0.04 },
    reason: 'Launch promotion — higher rates for the first quarter',
    granted_by: ADMIN_ID,
    expires_at: inDays(4), // exercises "expiring soon"
    revoked_at: null,
    createdAt: '2026-05-02T09:00:00.000Z',
  },
  {
    _id: '665f0000000000000000e002',
    offer_type: 'flex',
    asset_id: ASSET_HARMONY,
    direct: { founder: 0.14, default: 0.06 },
    reason: null,
    granted_by: ADMIN_ID,
    expires_at: null,
    revoked_at: null,
    createdAt: '2026-03-11T09:00:00.000Z',
  },
];

const userOverrides: MockSubjectOverride[] = [
  {
    _id: '665f0000000000000000e101',
    offer_type: 'full-ownership',
    user_id: USER_JOHN,
    direct: 0.15,
    upline: 0.04,
    reason: 'Negotiated rate — top performer 2025',
    granted_by: ADMIN_ID,
    expires_at: null,
    revoked_at: null,
    createdAt: '2026-02-20T09:00:00.000Z',
  },
  {
    _id: '665f0000000000000000e102',
    offer_type: 'flex',
    user_id: USER_UCHE,
    direct: 0.11,
    reason: 'Retention offer',
    granted_by: ADMIN_ID,
    expires_at: inDays(-12), // already expired
    revoked_at: null,
    createdAt: '2026-01-08T09:00:00.000Z',
  },
];

const assetUserOverrides: MockSubjectOverride[] = [
  {
    _id: '665f0000000000000000e201',
    offer_type: 'full-ownership',
    asset_id: ASSET_AVIATION,
    user_id: USER_JOHN,
    direct: 0.12,
    reason: 'Lower rate on Aviation City — bulk allocation deal',
    granted_by: ADMIN_ID,
    expires_at: null,
    revoked_at: null,
    createdAt: '2026-06-15T09:00:00.000Z',
  },
  {
    _id: '665f0000000000000000e202',
    offer_type: 'flex',
    asset_id: ASSET_HARMONY,
    user_id: USER_UCHE,
    direct: 0.09,
    reason: 'Superseded by the blanket referrer rate',
    granted_by: ADMIN_ID,
    expires_at: null,
    revoked_at: '2026-07-02T09:00:00.000Z',
    createdAt: '2026-04-01T09:00:00.000Z',
  },
];

type OverrideRow = { offer_type: string; expires_at?: string | null; revoked_at?: string | null } & Record<
  string,
  unknown
>;

type MockSubjectOverride = {
  _id: string;
  offer_type: string;
  user_id: string;
  asset_id?: string;
  /** Per-leg since 2026-07-28 (ticket 8) — the old flat `rate` is migrated into `direct`. */
  direct: number | null;
  upline?: number | null;
  topline?: number | null;
  reason: string | null;
  granted_by: string;
  expires_at: string | null;
  revoked_at: string | null;
  createdAt: string;
};

/**
 * Shared upsert for user and asset+user overrides. `keyFields` is the unique
 * key the BE indexes on, minus `offer_type` which is always part of it.
 */
function upsertSubjectOverride(
  rows: MockSubjectOverride[],
  dto: Partial<MockSubjectOverride>,
  keyFields: ('user_id' | 'asset_id')[]
): MockSubjectOverride {
  const now = new Date().toISOString();
  const index = rows.findIndex(
    (row) =>
      row.offer_type === dto.offer_type && keyFields.every((key) => row[key] === dto[key])
  );

  const next: MockSubjectOverride = {
    _id: index >= 0 ? rows[index]._id : `665f0000000000000000f${Date.now() % 1000}`,
    offer_type: dto.offer_type ?? 'full-ownership',
    user_id: dto.user_id ?? '',
    ...(keyFields.includes('asset_id') ? { asset_id: dto.asset_id ?? '' } : {}),
    direct: dto.direct ?? null,
    upline: dto.upline ?? null,
    topline: dto.topline ?? null,
    reason: dto.reason ?? null,
    granted_by: ADMIN_ID,
    expires_at: dto.expires_at ?? null,
    // Re-saving a revoked override reinstates it, as the BE does.
    revoked_at: null,
    createdAt: index >= 0 ? rows[index].createdAt : now,
  };

  if (index >= 0) rows[index] = next;
  else rows.push(next);

  return next;
}

/** Mirrors the BE's `activeFilter()` — not revoked, and not past its expiry. */
function isActive(row: OverrideRow): boolean {
  if (row.revoked_at) return false;
  if (!row.expires_at) return true;
  return new Date(row.expires_at).getTime() > Date.now();
}

function filterRows<T extends OverrideRow>(
  rows: T[],
  query: Record<string, unknown>,
  subjectKeys: string[]
): T[] {
  const includeInactive = String(query.include_inactive ?? '') === 'true';

  return rows.filter((row) => {
    if (!includeInactive && !isActive(row)) return false;
    if (query.offer_type && row.offer_type !== query.offer_type) return false;

    // The BE applies one filter object to all three collections, so a
    // subject filter simply matches nothing on a collection lacking that key.
    for (const key of ['user_id', 'asset_id']) {
      const wanted = query[key];
      if (!wanted) continue;
      if (!subjectKeys.includes(key)) return false;
      if (row[key] !== wanted) return false;
    }
    return true;
  });
}

export const commissionRoutes: MockRoutes = {
  'GET /admin/commission/config': () => ({
    active: versions[0],
    history: versions,
  }),

  /**
   * Publishing creates a NEW version rather than mutating — mirroring
   * `CommissionAdminService.publishConfig`, which spreads the current config,
   * overlays the DTO, and bumps `version`.
   */
  'POST /admin/commission/config': ({ body: raw }) => {
    const dto = body<Partial<MockConfig>>(raw);
    const current = versions[0];
    const now = new Date().toISOString();

    // Required since 2026-07-28 — `CreateCommissionConfigDto.reason` is
    // `@IsNotEmpty`, so the mock refuses like the BE would.
    if (typeof dto.reason !== 'string' || !dto.reason.trim()) {
      throw new MockHttpError(400, 'reason should not be empty', 'VALIDATION_FAILED');
    }

    const changed_fields = (
      [
        'wht_rate',
        'marketplace_platform_fee_pct',
        'high_commission_alert_threshold',
        'associate_pro_fee',
        'upgrade_commission_pct',
      ] as const
    ).filter((key) => dto[key] !== undefined && dto[key] !== current[key]);

    const next: MockConfig = {
      ...current,
      ...dto,
      _id: `665fdddd${String(current.version + 1).padStart(16, '0')}`,
      version: current.version + 1,
      reason: dto.reason.trim(),
      changed_fields: [
        ...changed_fields,
        ...(dto.flexCommission !== undefined ? ['flexCommission'] : []),
        ...(dto.fullOwnershipCommission !== undefined ? ['fullOwnershipCommission'] : []),
      ],
      last_modified_by: ADMIN_ID,
      createdAt: now,
      updatedAt: now,
    };

    versions = [next, ...versions];
    return next;
  },

  'GET /admin/commission/overrides': ({ query }) => ({
    asset: filterRows(assetOverrides, query, ['asset_id']).map(populate),
    user: filterRows(userOverrides, query, ['user_id']).map(populate),
    asset_user: filterRows(assetUserOverrides, query, ['asset_id', 'user_id']).map(populate),
  }),

  /**
   * Upsert on `(asset_id, offer_type)` — mirrors
   * `CommissionAdminService.upsertAssetOverride`, including clearing
   * `revoked_at` so re-saving a revoked override reinstates it.
   */
  'POST /admin/commission/overrides/asset': ({ body: raw }) => {
    const dto = body<{
      asset_id?: string;
      offer_type?: string;
      direct?: Record<string, number>;
      upline?: Record<string, number>;
      topline?: Record<string, number>;
      reason?: string;
      expires_at?: string;
    }>(raw);

    const now = new Date().toISOString();
    const index = assetOverrides.findIndex(
      (row) => row.asset_id === dto.asset_id && row.offer_type === dto.offer_type
    );

    const next = {
      _id: index >= 0 ? assetOverrides[index]._id : `665f0000000000000000e${Date.now() % 1000}`,
      offer_type: dto.offer_type ?? 'full-ownership',
      asset_id: dto.asset_id ?? '',
      direct: dto.direct ?? {},
      ...(dto.upline && { upline: dto.upline }),
      ...(dto.topline && { topline: dto.topline }),
      reason: dto.reason ?? null,
      granted_by: ADMIN_ID,
      expires_at: dto.expires_at ?? null,
      revoked_at: null,
      createdAt: index >= 0 ? assetOverrides[index].createdAt : now,
    };

    if (index >= 0) assetOverrides[index] = next;
    else assetOverrides.push(next);

    return next;
  },

  /**
   * Upsert on `(user_id, offer_type)`. ⛔ ticket 8 — the BE stores one flat
   * `rate`; the mock matches that so the UI is exercised against the real
   * contract, not an aspirational one.
   */
  'POST /admin/commission/overrides/user': ({ body: raw }) =>
    upsertSubjectOverride(userOverrides, body(raw), ['user_id']),

  /** Upsert on `(asset_id, user_id, offer_type)` — the most specific override. */
  'POST /admin/commission/overrides/asset-user': ({ body: raw }) =>
    upsertSubjectOverride(assetUserOverrides, body(raw), ['asset_id', 'user_id']),

  /**
   * Soft delete — sets `revoked_at` and keeps the row, exactly as
   * `CommissionRepository.revokeOverride` does. The record is the explanation
   * for payouts on plans created while it was active.
   */
  'DELETE /admin/commission/overrides/:type/:id': ({ params }) => {
    const { type, id } = params;

    const rows: { _id: string; revoked_at: string | null }[] =
      type === 'asset'
        ? assetOverrides
        : type === 'user'
          ? userOverrides
          : assetUserOverrides;

    const row = rows.find((candidate) => candidate._id === id);
    if (!row) throw new MockHttpError(404, 'Override not found', 'OVERRIDE_NOT_FOUND');

    row.revoked_at = new Date().toISOString();
    return { revoked: true, id, type };
  },

  /**
   * The dry-run (ticket 9b) — resolves the same chain a purchase would,
   * against this file's override fixtures, so what the preview says always
   * matches what the overrides table shows.
   */
  'GET /admin/commission/preview': ({ query }) => {
    const userId = String(query.user_id ?? '');
    const assetId = String(query.asset_id ?? '');
    const offerType = String(query.offer_type ?? '');
    if (!userId || !assetId || !offerType) {
      throw new MockHttpError(400, 'user_id, asset_id and offer_type are required', 'VALIDATION_FAILED');
    }

    const config = versions[0];
    const userRef = USER_REFS[userId] as { referral_status?: string } | undefined;
    const referrerTier = userRef?.referral_status ?? 'default';
    const legs = offerType === 'flex' ? ['direct'] : ['direct', 'upline', 'topline'];

    const active = (row: OverrideRow) => isActive(row) && row.offer_type === offerType;
    const assetUser = assetUserOverrides.find(
      (row) => active(row) && row.user_id === userId && row.asset_id === assetId
    );
    const userOverride = userOverrides.find((row) => active(row) && row.user_id === userId);
    const assetOverride = assetOverrides.find((row) => active(row) && row.asset_id === assetId);

    const rates = legs.map((leg) => {
      const au = assetUser?.[leg as 'direct'];
      if (au != null) return { commission_tier: leg, applies: true, rate: au, override_source: 'asset_user' };

      const uo = userOverride?.[leg as 'direct'];
      if (uo != null) return { commission_tier: leg, applies: true, rate: uo, override_source: 'user' };

      const table = assetOverride?.[leg as 'direct'] as Record<string, number> | undefined;
      const ao = table?.[referrerTier] ?? table?.default;
      if (ao != null) return { commission_tier: leg, applies: true, rate: ao, override_source: 'asset' };

      const defaults =
        offerType === 'flex'
          ? leg === 'direct'
            ? config.flexCommission.direct
            : undefined
          : config.fullOwnershipCommission[leg as 'direct' | 'upline' | 'topline'];
      const rate = defaults?.[referrerTier] ?? defaults?.default;
      if (rate != null) return { commission_tier: leg, applies: true, rate, override_source: 'default' };

      return { commission_tier: leg, applies: false, rate: null, override_source: null };
    });

    return {
      referrer_tier: referrerTier,
      config_version: config.version,
      wht_rate: config.wht_rate,
      rates,
    };
  },

  /**
   * Step 8's data — one payable plan and one that pays nobody, so both states
   * of the audit screen are reachable in mock mode. Any other id is an honest
   * 404, with the known ids named so the lookup page is usable.
   */
  'GET /admin/commission/audit/:paymentPlanId': ({ params }) => {
    const PLAN_PAYABLE = '665fp000000000000000p001';
    const PLAN_UNPAYABLE = '665fp000000000000000p002';

    if (params.paymentPlanId === PLAN_PAYABLE) {
      return {
        payment_plan_id: PLAN_PAYABLE,
        buyer: { id: '665fcccc00000000000000c9', firstName: 'Amaka', lastName: 'Obi', email: 'amaka.obi@example.com', referral_status: 'default' },
        asset: { id: ASSET_AVIATION, name: 'Aviation City' },
        commission_config_version: 2,
        wht_rate: 0.05,
        commission_recipients: [
          {
            commission_type: 'direct',
            rate: 0.12,
            tier_at_creation: 'associate-pro',
            override_source: 'asset_user',
            user: { id: USER_JOHN, firstName: 'John', lastName: 'Okafor', email: 'john.okafor@example.com', referral_status: 'associate-pro' },
            agency_id: null,
          },
          {
            commission_type: 'upline',
            rate: 0.02,
            tier_at_creation: 'premium',
            override_source: 'default',
            user: { id: USER_UCHE, firstName: 'Uche', lastName: 'Eze', email: 'uche.eze@example.com', referral_status: 'premium' },
            agency_id: null,
          },
          {
            commission_type: 'topline',
            rate: 0.01,
            tier_at_creation: 'founder',
            override_source: 'default',
            // An unresolvable ref — populate found nothing, shaped to bare id.
            user: { id: '665fcccc00000000000000c7' },
            agency_id: null,
          },
        ],
        commission_payable: true,
      };
    }

    if (params.paymentPlanId === PLAN_UNPAYABLE) {
      return {
        payment_plan_id: PLAN_UNPAYABLE,
        buyer: { id: '665fcccc00000000000000c8', firstName: 'Bola', lastName: 'Adewale', email: 'bola.adewale@example.com', referral_status: 'default' },
        asset: { id: ASSET_HARMONY, name: 'Harmony Gardens' },
        commission_config_version: 3,
        wht_rate: 0.05,
        commission_recipients: [],
        commission_payable: false,
      };
    }

    throw new MockHttpError(
      404,
      `No payment plan with this ID. Mock data has ${PLAN_PAYABLE} (payable) and ${PLAN_UNPAYABLE} (pays nobody).`,
      'PAYMENT_PLAN_NOT_FOUND'
    );
  },
};
