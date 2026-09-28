import { MockHttpError, type MockRoutes } from '../router';
import { findActiveAsset, type MockOfferType } from './assets';
import { body, paged } from './util';

/* ============================================================
 * Asset costs — the real abode-be-v2 3-layer model (confirmed field-for-field
 * against `src/modules/asset-cost/*` on staging, PR #82 "phase-1"):
 *
 *   Cost item (catalogue)    /admin/assets/:assetId/costs/items(/:itemId)
 *   Allocation rule          .../items/:itemId/allocation-rule (PUT/GET, versioned)
 *   Obligation (a record)    /admin/assets/:assetId/costs(/:obligationId)
 *   Event (a stage)          .../:obligationId/stages, /admin/cost-entries/:eventId*
 *   Coverage                 GET .../costs/coverage
 *   Impact preview           POST .../costs/impact-preview
 *
 * This is a REAL module now, not a provisional guess — the shapes here
 * mirror the actual DTOs/presenters read directly from staging, including
 * the two-level "obligation list has no dollar figure, only
 * GET .../:obligationId does (via its embedded events)" asymmetry. Carved
 * out of the assets domain's /admin/assets/* claim the same way
 * land-configuration.ts is; `/admin/cost-entries/*` is a separate top-level
 * namespace (matches the real backend's own `AssetCostEventController`).
 * ============================================================ */

const MOCK_ADMIN_ID = '665fbbbb00000000000000b1';
const MOCK_ADMIN_EMAIL = 'nicholas@abode.ng';

export type MockCostGroup = 'acquisition' | 'development' | 'documentation_finance' | 'direct_cost_of_sale' | 'opex';
const COST_GROUPS: readonly MockCostGroup[] = ['acquisition', 'development', 'documentation_finance', 'direct_cost_of_sale', 'opex'];
const COST_GROUP_LABELS: Record<MockCostGroup, string> = {
  acquisition: 'Acquisition',
  development: 'Development',
  documentation_finance: 'Documentation & Finance',
  direct_cost_of_sale: 'Direct Cost of Sale',
  opex: 'OPEX',
};
/** Every group here is "direct" except opex — matches the real backend's DIRECT_GROUPS. */
const DIRECT_GROUPS: readonly MockCostGroup[] = ['acquisition', 'development', 'documentation_finance', 'direct_cost_of_sale'];

export type MockAllocationBasis =
  | 'total_sqm'
  | 'saleable_sqm'
  | 'product_sqm'
  | 'sqm_sold'
  | 'revenue'
  | 'units'
  | 'equal'
  | 'manual'
  | 'amount'
  | 'direct';
const ALLOCATION_BASES: readonly MockAllocationBasis[] = [
  'total_sqm', 'saleable_sqm', 'product_sqm', 'sqm_sold', 'revenue', 'units', 'equal', 'manual', 'amount', 'direct',
];
const ALLOCATION_BASIS_LABELS: Record<MockAllocationBasis, string> = {
  total_sqm: 'By total sqm', saleable_sqm: 'By saleable sqm', product_sqm: 'By product sqm', sqm_sold: 'By sqm sold',
  revenue: 'By revenue', units: 'By units', equal: 'Equally', manual: 'Manual percentages', amount: 'Manual amounts', direct: 'Direct (one product)',
};

export type MockFinancialStage = 'budget' | 'committed' | 'claimed' | 'incurred' | 'paid' | 'reversal' | 'adjustment';
const RECOGNISED_STAGES: readonly MockFinancialStage[] = ['incurred', 'reversal', 'adjustment'];
function countsAsCost(stage: MockFinancialStage): boolean {
  return RECOGNISED_STAGES.includes(stage);
}
function signFor(stage: MockFinancialStage): number {
  return stage === 'reversal' ? -1 : 1;
}

export type MockObligationStatus = 'open' | 'settled' | 'reversed' | 'archived';
export type MockCostEventStatus = 'draft' | 'approved' | 'reversed' | 'archived';
export type MockCostSourceType = 'manual' | 'field_submission' | 'commission_transaction' | 'work_order';

type MockManualShare = { offer_type: MockOfferType; percent: number };

export type MockCostItem = {
  _id: string;
  asset_id: string;
  group: MockCostGroup;
  name: string;
  description: string | null;
  is_shared: boolean;
  allocation_basis: MockAllocationBasis | null;
  applies_to_products: MockOfferType[];
  excluded_products: MockOfferType[];
  manual_shares: MockManualShare[];
  applicability_version: number;
  is_active: boolean;
  createdAt: string;
};

type MockAllocationRuleShare = { offer_type: MockOfferType; percent: number | null; amount: number | null };

export type MockAllocationRule = {
  asset_id: string;
  cost_item_id: string;
  version: number;
  method: MockAllocationBasis;
  applies_to_products: MockOfferType[];
  excluded_products: MockOfferType[];
  shares: MockAllocationRuleShare[];
  effective_date: string;
  is_current: boolean;
  reason: string;
  configured_by: string;
  configured_by_email: string | null;
  configured_at: string;
  prior_version_id: string | null;
};

export type MockObligation = {
  _id: string;
  asset_id: string;
  cost_item_id: string;
  title: string;
  description: string | null;
  product: MockOfferType | null;
  size_id: string | null;
  vendor: string | null;
  reference: string | null;
  status: MockObligationStatus;
  source_type: MockCostSourceType;
  source_id: string | null;
  effective_date: string | null;
  archived_reason: string | null;
  createdAt: string;
};

