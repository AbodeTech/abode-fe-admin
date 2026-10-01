import { z } from 'zod';

import { FENCING_SIDES, type FencingSide } from './site-setup.schema';

/* ============================================================
 * Field operations on one estate — everything the Site Setup tab reads and
 * writes beyond the boundary itself. Every shape here is transcribed from
 * `abode-be-v2`'s field-staff module:
 *
 *   GET  /admin/field-submissions?asset_id=        FieldVerificationService.list()
 *   GET  /admin/field-submissions/:id              .getOne()
 *   POST /admin/field-submissions/:id/verify       .verify()
 *   POST /admin/field-submissions/:id/reject       .reject()
 *   POST /admin/field-submissions/:id/correct      .correct()
 *   POST /admin/field-submissions/:id/reverse      .reverse()
 *   POST /admin/field-submissions/:id/link-plots   .linkPlots()
 *   GET  /admin/assets/:assetId/field-costs        SiteSetupService.costs()
 *   GET  /admin/assets/:assetId/field-staff        FieldStaffAdminService.listAssetAssignments()
 *   GET  /admin/assets/:assetId/field-performance  FieldPerformanceService.forAsset()
 *   GET  /admin/field-allocation/assets/:assetId   FieldAllocationService.forAsset()
 *   GET  /admin/field-allocation/events/:eventId   .eventReport()
 *   PUT / DELETE /admin/field-allocation/events/:eventId/owner
 *
 * Field workers record work in their own app; an admin reviews it here.
 * Only verified work counts — towards site progress, the worker's score and
 * the estate's costs.
 * ============================================================ */

/* -------------------- submissions -------------------- */

export const FIELD_METRIC_KEYS = [
  'fencing_new_metres',
  'allocation_customers',
  'parcelation_plots',
  'clearing_sqm',
  'boundary_metres',
] as const;
export type FieldMetricKey = (typeof FIELD_METRIC_KEYS)[number];

export const SUBMISSION_STATUSES = [
  'draft',
  'submitted',
  'verified',
  'rejected',
  'withdrawn',
  'corrected',
  'reversed',
] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  draft: 'Draft',
  submitted: 'Awaiting review',
  verified: 'Verified',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
  corrected: 'Corrected',
  reversed: 'Reversed',
};

const PersonSchema = z.object({
  id: z.string(),
  full_name: z.string().nullable(),
  email: z.string().nullable().optional(),
});

const ReceiptSchema = z.object({
  url: z.string(),
  caption: z.string().nullable(),
  reference: z.string().nullable(),
  amount: z.number().nullable(),
});

/** One row of the review queue — `presentSubmission()`. `payload` differs per metric. */
export const FieldSubmissionSchema = z.object({
  id: z.string(),
  field_staff: PersonSchema.nullable(),
  asset: z.object({ id: z.string(), name: z.string().nullable() }).nullable(),
  staff_type: z.string(),
  metric_key: z.string(),
  metric_label: z.string(),
  summary: z.string(),
  year: z.number(),
  month: z.number(),
  work_date: z.string().nullable(),
  status: z.enum(SUBMISSION_STATUSES),
  quantity: z.number(),
  unit: z.string().nullable(),
  counts_towards_target: z.boolean(),
  payload: z.record(z.string(), z.unknown()),
  evidence: z.array(z.object({ url: z.string(), kind: z.string(), caption: z.string().nullable() })),
  plot_ids: z.array(z.string()),
  amount_spent: z.number().nullable(),
  vendor: z.string().nullable(),
  payment_reference: z.string().nullable(),
  receipts: z.array(ReceiptSchema),
  receipt_url: z.string().nullable(),
  receipts_total: z.number().nullable(),
  note: z.string().nullable(),
  warnings: z.array(z.string()),
  warning_acknowledgement: z.string().nullable(),
  revision: z.number(),
  scorecard_id: z.string().nullable(),
  submitted_at: z.string().nullable(),
  reviewed_at: z.string().nullable(),
  review_note: z.string().nullable(),
  correction_reason: z.string().nullable(),
  reversal_reason: z.string().nullable(),
  created_at: z.string().nullable(),
});
export type FieldSubmission = z.infer<typeof FieldSubmissionSchema>;

