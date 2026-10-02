import { MockHttpError, type MockRoutes } from '../router';
import { assetPlots, findActiveAsset, type MockAsset } from './assets';
import { allocationEventForField } from './company-events';
import {
  activeAssignment,
  approveBoundary,
  assignments,
  checkPayload,
  currentBoundary,
  effects,
  fencedOnSide,
  fieldStaff,
  liveEffects,
  reverseEffects,
  round2,
  submissions,
  unitFor,
  writeEffects,
  type MockAssignment,
  type MockFieldStaff,
  type MockSubmission,
  type Sides,
} from './field-store';
import { body, paged } from './util';

/* ============================================================
 * Field operations — the rest of `abode-be-v2`'s field-staff module that the
 * Site Setup tab uses: the submission review queue, field costs, who covers
 * a site, the month's scores, and allocation-event ownership.
 *
 * All of these are REAL endpoints; this file exists for offline and test
 * parity. Status rules, warnings and error codes follow
 * `FieldVerificationService` and `FieldAllocationService`. Monthly targets
 * are fixed here, since scorecards (their real source) are not modelled.
 * ============================================================ */

const METRIC_LABELS: Record<string, string> = {
  fencing_new_metres: 'New fencing',
  allocation_customers: 'Customers allocated on the ground',
  parcelation_plots: 'Plots parcelled',
  clearing_sqm: 'Land cleared',
  boundary_metres: 'Boundary established',
};

function requireAsset(assetId: string): MockAsset {
  const row = findActiveAsset(assetId);
  if (!row) throw new MockHttpError(404, 'Asset not found', 'FIELD_SITE_NOT_FOUND');
  return row;
}

const staffById = (id: string) => fieldStaff.find((row) => row.id === id);
const fullName = (staff: MockFieldStaff) => `${staff.first_name} ${staff.last_name}`.trim();

/** `describeWork()`. */
function describeWork(submission: MockSubmission): string {
  const payload = submission.payload;
  switch (submission.metric_key) {
    case 'fencing_new_metres':
      return `${payload.metres}m ${payload.work_type === 'repair' ? 'repaired' : 'new fencing on'} the ${payload.side} side`;
    case 'parcelation_plots': {
      const count = Array.isArray(payload.plot_ids) ? payload.plot_ids.length : 0;
      return `${count} plot${count === 1 ? '' : 's'} ${payload.is_rework ? 're-pegged' : 'pegged out'}`;
    }
    case 'clearing_sqm':
      return `${payload.actual_sqm} sqm cleared (${payload.mapping})`;
    default:
      return `${payload.metres}m of boundary established`;
  }
}

/** `presentSubmission()`. */
function presentSubmission(row: MockSubmission) {
  const staff = staffById(row.staff_id);
  const asset = findActiveAsset(row.asset_id);
  const priced = row.receipts.filter((receipt) => typeof receipt.amount === 'number');
  const workDate = new Date(row.work_date);
  return {
    id: row.id,
    field_staff: staff ? { id: staff.id, full_name: fullName(staff), email: staff.email } : null,
    asset: asset ? { id: row.asset_id, name: asset.name } : null,
    staff_type: staff?.staff_type ?? 'site_manager',
    metric_key: row.metric_key,
    metric_label: METRIC_LABELS[row.metric_key],
    summary: describeWork(row),
    year: workDate.getUTCFullYear(),
    month: workDate.getUTCMonth() + 1,
    work_date: row.work_date,
    status: row.status,
    quantity: row.quantity,
    unit: unitFor(row.metric_key),
    counts_towards_target: row.counts_towards_target,
    payload: row.payload,
    evidence: row.evidence,
    plot_ids: row.plot_ids,
    amount_spent: row.amount_spent,
    vendor: row.vendor,
    payment_reference: row.payment_reference,
    receipts: row.receipts,
    receipt_url: row.receipts[0]?.url ?? null,
    receipts_total: priced.length ? round2(priced.reduce((sum, receipt) => sum + (receipt.amount as number), 0)) : null,
    note: row.note,
    warnings: row.warnings,
    warning_acknowledgement: row.warning_acknowledgement,
    revision: row.revision,
    scorecard_id: null,
    submitted_at: row.submitted_at,
    reviewed_at: row.reviewed_at,
    review_note: row.review_note,
    correction_reason: row.correction_reason,
    reversal_reason: row.reversal_reason,
    created_at: row.created_at,
  };
}

