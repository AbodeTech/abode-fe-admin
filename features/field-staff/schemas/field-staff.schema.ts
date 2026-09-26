import { z } from 'zod';

/* ============================================================
 * Field staff — Site Managers and Surveyors, their invitations and their
 * asset assignments. /admin/field-staff/*
 *
 * Shapes mirror abode-be-v2 `field-staff.presenter.ts` (presentFieldStaff,
 * presentAssignment). Field workers have their own accounts and sign in to a
 * separate field app — this admin only manages them.
 * ============================================================ */

export const FIELD_STAFF_TYPES = ['site_manager', 'surveyor'] as const;
export const FieldStaffTypeSchema = z.enum(FIELD_STAFF_TYPES);
export type FieldStaffType = z.infer<typeof FieldStaffTypeSchema>;

export const FIELD_STAFF_TYPE_LABELS: Record<FieldStaffType, string> = {
  site_manager: 'Site Manager',
  surveyor: 'Surveyor',
};

/** `invited` — activation link sent, not used yet. `disabled` — signed out everywhere, history kept. */
export const FIELD_STAFF_STATUSES = ['invited', 'active', 'disabled'] as const;
export const FieldStaffStatusSchema = z.enum(FIELD_STAFF_STATUSES);
export type FieldStaffStatus = z.infer<typeof FieldStaffStatusSchema>;

/** How an estate is referenced everywhere in this module. `name` is null if the asset was removed. */
export const FieldAssetRefSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
});
export type FieldAssetRef = z.infer<typeof FieldAssetRefSchema>;

/** How a field worker is referenced inside other records. */
export const FieldStaffRefSchema = z.object({
  id: z.string(),
  full_name: z.string().nullable(),
  email: z.string().nullable(),
});
export type FieldStaffRef = z.infer<typeof FieldStaffRefSchema>;

export const assetName = (asset: FieldAssetRef | null | undefined) => asset?.name ?? 'Removed site';

export function staffName(person: { full_name: string | null; email?: string | null } | null | undefined): string {
  return person?.full_name || person?.email || 'Unknown';
}

export function staffInitials(person: { full_name: string | null } | null | undefined): string {
  const parts = (person?.full_name ?? '').trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? '') + (parts[parts.length - 1]?.[0] ?? '')).toUpperCase() || '?';
}

/** GET /admin/field-staff (paged) and the `field_staff` inside GET /admin/field-staff/:id */
export const FieldStaffSchema = z.object({
  id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  full_name: z.string(),
  email: z.string(),
  phone_number: z.string().nullable(),
  staff_type: FieldStaffTypeSchema,
  status: FieldStaffStatusSchema,
  employee_reference: z.string().nullable(),
  invited_at: z.string().nullable(),
  activated_at: z.string().nullable(),
  last_login_at: z.string().nullable(),
  disabled_at: z.string().nullable(),
  disabled_reason: z.string().nullable(),
  created_at: z.string().nullable(),
});
export type FieldStaff = z.infer<typeof FieldStaffSchema>;

/* -------------------- assignments -------------------- */

export const FIELD_RESPONSIBILITIES = ['primary', 'support', 'relief'] as const;
export const FieldResponsibilitySchema = z.enum(FIELD_RESPONSIBILITIES);
export type FieldResponsibility = z.infer<typeof FieldResponsibilitySchema>;

export const FIELD_RESPONSIBILITY_LABELS: Record<FieldResponsibility, string> = {
  primary: 'Primary',
  support: 'Support',
  relief: 'Relief',
};

/** GET/POST /admin/field-staff/:id/assignments, PATCH .../:assignmentId/end */
export const FieldAssignmentSchema = z.object({
  id: z.string(),
  asset: FieldAssetRefSchema.nullable(),
  field_staff: FieldStaffRefSchema.nullable(),
  staff_type: FieldStaffTypeSchema,
  responsibility: FieldResponsibilitySchema,
  /** `active` until ended. A future start date is still `active` but not `is_active`. */
  status: z.enum(['active', 'ended']),
  starts_on: z.string().nullable(),
  ends_on: z.string().nullable(),
  /** Started and not yet ended, right now. */
  is_active: z.boolean(),
  note: z.string().nullable(),
  end_reason: z.string().nullable(),
});
export type FieldAssignment = z.infer<typeof FieldAssignmentSchema>;

/** GET /admin/field-staff/:id — the person and every assignment they've held. */
export const FieldStaffDetailSchema = z.object({
  field_staff: FieldStaffSchema,
  assignments: z.array(FieldAssignmentSchema),
});
export type FieldStaffDetail = z.infer<typeof FieldStaffDetailSchema>;

/** GET /admin/assets — just what the site picker needs from each row. */
export const AssetOptionSchema = z.looseObject({
  _id: z.string(),
  name: z.string(),
});
export type AssetOption = z.infer<typeof AssetOptionSchema>;

/* -------------------- request bodies (mirror the DTOs exactly) -------------------- */

/** InviteFieldStaffDto */
export type InviteFieldStaffPayload = {
  first_name: string;
  last_name: string;
  email: string;
  staff_type: FieldStaffType;
  phone_number?: string;
  employee_reference?: string;
};

/** DisableFieldStaffDto */
export type DisableFieldStaffPayload = { reason: string };

/** AssignFieldStaffDto — `starts_on` defaults to today on the server. */
export type CreateFieldAssignmentPayload = {
  asset_id: string;
  responsibility?: FieldResponsibility;
  starts_on?: string;
  note?: string;
};

/** EndAssignmentDto — `ends_on` defaults to now on the server. */
export type EndFieldAssignmentPayload = {
  ends_on?: string;
  reason: string;
};
