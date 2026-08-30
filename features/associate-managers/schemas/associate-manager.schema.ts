import { z } from 'zod';

/* ============================================================
 * Associate Manager Tracker — /admin/managers/* and
 * /admin/pros/:pro_id/onboarding-attempts.
 *
 * Shapes transcribed from `abode-be-v2/src/modules/associate-manager`:
 * the service maps every doc through `toListItem` / `toProSummary` /
 * `toTarget`, so these are real response DTOs rather than raw Mongoose
 * documents — the one exception is the onboarding attempt, which the BE
 * returns lean and populated (hence `looseObject`).
 *
 * ID SEMANTICS, the trap in this module: every `:manager_id` route takes
 * the **Admin** id (`existsForManager` queries `{ manager: managerId }`),
 * which is `ManagerListItem.manager_id` — NOT `.id`, the AssociateManager
 * document's own id. Always pass `manager_id` to a route.
 * ============================================================ */

/** The admin behind a manager, as `manager_admin` in the BE's aggregation. */
export const ManagerAdminSchema = z
  .looseObject({
    _id: z.string(),
    userName: z.string().nullable().optional(),
    firstName: z.string().nullable().optional(),
    lastName: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    role: z.string().nullable().optional(),
  })
  .nullable();

export type ManagerAdmin = z.infer<typeof ManagerAdminSchema>;

/** A roster member. Note `pro_id`, not `id` — the dashboard's roster row uses `id`. */
export const ProSummarySchema = z.object({
  pro_id: z.string(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  email: z.string().nullable(),
  phone_number: z.string().nullable(),
});

export type ProSummary = z.infer<typeof ProSummarySchema>;

export function proSummaryName(pro: Pick<ProSummary, 'first_name' | 'last_name' | 'email'>): string {
  const full = `${pro.first_name ?? ''} ${pro.last_name ?? ''}`.trim();
  return full || pro.email || 'Unknown';
}

/**
 * GET /admin/managers, GET /admin/managers/:manager_id, and the body every
 * roster mutation answers with.
 *
 * `associate_pros` is the FULL roster on the detail route but only the first
 * five on the list route (the BE previews to keep the list query cheap), so
 * never count it — `roster_size` is the real total either way.
 */
export const ManagerListItemSchema = z.object({
  id: z.string(),
  manager_id: z.string(),
  display_name: z.string().nullable(),
  phone_number: z.string().nullable(),
  whatsapp_group_link: z.string().nullable(),
  roster_size: z.number(),
  associate_pros: z.array(ProSummarySchema),
  createdAt: z.string().nullable(),
  updatedAt: z.string().nullable(),
});

export type ManagerListItem = z.infer<typeof ManagerListItemSchema>;

/** GET /admin/managers/me — a body, not a 403, when the caller manages nobody. */
export const ManagerProfileSchema = z.object({
  is_manager: z.boolean(),
  manager: ManagerListItemSchema.nullable(),
});

export type ManagerProfile = z.infer<typeof ManagerProfileSchema>;

/** POST /admin/managers */
export type AddManagerPayload = {
  admin_id: string;
  display_name?: string;
  /** E.164 — the BE rejects anything else. */
  phone_number?: string;
  whatsapp_group_link?: string;
};

/** DELETE /admin/managers/:manager_id */
export const RemoveManagerResultSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  results: z.array(ProSummarySchema),
});

/**
 * The 400 body when a manager still holds pros. `pros_to_reassign` is what
 * RemoveManagerDialog offers to move before retrying.
 */
export const ManagerHasRosterDetailsSchema = z.object({
  manager_id: z.string(),
  pros_to_reassign: z.array(ProSummarySchema),
});

/** POST /admin/managers/:manager_id/pros — max 200 ids per call. */
export const BULK_ASSIGN_MAX = 200;

export const BulkAssignResultSchema = z.object({
  manager: ManagerListItemSchema,
  reassigned_count: z.number(),
  from_managers: z.array(z.string()),
  to_manager: z.string(),
});

export type BulkAssignResult = z.infer<typeof BulkAssignResultSchema>;

/* ============================================================
 * Targets — GET/PUT /admin/managers/:manager_id/targets[/:year/:month]
 * ============================================================ */

export const ManagerTargetSchema = z.object({
  manager_id: z.string(),
  month: z.number(),
  year: z.number(),
  associate_pro_recruited_target: z.number(),
  selling_associate_pro_target: z.number(),
  revenue_target: z.number(),
  performance_score_target: z.number(),
  updatedAt: z.string().nullable(),
});

export type ManagerTarget = z.infer<typeof ManagerTargetSchema>;

/**
 * Every target is optional, and an OMITTED one is left alone rather than reset
 * — the BE builds its `$set` field by field behind an `!== undefined` check.
 *
 * So never substitute 0 for a blank input. A defaulted `revenue_target: 0`
 * clamps the revenue component of the 50-30-20 score to zero and silently
 * costs the manager 30 of their 100 points; "not set" and "set to zero" are
 * different answers.
 */
export type AssignTargetPayload = {
  associate_pro_recruited_target?: number;
  selling_associate_pro_target?: number;
  revenue_target?: number;
  performance_score_target?: number;
};

/* ============================================================
 * Rating series — GET /admin/managers/:manager_id/rating-series
 * ============================================================ */

/**
 * Oldest first, with unrated months present as `{ average: 0, count: 0 }`.
 * `count: 0` means NOBODY RATED — never render it as a real score of zero.
 */