/** GET /admin/field-submissions/:id — the submission plus what a reviewer needs to decide. */
export const FieldSubmissionDetailSchema = z.object({
  submission: FieldSubmissionSchema,
  plots: z.array(z.object({ id: z.string(), label: z.string(), size_sqm: z.number() })),
  /** Worked out fresh on every read; the reviewer must acknowledge these to verify. */
  warnings: z.array(z.string()),
  /** What verifying wrote: site progress, plot history, the worker's score, a cost. */
  effects: z.array(
    z.object({
      effect_type: z.string(),
      quantity: z.number().nullable().optional(),
      amount: z.number().nullable(),
      revision: z.number(),
      is_reversed: z.boolean().optional(),
    })
  ),
});
export type FieldSubmissionDetail = z.infer<typeof FieldSubmissionDetailSchema>;

/**
 * POST .../verify answers in two shapes: the usual `{submission, effects_written,
 * boundary_accepted}`, or the bare submission when it was already verified.
 */
export const VerifySubmissionResultSchema = z.union([
  z.object({
    submission: FieldSubmissionSchema,
    effects_written: z.array(z.string()),
    boundary_accepted: z.boolean(),
  }),
  FieldSubmissionSchema,
]);

/** `effect_type` on the backend's field effects (`prepareEffects()`). */
export const EFFECT_LABELS: Record<string, string> = {
  performance_actual: 'Worker score',
  site_setup: 'Site progress',
  plot_history: 'Plot history',
  asset_cost: 'Estate cost',
  audit_timeline: 'Asset history',
};

export type SubmissionAction = 'verify' | 'reject' | 'correct' | 'reverse' | 'link_plots';

/**
 * What the backend will accept for a submission in this state. Verify and
 * reject need `submitted`; correct and reverse need `verified`. Linking plots
 * is only for clearing recorded as an unmapped area.
 */
export function submissionActions(submission: Pick<FieldSubmission, 'status' | 'metric_key' | 'payload'>): SubmissionAction[] {
  const actions: SubmissionAction[] = [];
  if (submission.status === 'submitted') actions.push('verify', 'reject');
  if (submission.status === 'verified') actions.push('correct', 'reverse');
  const unmapped = submission.metric_key === 'clearing_sqm' && submission.payload.mapping === 'unmapped';
  if (unmapped && (submission.status === 'submitted' || submission.status === 'verified')) actions.push('link_plots');
  return actions;
}

/** The sides a surveyor proposed alongside a boundary submission, if any. */
export function proposedSides(submission: Pick<FieldSubmission, 'metric_key' | 'payload'>): Partial<Record<FencingSide, number>> | null {
  if (submission.metric_key !== 'boundary_metres') return null;
  const raw = submission.payload.proposed_sides;
  if (!raw || typeof raw !== 'object') return null;
  const sides: Partial<Record<FencingSide, number>> = {};
  for (const side of FENCING_SIDES) {
    const value = (raw as Record<string, unknown>)[side];
    if (typeof value === 'number') sides[side] = value;
  }
  return Object.keys(sides).length > 0 ? sides : null;
}

/* ---- review forms ---- */

/** `VerifySubmissionDto`. The acknowledgement is required only when there are warnings. */
export const verifySubmissionFormSchema = (hasWarnings: boolean) =>
  z.object({
    acknowledgement: hasWarnings
      ? z.string().trim().min(1, 'Say why this is being verified despite the warning').max(500)
      : z.string().trim().max(500).optional(),
    accept_proposed_boundary: z.boolean().optional(),
    note: z.string().trim().max(500).optional(),
  });
export type VerifySubmissionFormValues = z.infer<ReturnType<typeof verifySubmissionFormSchema>>;

/** `RejectSubmissionDto` and `ReverseSubmissionDto` — both are one required reason. */
export const submissionReasonFormSchema = z.object({
  reason: z.string().trim().min(1, 'A reason is required').max(500),
});
export type SubmissionReasonFormValues = z.infer<typeof submissionReasonFormSchema>;

/**
 * The corrected figures, as the form holds them. Which fields apply depends on
 * the metric; the rest are left `undefined`.
 */
