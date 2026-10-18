import { z } from 'zod';

/* ============================================================
 * Company Events.
 *
 * The backend module landed 2026-09-11 (abode-be-v2 staging, PR #67
 * "allocation-event") — these shapes are now confirmed directly against
 * `company-events-admin.controller.ts` / `.service.ts` / `dto/company-event.dto.ts`
 * / `schemas/company-event.schema.ts` on that branch, not speculative.
 *
 * PR #69 ("company-events-offline") then added the three admin endpoints
 * that were the one real gap: `GET /:id/allocations`, `GET /:id/analytics`,
 * `GET /:id/registrations` — all gated on `view_allocations`, confirmed
 * against the same files. Every shape below is now real; nothing in this
 * file is mock-only or simulated anymore.
 *
 * Per the finalized decisions doc, still true on the real backend:
 * - No waitlist state, no auto-revert-on-no-show (decisions #3/#4) — an
 *   `EventAllocation`, once created, stands until an admin explicitly
 *   removes it.
 * - No `EventAllocationHistory` *endpoint* exposed to the admin (the
 *   collection exists server-side for audit, per decision #12, but nothing
 *   here reads it).
 * - Decision #9 said pickup-location seat limits were "removed, not needed"
 *   — the real backend built `seat_limit` anyway (optional, on both the
 *   create DTO and the response). Modeled here since it's real data when
 *   present, but no create-form UI was added for it, matching the decision.
 * ============================================================ */

export const COMPANY_EVENT_TYPES = ['site_inspection', 'allocation'] as const;
export const CompanyEventTypeSchema = z.enum(COMPANY_EVENT_TYPES);
export type CompanyEventType = z.infer<typeof CompanyEventTypeSchema>;

export const COMPANY_EVENT_STATUSES = ['draft', 'published', 'closed'] as const;
export const CompanyEventStatusSchema = z.enum(COMPANY_EVENT_STATUSES);
export type CompanyEventStatus = z.infer<typeof CompanyEventStatusSchema>;

/**
 * Every event is created `draft`. Moving it on is real as of PR #70
 * (staging `ba31456`, "company-events-status-onboarding") —
 * `PATCH /:id/status` (and the `POST /:id/publish` / `POST /:id/close`
 * shortcuts, which are the same transition under the hood) enforce a legal
 * transition graph server-side: `draft → published | closed`,
 * `published → closed`, `closed → published` (the reopen path). See
 * `useUpdateEventStatus` in `use-update-event-status.ts`. `EVENT_CLOSED` is
 * the real error `saveAllocations` throws once an event is `closed`.
 */
export const PickupLocationSchema = z.object({
  id: z.string(),
  name: z.string(),
  seat_limit: z.number().nullable().optional(),
});
export type PickupLocation = z.infer<typeof PickupLocationSchema>;

/**
 * `GET /admin/company-events` / `GET /admin/company-events/:id`.
 * `asset_name` is NOT part of the real response (`toEventDto()` only sends
 * `asset_id`) — hooks join it in client-side from `useCompanyEventAssets()`
 * and widen the type to `CompanyEventWithAssetName` below, so every
 * consuming component still reads `.asset_name` unchanged.
 */