export const RatingSeriesPointSchema = z.object({
  month: z.number(),
  year: z.number(),
  average: z.number(),
  count: z.number(),
});

export type RatingSeriesPoint = z.infer<typeof RatingSeriesPointSchema>;

/* ============================================================
 * Onboarding attempts — /admin/pros/:pro_id/onboarding-attempts
 *
 * Pro-scoped, so a reassignment never touches the history. Returned lean and
 * populated rather than mapped, so this stays loose.
 * ============================================================ */

export const ONBOARDING_OUTCOMES = ['picked', 'not_available', 'rescheduled'] as const;
export const OnboardingOutcomeSchema = z.enum(ONBOARDING_OUTCOMES);
export type OnboardingOutcome = z.infer<typeof OnboardingOutcomeSchema>;

export const ONBOARDING_SUPPORTS = ['materials', 'training', 'accountability', 'others'] as const;
export const ONBOARDING_TIMES_OF_DAY = ['morning', 'afternoon', 'evening', 'anytime'] as const;

const YesNoSchema = z.enum(['yes', 'no']).nullable().optional();

/**
 * A plain `z.object`, not `looseObject`: the BE returns a lean Mongoose doc, so
 * the payload also carries `updatedAt` and `__v`. Zod strips unknown keys
 * rather than rejecting them, and declaring the set precisely is what keeps
 * these fields typed instead of collapsing to `unknown`.
 */
export const OnboardingAttemptSchema = z.object({
  _id: z.string(),
  pro_id: z.string(),
  /**
   * The admin who made the call — v1 called this `manager`. Always POPULATED:
   * both the list and the create response come from `listByPro`, which
   * populates it.
   */
  admin_id: ManagerAdminSchema,
  outcome: OnboardingOutcomeSchema,
  /** Computed on read: 1-indexed from the OLDEST attempt. Never stored. */
  attempt_number: z.number(),
  /** Computed on read: only the LATEST attempt can be overdue. */
  is_overdue: z.boolean(),

  motivation: z.string().nullable().optional(),
  experience: YesNoSchema,
  experience_length: z.string().nullable().optional(),
  prospects: z.string().nullable().optional(),
  income_goal: z.string().nullable().optional(),
  support: z.enum(ONBOARDING_SUPPORTS).nullable().optional(),
  support_other: z.string().nullable().optional(),
  read_docs: z.enum(['yes', 'no', 'uncertain']).nullable().optional(),
  got_guide: YesNoSchema,

  reschedule_date: z.string().nullable().optional(),
  reschedule_time_of_day: z.enum(ONBOARDING_TIMES_OF_DAY).nullable().optional(),
  reschedule_note: z.string().nullable().optional(),

  createdAt: z.string(),
});

export type OnboardingAttempt = z.infer<typeof OnboardingAttemptSchema>;

/** POST body. `pro_id` goes in the PATH — sending it in the body is a 400. */
export type LogOnboardingAttemptPayload = {
  outcome: OnboardingOutcome;
  motivation?: string;
  experience?: 'yes' | 'no';
  experience_length?: string;
  prospects?: string;
  income_goal?: string;
  support?: (typeof ONBOARDING_SUPPORTS)[number];
  support_other?: string;
  read_docs?: 'yes' | 'no' | 'uncertain';
  got_guide?: 'yes' | 'no';
  /** Required by the BE when `outcome` is `rescheduled`. */
  reschedule_date?: string;
  reschedule_time_of_day?: (typeof ONBOARDING_TIMES_OF_DAY)[number];
  reschedule_note?: string;
};

/* ============================================================
 * Manager identity
 * ============================================================ */

/**
 * A human label for a manager.
 *
 * KNOWN GAP: `ManagerListItem` carries no admin name or email. The BE's
 * aggregation joins `manager_admin` and SEARCHES and SORTS on its
 * firstName/lastName/userName/email — then `toListItem` drops it from the
 * payload, so the list can be searched by a field the response doesn't
 * contain. Until that is returned, the only human-readable field is
 * `display_name`, which is nullable and unset for a freshly promoted manager.
 *
 * Every manager label in this feature routes through here, so restoring the
 * admin object is a one-function change rather than a six-component sweep.
 */
export function managerDisplayName(
  manager: Pick<ManagerListItem, 'display_name' | 'manager_id'> | null | undefined
): string {
  if (!manager) return 'Manager';
  return manager.display_name?.trim() || `Manager ${manager.manager_id.slice(-6)}`;
}

export function managerInitials(
  manager: Pick<ManagerListItem, 'display_name' | 'manager_id'> | null | undefined
): string {
  const name = managerDisplayName(manager);
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}

/* ============================================================
 * Admin picker — GET /admin/admins
 *
 * Bare Mongoose docs; the BE has no response DTO for this route, hence the
 * loose shape. Duplicated from cs-managers rather than shared because
 * `roles-permissions` still owns the admin list on GraphQL and features stay
 * self-contained — fold both into that feature once it migrates.
 * ============================================================ */

export const AdminPickerRowSchema = z.looseObject({
  _id: z.string(),
  userName: z.string().nullable().optional(),
  firstName: z.string().nullable().optional(),
  lastName: z.string().nullable().optional(),
  email: z.string(),
  role: z.string().nullable().optional(),
});

export type AdminPickerRow = z.infer<typeof AdminPickerRowSchema>;

export function adminPickerName(row: AdminPickerRow): string {
  const full = `${row.firstName ?? ''} ${row.lastName ?? ''}`.trim();
  return full || row.userName || row.email;
}