/** `warningsFor()` — worked out fresh each time, exactly as the real service does. */
function warningsFor(row: MockSubmission): string[] {
  const warnings: string[] = [];

  const duplicates = submissions.filter(
    (other) =>
      other.id !== row.id &&
      other.asset_id === row.asset_id &&
      other.metric_key === row.metric_key &&
      other.quantity === row.quantity &&
      other.work_date.slice(0, 10) === row.work_date.slice(0, 10) &&
      (other.status === 'submitted' || other.status === 'verified')
  );
  if (duplicates.length) {
    warnings.push(`${duplicates.length} other submission(s) record the same amount of the same work on this day`);
  }

  if (row.amount_spent && row.receipts.length && row.receipts.every((receipt) => typeof receipt.amount === 'number')) {
    const total = round2(row.receipts.reduce((sum, receipt) => sum + (receipt.amount as number), 0));
    const claimed = round2(row.amount_spent);
    if (total !== claimed) {
      warnings.push(`The ${row.receipts.length} receipt(s) add up to ${total}, but the amount spent is recorded as ${claimed}`);
    }
  }

  if (row.metric_key === 'fencing_new_metres' && row.payload.work_type === 'new') {
    const boundary = currentBoundary(row.asset_id);
    if (!boundary) {
      warnings.push('This estate has no approved boundary to check fencing against');
    } else {
      const side = String(row.payload.side) as keyof Sides;
      const sideLength = boundary.sides[side];
      const total = fencedOnSide(row.asset_id, side) + Number(row.payload.metres ?? 0);
      if (sideLength > 0 && total > sideLength) {
        warnings.push(
          `Fencing on the ${side} side would reach ${total}m, which is ${round2(total - sideLength)}m more than the approved ${sideLength}m`
        );
      }
    }
  }

  if (row.metric_key === 'parcelation_plots' && row.payload.is_rework) {
    warnings.push('This is re-work, so it does not count towards the monthly target');
  }

  return warnings;
}

function load(id: string): MockSubmission {
  const row = submissions.find((candidate) => candidate.id === id);
  if (!row) throw new MockHttpError(404, 'Submission not found', 'SUBMISSION_NOT_FOUND');
  return row;
}

function requireReason(raw: unknown): string {
  const reason = String(body<{ reason?: string }>(raw).reason ?? '').trim();
  if (!reason) throw new MockHttpError(400, 'A reason is required', 'VALIDATION_FAILED');
  return reason;
}

function plotsOf(assetId: string, plotIds: string[]) {
  return assetPlots(assetId).filter((plot) => plotIds.includes(plot._id));
}

/* -------------------- scores -------------------- */

/** Stand-ins for a published scorecard: the month's targets per staff type. Weights add up to 100. */
const TARGETS: Record<MockFieldStaff['staff_type'], { metric_key: string; target: number; weight: number; unit: string }[]> = {
  site_manager: [{ metric_key: 'fencing_new_metres', target: 600, weight: 100, unit: 'metres' }],
  surveyor: [
    { metric_key: 'clearing_sqm', target: 20_000, weight: 50, unit: 'sqm' },
    { metric_key: 'parcelation_plots', target: 40, weight: 30, unit: 'plots' },
    { metric_key: 'boundary_metres', target: 1_000, weight: 20, unit: 'metres' },
  ],
};

const inMonth = (iso: string, year: number, month: number) => {
  const date = new Date(iso);
  return date.getUTCFullYear() === year && date.getUTCMonth() + 1 === month;
};

