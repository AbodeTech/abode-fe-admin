'use client';

import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

import { apiGet } from '@/lib/api-client';

import { AdminPickerRowSchema } from '../schemas/associate-manager.schema';
import { managerKeys } from './query-keys';

/**
 * GET /admin/admins — the pool to promote an associate manager from.
 *
 * Local rather than shared: `roles-permissions` still serves this list over
 * GraphQL, and features here stay self-contained. cs-managers carries the same
 * hook for the same reason; fold both into `roles-permissions` when it migrates.
 */
export const useAdminPicker = () =>
  useQuery({
    queryKey: managerKeys.adminPicker(),
    queryFn: () => apiGet('/admin/admins', z.array(AdminPickerRowSchema)),
  });
