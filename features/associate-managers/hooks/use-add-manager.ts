'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiPost } from '@/lib/api-client';

import {
  ManagerListItemSchema,
  type AddManagerPayload,
} from '../schemas/associate-manager.schema';
import { managerKeys } from './query-keys';

/**
 * POST /admin/managers — promote an admin to associate manager.
 *
 * Idempotent on the BE: promoting someone who is already a manager returns
 * their existing row with the roster intact rather than resetting it.
 *
 * The optional branding fields are PRO-FACING (what a pro sees when they ask
 * who they report to), not a copy of the admin's account details. The BE
 * requires `phone_number` to be E.164 if sent at all.
 */
export const useAddManager = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: AddManagerPayload) =>
      apiPost('/admin/managers', payload, ManagerListItemSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: managerKeys.lists() });
      queryClient.invalidateQueries({ queryKey: managerKeys.me() });
    },
  });
};