function workerPerformance(staff: MockFieldStaff, assetId: string, assetName: string, year: number, month: number) {
  const metrics = TARGETS[staff.staff_type].map((target) => {
    const verifiedRows = liveEffects(assetId).filter(
      (effect) =>
        effect.effect_type === 'performance_actual' &&
        effect.staff_id === staff.id &&
        effect.metric_key === target.metric_key &&
        effect.counts_towards_target &&
        inMonth(effect.work_date, year, month)
    );
    const pendingRows = submissions.filter(
      (row) =>
        row.status === 'submitted' &&
        row.staff_id === staff.id &&
        row.asset_id === assetId &&
        row.metric_key === target.metric_key &&
        inMonth(row.work_date, year, month)
    );
    const verified = round2(verifiedRows.reduce((sum, effect) => sum + effect.quantity, 0));
    const pending = round2(pendingRows.reduce((sum, row) => sum + row.quantity, 0));
    const score = (quantity: number) => round2(Math.min(1, quantity / target.target) * target.weight);

    return {
      metric_key: target.metric_key,
      label: METRIC_LABELS[target.metric_key],
      unit: target.unit,
      target: target.target,
      weight: target.weight,
      verified,
      pending,
      uncapped_achievement_pct: round2((verified / target.target) * 100),
      achievement_pct: round2(Math.min(100, (verified / target.target) * 100)),
      earned_score: score(verified),
      verified_submissions: verifiedRows.length,
      pending_submissions: pendingRows.length,
      last_work_date: verifiedRows.map((effect) => effect.work_date).sort().at(-1) ?? null,
      weekly: [],
      projected_score: score(verified + pending),
      projected_achievement_pct: round2(Math.min(100, ((verified + pending) / target.target) * 100)),
    };
  });

  const total = round2(metrics.reduce((sum, metric) => sum + metric.earned_score, 0));
  const projected = round2(metrics.reduce((sum, metric) => sum + metric.projected_score, 0));

  return {
    field_staff: { id: staff.id, full_name: fullName(staff), email: staff.email, staff_type: staff.staff_type },
    year,
    month,
    month_label: monthLabel(year, month),
    allocation_events: [],
    scorecards: [
      {
        scorecard_id: `66f15c0000000000${staff.id.slice(-4)}${String(month).padStart(2, '0')}00`,
        asset: { id: assetId, name: assetName },
        state: 'published',
        scorecard_state: 'published',
        target_version: 1,
        is_restatement: false,
        metrics,
        score: total,
        projected_score: projected,
      },
    ],
    sites_without_targets: [],
    metrics,
    total_score: total,
    projected_score: projected,
    pending_submissions: metrics.reduce((sum, metric) => sum + metric.pending_submissions, 0),
  };
}

const monthLabel = (year: number, month: number) =>
  new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });

/** `presentAssignment()`. */
function presentAssignment(row: MockAssignment) {
  const staff = staffById(row.staff_id);
  const asset = findActiveAsset(row.asset_id);
  const now = Date.now();
  const started = new Date(row.starts_on).getTime() <= now;
  const ended = row.ends_on ? new Date(row.ends_on).getTime() <= now : false;
  return {
    id: row.id,
    asset: asset ? { id: row.asset_id, name: asset.name } : { id: row.asset_id, name: null },
    field_staff: staff ? { id: staff.id, full_name: fullName(staff), email: staff.email } : null,
    staff_type: staff?.staff_type ?? 'site_manager',
    responsibility: row.responsibility,
    status: ended ? 'ended' : 'active',
    starts_on: row.starts_on,
    ends_on: row.ends_on,
    is_active: started && !ended,
    note: row.note,
    end_reason: row.end_reason,
  };
}

/* -------------------- allocation events on the ground -------------------- */

const owners: Record<string, { staff_id: string; note: string | null }> = {};

/** `FieldAllocationService.figuresFor()`. A confirmed allocation stands in for a confirmed ground scan. */
function figuresFor(eventId: string) {
  const found = allocationEventForField(eventId);
  if (!found) throw new MockHttpError(404, 'Allocation event not found', 'ALLOCATION_EVENT_NOT_FOUND');
  const { event, allocations } = found;
  const confirmed = allocations.filter((row) => row.status === 'confirmed');
  const customers = (rows: typeof allocations) => new Set(rows.map((row) => row.user_id)).size;
  const sqm = (rows: typeof allocations) => round2(rows.reduce((sum, row) => sum + row.size_reserved, 0));
  const owner = owners[eventId] ? staffById(owners[eventId].staff_id) : undefined;

  return {
    asset_id: event.asset_id,
    event: { id: event.id, title: event.title, starts_at: event.starts_at, status: event.status },
    // This mock's allocations are not tied to plots, so plot counts are zero, as they are
    // on the real backend for a plan with no plot attached yet.
    expected: { customers: customers(allocations), plans: allocations.length, plots: 0, sqm: sqm(allocations) },
    confirmed: { customers: customers(confirmed), plans: confirmed.length, plots: 0, sqm: sqm(confirmed) },
    outstanding: {
      customers: Math.max(0, customers(allocations) - customers(confirmed)),
      plans: Math.max(0, allocations.length - confirmed.length),
    },
    completion_pct: allocations.length ? round2((confirmed.length / allocations.length) * 100) : null,
    owner: owner ? { id: owner.id, full_name: fullName(owner) } : null,
  };
}

