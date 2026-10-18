import { z } from 'zod';

/* ============================================================
 * Client requests — the admin surface, GET/PATCH/POST /admin/requests/*.
 *
 * Shapes are transcribed from the backend's `ClientRequestView` and
 * `RequestStatisticsView` — the first module on abode-be-v2 that declares
 * `@ApiOkResponse` types, so unlike everywhere else these are documented,
 * not inferred. Refs arrive POPULATED and collapsed to `{id, name, email}`.
 *
 * Three types (v1's `location_change` was dropped in v2 — deliberately, per
 * product). Exactly one `*_details` block is set, matching `request_type`.
 *
 * Fees are whole naira.
 * ============================================================ */

export const REQUEST_TYPES = ['document_change', 'asset_update', 'custom_request'] as const;
export const RequestTypeSchema = z.enum(REQUEST_TYPES);
export type RequestType = z.infer<typeof RequestTypeSchema>;

export const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  document_change: 'Document change',
  asset_update: 'Asset update',
  custom_request: 'Custom request',
};

/** Fixed fees the backend charges — shown on the type cards. */
export const REQUEST_FEES: Record<RequestType, number> = {
  document_change: 20_000,
  asset_update: 100_000,
  custom_request: 0,
};

/**
 * The lifecycle. Transitions mirror the backend's `VALID_TRANSITIONS` table
 * exactly, so action gating on the client can never offer a move the server
 * would refuse.
 *
 *   submitted ──▶ under_review ──▶ approved ──▶ completed
 *       │              │              │
 *       ├──▶ approved  ├──▶ declined  └──▶ cancelled
 *       ├──▶ declined  └──▶ cancelled
 *       └──▶ cancelled
 */
export const REQUEST_STATUSES = [
  'submitted',
  'under_review',
  'approved',
  'completed',
  'declined',
  'cancelled',
] as const;
export const RequestStatusSchema = z.enum(REQUEST_STATUSES);
export type RequestStatus = z.infer<typeof RequestStatusSchema>;

/** `submitted` is labelled "Pending" — the backend's own view says so. */
export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  submitted: 'Pending',
  under_review: 'Under review',
  approved: 'Approved',
  completed: 'Completed',
  declined: 'Declined',
  cancelled: 'Cancelled',
};

const VALID_TRANSITIONS: Record<RequestStatus, readonly RequestStatus[]> = {
  submitted: ['under_review', 'approved', 'declined', 'cancelled'],
  under_review: ['approved', 'declined', 'cancelled'],
  approved: ['completed', 'cancelled'],
  completed: [],
  declined: [],
  cancelled: [],
};

export const PAYMENT_STATUSES = [
  'not_applicable',
  'submitted',
  'verified',
  'refunded',
  'cancelled',
  'declined',
] as const;
export const PaymentStatusSchema = z.enum(PAYMENT_STATUSES);
export type PaymentStatus = z.infer<typeof PaymentStatusSchema>;

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  not_applicable: 'No fee',
  submitted: 'Awaiting verification',
  verified: 'Paid',
  refunded: 'Refunded',
  cancelled: 'Cancelled',
  declined: 'Declined',
};

export const APPROVAL_MODES = ['system', 'manual'] as const;
export type ApprovalMode = (typeof APPROVAL_MODES)[number];

/* -------------------- refs -------------------- */

/**
 * A populated ref collapsed by the backend's `refOf` — `{id, name, email}`.
 * An unpopulated one keeps just the id, so `name`/`email` stay optional.
 */
export const RefSchema = z.object({
  id: z.string(),
  name: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
});
export type Ref = z.infer<typeof RefSchema>;

/* -------------------- details blocks -------------------- */

export const DocumentChangeDetailsSchema = z.looseObject({
  asset: RefSchema.nullable(),
  unique_asset_id: z.string(),
  asset_name_snapshot: z.string(),
  document_type: z.string(),
  current_name: z.string(),
  current_address: z.string(),
  new_name: z.string(),
  new_address: z.string(),
  reason_for_change: z.string(),
});
export type DocumentChangeDetails = z.infer<typeof DocumentChangeDetailsSchema>;

