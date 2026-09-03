import { z } from 'zod';

/* ============================================================
 * Agencies — abode-be-v2 `AgencyAdminController` (`admin/agencies`).
 *
 *   GET    /admin/agencies                          list + member counts
 *   POST   /admin/agencies                          create, owner existing|new
 *   GET    /admin/agencies/:id                      detail + owner + totals
 *   PATCH  /admin/agencies/:id                      name / rate / contacts
 *   POST   /admin/agencies/:id/suspend              reason, 20–500 chars
 *   POST   /admin/agencies/:id/reactivate           lift a suspension
 *   DELETE /admin/agencies/:id                      only at member_count 0
 *   POST   /admin/agencies/:id/change-owner         super admin only
 *   GET    /admin/agencies/:id/members              roster, searchable
 *   GET    /admin/agencies/:id/commissions          commission ledger
 *   GET    /admin/agencies/:id/commissions/export   CSV, 10/hour, 50k cap
 *   PATCH  /admin/users/:user_id/org                move a user in or out
 *
 * Reads take `view_agencies`, writes `manage_agencies`, the export
 * `export_agencies`.
 *
 * The v2 agency is a much leaner record than v1's GraphQL one: a name, a
 * code, a commission rate, an owner and two optional contact fields. There is
 * no address, no wallet, no verification flag and no sales aggregate — those
 * v1 concepts have no v2 equivalent and are not modelled here.
 * ============================================================ */

export const AGENCY_STATUSES = ['active', 'suspended'] as const;
export type AgencyStatus = (typeof AGENCY_STATUSES)[number];

export const AGENCY_SORT_FIELDS = ['created_at', 'name', 'commission_percentage'] as const;
export type AgencySortField = (typeof AGENCY_SORT_FIELDS)[number];

/**
 * The shape `AgencyService.shape()` returns — the body of every single-agency
 * response (create, update, suspend, reactivate) and each list row.
 *
 * `owner_user_id` is a bare id; only the detail endpoint expands the owner.
 * Dates are Mongoose timestamps serialized to ISO strings.
 */
