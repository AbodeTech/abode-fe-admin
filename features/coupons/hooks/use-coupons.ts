'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

import { apiClient, apiGetPaged, apiPatch, apiPost } from '@/lib/api-client';
import { dispatchMockRequest, isMockApiEnabled } from '@/lib/mocks';

import {
  CouponSchema,
  type CreateCouponInput,
  type UpdateCouponInput,
  type UpdateCouponStatusInput,
} from '../schemas/coupon.schema';
import { couponKeys, type CouponListFilters } from './query-keys';

export const DEFAULT_COUPON_LIMIT = 20;

/**
 * GET /admin/coupons — paginated admin coupon list.
 * Filters: `status`, `applies_to`, `search` (partial code match).
 */
export const useCoupons = (filters?: CouponListFilters) => {
  const { page = 1, limit = DEFAULT_COUPON_LIMIT, ...rest } = filters ?? {};

  return useQuery({
    queryKey: couponKeys.list({ page, limit, ...rest }),
    queryFn: () =>
      apiGetPaged('/admin/coupons', CouponSchema, {
        params: {
          page,
          limit,
          status: rest.status,
          applies_to: rest.applies_to,
          search: rest.search?.trim() || undefined,
        },
      }),
  });
};

function useInvalidatingMutation<TVariables, TData>(
  mutationFn: (variables: TVariables) => Promise<TData>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: couponKeys.lists() });
    },
  });
}

/** POST /admin/coupons */
export const useCreateCoupon = () =>
  useInvalidatingMutation((input: CreateCouponInput) =>
    apiPost('/admin/coupons', input, CouponSchema)
  );

/** PATCH /admin/coupons/:code */
export const useUpdateCoupon = () =>
  useInvalidatingMutation((args: { couponCode: string } & UpdateCouponInput) => {
    const { couponCode, ...body } = args;
    return apiPatch(`/admin/coupons/${encodeURIComponent(couponCode)}`, body, CouponSchema);
  });

/** PATCH /admin/coupons/:code/status */
export const useUpdateCouponStatus = () =>
  useInvalidatingMutation((args: { couponCode: string } & UpdateCouponStatusInput) => {
    const { couponCode, status, reason } = args;
    return apiPatch(
      `/admin/coupons/${encodeURIComponent(couponCode)}/status`,
      { status, ...(reason ? { reason } : {}) },
      CouponSchema
    );
  });

const DeleteCouponResultSchema = z.object({
  success: z.boolean(),
  message: z.string().optional(),
});

/**
 * DELETE /admin/coupons/:code — soft-delete.
 *
 * The BE returns `{ success, message }` without a `data` envelope (same pattern
 * as asset soft-delete), so we cannot use `apiDelete`'s unwrap for the live path.
 */
export const useDeleteCoupon = () =>
  useInvalidatingMutation(async (couponCode: string) => {
    const path = `/admin/coupons/${encodeURIComponent(couponCode)}`;

    if (isMockApiEnabled()) {
      const payload = await dispatchMockRequest({
        method: 'DELETE',
        path,
        query: {},
        body: undefined,
      });
      return DeleteCouponResultSchema.parse(payload);
    }

    const res = await apiClient.delete(path);
    const parsed = DeleteCouponResultSchema.parse(res.data);
    if (!parsed.success) {
      throw new Error(parsed.message ?? 'Failed to delete coupon');
    }
    return parsed;
  });