export const UPDATE_TYPES = ['size', 'units'] as const;

export const AssetUpdateDetailsSchema = z.looseObject({
  asset: RefSchema.nullable(),
  unique_asset_id: z.string(),
  asset_name_snapshot: z.string(),
  update_type: z.enum(UPDATE_TYPES),
  current_size: z.number(),
  current_units: z.number(),
  new_size: z.number(),
  new_units: z.number(),
  reason_for_update: z.string(),
  computed_new_total_price: z.number(),
  computed_price_delta: z.number(),
});
export type AssetUpdateDetails = z.infer<typeof AssetUpdateDetailsSchema>;

export const CUSTOM_REQUEST_CATEGORIES = [
  'payment',
  'documentation',
  'property',
  'technical',
  'general',
] as const;

export const CustomRequestDetailsSchema = z.looseObject({
  title: z.string(),
  description: z.string(),
  category: z.string(),
  related_asset: RefSchema.nullable().optional(),
  related_asset_name_snapshot: z.string().nullable().optional(),
  attachments: z.array(z.string()).default([]),
});
export type CustomRequestDetails = z.infer<typeof CustomRequestDetailsSchema>;

export const PaymentProofSchema = z.looseObject({
  bank_name: z.string(),
  reference_number: z.string(),
  proof_image_url: z.string(),
  submitted_at: z.string(),
  verified_at: z.string().nullable().optional(),
  verified_by: z.string().nullable().optional(),
});
export type PaymentProof = z.infer<typeof PaymentProofSchema>;

/* -------------------- the request -------------------- */