export const CompanyEventSchema = z.object({
  id: z.string(),
  title: z.string(),
  type: CompanyEventTypeSchema,
  asset_id: z.string(),
  date: z.string(),
  time: z.string(),
  /** Full UTC instant — `date`+`time` resolved server-side against Africa/Lagos. */
  starts_at: z.string(),
  pickup_locations: z.array(PickupLocationSchema),
  /** Allocation events only. */
  available_size: z.number().nullable().optional(),
  /** Running total already committed to non-cancelled allocations. */
  reserved_size: z.number(),
  /** `available_size - reserved_size`, floored at 0; `null` when no capacity is set. */
  remaining_capacity: z.number().nullable(),
  size_unit: z.string().nullable().optional(),
  status: CompanyEventStatusSchema,
  created_by: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type CompanyEvent = z.infer<typeof CompanyEventSchema>;

/** What every hook actually returns — `asset_name` joined in client-side (see `CompanyEventSchema` doc). */
export type CompanyEventWithAssetName = CompanyEvent & { asset_name: string };

/**
 * Option row for the site/estate dropdown — a minimal slice of the real
 * `GET /admin/assets` response, duplicated rather than imported from
 * `features/assets/` per CLAUDE.md's no-cross-feature-import rule (mirrors
 * `AllocationAssetOptionSchema` in `features/allocation/`).
 */
export const CompanyEventAssetOptionSchema = z.object({
  _id: z.string(),
  name: z.string(),
});
export type CompanyEventAssetOption = z.infer<typeof CompanyEventAssetOptionSchema>;

/**
 * Eligibility is a two-tier status derived server-side from `PaymentPlan`:
 * `land_and_dev_levy` when land payment AND dev levy are both complete,
 * `land` when only land payment is complete. "Statutory fee" and "dev levy"
 * are the same thing (terminology settled in the plan doc).
 */
export const ELIGIBILITY_TIERS = ['land', 'land_and_dev_levy'] as const;
export const EligibilityTierSchema = z.enum(ELIGIBILITY_TIERS);
export type EligibilityTier = z.infer<typeof EligibilityTierSchema>;

/**
 * `GET /admin/company-events/:id/eligible-clients` — one row per eligible
 * payment plan, FCFS-ordered by `land_completed_at` ascending (server-side
 * sort — the real aggregation's `$sort: { land_payment_completed_date: 1 }`).
 * Already excludes anyone holding a non-cancelled `EventAllocation` for
 * *any* event at this event's asset (the repo's `eligiblePipeline()` does an
 * `$lookup` + `$match: { _alloc: { $size: 0 } }`) — decision #15's
 * allocate-once-per-location is enforced here, no separate filter needed.
 *
 * `size` is **per-unit** — the real commit size is `size * no_of_units`
 * (matches `saveAllocations()`'s `size_reserved = plan.size * plan.no_of_units`).
 */
export const EventEligibleClientSchema = z.object({
  payment_plan_id: z.string(),
  user_id: z.string(),
  name: z.string(),
  email: z.string(),
  phone: z.string().nullable().optional(),
  size: z.number(),
  no_of_units: z.number(),
  eligibility_tier: EligibilityTierSchema,
  land_completed_at: z.string().nullable().optional(),
  plan_status: z.string().nullable().optional(),
});
export type EventEligibleClient = z.infer<typeof EventEligibleClientSchema>;

export const EVENT_ALLOCATION_STATUSES = [
  'allocated',
  'email_sent',
  'registered',
  'checked_in',
  'confirmed',
  'cancelled',
] as const;
export const EventAllocationStatusSchema = z.enum(EVENT_ALLOCATION_STATUSES);
export type EventAllocationStatus = z.infer<typeof EventAllocationStatusSchema>;

export const INVITE_EMAIL_STATUSES = ['not_sent', 'queued', 'sent', 'failed'] as const;
export const InviteEmailStatusSchema = z.enum(INVITE_EMAIL_STATUSES);
export type InviteEmailStatus = z.infer<typeof InviteEmailStatusSchema>;

/** A registrant's self-reported role — set on `EventRegistration`, not on the allocation itself. */
export const REGISTRATION_CATEGORIES = ['associate_pro', 'associate', 'client'] as const;
export const RegistrationCategorySchema = z.enum(REGISTRATION_CATEGORIES);
export type RegistrationCategory = z.infer<typeof RegistrationCategorySchema>;

/**
 * `GET /admin/company-events/:id/allocations` — real as of PR #69. One row
 * per (non-deleted) allocation, contact resolved from the person's
 * registration form where they've submitted one, else their user record.
 * `category`/`pickup_location` come off the linked `EventRegistration` and
 * are `null` until that person registers.
 */
export const EventAllocationSchema = z.object({
  allocation_id: z.string(),
  user_id: z.string().nullable(),
  payment_plan_id: z.string().nullable(),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  category: RegistrationCategorySchema.nullable(),
  pickup_location: z.string().nullable(),
  status: EventAllocationStatusSchema,
  eligibility_tier: EligibilityTierSchema,
  size_reserved: z.number(),
  email_status: InviteEmailStatusSchema,
  invite_sent_at: z.string().nullable(),
  registered_at: z.string().nullable(),
  checked_in_at: z.string().nullable(),
  confirmed_at: z.string().nullable(),
  cancelled_at: z.string().nullable(),
  created_at: z.string(),
});
export type EventAllocation = z.infer<typeof EventAllocationSchema>;

export const SAVE_EVENT_ALLOCATION_FAILURE_REASONS = [
  'ALREADY_ALLOCATED',
  'NO_LONGER_ELIGIBLE',
  'CAPACITY_EXCEEDED',
] as const;
export const SaveEventAllocationFailureReasonSchema = z.enum(SAVE_EVENT_ALLOCATION_FAILURE_REASONS);
export type SaveEventAllocationFailureReason = z.infer<typeof SaveEventAllocationFailureReasonSchema>;

/**
 * Response body of `POST /admin/company-events/:id/allocations` — a
 * partial-success shape. The client's running-total/capacity check is a UX
 * convenience only; this response is the real, server-revalidated outcome,
 * since two admins can work the same event concurrently (decision #1) — the
 * real service re-validates plan status, land-payment completion, and
 * capacity inside one DB transaction per batch.
 */
export const SaveEventAllocationsResultSchema = z.object({
  succeeded: z.array(
    z.object({
      payment_plan_id: z.string(),
      event_allocation_id: z.string(),
      size_reserved: z.number(),
    })
  ),
  failed: z.array(
    z.object({
      payment_plan_id: z.string(),
      reason: SaveEventAllocationFailureReasonSchema,
    })
  ),
  /** Always a number on the real backend (saving requires capacity to already be set). */
  remaining_capacity: z.number().nullable(),
});
export type SaveEventAllocationsResult = z.infer<typeof SaveEventAllocationsResultSchema>;

/**
 * `DELETE /admin/company-events/:id/allocations/:allocationId` response.
 * `already_cancelled` is only present on the real backend's idempotent path
 * (`company-events.service.ts#deallocate` returns `{deallocated: true, freed}`
 * with the field omitted entirely on a normal first-time cancel, not even
 * `false`) — optional + defaulted here rather than fixed upstream, since its
 * absence unambiguously means "not already cancelled" either way.
 */
export const DeallocateResultSchema = z.object({
  deallocated: z.boolean(),
  /** True when the allocation was already cancelled — idempotent, not an error. */
  already_cancelled: z.boolean().optional().default(false),
  /** Size freed back to the event's capacity (0 when `already_cancelled`). */
  freed: z.number(),
});
export type DeallocateResult = z.infer<typeof DeallocateResultSchema>;

/**
 * `GET /admin/company-events/:id/registrations` — real as of PR #69. One row
 * per public form submission (`EventRegistration`), independent of the
 * allocation's own lifecycle status.
 */
export const EventRegistrationRowSchema = z.object({
  registration_id: z.string(),
  allocation_id: z.string().nullable(),
  name: z.string(),
  phone: z.string(),
  email: z.string(),
  category: RegistrationCategorySchema,
  pickup_location: z.string().nullable(),
  submitted_at: z.string().nullable(),
});
export type EventRegistrationRow = z.infer<typeof EventRegistrationRowSchema>;

/**
 * `GET /admin/company-events/:id/analytics` — real as of PR #69. One-pass
 * funnel + mix analytics for an allocation event's dashboard
 * (`company-events.service.ts#getEventAnalytics`). `funnel`/`registration_split`/
 * `no_show`/`cancelled` are counted off live (non-cancelled, except `cancelled`
 * itself) allocations; `category_mix` and `pickup_load` come off the
 * registrations collection. Only 'allocation'-type events have this endpoint
 * (`NOT_AN_ALLOCATION_EVENT` otherwise).
 */
export const EventAnalyticsSchema = z.object({
  event_id: z.string(),
  title: z.string(),
  funnel: z.object({
    allocated: z.number(),
    registered: z.number(),
    checked_in: z.number(),
    confirmed: z.number(),
  }),
  registration_split: z.object({
    registered: z.number(),
    not_registered: z.number(),
  }),
  /** Registered but never checked in — the boarding no-show/logistics risk. */
  no_show: z.number(),
  cancelled: z.number(),
  category_mix: z.array(
    z.object({
      category: RegistrationCategorySchema,
      count: z.number(),
    })
  ),
  pickup_load: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      seat_limit: z.number().nullable(),
      registered: z.number(),
    })
  ),
  capacity: z.object({
    available_size: z.number().nullable(),
    reserved_size: z.number(),
    remaining: z.number().nullable(),
    utilization_pct: z.number().nullable(),
    size_unit: z.string(),
  }),
});
export type EventAnalytics = z.infer<typeof EventAnalyticsSchema>;
