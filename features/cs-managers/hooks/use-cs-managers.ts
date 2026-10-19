'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

import {
  AdminPickerRowSchema,
  AutoAssignPreviewSchema,
  CSManagerSummarySchema,
  UnassignedCustomersResultSchema,
} from '../schemas/cs-manager.schema';
import { csManagerKeys } from './query-keys';
import { z } from 'zod';

export const DEFAULT_UNASSIGNED_LIMIT = 20;

/**
 * GET /admin/cs-managers — bare array, no pagination. Needs
 * `view_cs_manager_tracker`; pass `enabled: false` to callers without it.
 */
export const useCSManagers = ({ enabled = true }: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: csManagerKeys.list(),
    queryFn: () => apiGet('/admin/cs-managers', z.array(CSManagerSummarySchema)),
    enabled,
  });

/** GET /admin/cs-managers/unassigned-customers — {count, results}, not the standard paged envelope. */
export const useUnassignedCustomers = (params?: {
  page?: number;
  limit?: number;
  /** Super-admin only on the BE — pass false in the manager view so a CS
   * Manager never fires a request they'd be rejected for. */
  enabled?: boolean;
}) => {
  const page = params?.page ?? 1;
  const limit = params?.limit ?? DEFAULT_UNASSIGNED_LIMIT;
  const enabled = params?.enabled ?? true;

  return useQuery({
    queryKey: csManagerKeys.unassigned(page, limit),
    queryFn: () =>
      apiGet('/admin/cs-managers/unassigned-customers', UnassignedCustomersResultSchema, {
        params: { page, limit },
      }),
    enabled,
  });
};

/**
 * GET /admin/cs-managers/auto-assign/preview — super admin only. A dry run of
 * the auto-assign job: who is waiting and how many each manager would get.
 * Writes nothing whether or not `CS_MANAGER_AUTO_ASSIGN` is on. The BE does
 * the whole sweep to answer, so fetch it only when someone opens the preview.
 */
export const useAutoAssignPreview = ({ enabled = true }: { enabled?: boolean } = {}) =>
  useQuery({
    queryKey: csManagerKeys.autoAssignPreview(),
    queryFn: () => apiGet('/admin/cs-managers/auto-assign/preview', AutoAssignPreviewSchema),
    enabled,
  });

/**
 * GET /admin/admins — used only as the admin picker source for promoting a
 * CS Manager. `roles-permissions` hasn't migrated off GraphQL yet (still
 * calls getAllAdminWithRoles), so this hook lives here rather than being
 * shared — extend `roles-permissions` to reuse it once that feature migrates.
 */
export const useAdminPicker = () =>
  useQuery({
    queryKey: csManagerKeys.adminPicker(),
    queryFn: () => apiGet('/admin/admins', z.array(AdminPickerRowSchema)),
  });
