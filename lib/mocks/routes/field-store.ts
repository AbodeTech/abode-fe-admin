/* ============================================================
 * The field-staff module's data, for the mock layer: approved boundaries,
 * field workers and their site assignments, work submissions, and the
 * "effects" a verified submission writes. Shared by site-setup.ts (which
 * reads progress from the effects, as the real `SiteSetupService` does) and
 * field-operations.ts (which reviews the submissions).
 *
 * The rules mirror `abode-be-v2`'s `FieldVerificationService` and
 * `submission-payloads.ts`: only a verified submission has live effects, a
 * correction reverses the old ones and writes a new revision, and a reversal
 * leaves none.
 * ============================================================ */

export type Sides = { front: number; right: number; back: number; left: number };
export const SIDES = ['front', 'right', 'back', 'left'] as const;

export type MockBoundaryVersion = {
  version: number;
  sides: Sides;
  perimeter_metres: number;
  is_current: boolean;
  source: 'admin' | 'surveyor_submission';
  submission_id: string | null;
  approved_at: string;
  note: string | null;
};

export const round2 = (value: number) => Math.round(value * 100) / 100;

export function perimeterOf(sides: Sides): number {
  return round2(sides.front + sides.right + sides.back + sides.left);
}

const boundaries: Record<string, MockBoundaryVersion[]> = {};

export function boundaryVersions(assetId: string): MockBoundaryVersion[] {
  return [...(boundaries[assetId] ?? [])].sort((a, b) => b.version - a.version);
}

export function currentBoundary(assetId: string): MockBoundaryVersion | undefined {
  return (boundaries[assetId] ?? []).find((version) => version.is_current);
}

/** Stands the current version down and approves a new one — what both the admin PUT and an accepted surveyor proposal do. */
export function approveBoundary(
  assetId: string,
  sides: Sides,
  source: MockBoundaryVersion['source'],
  note: string | null,
  submissionId: string | null = null
): MockBoundaryVersion {
  const existing = boundaries[assetId] ?? [];
  for (const version of existing) version.is_current = false;
  const created: MockBoundaryVersion = {
    version: existing.length > 0 ? Math.max(...existing.map((version) => version.version)) + 1 : 1,
    sides,
    perimeter_metres: perimeterOf(sides),
    is_current: true,
    source,
    submission_id: submissionId,
    approved_at: new Date().toISOString(),
    note,
  };
  boundaries[assetId] = [...existing, created];
  return created;
}

/* -------------------- people -------------------- */

export type MockFieldStaff = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  staff_type: 'site_manager' | 'surveyor';
  status: 'active' | 'disabled';
};

export type MockAssignment = {
  id: string;
  staff_id: string;
  asset_id: string;
  responsibility: 'primary' | 'support';
  starts_on: string;
  ends_on: string | null;
  note: string | null;
  end_reason: string | null;
};

const A1 = '665faaaa00000000000000a1';
const A2 = '665faaaa00000000000000a2';

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString();

export const fieldStaff: MockFieldStaff[] = [
  { id: '66f1e1d000000000000000f1', first_name: 'Ngozi', last_name: 'Adeyemi', email: 'ngozi.adeyemi@abode.test', staff_type: 'site_manager', status: 'active' },
  { id: '66f1e1d000000000000000f2', first_name: 'Tunde', last_name: 'Bakare', email: 'tunde.bakare@abode.test', staff_type: 'surveyor', status: 'active' },
  { id: '66f1e1d000000000000000f3', first_name: 'Ibrahim', last_name: 'Sule', email: 'ibrahim.sule@abode.test', staff_type: 'site_manager', status: 'active' },
];