export const correctSubmissionFormSchema = z.object({
  reason: z.string().trim().min(1, 'A reason is required').max(500),
  metres: z.number().positive('Must be above zero').optional(),
  side: z.enum(FENCING_SIDES).optional(),
  work_type: z.enum(['new', 'repair']).optional(),
  actual_sqm: z.number().positive('Must be above zero').optional(),
  coverage: z.enum(['full', 'partial']).optional(),
  amount_spent: z.number().min(0).optional(),
});
export type CorrectSubmissionFormValues = z.infer<typeof correctSubmissionFormSchema>;

/** The figures of a submission that this screen lets a reviewer correct. */
export const CORRECTABLE_FIELDS: Record<string, readonly (keyof CorrectSubmissionFormValues)[]> = {
  fencing_new_metres: ['metres', 'side', 'work_type'],
  clearing_sqm: ['actual_sqm', 'coverage'],
  boundary_metres: ['metres'],
  // The backend keeps the plots a verified parcelation was written against, so
  // changing the plot list here would not move them. Only the cost can change.
  parcelation_plots: [],
};

/** Seeds the correction form from what is on the submission now. */
export function correctionDefaults(submission: FieldSubmission): CorrectSubmissionFormValues {
  const payload = submission.payload;
  const number = (value: unknown) => (typeof value === 'number' ? value : undefined);
  return {
    reason: '',
    metres: number(payload.metres),
    side: FENCING_SIDES.find((side) => side === payload.side),
    work_type: payload.work_type === 'new' || payload.work_type === 'repair' ? payload.work_type : undefined,
    actual_sqm: number(payload.actual_sqm),
    coverage: payload.coverage === 'full' || payload.coverage === 'partial' ? payload.coverage : undefined,
    amount_spent: submission.amount_spent ?? undefined,
  };
}

/**
 * `CorrectSubmissionDto`. The backend replaces the whole payload, so the
 * corrected fields are laid over the existing one. `payload` and
 * `amount_spent` are sent only when they actually differ; with neither, the
 * correction is refused here rather than writing a revision that changes
 * nothing.
 */
export function buildCorrection(
  submission: FieldSubmission,
  values: CorrectSubmissionFormValues
): { reason: string; payload?: Record<string, unknown>; amount_spent?: number } | { error: string } {
  const fields = CORRECTABLE_FIELDS[submission.metric_key] ?? [];
  const changed: Record<string, unknown> = {};
  for (const field of fields) {
    const next = values[field];
    if (next !== undefined && next !== submission.payload[field]) changed[field] = next;
  }

  const amountChanged = values.amount_spent !== undefined && values.amount_spent !== (submission.amount_spent ?? undefined);
  if (Object.keys(changed).length === 0 && !amountChanged) {
    return { error: 'Change at least one figure before saving a correction' };
  }

  return {
    reason: values.reason.trim(),
    ...(Object.keys(changed).length > 0 ? { payload: { ...submission.payload, ...changed } } : {}),
    ...(amountChanged ? { amount_spent: values.amount_spent } : {}),
  };
}

/** `LinkPlotsDto`. */
export const linkPlotsFormSchema = z.object({
  plot_ids: z.array(z.string()).min(1, 'Pick at least one plot'),
  note: z.string().trim().max(300).optional(),
});
export type LinkPlotsFormValues = z.infer<typeof linkPlotsFormSchema>;

/* -------------------- field costs -------------------- */

/** GET .../field-costs — what verified field work has cost, by category and entry by entry. */
export const FieldCostsSchema = z.object({
  asset: z.object({ id: z.string(), name: z.string() }),
  total_amount: z.number(),
  by_category: z.array(z.object({ category: z.string(), amount: z.number() })),
  entries: z.array(
    z.object({
      submission_id: z.string(),
      category: z.string(),
      amount: z.number(),
      vendor: z.string().nullable(),
      payment_reference: z.string().nullable(),
      receipts: z.array(
        z.object({
          url: z.string(),
          caption: z.string().nullable().optional(),
          reference: z.string().nullable().optional(),
          amount: z.number().nullable().optional(),
        })
      ),
      work_date: z.string().nullable(),
    })
  ),
});
export type FieldCosts = z.infer<typeof FieldCostsSchema>;

/** `site_works` → "Site works". The backend sends category keys, not labels. */
export const categoryLabel = (category: string) =>
  category.charAt(0).toUpperCase() + category.slice(1).replace(/_/g, ' ');

/* -------------------- who covers this site -------------------- */

export const FIELD_STAFF_TYPE_LABELS: Record<string, string> = {
  site_manager: 'Site manager',
  surveyor: 'Surveyor',
};

