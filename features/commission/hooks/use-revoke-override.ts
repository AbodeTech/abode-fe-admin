'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { apiDelete } from '@/lib/api-client';

import type { OverrideType } from '../schemas/override.schema';
import { commissionKeys } from './query-keys';

const RevokeResponseSchema = z.object({
  revoked: z.boolean(),
  id: z.string(),
  type: z.string(),
});

/**
 * DELETE /admin/commission/overrides/:type/:id.
 *
 * Despite the verb this is a **soft delete** — the BE sets `revoked_at` and
 * keeps the row:
 *
 *   model.findByIdAndUpdate(id, { $set: { revoked_at: new Date() } })
 *
 * The record has to survive because it is the explanation for money still
 * moving: plans created while it was active keep paying its rate for life, and
 * their audit trail says `override_source` without naming the override.
 *
 * Revoking changes nothing about existing plans. It only removes the override
 * from the resolution chain for plans created from now on.
 */
export const useRevokeOverride = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ type, id }: { type: OverrideType; id: string }) =>
      apiDelete(`/admin/commission/overrides/${type}/${id}`, RevokeResponseSchema),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: commissionKeys.overrides() });
    },
  });
};