export const assignments: MockAssignment[] = [
  { id: '66f1a55000000000000000a1', staff_id: fieldStaff[0].id, asset_id: A1, responsibility: 'primary', starts_on: daysAgo(120), ends_on: null, note: null, end_reason: null },
  { id: '66f1a55000000000000000a2', staff_id: fieldStaff[1].id, asset_id: A1, responsibility: 'primary', starts_on: daysAgo(90), ends_on: null, note: null, end_reason: null },
  { id: '66f1a55000000000000000a3', staff_id: fieldStaff[2].id, asset_id: A1, responsibility: 'support', starts_on: daysAgo(200), ends_on: daysAgo(121), note: null, end_reason: 'Moved to another estate' },
  { id: '66f1a55000000000000000a4', staff_id: fieldStaff[0].id, asset_id: A2, responsibility: 'primary', starts_on: daysAgo(120), ends_on: null, note: null, end_reason: null },
];

/** `FieldStaffRepository.activeAssignment()` — starts on or before the date, and has not ended by it. */
export function activeAssignment(staffId: string, assetId: string, on: string): MockAssignment | undefined {
  const at = new Date(on).getTime();
  return assignments.find(
    (row) =>
      row.staff_id === staffId &&
      row.asset_id === assetId &&
      new Date(row.starts_on).getTime() <= at &&
      (row.ends_on === null || new Date(row.ends_on).getTime() > at)
  );
}

/* -------------------- submissions and their effects -------------------- */

export type MockSubmissionStatus = 'draft' | 'submitted' | 'verified' | 'rejected' | 'withdrawn' | 'corrected' | 'reversed';

export type MockSubmission = {
  id: string;
  staff_id: string;
  asset_id: string;
  metric_key: 'fencing_new_metres' | 'parcelation_plots' | 'clearing_sqm' | 'boundary_metres';
  work_date: string;
  status: MockSubmissionStatus;
  payload: Record<string, unknown>;
  quantity: number;
  counts_towards_target: boolean;
  evidence: { url: string; kind: string; caption: string | null }[];
  plot_ids: string[];
  amount_spent: number | null;
  vendor: string | null;
  payment_reference: string | null;
  receipts: { url: string; caption: string | null; reference: string | null; amount: number | null }[];
  note: string | null;
  warnings: string[];
  warning_acknowledgement: string | null;
  revision: number;
  submitted_at: string | null;
  reviewed_at: string | null;
  review_note: string | null;
  correction_reason: string | null;
  reversal_reason: string | null;
  created_at: string;
};

export type MockEffect = {
  submission_id: string;
  effect_type: 'performance_actual' | 'site_setup' | 'plot_history' | 'asset_cost' | 'audit_timeline';
  revision: number;
  asset_id: string;
  staff_id: string;
  metric_key: string;
  work_date: string;
  quantity: number;
  amount: number | null;
  plot_ids: string[];
  detail: Record<string, unknown>;
  counts_towards_target: boolean;
  is_reversed: boolean;
};

export const submissions: MockSubmission[] = [];
export const effects: MockEffect[] = [];

const UNITS: Record<MockSubmission['metric_key'], string> = {
  fencing_new_metres: 'metres',
  parcelation_plots: 'plots',
  clearing_sqm: 'sqm',
  boundary_metres: 'metres',
};
export const unitFor = (metricKey: MockSubmission['metric_key']) => UNITS[metricKey];

const COST_CATEGORY: Record<MockSubmission['metric_key'], string> = {
  fencing_new_metres: 'fencing',
  clearing_sqm: 'clearing',
  parcelation_plots: 'survey',
  boundary_metres: 'survey',
};