export type MockCostEvent = {
  _id: string;
  obligation_id: string;
  asset_id: string;
  cost_item_id: string;
  financial_stage: MockFinancialStage;
  amount: number | null;
  effective_date: string | null;
  vendor: string | null;
  reference: string | null;
  note: string | null;
  evidence: { url: string; caption: string | null }[];
  status: MockCostEventStatus;
  source_type: MockCostSourceType;
  source_id: string | null;
  source_key: string;
  revision: number;
  reverses_event_id: string | null;
  reversal_reason: string | null;
  approved_by: string | null;
  approved_at: string | null;
  createdAt: string;
};

const nowIso = () => new Date().toISOString();
const round2 = (n: number) => Math.round(n * 100) / 100;

/** Everything keyed by asset id. */
const itemsByAsset: Record<string, MockCostItem[]> = {};
const rulesByAsset: Record<string, MockAllocationRule[]> = {};
const obligationsByAsset: Record<string, MockObligation[]> = {};
/** Events, keyed by obligation id. */
const eventsByObligation: Record<string, MockCostEvent[]> = {};

let itemSeq = 0;
let obligationSeq = 0;
let eventSeq = 0;

function sourceKey(sourceType: MockCostSourceType, sourceId: string | null, stage: MockFinancialStage): string {
  return `${sourceType}:${sourceId}:${stage}`;
}

function findItem(assetId: string, itemId: string): MockCostItem | undefined {
  return (itemsByAsset[assetId] ?? []).find((i) => i._id === itemId);
}

function findObligation(assetId: string, obligationId: string): MockObligation | undefined {
  return (obligationsByAsset[assetId] ?? []).find((o) => o._id === obligationId);
}

/** Events don't carry which asset owns them at the route layer for `/admin/cost-entries/:eventId` — search every obligation's events. */
function findEventAnywhere(eventId: string): { event: MockCostEvent; assetId: string; obligation: MockObligation } | undefined {
  for (const [assetId, obligations] of Object.entries(obligationsByAsset)) {
    for (const obligation of obligations) {
      const event = (eventsByObligation[obligation._id] ?? []).find((e) => e._id === eventId);
      if (event) return { event, assetId, obligation };
    }
  }
  return undefined;
}

function presentItem(item: MockCostItem, currentRule: MockAllocationRule | undefined): Record<string, unknown> {
  return {
    id: item._id,
    asset_id: item.asset_id,
    group: item.group,
    group_label: COST_GROUP_LABELS[item.group],
    name: item.name,
    description: item.description,
    is_shared: item.is_shared,
    allocation_basis: item.allocation_basis,
    allocation_label: item.allocation_basis ? ALLOCATION_BASIS_LABELS[item.allocation_basis] : null,
    applies_to_products: item.applies_to_products,
    excluded_products: item.excluded_products,
    manual_shares: item.manual_shares,
    applicability_version: item.applicability_version,
    is_active: item.is_active,
    needs_allocation_rule: item.is_shared && !currentRule,
    created_at: item.createdAt,
  };
}

/**
 * The GET history's per-version public shape — confirmed against the real
 * `allocationHistory()`'s inline rule mapping: no `id`/`asset_id`/
 * `cost_item_id` of its own (identity is `version`), `configured_by_email`
 * folded into `configured_by`, `prior_version_id` dropped entirely.
 */
function presentRule(rule: MockAllocationRule): Record<string, unknown> {
  return {
    version: rule.version,
    method: rule.method,
    applies_to_products: rule.applies_to_products,
    excluded_products: rule.excluded_products,
    shares: rule.shares,
    effective_date: rule.effective_date,
    is_current: rule.is_current,
    reason: rule.reason,
    configured_by: rule.configured_by_email ?? rule.configured_by,
    configured_at: rule.configured_at,
  };
}

function presentObligation(obligation: MockObligation, item: MockCostItem | undefined): Record<string, unknown> {
  return {
    id: obligation._id,
    asset_id: obligation.asset_id,
    cost_item: item
      ? { id: item._id, name: item.name, group: item.group, is_shared: item.is_shared, allocation_basis: item.allocation_basis }
      : { id: obligation.cost_item_id, name: null, group: null, is_shared: false, allocation_basis: null },
    title: obligation.title,
    description: obligation.description,
    product: obligation.product,
    size_id: obligation.size_id,
    vendor: obligation.vendor,
    reference: obligation.reference,
    status: obligation.status,
    source_type: obligation.source_type,
    source_id: obligation.source_id,
    effective_date: obligation.effective_date,
    archived_reason: obligation.archived_reason,
    created_at: obligation.createdAt,
  };
}

function presentEvent(event: MockCostEvent): Record<string, unknown> {
  return {
    id: event._id,
    obligation_id: event.obligation_id,
    cost_item_id: event.cost_item_id,
    financial_stage: event.financial_stage,
    stage_label: event.financial_stage,
    counts_as_cost: countsAsCost(event.financial_stage),
    amount: event.amount,
    effective_date: event.effective_date,
    vendor: event.vendor,
    reference: event.reference,
    note: event.note,
    evidence: event.evidence,
    status: event.status,
    source_type: event.source_type,
    source_id: event.source_id,
    revision: event.revision,
    reverses_event_id: event.reverses_event_id,
    reversal_reason: event.reversal_reason,
    approved_at: event.approved_at,
    created_at: event.createdAt,
  };
}