/** One row of GET .../field-staff — `presentAssignment()`. */
export const FieldAssignmentSchema = z.object({
  id: z.string(),
  asset: z.object({ id: z.string(), name: z.string().nullable() }).nullable(),
  field_staff: PersonSchema.nullable(),
  staff_type: z.string(),
  responsibility: z.string(),
  status: z.string(),
  starts_on: z.string().nullable(),
  ends_on: z.string().nullable(),
  is_active: z.boolean(),
  note: z.string().nullable(),
  end_reason: z.string().nullable(),
});
export type FieldAssignment = z.infer<typeof FieldAssignmentSchema>;

/* -------------------- this month on this site -------------------- */

const MetricPerformanceSchema = z.object({
  metric_key: z.string(),
  label: z.string(),
  unit: z.string().nullable(),
  target: z.number(),
  weight: z.number(),
  verified: z.number(),
  pending: z.number(),
  achievement_pct: z.number().nullable(),
  earned_score: z.number(),
  verified_submissions: z.number(),
  pending_submissions: z.number(),
  last_work_date: z.string().nullable(),
});

const ScorecardViewSchema = z.object({
  scorecard_id: z.string().nullable(),
  asset: z.object({ id: z.string(), name: z.string().nullable() }),
  state: z.string(),
  scorecard_state: z.string(),
  metrics: z.array(MetricPerformanceSchema),
  score: z.number(),
  projected_score: z.number(),
});

const WorkerPerformanceSchema = z.object({
  field_staff: z.object({
    id: z.string(),
    full_name: z.string(),
    email: z.string().nullable().optional(),
    staff_type: z.string(),
  }),
  scorecards: z.array(ScorecardViewSchema),
  sites_without_targets: z.array(z.unknown()),
  total_score: z.number(),
  projected_score: z.number(),
  pending_submissions: z.number(),
});
export type WorkerPerformance = z.infer<typeof WorkerPerformanceSchema>;

/** GET .../field-performance — everyone working this site in one month. */
export const AssetFieldPerformanceSchema = z.object({
  asset: z.object({ id: z.string(), name: z.string() }),
  /** The month's label, e.g. "October 2026". */
  month: z.string(),
  year: z.number(),
  month_number: z.number(),
  workers: z.array(WorkerPerformanceSchema),
  totals: z.object({ workers: z.number(), average_score: z.number() }),
});
export type AssetFieldPerformance = z.infer<typeof AssetFieldPerformanceSchema>;

/**
 * A worker's score on this site, or `null` when no targets were set for the
 * month. The backend reports 0 in that case, which reads as "scored nothing";
 * it really means there is nothing to score against.
 */
export function workerScore(worker: WorkerPerformance): { score: number; projected: number } | null {
  if (worker.scorecards.length === 0) return null;
  return { score: worker.total_score, projected: worker.projected_score };
}

/** The site's average across workers who have targets — `null` when none do. */
export function averageScore(workers: WorkerPerformance[]): number | null {
  const scored = workers.map(workerScore).filter((row) => row !== null);
  if (scored.length === 0) return null;
  return Math.round((scored.reduce((sum, row) => sum + row.score, 0) / scored.length) * 100) / 100;
}

/* -------------------- allocation events on the ground -------------------- */

const CountsSchema = z.object({ customers: z.number(), plans: z.number(), plots: z.number(), sqm: z.number() });

/** `EventAllocationFigures` — expected against confirmed by a ground scan, for one event. */
export const EventAllocationFiguresSchema = z.object({
  asset_id: z.string(),
  event: z.object({
    id: z.string(),
    title: z.string().nullable(),
    starts_at: z.string().nullable(),
    status: z.string().nullable(),
  }),
  expected: CountsSchema,
  confirmed: CountsSchema,
  outstanding: z.object({ customers: z.number(), plans: z.number() }),
  /** `null` when nobody has been allocated to the event yet. */
  completion_pct: z.number().nullable(),
  owner: z.object({ id: z.string(), full_name: z.string().nullable() }).nullable(),
  /** Only on the single-event report. */
  note: z.string().optional(),
});
export type EventAllocationFigures = z.infer<typeof EventAllocationFiguresSchema>;

