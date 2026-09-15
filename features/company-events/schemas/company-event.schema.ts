import { z } from 'zod';

/* ============================================================
 * Company Events — enums and form input.
 *
 * The UI design came from abode-be-v2's REST module; the data layer here
 * talks to our own GraphQL backend (abode-BE, `feature/allocation-events`).
 * Response shapes are therefore NOT modeled in this file — codegen owns
 * them, per CLAUDE.md, and the create-event form keeps its own zod schema
 * in CompanyEventForm. What stays is what codegen cannot express:
 *
 * - the enums. The schema types `type`, `status`, `eligibility_tier`,
 *   `email_status` and `category` as plain `String!`, so codegen yields
 *   `string`. The unions below are narrower than that, and the const
 *   arrays drive the filter dropdowns and badge maps.
 *
 * Behaviour worth keeping in mind, enforced server-side:
 * - An event is created `draft`. `setCompanyEventStatus` enforces the legal
 *   graph (`draft → published | closed`, `published → closed`,
 *   `closed → published`) and treats asking for the status it already holds
 *   as a no-op rather than an error.
 * - Allocation is refused while `available_size` is null (uncapped).
 * - There is no waitlist and no auto-revert on no-show: an allocation, once
 *   created, stands until an admin explicitly releases it.
 * ============================================================ */

export const COMPANY_EVENT_TYPES = ['site_inspection', 'allocation'] as const;
export const CompanyEventTypeSchema = z.enum(COMPANY_EVENT_TYPES);
export type CompanyEventType = z.infer<typeof CompanyEventTypeSchema>;

export const COMPANY_EVENT_STATUSES = ['draft', 'published', 'closed'] as const;
export const CompanyEventStatusSchema = z.enum(COMPANY_EVENT_STATUSES);
export type CompanyEventStatus = z.infer<typeof CompanyEventStatusSchema>;

export const EVENT_SIZE_UNITS = ['sqm', 'plots'] as const;
export const EventSizeUnitSchema = z.enum(EVENT_SIZE_UNITS);
export type EventSizeUnit = z.infer<typeof EventSizeUnitSchema>;

export const ELIGIBILITY_TIERS = ['land', 'land_and_dev_levy'] as const;
export const EligibilityTierSchema = z.enum(ELIGIBILITY_TIERS);
export type EligibilityTier = z.infer<typeof EligibilityTierSchema>;

/**
 * How a plan earned its place on allocation day. `fully_paid` is the only
 * route full-ownership has; `qualification_threshold` is the flex route, where
 * the plan has passed the percentage its tier sets.
 */
export const ELIGIBILITY_QUALIFIED_BY = ['fully_paid', 'qualification_threshold'] as const;
export const EligibilityQualifiedBySchema = z.enum(ELIGIBILITY_QUALIFIED_BY);
export type EligibilityQualifiedBy = z.infer<typeof EligibilityQualifiedBySchema>;

/**
 * Where somebody has got to on the day. This is ATTENDANCE, not land — the two
 * were one field until the backend split them, and they answer different
 * questions: this one is "have they replied, boarded, been seen at their plot",
 * and it applies to visitors who are being given no land at all.
 *
 * `invited` replaced `email_sent`: a row now exists from the moment we allocate
 * somebody, before any email goes out, and that is the state it starts in.
 */
export const EVENT_ALLOCATION_STATUSES = [
  'invited',
  'registered',
  'checked_in',
  'confirmed',
  'cancelled',
] as const;
export const EventAllocationStatusSchema = z.enum(EVENT_ALLOCATION_STATUSES);
export type EventAllocationStatus = z.infer<typeof EventAllocationStatusSchema>;

/** The land itself, which only knows whether it is still committed. */
export const LAND_ALLOCATION_STATUSES = ['allocated', 'cancelled'] as const;
export const LandAllocationStatusSchema = z.enum(LAND_ALLOCATION_STATUSES);
export type LandAllocationStatus = z.infer<typeof LandAllocationStatusSchema>;

/**
 * The two kinds of person on an event.
 *
 * `allocated` — we are giving them land, so we invited them.
 * `visitor`   — they signed themselves up through the public link, hold no
 *               allocation, and are coming to look.
 *
 * Both board the same bus and both hold a pass, which is why they share one
 * list rather than two.
 */
export const EVENT_ATTENDEE_TYPES = ['allocated', 'visitor'] as const;
export const EventAttendeeTypeSchema = z.enum(EVENT_ATTENDEE_TYPES);
export type EventAttendeeType = z.infer<typeof EventAttendeeTypeSchema>;

/** Delivery of the invite, tracked apart from the allocation's own status. */
export const INVITE_EMAIL_STATUSES = ['not_sent', 'queued', 'sent', 'failed'] as const;
export const InviteEmailStatusSchema = z.enum(INVITE_EMAIL_STATUSES);
export type InviteEmailStatus = z.infer<typeof InviteEmailStatusSchema>;

export const REGISTRATION_CATEGORIES = ['associate_pro', 'associate', 'client'] as const;
export const RegistrationCategorySchema = z.enum(REGISTRATION_CATEGORIES);
export type RegistrationCategory = z.infer<typeof RegistrationCategorySchema>;

/** Why a plan in a batch could not be committed. */
export const SAVE_EVENT_ALLOCATION_FAILURE_REASONS = [
  'ALREADY_ALLOCATED',
  'NO_LONGER_ELIGIBLE',
  'CAPACITY_EXCEEDED',
] as const;
export const SaveEventAllocationFailureReasonSchema = z.enum(SAVE_EVENT_ALLOCATION_FAILURE_REASONS);
export type SaveEventAllocationFailureReason = z.infer<typeof SaveEventAllocationFailureReasonSchema>;