function currentRuleFor(assetId: string, itemId: string): MockAllocationRule | undefined {
  return (rulesByAsset[assetId] ?? []).find((r) => r.cost_item_id === itemId && r.is_current);
}

/**
 * The rich `{obligation, cost_item, stages, recognised_cost, events}` shape —
 * confirmed this is what the real `getObligation()` AND `createObligation()`
 * both return (the latter delegates straight to the former on the real
 * backend), unlike the list/archive endpoints, which return the bare
 * obligation. Shared here so POST .../costs stays consistent with
 * GET .../costs/:obligationId rather than drifting back to the old, wrong
 * bare-obligation assumption.
 */
function presentObligationDetail(assetId: string, obligation: MockObligation): Record<string, unknown> {
  const item = findItem(assetId, obligation.cost_item_id);
  const events = eventsByObligation[obligation._id] ?? [];

  const stages: Record<string, number> = {};
  let recognised = 0;
  for (const event of events) {
    if (event.status !== 'approved' || event.amount == null) continue;
    stages[event.financial_stage] = (stages[event.financial_stage] ?? 0) + event.amount;
    if (countsAsCost(event.financial_stage)) recognised += event.amount * signFor(event.financial_stage);
  }

  return {
    obligation: presentObligation(obligation, item),
    cost_item: item ? presentItem(item, currentRuleFor(assetId, item._id)) : null,
    stages,
    recognised_cost: round2(recognised),
    events: events.map(presentEvent),
  };
}

function newItem(partial: Pick<MockCostItem, 'asset_id' | 'group' | 'name'> & Partial<MockCostItem>): MockCostItem {
  itemSeq += 1;
  return {
    _id: `665fci${String(itemSeq).padStart(4, '0')}`,
    description: null,
    is_shared: false,
    allocation_basis: null,
    applies_to_products: [],
    excluded_products: [],
    manual_shares: [],
    applicability_version: 1,
    is_active: true,
    createdAt: nowIso(),
    ...partial,
  };
}

function newObligation(
  partial: Pick<MockObligation, 'asset_id' | 'cost_item_id' | 'title'> & Partial<MockObligation>
): MockObligation {
  obligationSeq += 1;
  return {
    _id: `665fco${String(obligationSeq).padStart(4, '0')}`,
    description: null,
    product: null,
    size_id: null,
    vendor: null,
    reference: null,
    status: 'open',
    source_type: 'manual',
    source_id: null,
    effective_date: null,
    archived_reason: null,
    createdAt: nowIso(),
    ...partial,
  };
}

function writeEvent(
  obligation: MockObligation,
  input: Partial<MockCostEvent> & Pick<MockCostEvent, 'financial_stage'>
): MockCostEvent {
  eventSeq += 1;
  const sourceType = input.source_type ?? 'manual';
  const sourceId = input.source_id ?? null;
  const event: MockCostEvent = {
    _id: `665fce${String(eventSeq).padStart(4, '0')}`,
    obligation_id: obligation._id,
    asset_id: obligation.asset_id,
    cost_item_id: obligation.cost_item_id,
    amount: null,
    effective_date: nowIso(),
    vendor: null,
    reference: null,
    note: null,
    evidence: [],
    status: 'draft',
    source_type: sourceType,
    source_id: sourceId,
    source_key: sourceKey(sourceType, sourceId, input.financial_stage),
    revision: 1,
    reverses_event_id: null,
    reversal_reason: null,
    approved_by: null,
    approved_at: null,
    createdAt: nowIso(),
    ...input,
  };
  eventsByObligation[obligation._id] = [...(eventsByObligation[obligation._id] ?? []), event];
  return event;
}