/** `checkPayload()` — the quantity a payload is worth, and whether it counts towards the target. */
export function checkPayload(
  metricKey: MockSubmission['metric_key'],
  payload: Record<string, unknown>
): { issues: string[]; quantity: number; counts_towards_target: boolean } {
  const issues: string[] = [];
  const positive = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0;

  if (metricKey === 'fencing_new_metres') {
    if (!SIDES.includes(payload.side as (typeof SIDES)[number])) issues.push('Say which side of the estate was fenced');
    if (payload.work_type !== 'new' && payload.work_type !== 'repair') issues.push('Say whether this is new fencing or a repair');
    if (!positive(payload.metres)) issues.push('Metres fenced must be above zero');
    const isNew = payload.work_type === 'new';
    return { issues, quantity: isNew ? Number(payload.metres ?? 0) : 0, counts_towards_target: isNew };
  }
  if (metricKey === 'parcelation_plots') {
    const plotIds = Array.isArray(payload.plot_ids) ? payload.plot_ids : [];
    if (plotIds.length === 0) issues.push('Pick the plots that were pegged out');
    const isRework = payload.is_rework === true;
    return { issues, quantity: isRework ? 0 : plotIds.length, counts_towards_target: !isRework };
  }
  if (metricKey === 'clearing_sqm') {
    if (!positive(payload.actual_sqm)) issues.push('Square metres cleared must be above zero');
    if (payload.coverage !== 'full' && payload.coverage !== 'partial') issues.push('Say whether the area was fully or partly cleared');
    return { issues, quantity: Number(payload.actual_sqm ?? 0), counts_towards_target: true };
  }
  if (!positive(payload.metres)) issues.push('Metres of boundary must be above zero');
  return { issues, quantity: Number(payload.metres ?? 0), counts_towards_target: true };
}

/** `prepareEffects()` + the write: everything a verification puts on the books, at the submission's current revision. */
export function writeEffects(submission: MockSubmission): MockEffect['effect_type'][] {
  const { payload, quantity } = submission;
  const base = {
    submission_id: submission.id,
    revision: submission.revision,
    asset_id: submission.asset_id,
    staff_id: submission.staff_id,
    metric_key: submission.metric_key,
    work_date: submission.work_date,
    plot_ids: submission.plot_ids,
    counts_towards_target: submission.counts_towards_target,
    is_reversed: false,
  };
  const written: MockEffect[] = [{ ...base, effect_type: 'performance_actual', quantity, amount: null, detail: {} }];

  if (submission.metric_key === 'fencing_new_metres') {
    written.push({
      ...base,
      effect_type: 'site_setup',
      quantity: payload.work_type === 'new' ? Number(payload.metres) : 0,
      amount: null,
      detail: { kind: 'fencing', side: payload.side, work_type: payload.work_type, metres: payload.metres },
    });
  }
  if (submission.metric_key === 'boundary_metres') {
    written.push({ ...base, effect_type: 'site_setup', quantity: Number(payload.metres), amount: null, detail: { kind: 'boundary' } });
  }
  if (submission.metric_key === 'parcelation_plots') {
    written.push({
      ...base,
      effect_type: 'plot_history',
      quantity,
      amount: null,
      detail: { kind: 'parcelation', is_rework: payload.is_rework === true },
    });
  }
  if (submission.metric_key === 'clearing_sqm') {
    written.push({
      ...base,
      effect_type: 'plot_history',
      quantity,
      amount: null,
      detail: { kind: 'clearing', mapping: payload.mapping, coverage: payload.coverage },
    });
  }
  if (submission.amount_spent && submission.amount_spent > 0) {
    written.push({
      ...base,
      effect_type: 'asset_cost',
      quantity,
      amount: submission.amount_spent,
      detail: {
        vendor: submission.vendor,
        payment_reference: submission.payment_reference,
        receipts: submission.receipts,
        cost_category: COST_CATEGORY[submission.metric_key],
      },
    });
  }
  written.push({ ...base, effect_type: 'audit_timeline', quantity, amount: null, detail: {} });

  effects.push(...written);
  return written.map((effect) => effect.effect_type);
}

export function reverseEffects(submissionId: string): void {
  for (const effect of effects) if (effect.submission_id === submissionId) effect.is_reversed = true;
}

export const liveEffects = (assetId: string) => effects.filter((effect) => effect.asset_id === assetId && !effect.is_reversed);

/** New fencing already verified on one side — what a new submission is checked against. */
export function fencedOnSide(assetId: string, side: string): number {
  return liveEffects(assetId)
    .filter((effect) => effect.effect_type === 'site_setup' && effect.detail.kind === 'fencing' && effect.detail.side === side && effect.detail.work_type !== 'repair')
    .reduce((sum, effect) => sum + effect.quantity, 0);
}