export const AgencySchema = z.object({
  id: z.string(),
  name: z.string(),
  /** `AG-XXXXXXXX`, allocated by the BE and immutable. */
  code: z.string(),
  commission_percentage: z.number(),
  owner_user_id: z.string(),
  status: z.enum(AGENCY_STATUSES),
  is_suspended: z.boolean(),
  suspension_reason: z.string().nullable(),
  contact_email: z.string().nullable(),
  contact_phone: z.string().nullable(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

export type Agency = z.infer<typeof AgencySchema>;

/** A list row: the agency plus how many users sit under it. */
export const AgencyListRowSchema = AgencySchema.extend({
  member_count: z.number(),
});

export type AgencyListRow = z.infer<typeof AgencyListRowSchema>;

/** The owner, expanded on the detail response only. */
export const AgencyOwnerSchema = z.object({
  id: z.string(),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  user_name: z.string().nullable().optional(),
  phone_number: z.string().nullable().optional(),
});

export type AgencyOwner = z.infer<typeof AgencyOwnerSchema>;

/**
 * `GET /admin/agencies/:id`.
 *
 * `owner` is nullable: the field is required on the document, but the service
 * resolves it with a separate lookup that returns null if the user row is gone.
 */
export const AgencyDetailSchema = AgencySchema.extend({
  owner: AgencyOwnerSchema.nullable(),
  member_count: z.number(),
  total_commission_to_date: z.number(),
});

export type AgencyDetail = z.infer<typeof AgencyDetailSchema>;

/** One row of `GET /admin/agencies/:id/members`. */
export const AgencyMemberSchema = z.object({
  id: z.string(),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  user_name: z.string().nullable().optional(),
  phone_number: z.string().nullable().optional(),
  referral_status: z.string().nullable().optional(),
  is_owner: z.boolean(),
  joined_at: z.string().nullable(),
});

export type AgencyMember = z.infer<typeof AgencyMemberSchema>;

/**
 * One row of `GET /admin/agencies/:id/commissions`.
 *
 * The names are denormalized onto the ledger row by the BE, so they are
 * whatever was true when the commission was earned — and null on older rows
 * written before the denormalization landed. Every money field is nullable
 * for the same reason; `net_commission` falls back to the row's `amount`.
 */
export const AgencyCommissionRowSchema = z.object({
  id: z.string(),
  date: z.string(),
  buyer_name: z.string().nullable(),
  asset_name: z.string().nullable(),
  paid_to_name: z.string().nullable(),
  paid_to_user_id: z.string().nullable(),
  rate: z.number().nullable(),
  wht_rate: z.number().nullable(),
  gross_commission: z.number().nullable(),
  wht_deducted: z.number().nullable(),
  net_commission: z.number().nullable(),
  payment_plan_id: z.string().nullable(),
});

export type AgencyCommissionRow = z.infer<typeof AgencyCommissionRowSchema>;

/** `DELETE /admin/agencies/:id` and `PATCH /admin/users/:id/org`. */
export const AgencyMessageSchema = z.looseObject({
  message: z.string(),
});

/* -------------------- query params -------------------- */

export const DEFAULT_AGENCY_LIMIT = 20;
export const MAX_AGENCY_LIMIT = 100;

export interface AgencyListQuery {
  page?: number;
  limit?: number;
  /** Matches agency name or code. */
  q?: string | null;
  status?: AgencyStatus | null;
  sort?: AgencySortField | null;
  order?: 'asc' | 'desc' | null;
}

export interface AgencyMemberQuery {
  page?: number;
  limit?: number;
  /** Matches name, email, username or phone. */
  q?: string | null;
  /** Defaults to true on the BE — the owner is listed among the members. */
  include_owner?: boolean;
}

export interface AgencyCommissionQuery {
  page?: number;
  limit?: number;
  start_date?: string | null;
  end_date?: string | null;
}

/**
 * Drop empty values rather than sending them.
 *
 * The BE runs `forbidNonWhitelisted` with a `ValidationPipe` that coerces, so
 * an empty-string `status` fails `IsEnum` with a 400 instead of being treated
 * as "no filter".
 */
const clean = (params: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== null && v !== undefined && v !== '')
  );

export const buildAgencyListParams = (filters: AgencyListQuery): Record<string, unknown> =>
  clean({
    page: filters.page ?? 1,
    limit: Math.min(filters.limit ?? DEFAULT_AGENCY_LIMIT, MAX_AGENCY_LIMIT),
    q: filters.q,
    status: filters.status,
    sort: filters.sort,
    order: filters.order,
  });

export const buildAgencyMemberParams = (
  filters: AgencyMemberQuery
): Record<string, unknown> =>
  clean({
    page: filters.page ?? 1,
    limit: Math.min(filters.limit ?? DEFAULT_AGENCY_LIMIT, MAX_AGENCY_LIMIT),
    q: filters.q,
    // Explicit false is meaningful, so it must survive `clean`.
    include_owner: filters.include_owner === false ? 'false' : undefined,
  });

export const buildAgencyCommissionParams = (
  filters: AgencyCommissionQuery
): Record<string, unknown> =>
  clean({
    page: filters.page ?? 1,
    limit: Math.min(filters.limit ?? DEFAULT_AGENCY_LIMIT, MAX_AGENCY_LIMIT),
    start_date: filters.start_date,
    end_date: filters.end_date,
  });

/* -------------------- writes -------------------- */

/**
 * `POST /admin/agencies`.
 *
 * `owner_mode` discriminates: `existing` promotes a user who must not already
 * own an agency, `new` creates the user and emails them a temporary password.
 * A discriminated union would be the natural model, but the form needs to
 * hold a half-filled branch while the admin switches between modes, so the
 * branches are validated with `superRefine` and the unused one is stripped
 * before the request goes out.
 */
const newOwnerSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required').max(60),
  lastName: z.string().trim().min(1, 'Last name is required').max(60),
  email: z.email('Enter a valid email'),
  userName: z.string().trim().min(1, 'Username is required').max(30),
  phoneNumber: z.string().trim().min(1, 'Phone number is required').max(20),
});

