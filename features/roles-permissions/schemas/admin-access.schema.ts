import { z } from 'zod';

import { LANDING_PAGES } from '@/lib/rbac/landing';

/* ============================================================
 * Per-person access: the start page and the extra permissions.
 *
 *   PATCH /admin/me/start-page              any signed-in admin, their own
 *   PATCH /admin/admins/:id/start-page      manage_admins
 *   PUT   /admin/admins/:id/extra-permissions   manage_admins
 *
 * Mirrors abode-be-v2 `admin-access.dto.ts` and the results returned by
 * `AdminService.setStartPage` / `setExtraPermissions`. The BE runs
 * forbidNonWhitelisted, so a payload carries exactly the DTO's fields.
 * ============================================================ */

/**
 * `SetStartPageDto`. `null` clears the choice, so the primary role's landing
 * page applies. A non-null value must be the landing page of a role the person
 * holds; the BE answers 400 `START_PAGE_NOT_AVAILABLE` (with the list that is
 * available) otherwise.
 */
export const setStartPageSchema = z.object({
  start_page: z.enum(LANDING_PAGES).nullable(),
});

export type SetStartPagePayload = z.infer<typeof setStartPageSchema>;

/** What both start-page endpoints return. `start_page` is the resolved value. */
export const StartPageResultSchema = z.object({
  admin_id: z.string(),
  start_page_choice: z.string().nullable(),
  start_page: z.string(),
});

export type StartPageResult = z.infer<typeof StartPageResultSchema>;

/**
 * `SetExtraPermissionsDto`: the FULL list, which replaces the current one.
 * Sending a subset removes everything left out.
 */
export const setExtraPermissionsSchema = z.object({
  permissions: z.array(z.string()),
});

export type SetExtraPermissionsPayload = z.infer<typeof setExtraPermissionsSchema>;

/**
 * `POST /admin/invite` (`InviteAdminDto`): an email and the roles to give, first = primary.
 * `role_ids` needs at least one. (The DTO also accepts a single `role_id`; this app always
 * sends the list.)
 */
export const inviteAdminSchema = z.object({
  email: z.string().min(1, 'Email is required').email('Enter a valid email'),
  role_ids: z.array(z.string()).min(1, 'Pick at least one role'),
});

export type InviteAdminPayload = z.infer<typeof inviteAdminSchema>;

/** What `AdminService.inviteAdmin` returns. */
export const InviteAdminResultSchema = z.object({
  id: z.string(),
  email: z.string(),
  userName: z.string().nullable().optional(),
  role_id: z.string(),
  role_name: z.string(),
  role_ids: z.array(z.string()).default([]),
  role_names: z.array(z.string()).default([]),
  message: z.string().nullable().optional(),
});

export type InviteAdminResult = z.infer<typeof InviteAdminResultSchema>;

/** `permissions` is the person's full union after the change: roles plus extras. */
export const ExtraPermissionsResultSchema = z.object({
  admin_id: z.string(),
  extra_permissions: z.array(z.string()),
  permissions: z.array(z.string()),
});

export type ExtraPermissionsResult = z.infer<typeof ExtraPermissionsResultSchema>;

/** What link and unlink return; `associate_pro_user_id` is null after an unlink. */
export const AssociateProLinkResultSchema = z.object({
  admin_id: z.string(),
  associate_pro_user_id: z.string().nullable(),
});

export type AssociateProLinkResult = z.infer<typeof AssociateProLinkResultSchema>;

/** A user as the Associate Pro picker needs one: who, by id. Read from the users list and from one user's page. */
export const AssociateProUserSchema = z.looseObject({
  id: z.string(),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
});

export type AssociateProUser = z.infer<typeof AssociateProUserSchema>;

export const associateProUserName = (user: AssociateProUser): string =>
  `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim() || user.email || user.id;