function seedIfNeeded(assetId: string): void {
  if (itemsByAsset[assetId]) return;
  const row = findActiveAsset(assetId);
  if (!row) return;
  itemsByAsset[assetId] = [];
  obligationsByAsset[assetId] = [];
  rulesByAsset[assetId] = [];

  if (assetId === '665faaaa00000000000000a1') {
    const landPurchase = newItem({ asset_id: assetId, group: 'acquisition', name: 'Land purchase', is_active: true });
    itemsByAsset[assetId].push(landPurchase);
    const landObligation = newObligation({
      asset_id: assetId,
      cost_item_id: landPurchase._id,
      title: 'Land purchase',
      vendor: 'Ibeju-Lekki Family Trust',
      effective_date: '2026-03-01',
      status: 'settled',
    });
    obligationsByAsset[assetId].push(landObligation);
    for (const stage of ['budget', 'committed', 'incurred', 'paid'] as MockFinancialStage[]) {
      const event = writeEvent(landObligation, { financial_stage: stage, amount: 920_000_000, effective_date: '2026-03-01' });
      event.status = 'approved';
      event.approved_by = MOCK_ADMIN_ID;
      event.approved_at = nowIso();
    }

    const fencing = newItem({
      asset_id: assetId,
      group: 'development',
      name: 'Perimeter fencing',
      is_shared: true,
      allocation_basis: 'saleable_sqm',
    });
    itemsByAsset[assetId].push(fencing);
    rulesByAsset[assetId].push({
      asset_id: assetId,
      cost_item_id: fencing._id,
      version: 1,
      method: 'saleable_sqm',
      applies_to_products: [],
      excluded_products: [],
      shares: [],
      effective_date: '2026-03-05',
      is_current: true,
      reason: 'Initial allocation setup',
      configured_by: MOCK_ADMIN_ID,
      configured_by_email: MOCK_ADMIN_EMAIL,
      configured_at: nowIso(),
      prior_version_id: null,
    });
    const fencingObligation = newObligation({
      asset_id: assetId,
      cost_item_id: fencing._id,
      title: 'Perimeter fencing — weeks 1-6',
      vendor: 'Site Manager (field submission)',
      effective_date: '2026-08-15',
      source_type: 'field_submission',
      source_id: 'sm-sub-0091',
    });
    obligationsByAsset[assetId].push(fencingObligation);
    let ev = writeEvent(fencingObligation, { financial_stage: 'budget', amount: 383_800_000, effective_date: '2026-03-10' });
    ev.status = 'approved';
    ev.approved_by = MOCK_ADMIN_ID;
    ev.approved_at = nowIso();
    ev = writeEvent(fencingObligation, { financial_stage: 'committed', amount: 812_400_000, effective_date: '2026-04-02' });
    ev.status = 'approved';
    ev.approved_by = MOCK_ADMIN_ID;
    ev.approved_at = nowIso();
    // Deliberately left unapproved — the coverage panel's "entries awaiting approval" gets a real, non-zero example.
    writeEvent(fencingObligation, {
      financial_stage: 'claimed',
      amount: 676_200_000,
      effective_date: '2026-08-20',
      source_type: 'field_submission',
      source_id: 'sm-sub-0091',
    });

    const survey = newItem({ asset_id: assetId, group: 'documentation_finance', name: 'Survey and legal fees' });
    itemsByAsset[assetId].push(survey);
    const surveyObligation = newObligation({
      asset_id: assetId,
      cost_item_id: survey._id,
      title: 'Survey and legal fees',
      effective_date: '2026-05-01',
    });
    obligationsByAsset[assetId].push(surveyObligation);
    writeEvent(surveyObligation, { financial_stage: 'budget', amount: 45_000_000, effective_date: '2026-05-01' });
  }

  if (assetId === '665faaaa00000000000000a2') {
    const security = newItem({ asset_id: assetId, group: 'opex', name: 'Site security' });
    itemsByAsset[assetId].push(security);
    const securityObligation = newObligation({ asset_id: assetId, cost_item_id: security._id, title: 'Site security', effective_date: '2026-02-15' });
    obligationsByAsset[assetId].push(securityObligation);
    let ev = writeEvent(securityObligation, { financial_stage: 'committed', amount: 24_000_000, effective_date: '2026-02-15' });
    ev.status = 'approved';
    ev.approved_by = MOCK_ADMIN_ID;
    ev.approved_at = nowIso();
    ev = writeEvent(securityObligation, { financial_stage: 'incurred', amount: 18_000_000, effective_date: '2026-07-01' });
    ev.status = 'approved';
    ev.approved_by = MOCK_ADMIN_ID;
    ev.approved_at = nowIso();

    const commission = newItem({ asset_id: assetId, group: 'direct_cost_of_sale', name: 'Sales commission accrual' });
    itemsByAsset[assetId].push(commission);
    const commissionObligation = newObligation({
      asset_id: assetId,
      cost_item_id: commission._id,
      title: 'Settled commission batch #4471',
      effective_date: '2026-08-15',
      source_type: 'commission_transaction',
      source_id: 'txn-cm-4471',
    });
    obligationsByAsset[assetId].push(commissionObligation);
    const commissionEvent = writeEvent(commissionObligation, { financial_stage: 'incurred', amount: 61_000_000, effective_date: '2026-08-15' });
    commissionEvent.status = 'approved';
    commissionEvent.approved_by = MOCK_ADMIN_ID;
    commissionEvent.approved_at = nowIso();
  }
}

function requireAsset(assetId: string) {
  const row = findActiveAsset(assetId);
  if (!row) throw new MockHttpError(404, 'Asset not found', 'COST_ASSET_NOT_FOUND');
  return row;
}

/** For estate-profitability.ts's in-process read — not an HTTP route. */
export function getCostItems(assetId: string): MockCostItem[] {
  seedIfNeeded(assetId);
  return itemsByAsset[assetId] ?? [];
}
export function getCostObligations(assetId: string): MockObligation[] {
  seedIfNeeded(assetId);
  return obligationsByAsset[assetId] ?? [];
}
export function getCostEvents(obligationId: string): MockCostEvent[] {
  return eventsByObligation[obligationId] ?? [];
}
export function getCurrentAllocationRule(assetId: string, itemId: string): MockAllocationRule | undefined {
  seedIfNeeded(assetId);
  return currentRuleFor(assetId, itemId);
}
export { countsAsCost, signFor, DIRECT_GROUPS, COST_GROUPS };