export const createAgencySchema = z
  .object({
    name: z.string().trim().min(1, 'Agency name is required').max(120),
    commission_percentage: z
      .number('Enter a commission rate')
      .min(0, 'Cannot be negative')
      .max(100, 'Cannot exceed 100%'),
    owner_mode: z.enum(['existing', 'new']),
    owner_user_id: z.string().trim().optional(),
    new_owner: newOwnerSchema.partial().optional(),
    contact_email: z.union([z.email('Enter a valid email'), z.literal('')]).optional(),
    contact_phone: z.string().trim().max(20).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.owner_mode === 'existing') {
      if (!value.owner_user_id) {
        ctx.addIssue({
          code: 'custom',
          path: ['owner_user_id'],
          message: 'Pick the user who will own this agency',
        });
      }
      return;
    }

    const parsed = newOwnerSchema.safeParse(value.new_owner ?? {});
    if (parsed.success) return;
    for (const issue of parsed.error.issues) {
      ctx.addIssue({ ...issue, path: ['new_owner', ...issue.path] });
    }
  });

export type CreateAgencyFormValues = z.infer<typeof createAgencySchema>;

/** Exactly the DTO's fields — an extra one is a hard 400. */
export type CreateAgencyPayload = {
  name: string;
  commission_percentage: number;
  owner_mode: 'existing' | 'new';
  owner_user_id?: string;
  new_owner?: z.infer<typeof newOwnerSchema>;
  contact_email?: string;
  contact_phone?: string;
};

/** Strip the branch the admin didn't use, and any blank optional. */
export function toCreateAgencyPayload(values: CreateAgencyFormValues): CreateAgencyPayload {
  const payload: CreateAgencyPayload = {
    name: values.name.trim(),
    commission_percentage: values.commission_percentage,
    owner_mode: values.owner_mode,
  };

  if (values.owner_mode === 'existing') {
    payload.owner_user_id = values.owner_user_id;
  } else {
    const owner = newOwnerSchema.parse(values.new_owner ?? {});
    payload.new_owner = {
      ...owner,
      email: owner.email.toLowerCase().trim(),
    };
  }

  if (values.contact_email) payload.contact_email = values.contact_email;
  if (values.contact_phone) payload.contact_phone = values.contact_phone;

  return payload;
}

/**
 * `PATCH /admin/agencies/:id`. Every field is optional and the BE diffs
 * against the current row, so send only what changed.
 *
 * Both contacts are nullable — `null` clears the field, `undefined` leaves it
 * untouched. That distinction has to survive serialization, so the update hook
 * must not strip nulls the way the query builders do.
 */
export const updateAgencySchema = z.object({
  name: z.string().trim().min(1, 'Agency name is required').max(120).optional(),
  commission_percentage: z.number().min(0).max(100).optional(),
  contact_email: z.union([z.email('Enter a valid email'), z.null()]).optional(),
  contact_phone: z.union([z.string().trim().max(20), z.null()]).optional(),
});

export type UpdateAgencyPayload = z.infer<typeof updateAgencySchema>;

/** `POST /admin/agencies/:id/suspend`. The BE re-checks the trimmed length. */
export const SUSPENSION_REASON_MIN = 20;
export const SUSPENSION_REASON_MAX = 500;

export const suspendAgencySchema = z.object({
  suspension_reason: z
    .string()
    .trim()
    .min(SUSPENSION_REASON_MIN, `At least ${SUSPENSION_REASON_MIN} characters`)
    .max(SUSPENSION_REASON_MAX, `Keep it under ${SUSPENSION_REASON_MAX} characters`),
});

export type SuspendAgencyPayload = z.infer<typeof suspendAgencySchema>;

/**
 * `POST /admin/agencies/:id/change-owner` — super admin only, on top of
 * `manage_agencies`. Gate the UI on `role.is_super_admin`.
 */
export const changeOwnerSchema = z.object({
  new_owner_user_id: z.string().trim().min(1, 'Pick the incoming owner'),
  /** BE default is true: the outgoing owner stays on as a plain member. */
  retain_old_owner_as_member: z.boolean().default(true),
});

export type ChangeOwnerPayload = z.infer<typeof changeOwnerSchema>;

/* -------------------- display helpers -------------------- */

export function agencyOwnerName(owner: AgencyOwner | null | undefined): string {
  if (!owner) return '—';
  const full = [owner.first_name, owner.last_name].filter(Boolean).join(' ').trim();
  return full || owner.user_name || owner.email || owner.id;
}

export function agencyMemberName(member: AgencyMember): string {
  const full = [member.first_name, member.last_name].filter(Boolean).join(' ').trim();
  return full || member.user_name || member.email || member.id;
}