/** GET /admin/field-allocation/assets/:assetId — only events that have an owner. */
export const AssetFieldAllocationSchema = z.object({
  asset: z.object({ id: z.string(), name: z.string() }),
  events: z.array(EventAllocationFiguresSchema),
});

/** PUT .../events/:eventId/owner. */
export const AssignEventOwnerResultSchema = z.object({
  event_id: z.string(),
  field_staff: z.object({ id: z.string(), full_name: z.string(), email: z.string().nullable().optional() }),
  event_starts_at: z.string(),
  note: z.string().nullable(),
});

export const assignEventOwnerFormSchema = z.object({
  field_staff_id: z.string().min(1, 'Pick a site manager'),
  note: z.string().trim().max(300).optional(),
});
export type AssignEventOwnerFormValues = z.infer<typeof assignEventOwnerFormSchema>;

/**
 * Who can be made accountable for an event: a site manager whose assignment
 * to this site covers the event date. The backend refuses anyone else, so the
 * picker only offers these.
 */
export function eligibleEventOwners(assignments: FieldAssignment[], eventStartsAt: string | null): FieldAssignment[] {
  const at = eventStartsAt ? new Date(eventStartsAt).getTime() : null;
  const seen = new Set<string>();
  return assignments.filter((row) => {
    if (row.staff_type !== 'site_manager' || !row.field_staff) return false;
    if (at !== null) {
      const starts = row.starts_on ? new Date(row.starts_on).getTime() : Number.NEGATIVE_INFINITY;
      const ends = row.ends_on ? new Date(row.ends_on).getTime() : Number.POSITIVE_INFINITY;
      if (at < starts || at >= ends) return false;
    } else if (!row.is_active) {
      return false;
    }
    if (seen.has(row.field_staff.id)) return false;
    seen.add(row.field_staff.id);
    return true;
  });
}

/* -------------------- reading a submission's work details -------------------- */

const text = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : null);
const capital = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

/**
 * The work details of a submission as label and value pairs, for the review
 * sheet. `payload` is a different shape per metric (`submission-payloads.ts`
 * on the backend); anything absent is left out instead of shown as blank.
 */
export function workDetails(submission: Pick<FieldSubmission, 'metric_key' | 'payload'>): { label: string; value: string }[] {
  const payload = submission.payload;
  const rows: [string, string | null][] = [];

  switch (submission.metric_key) {
    case 'fencing_new_metres':
      rows.push(
        ['Side', text(payload.side) && capital(String(payload.side))],
        ['Work', payload.work_type === 'repair' ? 'Repair (does not count towards the target)' : payload.work_type === 'new' ? 'New fencing' : null],
        ['Metres', typeof payload.metres === 'number' ? `${payload.metres.toLocaleString()} m` : null],
        ['From', text(payload.start_reference)],
        ['To', text(payload.end_reference)]
      );
      break;
    case 'parcelation_plots':
      rows.push(
        ['Kind', payload.is_rework === true ? 'Re-pegging (does not count towards the target)' : 'First pegging'],
        ['Reason for re-pegging', text(payload.rework_reason)]
      );
      break;
    case 'clearing_sqm':
      rows.push(
        ['Area', typeof payload.actual_sqm === 'number' ? `${payload.actual_sqm.toLocaleString()} sqm` : null],
        ['Where', payload.mapping === 'unmapped' ? 'An unmapped area (no plots attached)' : payload.mapping === 'mapped' ? 'On known plots' : null],
        ['Coverage', payload.coverage === 'full' ? 'Fully cleared' : payload.coverage === 'partial' ? 'Partly cleared' : null],
        ['Description', text(payload.description)],
        ['Markers', text(payload.markers)],
        ['Plots linked later', text(payload.linked_note)]
      );
      break;
    case 'boundary_metres': {
      const proposed = proposedSides(submission);
      rows.push(
        ['Metres', typeof payload.metres === 'number' ? `${payload.metres.toLocaleString()} m` : null],
        ['References', text(payload.references)],
        [
          'Proposed sides',
          proposed
            ? FENCING_SIDES.flatMap((side) => (proposed[side] === undefined ? [] : [`${capital(side)} ${proposed[side]} m`])).join(' · ')
            : null,
        ]
      );
      break;
    }
  }

  rows.push(['Worker note', text(payload.note)]);
  return rows.flatMap(([label, value]) => (value ? [{ label, value }] : []));
}