export const fieldOperationsRoutes: MockRoutes = {
  /* ---- the review queue ---- */

  'GET /admin/field-submissions': ({ query }) => {
    const rows = submissions
      .filter((row) => !query.asset_id || row.asset_id === String(query.asset_id))
      .filter((row) => !query.status || row.status === String(query.status))
      .filter((row) => !query.metric_key || row.metric_key === String(query.metric_key))
      .filter((row) => !query.field_staff_id || row.staff_id === String(query.field_staff_id))
      .sort((a, b) => new Date(b.work_date).getTime() - new Date(a.work_date).getTime())
      .map(presentSubmission);
    return paged(rows, query);
  },

  'GET /admin/field-submissions/:id': ({ params }) => {
    const row = load(params.id);
    return {
      submission: presentSubmission(row),
      plots: plotsOf(row.asset_id, row.plot_ids).map((plot) => ({
        id: plot._id,
        label: `${plot.block_label}-${plot.plot_number}`,
        size_sqm: plot.size,
      })),
      warnings: warningsFor(row),
      effects: effects
        .filter((effect) => effect.submission_id === row.id)
        .map((effect) => ({
          effect_type: effect.effect_type,
          quantity: effect.quantity,
          amount: effect.amount,
          revision: effect.revision,
          is_reversed: effect.is_reversed,
        })),
    };
  },

  'POST /admin/field-submissions/:id/verify': ({ params, body: raw }) => {
    const row = load(params.id);
    const dto = body<{ revision?: number; acknowledgement?: string; accept_proposed_boundary?: boolean; note?: string }>(raw);

    if (row.status === 'verified') return presentSubmission(row);
    if (row.status !== 'submitted') {
      throw new MockHttpError(409, 'This submission has already been reviewed', 'SUBMISSION_ALREADY_REVIEWED');
    }
    if (dto.revision !== undefined && dto.revision !== row.revision) {
      throw new MockHttpError(409, 'This submission changed while you were reviewing it', 'SUBMISSION_STALE');
    }
    if (!activeAssignment(row.staff_id, row.asset_id, row.work_date)) {
      throw new MockHttpError(400, 'This worker did not cover that site on the work date', 'FIELD_SITE_NOT_ASSIGNED');
    }
    const checked = checkPayload(row.metric_key, row.payload);
    if (checked.issues.length) throw new MockHttpError(400, checked.issues.join('; '), 'SUBMISSION_INVALID');

    const warnings = warningsFor(row);
    if (warnings.length && !dto.acknowledgement?.trim()) {
      throw new MockHttpError(400, 'This submission carries a warning that must be acknowledged', 'SUBMISSION_WARNING_UNACKNOWLEDGED');
    }

    let boundaryAccepted = false;
    const proposed = row.payload.proposed_sides as Partial<Sides> | undefined;
    if (dto.accept_proposed_boundary && row.metric_key === 'boundary_metres' && proposed) {
      const current = currentBoundary(row.asset_id);
      approveBoundary(
        row.asset_id,
        {
          front: proposed.front ?? current?.sides.front ?? 0,
          right: proposed.right ?? current?.sides.right ?? 0,
          back: proposed.back ?? current?.sides.back ?? 0,
          left: proposed.left ?? current?.sides.left ?? 0,
        },
        'surveyor_submission',
        'Accepted with a verified surveyor boundary submission',
        row.id
      );
      boundaryAccepted = true;
    }

    Object.assign(row, {
      status: 'verified',
      reviewed_at: new Date().toISOString(),
      review_note: dto.note ?? null,
      warnings,
      warning_acknowledgement: dto.acknowledgement ?? null,
      quantity: checked.quantity,
      counts_towards_target: checked.counts_towards_target,
    });
    const written = writeEffects(row);

    return { submission: presentSubmission(row), effects_written: written, boundary_accepted: boundaryAccepted };
  },

  'POST /admin/field-submissions/:id/reject': ({ params, body: raw }) => {
    const row = load(params.id);
    const reason = requireReason(raw);
    if (row.status !== 'submitted') {
      throw new MockHttpError(409, 'This submission has already been reviewed', 'SUBMISSION_ALREADY_REVIEWED');
    }
    Object.assign(row, { status: 'rejected', reviewed_at: new Date().toISOString(), review_note: reason });
    return presentSubmission(row);
  },

  'POST /admin/field-submissions/:id/correct': ({ params, body: raw }) => {
    const row = load(params.id);
    const reason = requireReason(raw);
    const dto = body<{ payload?: Record<string, unknown>; amount_spent?: number }>(raw);
    if (row.status !== 'verified') {
      throw new MockHttpError(409, 'Only a verified submission can be corrected', 'SUBMISSION_NOT_VERIFIED');
    }
    const payload = dto.payload ?? row.payload;
    const checked = checkPayload(row.metric_key, payload);
    if (checked.issues.length) throw new MockHttpError(400, checked.issues.join('; '), 'SUBMISSION_INVALID');

    reverseEffects(row.id);
    // The status stays `verified`: the real service records the correction on the row, not as a new status.
    Object.assign(row, {
      payload,
      quantity: checked.quantity,
      counts_towards_target: checked.counts_towards_target,
      amount_spent: dto.amount_spent ?? row.amount_spent,
      revision: row.revision + 1,
      correction_reason: reason,
    });
    writeEffects(row);
    return presentSubmission(row);
  },

  'POST /admin/field-submissions/:id/reverse': ({ params, body: raw }) => {
    const row = load(params.id);
    const reason = requireReason(raw);
    if (row.status === 'reversed') {
      throw new MockHttpError(409, 'This submission has already been reversed', 'SUBMISSION_ALREADY_REVERSED');
    }
    if (row.status !== 'verified') {
      throw new MockHttpError(409, 'Only a verified submission can be reversed', 'SUBMISSION_NOT_VERIFIED');
    }
    reverseEffects(row.id);
    Object.assign(row, { status: 'reversed', reversal_reason: reason });
    return presentSubmission(row);
  },

  'POST /admin/field-submissions/:id/link-plots': ({ params, body: raw }) => {
    const row = load(params.id);
    const dto = body<{ plot_ids?: string[]; note?: string }>(raw);
    if (row.metric_key !== 'clearing_sqm' || row.payload.mapping !== 'unmapped') {
      throw new MockHttpError(400, 'Only unmapped clearing can have plots linked to it', 'SUBMISSION_NOT_UNMAPPED');
    }
    const ids = dto.plot_ids ?? [];
    if (ids.length === 0 || plotsOf(row.asset_id, ids).length !== ids.length) {
      throw new MockHttpError(400, 'One or more plots do not belong to this estate', 'SUBMISSION_PLOTS_INVALID');
    }

    row.plot_ids = ids;
    row.payload = { ...row.payload, mapping: 'mapped', linked_note: dto.note ?? null };
    for (const effect of effects) {
      if (effect.submission_id !== row.id || effect.is_reversed || effect.effect_type !== 'plot_history') continue;
      effect.plot_ids = ids;
      effect.detail = { ...effect.detail, mapping: 'mapped', sqm_per_plot: round2(effect.quantity / ids.length) };
    }
    return presentSubmission(row);
  },

  /* ---- costs, people, scores ---- */

  'GET /admin/assets/:assetId/field-costs': ({ params }) => {
    const asset = requireAsset(params.assetId);
    const costs = liveEffects(params.assetId)
      .filter((effect) => effect.effect_type === 'asset_cost')
      .sort((a, b) => new Date(b.work_date).getTime() - new Date(a.work_date).getTime());
    const byCategory = new Map<string, number>();
    for (const effect of costs) {
      const category = String(effect.detail.cost_category ?? 'site_works');
      byCategory.set(category, (byCategory.get(category) ?? 0) + (effect.amount ?? 0));
    }
    return {
      asset: { id: params.assetId, name: asset.name },
      total_amount: round2(costs.reduce((sum, effect) => sum + (effect.amount ?? 0), 0)),
      by_category: [...byCategory.entries()].map(([category, amount]) => ({ category, amount: round2(amount) })),
      entries: costs.map((effect) => ({
        submission_id: effect.submission_id,
        category: String(effect.detail.cost_category ?? 'site_works'),
        amount: effect.amount ?? 0,
        vendor: effect.detail.vendor ?? null,
        payment_reference: effect.detail.payment_reference ?? null,
        receipts: effect.detail.receipts ?? [],
        work_date: effect.work_date,
      })),
    };
  },

  'GET /admin/assets/:assetId/field-staff': ({ params, query }) => {
    requireAsset(params.assetId);
    const includeEnded = query.include_ended === true || query.include_ended === 'true';
    return assignments
      .filter((row) => row.asset_id === params.assetId)
      .map(presentAssignment)
      .filter((row) => includeEnded || row.status !== 'ended');
  },

  'GET /admin/assets/:assetId/field-performance': ({ params, query }) => {
    const asset = requireAsset(params.assetId);
    const now = new Date();
    const year = Number(query.year) || now.getUTCFullYear();
    const month = Number(query.month) || now.getUTCMonth() + 1;

    const staffIds = [
      ...new Set(
        assignments
          .filter((row) => row.asset_id === params.assetId && (row.ends_on === null || new Date(row.ends_on).getTime() > Date.now()))
          .map((row) => row.staff_id)
      ),
    ];
    const workers = staffIds.flatMap((id) => {
      const staff = staffById(id);
      return staff ? [workerPerformance(staff, params.assetId, asset.name, year, month)] : [];
    });

    return {
      asset: { id: params.assetId, name: asset.name },
      month: monthLabel(year, month),
      year,
      month_number: month,
      workers,
      totals: {
        workers: workers.length,
        average_score: workers.length ? round2(workers.reduce((sum, row) => sum + row.total_score, 0) / workers.length) : 0,
      },
    };
  },

  /* ---- allocation events on the ground ---- */

  'GET /admin/field-allocation/assets/:assetId': ({ params }) => {
    const asset = requireAsset(params.assetId);
    const events = Object.keys(owners)
      .map((eventId) => figuresFor(eventId))
      .filter((figures) => figures.asset_id === params.assetId);
    return { asset: { id: params.assetId, name: asset.name }, events };
  },

  'GET /admin/field-allocation/events/:eventId': ({ params }) => ({
    ...figuresFor(params.eventId),
    note: 'Only a confirmed ground scan counts. Boarding a bus does not.',
  }),

  'PUT /admin/field-allocation/events/:eventId/owner': ({ params, body: raw }) => {
    const found = allocationEventForField(params.eventId);
    if (!found) throw new MockHttpError(404, 'Allocation event not found', 'ALLOCATION_EVENT_NOT_FOUND');
    const dto = body<{ field_staff_id?: string; note?: string }>(raw);
    const staff = staffById(String(dto.field_staff_id ?? ''));
    if (!staff) throw new MockHttpError(404, 'Field worker not found', 'FIELD_STAFF_NOT_FOUND');
    if (staff.staff_type !== 'site_manager') {
      throw new MockHttpError(400, 'Only a site manager can be accountable for an allocation event', 'FIELD_WRONG_STAFF_TYPE');
    }
    if (staff.status === 'disabled') throw new MockHttpError(403, 'This account is disabled', 'FIELD_ACCOUNT_DISABLED');
    if (!activeAssignment(staff.id, found.event.asset_id, found.event.starts_at)) {
      throw new MockHttpError(400, 'This site manager does not cover that estate on the event date', 'FIELD_SITE_NOT_ASSIGNED');
    }

    owners[params.eventId] = { staff_id: staff.id, note: dto.note?.trim() || null };
    return {
      event_id: params.eventId,
      field_staff: { id: staff.id, full_name: fullName(staff), email: staff.email },
      event_starts_at: found.event.starts_at,
      note: owners[params.eventId].note,
    };
  },

  'DELETE /admin/field-allocation/events/:eventId/owner': ({ params }) => {
    if (!owners[params.eventId]) {
      throw new MockHttpError(404, 'This allocation event has no owner', 'ALLOCATION_EVENT_NOT_OWNED');
    }
    delete owners[params.eventId];
    return null;
  },
};
