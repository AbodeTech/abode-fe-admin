import { z } from 'zod';

import { FieldAssetRefSchema, FieldStaffRefSchema, FieldStaffTypeSchema } from './field-staff.schema';
import { FieldMetricKeySchema } from './scorecard.schema';

/* ============================================================
 * Field submissions — one recorded piece of field work with its evidence and
 * spending, and the admin's decision on it. /admin/field-submissions/*
 *
 * Mirrors abode-be-v2 `submission.presenter.ts`. The work details (`payload`)
 * differ per metric; read them through lib/payload.ts, not directly.
 * ============================================================ */

export const SUBMISSION_STATUSES = [
  'draft',
  'submitted',
  'verified',
  'rejected',
  'withdrawn',
  'corrected',
  'reversed',
] as const;
export const SubmissionStatusSchema = z.enum(SUBMISSION_STATUSES);
export type SubmissionStatus = z.infer<typeof SubmissionStatusSchema>;

export const SubmissionEvidenceSchema = z.object({
  url: z.string(),
  kind: z.string(),
  caption: z.string().nullable(),
});
export type SubmissionEvidence = z.infer<typeof SubmissionEvidenceSchema>;

export const FieldSubmissionSchema = z.object({
  id: z.string(),
  field_staff: FieldStaffRefSchema.nullable(),
  asset: FieldAssetRefSchema.nullable(),
  staff_type: FieldStaffTypeSchema,
  metric_key: FieldMetricKeySchema,
  metric_label: z.string(),
  /** A ready-made sentence, e.g. "120m new fencing on the front side". */
  summary: z.string(),
  year: z.number(),
  month: z.number(),
  work_date: z.string().nullable(),
  status: SubmissionStatusSchema,
  /** What it adds to the metric — 0 for repairs and rework. */
  quantity: z.number(),
  unit: z.string().nullable(),
  counts_towards_target: z.boolean(),
  payload: z.record(z.string(), z.unknown()),
  evidence: z.array(SubmissionEvidenceSchema),
  plot_ids: z.array(z.string()),
  amount_spent: z.number().nullable(),
  vendor: z.string().nullable(),
  payment_reference: z.string().nullable(),
  receipt_url: z.string().nullable(),
  note: z.string().nullable(),
  /** Stored at verification time. For work still waiting, read the detail's `warnings`. */
  warnings: z.array(z.string()),
  warning_acknowledgement: z.string().nullable(),
  /** Bumped by every change. Sent back on verify so a stale review is refused. */
  revision: z.number(),
  scorecard_id: z.string().nullable(),
  submitted_at: z.string().nullable(),
  reviewed_at: z.string().nullable(),
  /** The verify note, or the rejection reason. */
  review_note: z.string().nullable(),
  correction_reason: z.string().nullable(),
  reversal_reason: z.string().nullable(),
  created_at: z.string().nullable(),
});
export type FieldSubmission = z.infer<typeof FieldSubmissionSchema>;

export const EFFECT_TYPES = [
  'performance_actual',
  'site_setup',
  'plot_history',
  'asset_cost',
  'audit_timeline',
] as const;

export const SubmissionEffectSchema = z.object({
  effect_type: z.enum(EFFECT_TYPES),
  quantity: z.number().nullable(),
  amount: z.number().nullable(),
  revision: z.number(),
  is_reversed: z.boolean(),
});
export type SubmissionEffect = z.infer<typeof SubmissionEffectSchema>;

/** GET /admin/field-submissions/:id */
export const SubmissionDetailSchema = z.object({
  submission: FieldSubmissionSchema,
  plots: z.array(z.object({ id: z.string(), label: z.string(), size_sqm: z.number().nullable() })),
  /** Worked out now — what an admin must acknowledge to verify. */
  warnings: z.array(z.string()),
  /** What verification has already written, per revision. Empty until verified. */
  effects: z.array(SubmissionEffectSchema),
});
export type SubmissionDetail = z.infer<typeof SubmissionDetailSchema>;

/**
 * POST .../verify returns `{ submission, effects_written, boundary_accepted }`,
 * except when it was already verified — then it returns the bare submission.
 */
export const VerifyResultSchema = z.union([
  z.object({
    submission: FieldSubmissionSchema,
    effects_written: z.array(z.string()),
    boundary_accepted: z.boolean(),
  }),
  FieldSubmissionSchema,
]);

/* -------------------- request bodies -------------------- */

/** VerifySubmissionDto */
export type VerifySubmissionPayload = {
  /** The revision you reviewed. A mismatch is refused with SUBMISSION_STALE. */
  revision?: number;
  /** Required when the submission has warnings. */
  acknowledgement?: string;
  /** Boundary work only: also accept the proposed sides as the approved boundary. */
  accept_proposed_boundary?: boolean;
  note?: string;
};

/** RejectSubmissionDto / ReverseSubmissionDto */
export type SubmissionReasonPayload = {
  reason: string;
};