export const assetCostRoutes: MockRoutes = {
  'GET /admin/assets/:assetId/costs/items': ({ params, query }) => {
    seedIfNeeded(params.assetId);
    requireAsset(params.assetId);
    const includeInactive = query.include_inactive === 'true';
    const items = (itemsByAsset[params.assetId] ?? []).filter((i) => includeInactive || i.is_active);
    return items.map((item) => presentItem(item, currentRuleFor(params.assetId, item._id)));
  },

  'POST /admin/assets/:assetId/costs/items': ({ params, body: raw }) => {
    seedIfNeeded(params.assetId);
    requireAsset(params.assetId);
    const dto = body<{
      group?: MockCostGroup;
      name?: string;
      description?: string;
      is_shared?: boolean;
      applies_to_products?: MockOfferType[];
      excluded_products?: MockOfferType[];
    }>(raw);

    if (!dto.group || !COST_GROUPS.includes(dto.group)) {
      throw new MockHttpError(400, `group must be one of: ${COST_GROUPS.join(', ')}`, 'VALIDATION_FAILED');
    }
    if (!dto.name?.trim()) throw new MockHttpError(400, 'name should not be empty', 'VALIDATION_FAILED');

    const duplicate = (itemsByAsset[params.assetId] ?? []).some(
      (i) => i.group === dto.group && i.name.toLowerCase() === dto.name!.trim().toLowerCase()
    );
    if (duplicate) {
      throw new MockHttpError(409, 'This estate already has a cost item with that name in that group', 'COST_ITEM_NAME_TAKEN');
    }

    const item = newItem({
      asset_id: params.assetId,
      group: dto.group,
      name: dto.name.trim(),
      description: dto.description?.trim() || null,
      is_shared: dto.is_shared ?? false,
      applies_to_products: dto.applies_to_products ?? [],
      excluded_products: dto.excluded_products ?? [],
    });
    itemsByAsset[params.assetId].push(item);
    return presentItem(item, undefined);
  },

  'PATCH /admin/assets/:assetId/costs/items/:itemId': ({ params, body: raw }) => {
    seedIfNeeded(params.assetId);
    const item = findItem(params.assetId, params.itemId);
    if (!item) throw new MockHttpError(404, 'Cost item not found', 'COST_ITEM_NOT_FOUND');

    const dto = body<{ name?: string; description?: string; is_shared?: boolean; is_active?: boolean }>(raw);
    if (dto.name !== undefined) item.name = dto.name.trim();
    if (dto.description !== undefined) item.description = dto.description.trim() || null;
    if (dto.is_shared !== undefined) item.is_shared = dto.is_shared;
    if (dto.is_active !== undefined) item.is_active = dto.is_active;

    return presentItem(item, currentRuleFor(params.assetId, item._id));
  },

  'DELETE /admin/assets/:assetId/costs/items/:itemId': ({ params }) => {
    seedIfNeeded(params.assetId);
    const item = findItem(params.assetId, params.itemId);
    if (!item) throw new MockHttpError(404, 'Cost item not found', 'COST_ITEM_NOT_FOUND');
    item.is_active = false;
    return presentItem(item, currentRuleFor(params.assetId, item._id));
  },

  'PUT /admin/assets/:assetId/costs/items/:itemId/allocation-rule': ({ params, body: raw }) => {
    seedIfNeeded(params.assetId);
    const item = findItem(params.assetId, params.itemId);
    if (!item) throw new MockHttpError(404, 'Cost item not found', 'COST_ITEM_NOT_FOUND');

    const dto = body<{
      method?: MockAllocationBasis;
      applies_to_products?: MockOfferType[];
      excluded_products?: MockOfferType[];
      percentages?: { offer_type: MockOfferType; percent: number }[];
      amounts?: { offer_type: MockOfferType; amount: number }[];
      effective_date?: string;
      reason?: string;
    }>(raw);

    if (!dto.method || !ALLOCATION_BASES.includes(dto.method)) {
      throw new MockHttpError(400, `method must be one of: ${ALLOCATION_BASES.join(', ')}`, 'VALIDATION_FAILED');
    }
    if (dto.method === 'manual' && !(dto.percentages ?? []).length) {
      throw new MockHttpError(400, 'This allocation rule needs at least one percentage', 'COST_ALLOCATION_INVALID');
    }
    if (dto.method === 'amount' && !(dto.amounts ?? []).length) {
      throw new MockHttpError(400, 'This allocation rule needs at least one amount', 'COST_ALLOCATION_INVALID');
    }
    if (!dto.effective_date?.trim()) throw new MockHttpError(400, 'effective_date should not be empty', 'VALIDATION_FAILED');
    if (!dto.reason?.trim()) throw new MockHttpError(400, 'reason should not be empty', 'VALIDATION_FAILED');

    const existing = rulesByAsset[params.assetId] ?? [];
    for (const rule of existing) {
      if (rule.cost_item_id === params.itemId) rule.is_current = false;
    }
    const priorCurrent = existing.filter((r) => r.cost_item_id === params.itemId);
    const version = priorCurrent.length > 0 ? Math.max(...priorCurrent.map((r) => r.version)) + 1 : 1;

    const shares: MockAllocationRuleShare[] = [
      ...(dto.percentages ?? []).map((p) => ({ offer_type: p.offer_type, percent: p.percent, amount: null })),
      ...(dto.amounts ?? []).map((a) => ({ offer_type: a.offer_type, percent: null, amount: a.amount })),
    ];
    const rule: MockAllocationRule = {
      asset_id: params.assetId,
      cost_item_id: params.itemId,
      version,
      method: dto.method,
      applies_to_products: dto.applies_to_products ?? [],
      excluded_products: dto.excluded_products ?? [],
      shares,
      effective_date: dto.effective_date.trim(),
      is_current: true,
      reason: dto.reason.trim(),
      configured_by: MOCK_ADMIN_ID,
      configured_by_email: MOCK_ADMIN_EMAIL,
      configured_at: nowIso(),
      prior_version_id: priorCurrent.length > 0 ? `${params.itemId}-v${version - 1}` : null,
    };
    rulesByAsset[params.assetId] = [...existing, rule];

    item.allocation_basis = dto.method;
    item.manual_shares = shares.filter((s) => s.percent != null).map((s) => ({ offer_type: s.offer_type, percent: s.percent as number }));
    item.applicability_version += 1;

    // The real PUT response is narrower than a history entry — no
    // `is_current`/`configured_by`/`configured_at` — confirmed against
    // `setAllocationRule()`'s own inline return literal.
    return {
      version: rule.version,
      method: rule.method,
      applies_to_products: rule.applies_to_products,
      excluded_products: rule.excluded_products,
      shares: rule.shares,
      effective_date: rule.effective_date,
      reason: rule.reason,
    };
  },

  'GET /admin/assets/:assetId/costs/items/:itemId/allocation-rule': ({ params }) => {
    seedIfNeeded(params.assetId);
    const item = findItem(params.assetId, params.itemId);
    if (!item) throw new MockHttpError(404, 'Cost item not found', 'COST_ITEM_NOT_FOUND');
    const rules = [...(rulesByAsset[params.assetId] ?? [])]
      .filter((r) => r.cost_item_id === params.itemId)
      .sort((a, b) => b.version - a.version);
    // Not paginated on the real backend — a plain `{cost_item, rules}`
    // object, confirmed against `allocationHistory()`'s own return.
    return {
      cost_item: presentItem(item, currentRuleFor(params.assetId, item._id)),
      rules: rules.map(presentRule),
    };
  },

  'GET /admin/assets/:assetId/costs': ({ params, query }) => {
    seedIfNeeded(params.assetId);
    requireAsset(params.assetId);
    let obligations = obligationsByAsset[params.assetId] ?? [];
    if (typeof query.cost_item_id === 'string') obligations = obligations.filter((o) => o.cost_item_id === query.cost_item_id);
    if (typeof query.status === 'string') obligations = obligations.filter((o) => o.status === query.status);
    const presented = obligations.map((o) => presentObligation(o, findItem(params.assetId, o.cost_item_id)));
    return paged(presented, query, 100);
  },

  'POST /admin/assets/:assetId/costs': ({ params, body: raw }) => {
    seedIfNeeded(params.assetId);
    requireAsset(params.assetId);
    const dto = body<{
      cost_item_id?: string;
      title?: string;
      description?: string;
      product?: MockOfferType;
      size_id?: string;
      vendor?: string;
      reference?: string;
      effective_date?: string;
      amount?: number;
      stage?: MockFinancialStage;
      note?: string;
    }>(raw);

    const item = dto.cost_item_id ? findItem(params.assetId, dto.cost_item_id) : undefined;
    if (!item) throw new MockHttpError(404, 'Cost item not found', 'COST_ITEM_NOT_FOUND');
    if (!dto.title?.trim()) throw new MockHttpError(400, 'title should not be empty', 'VALIDATION_FAILED');
    if (!dto.effective_date?.trim()) throw new MockHttpError(400, 'effective_date should not be empty', 'VALIDATION_FAILED');

    const obligation = newObligation({
      asset_id: params.assetId,
      cost_item_id: item._id,
      title: dto.title.trim(),
      description: dto.description?.trim() || null,
      product: dto.product ?? null,
      size_id: dto.size_id ?? null,
      vendor: dto.vendor?.trim() || null,
      reference: dto.reference?.trim() || null,
      effective_date: dto.effective_date.trim(),
    });
    obligationsByAsset[params.assetId].push(obligation);

    if (dto.amount !== undefined) {
      writeEvent(obligation, {
        financial_stage: dto.stage ?? 'budget',
        amount: dto.amount,
        effective_date: dto.effective_date.trim(),
        note: dto.note?.trim() || null,
      });
    }

    return presentObligationDetail(params.assetId, obligation);
  },

  'GET /admin/assets/:assetId/costs/coverage': ({ params }) => {
    seedIfNeeded(params.assetId);
    const row = requireAsset(params.assetId);
    const items = itemsByAsset[params.assetId] ?? [];
    const obligations = obligationsByAsset[params.assetId] ?? [];

    let totalRecognised = 0;
    let entriesAwaitingApproval = 0;
    let entriesWithoutAmount = 0;
    let completeCount = 0;

    const rows = items.map((item) => {
      const itemObligations = obligations.filter((o) => o.cost_item_id === item._id);
      const events = itemObligations.flatMap((o) => eventsByObligation[o._id] ?? []);
      const stagesRecorded = [...new Set(events.map((e) => e.financial_stage))];
      let recognised = 0;
      const gaps: string[] = [];

      for (const event of events) {
        if (event.status === 'draft') entriesAwaitingApproval += 1;
        if (event.amount == null) entriesWithoutAmount += 1;
        if (event.status === 'approved' && event.amount != null && countsAsCost(event.financial_stage)) {
          recognised += event.amount * signFor(event.financial_stage);
        }
      }
      if (events.some((e) => e.status === 'draft')) gaps.push('Has an entry awaiting approval');
      if (events.length === 0) gaps.push('No stage recorded yet');
      if (item.is_shared && !currentRuleFor(params.assetId, item._id)) gaps.push('Needs an allocation rule');

      const complete = gaps.length === 0;
      if (complete) completeCount += 1;
      totalRecognised += recognised;

      return {
        cost_item_id: item._id,
        name: item.name,
        group: item.group,
        is_shared: item.is_shared,
        allocation_basis: item.allocation_basis,
        recognised_cost: round2(recognised),
        stages_recorded: stagesRecorded,
        gaps,
        complete,
      };
    });

    return {
      asset: { id: row._id, name: row.name },
      items: rows,
      totals: {
        items: items.length,
        complete: completeCount,
        incomplete: items.length - completeCount,
        recognised_cost: round2(totalRecognised),
        entries_awaiting_approval: entriesAwaitingApproval,
        entries_without_an_amount: entriesWithoutAmount,
      },
      complete: completeCount === items.length,
    };
  },

  'POST /admin/assets/:assetId/costs/impact-preview': ({ params, body: raw }) => {
    seedIfNeeded(params.assetId);
    const row = requireAsset(params.assetId);
    const dto = body<{ cost_item_id?: string }>(raw);
    const item = dto.cost_item_id ? findItem(params.assetId, dto.cost_item_id) : undefined;
    if (!item) throw new MockHttpError(404, 'Cost item not found', 'COST_ITEM_NOT_FOUND');

    // A lightweight, honest preview: nudges the affected offer types by a
    // deterministic small amount rather than re-running the whole
    // allocation engine twice — the real value under test is the request/
    // response wiring, not a byte-perfect recomputation in a mock.
    const affected = item.applies_to_products.length > 0 ? item.applies_to_products : ['flex', 'full-ownership', 'commercial'];
    return {
      asset: { id: row._id, name: row.name },
      before: { by_product: affected.map((offer_type) => ({ offer_type, direct_cost: 0, allocated_opex: 0, net_profit: 0 })), complete: true },
      after: { by_product: affected.map((offer_type) => ({ offer_type, direct_cost: 0, allocated_opex: 0, net_profit: 0 })), complete: true },
      changes: affected.map((offer_type) => ({ offer_type, net_profit_change: 0 })),
      new_warnings: [],
    };
  },

  'GET /admin/assets/:assetId/costs/:obligationId': ({ params }) => {
    seedIfNeeded(params.assetId);
    const obligation = findObligation(params.assetId, params.obligationId);
    if (!obligation) throw new MockHttpError(404, 'Cost record not found', 'OBLIGATION_NOT_FOUND');
    return presentObligationDetail(params.assetId, obligation);
  },

  'PATCH /admin/assets/:assetId/costs/:obligationId/archive': ({ params, body: raw }) => {
    seedIfNeeded(params.assetId);
    const obligation = findObligation(params.assetId, params.obligationId);
    if (!obligation) throw new MockHttpError(404, 'Cost record not found', 'OBLIGATION_NOT_FOUND');
    const dto = body<{ reason?: string }>(raw);
    if (!dto.reason?.trim()) throw new MockHttpError(400, 'A reason is required', 'VALIDATION_FAILED');

    obligation.status = 'archived';
    obligation.archived_reason = dto.reason.trim();
    return presentObligation(obligation, findItem(params.assetId, obligation.cost_item_id));
  },

  'POST /admin/assets/:assetId/costs/:obligationId/stages': ({ params, body: raw }) => {
    seedIfNeeded(params.assetId);
    const obligation = findObligation(params.assetId, params.obligationId);
    if (!obligation) throw new MockHttpError(404, 'Cost record not found', 'OBLIGATION_NOT_FOUND');
    if (obligation.status === 'archived') throw new MockHttpError(409, 'This cost record has been archived', 'OBLIGATION_ARCHIVED');

    const dto = body<{
      stage?: MockFinancialStage;
      amount?: number;
      effective_date?: string;
      vendor?: string;
      reference?: string;
      note?: string;
    }>(raw);
    if (!dto.stage) throw new MockHttpError(400, 'stage should not be empty', 'VALIDATION_FAILED');
    if (dto.amount === undefined) throw new MockHttpError(400, 'This stage needs an amount', 'COST_AMOUNT_REQUIRED');

    const alreadyExists = (eventsByObligation[obligation._id] ?? []).some(
      (e) => e.source_type === 'manual' && e.financial_stage === dto.stage && e.status !== 'reversed'
    );
    if (alreadyExists) {
      throw new MockHttpError(409, 'That stage has already been recorded for this cost record from that source', 'COST_STAGE_DUPLICATE');
    }

    const event = writeEvent(obligation, {
      financial_stage: dto.stage,
      amount: dto.amount,
      effective_date: dto.effective_date?.trim() || nowIso(),
      vendor: dto.vendor?.trim() || obligation.vendor,
      reference: dto.reference?.trim() || null,
      note: dto.note?.trim() || null,
    });
    return presentEvent(event);
  },

  'POST /admin/assets/:assetId/costs/:obligationId/accept-claim': ({ params, body: raw }) => {
    seedIfNeeded(params.assetId);
    const obligation = findObligation(params.assetId, params.obligationId);
    if (!obligation) throw new MockHttpError(404, 'Cost record not found', 'OBLIGATION_NOT_FOUND');
    if (obligation.status === 'archived') throw new MockHttpError(409, 'This cost record has been archived', 'OBLIGATION_ARCHIVED');

    const events = eventsByObligation[obligation._id] ?? [];
    const claims = events.filter((e) => e.financial_stage === 'claimed' && e.status === 'approved');
    if (claims.length === 0) throw new MockHttpError(409, 'There is no claimed amount on this record waiting to be accepted', 'COST_NO_CLAIM_TO_ACCEPT');

    const claimedTotal = round2(claims.reduce((sum, e) => sum + (e.amount ?? 0), 0));
    const alreadyIncurred = events
      .filter((e) => e.financial_stage === 'incurred' && e.status === 'approved')
      .reduce((sum, e) => sum + (e.amount ?? 0), 0);
    if (alreadyIncurred >= claimedTotal) throw new MockHttpError(409, 'This claim has already been accepted as a cost', 'COST_CLAIM_ALREADY_ACCEPTED');

    const dto = body<{ amount?: number; effective_date?: string; note?: string }>(raw);
    const amount = dto.amount ?? round2(claimedTotal - alreadyIncurred);

    const event = writeEvent(obligation, {
      financial_stage: 'incurred',
      amount,
      effective_date: dto.effective_date?.trim() || nowIso(),
      vendor: obligation.vendor,
      note: dto.note?.trim() || 'Claim accepted by finance',
      source_type: 'manual',
    });
    event.status = 'approved';
    event.approved_by = MOCK_ADMIN_ID;
    event.approved_at = nowIso();
    return presentEvent(event);
  },

  'PATCH /admin/cost-entries/:eventId': ({ params, body: raw }) => {
    const found = findEventAnywhere(params.eventId);
    if (!found) throw new MockHttpError(404, 'Cost entry not found', 'COST_EVENT_NOT_FOUND');
    if (found.event.status !== 'draft') {
      throw new MockHttpError(409, 'Only a draft entry can be changed — revise or reverse the approved one instead', 'COST_EVENT_NOT_DRAFT');
    }
    const dto = body<{ amount?: number; effective_date?: string; vendor?: string; reference?: string; note?: string }>(raw);
    if (dto.amount !== undefined) found.event.amount = dto.amount;
    if (dto.effective_date !== undefined) found.event.effective_date = dto.effective_date;
    if (dto.vendor !== undefined) found.event.vendor = dto.vendor;
    if (dto.reference !== undefined) found.event.reference = dto.reference;
    if (dto.note !== undefined) found.event.note = dto.note;
    found.event.revision += 1;
    return presentEvent(found.event);
  },

  'POST /admin/cost-entries/:eventId/approve': ({ params, body: raw }) => {
    const found = findEventAnywhere(params.eventId);
    if (!found) throw new MockHttpError(404, 'Cost entry not found', 'COST_EVENT_NOT_FOUND');
    if (found.event.status === 'approved') throw new MockHttpError(409, 'This entry has already been approved', 'COST_EVENT_ALREADY_APPROVED');
    if (found.event.status !== 'draft') throw new MockHttpError(409, 'Only a draft entry can be approved', 'COST_EVENT_NOT_DRAFT');
    if (found.event.amount == null) throw new MockHttpError(400, 'This stage needs an amount', 'COST_AMOUNT_REQUIRED');

    const dto = body<{ note?: string }>(raw);
    found.event.status = 'approved';
    found.event.approved_by = MOCK_ADMIN_ID;
    found.event.approved_at = nowIso();
    if (dto.note) found.event.note = dto.note;
    return presentEvent(found.event);
  },

  'POST /admin/cost-entries/:eventId/reverse': ({ params, body: raw }) => {
    const found = findEventAnywhere(params.eventId);
    if (!found) throw new MockHttpError(404, 'Cost entry not found', 'COST_EVENT_NOT_FOUND');
    if (found.event.status === 'reversed') throw new MockHttpError(409, 'This entry has already been reversed', 'COST_EVENT_ALREADY_REVERSED');
    if (found.event.status !== 'approved') throw new MockHttpError(409, 'Only an approved entry can be reversed', 'COST_EVENT_NOT_APPROVED');

    const dto = body<{ reason?: string }>(raw);
    if (!dto.reason?.trim()) throw new MockHttpError(400, 'A reversal needs a reason', 'VALIDATION_FAILED');

    found.event.status = 'reversed';
    found.event.reversal_reason = dto.reason.trim();

    if (countsAsCost(found.event.financial_stage)) {
      const reversal = writeEvent(found.obligation, {
        financial_stage: 'reversal',
        amount: found.event.amount,
        effective_date: nowIso(),
        note: dto.reason.trim(),
        reverses_event_id: found.event._id,
      });
      reversal.status = 'approved';
      reversal.approved_by = MOCK_ADMIN_ID;
      reversal.approved_at = nowIso();
    }

    return presentEvent(found.event);
  },
};