export const ClientRequestSchema = z.looseObject({
  id: z.string(),
  request_id: z.string(),
  user: RefSchema.nullable(),
  request_type: RequestTypeSchema,
  status: RequestStatusSchema,

  document_change_details: DocumentChangeDetailsSchema.nullable().optional(),
  asset_update_details: AssetUpdateDetailsSchema.nullable().optional(),
  custom_request_details: CustomRequestDetailsSchema.nullable().optional(),

  processing_fee: z.number(),
  original_fee: z.number(),
  discount_amount: z.number(),
  coupon: z.string().nullable().optional(),
  coupon_code_snapshot: z.string().nullable().optional(),

  payment_status: PaymentStatusSchema,
  payment_proof: PaymentProofSchema.nullable().optional(),
  processing_fee_transaction: z.string().nullable().optional(),

  // Admin identities are ids, not populated — the view keeps them as ids on
  // purpose so the user's own detail page can't leak another admin's data.
  reviewed_by: z.string().nullable().optional(),
  reviewed_at: z.string().nullable().optional(),
  completed_by: z.string().nullable().optional(),
  completed_at: z.string().nullable().optional(),
  approval_mode: z.enum(APPROVAL_MODES).nullable().optional(),
  admin_notes: z.string().nullable().optional(),
  decline_reason: z.string().nullable().optional(),
  cancellation_reason: z.string().nullable().optional(),
  cancelled_by: z.string().nullable().optional(),
  cancelled_at: z.string().nullable().optional(),
  estimated_completion_hours: z.number().nullable().optional(),

  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ClientRequest = z.infer<typeof ClientRequestSchema>;

/* -------------------- helpers -------------------- */

/** The name a populated ref carries, or null when the ref is bare/absent. */
export function refName(ref: Ref | null | undefined): string | null {
  return ref?.name || null;
}

/** Whichever asset the request is about, regardless of type. */
export function requestAsset(request: ClientRequest): Ref | null {
  return (
    request.document_change_details?.asset ??
    request.asset_update_details?.asset ??
    request.custom_request_details?.related_asset ??
    null
  );
}

export function requestAssetName(request: ClientRequest): string | null {
  return (
    refName(requestAsset(request)) ??
    request.document_change_details?.asset_name_snapshot ??
    request.asset_update_details?.asset_name_snapshot ??
    request.custom_request_details?.related_asset_name_snapshot ??
    null
  );
}

/** A one-line summary of what the request asks for. */
export function requestSummary(request: ClientRequest): string {
  const dc = request.document_change_details;
  if (dc) return `${dc.document_type}: ${dc.current_name} → ${dc.new_name}`;
  const au = request.asset_update_details;
  if (au) {
    return au.update_type === 'size'
      ? `Size ${au.current_size} → ${au.new_size} sqm`
      : `Units ${au.current_units} → ${au.new_units}`;
  }
  const cr = request.custom_request_details;
  if (cr) return cr.title;
  return '—';
}

/**
 * Which actions this request can take right now — derived from the same
 * transition table the backend enforces, plus its one type rule (custom
 * requests can't be system-approved: there is nothing for the system to
 * execute).
 */
export function requestActions(request: ClientRequest): {
  canReview: boolean;
  canApprove: boolean;
  canSystemApprove: boolean;
  canComplete: boolean;
  canDecline: boolean;
  canCancel: boolean;
} {
  const next = VALID_TRANSITIONS[request.status];
  const canApprove = next.includes('approved');
  return {
    canReview: next.includes('under_review'),
    canApprove,
    canSystemApprove: canApprove && request.request_type !== 'custom_request',
    canComplete: next.includes('completed'),
    canDecline: next.includes('declined'),
    canCancel: next.includes('cancelled'),
  };
}

/** `ADMIN_REASON_MIN_LENGTH` — decline and cancel both enforce it. */
export const ADMIN_REASON_MIN = 20;
export const ADMIN_TEXT_MAX = 2000;

export const adminReasonSchema = z
  .string()
  .trim()
  .min(ADMIN_REASON_MIN, `Explain in at least ${ADMIN_REASON_MIN} characters`)
  .max(ADMIN_TEXT_MAX, `Keep it under ${ADMIN_TEXT_MAX} characters`);

/* -------------------- list + statistics -------------------- */

/**
 * The analytics block riding on the list response — computed in the same
 * `$facet` as the page, so it describes the filtered subset and cannot drift.
 */
export const ListAnalyticsSchema = z.looseObject({
  total_requests: z.number(),
  submitted_requests: z.number(),
  under_review_requests: z.number(),
  approved_requests: z.number(),
  completed_requests: z.number(),
  declined_requests: z.number(),
  cancelled_requests: z.number(),
  total_processing_fees: z.number(),
  fees_collected: z.number(),
  fees_pending_verification: z.number(),
  fees_refunded: z.number(),
});
export type ListAnalytics = z.infer<typeof ListAnalyticsSchema>;

/** GET /admin/requests — `{requests, total, page, limit, analytics}`, not the paged envelope. */
export const RequestListSchema = z.object({
  requests: z.array(ClientRequestSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
  analytics: ListAnalyticsSchema,
});
export type RequestList = z.infer<typeof RequestListSchema>;

/** GET /admin/requests/statistics — the 19-field dashboard block. */
export const RequestStatisticsSchema = z.looseObject({
  total_requests: z.number(),
  submitted_requests: z.number(),
  under_review_requests: z.number(),
  approved_requests: z.number(),
  completed_requests: z.number(),
  declined_requests: z.number(),
  cancelled_requests: z.number(),
  document_change_requests: z.number(),
  asset_update_requests: z.number(),
  custom_requests: z.number(),
  pending_document_change: z.number(),
  pending_asset_update: z.number(),
  pending_custom: z.number(),
  paid_requests: z.number(),
  unpaid_requests: z.number(),
  refunded_requests: z.number(),
  total_fees_collected: z.number(),
  total_fees_pending_verification: z.number(),
  total_fees_refunded: z.number(),
});
export type RequestStatistics = z.infer<typeof RequestStatisticsSchema>;