/* -------------------- seed: Aviation City -------------------- */

let seq = 0;
function seed(input: Pick<MockSubmission, 'staff_id' | 'metric_key' | 'status' | 'payload'> & Partial<MockSubmission> & { daysAgo: number }): MockSubmission {
  seq += 1;
  const checked = checkPayload(input.metric_key, input.payload);
  const { daysAgo: age, ...rest } = input;
  const reviewed = input.status === 'verified' || input.status === 'rejected';
  const submission: MockSubmission = {
    id: `66f15b0000000000000000${String(seq).padStart(2, '0')}`,
    asset_id: A1,
    work_date: daysAgo(age),
    quantity: checked.quantity,
    counts_towards_target: checked.counts_towards_target,
    evidence: [{ url: `https://files.abode.test/field/evidence-${seq}.jpg`, kind: 'photo', caption: null }],
    plot_ids: [],
    amount_spent: null,
    vendor: null,
    payment_reference: null,
    receipts: [],
    note: null,
    warnings: [],
    warning_acknowledgement: null,
    revision: 1,
    submitted_at: daysAgo(age),
    reviewed_at: reviewed ? daysAgo(Math.max(0, age - 1)) : null,
    review_note: null,
    correction_reason: null,
    reversal_reason: null,
    created_at: daysAgo(age),
    ...rest,
  };
  submissions.push(submission);
  if (submission.status === 'verified') writeEffects(submission);
  return submission;
}

const [siteManager, surveyor] = fieldStaff;

// Verified work, so the site has real progress to show.
seed({
  staff_id: siteManager.id,
  metric_key: 'fencing_new_metres',
  status: 'verified',
  daysAgo: 12,
  payload: { side: 'front', metres: 180, work_type: 'new', start_reference: 'Gate post', end_reference: 'North-east corner' },
  amount_spent: 1_350_000,
  vendor: 'Lekki Fencing Co.',
  payment_reference: 'TRF-88213',
  receipts: [{ url: 'https://files.abode.test/field/receipt-1.pdf', caption: 'Blocks and labour', reference: 'INV-4471', amount: 1_350_000 }],
});
seed({
  staff_id: surveyor.id,
  metric_key: 'clearing_sqm',
  status: 'verified',
  daysAgo: 9,
  payload: { mapping: 'unmapped', actual_sqm: 5000, coverage: 'full', description: 'Strip behind Block A, from the road to the stream', markers: 'Red pegs at each corner' },
  amount_spent: 1_800_000,
  vendor: 'GreenClear Ltd',
});
// Waiting for review.
seed({
  staff_id: siteManager.id,
  metric_key: 'fencing_new_metres',
  status: 'submitted',
  daysAgo: 2,
  payload: { side: 'right', metres: 95, work_type: 'new' },
  amount_spent: 700_000,
  vendor: 'Lekki Fencing Co.',
  // The receipts add up to less than the amount claimed — the backend warns on that.
  receipts: [{ url: 'https://files.abode.test/field/receipt-3.pdf', caption: null, reference: 'INV-4502', amount: 640_000 }],
});
seed({
  staff_id: surveyor.id,
  metric_key: 'boundary_metres',
  status: 'submitted',
  daysAgo: 1,
  payload: { metres: 640, references: 'Survey plan LS/2026/114', proposed_sides: { front: 420.5, right: 300, back: 420.5, left: 300 } },
});
seed({
  staff_id: siteManager.id,
  metric_key: 'fencing_new_metres',
  status: 'rejected',
  daysAgo: 6,
  payload: { side: 'back', metres: 40, work_type: 'repair' },
  review_note: 'The photos do not show the repaired section',
});
seed({
  staff_id: siteManager.id,
  metric_key: 'fencing_new_metres',
  status: 'submitted',
  daysAgo: 3,
  payload: { side: 'left', metres: 30, work_type: 'repair', note: 'Storm damage near the stream' },
});
