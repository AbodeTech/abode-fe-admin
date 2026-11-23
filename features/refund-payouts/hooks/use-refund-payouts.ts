"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { apiGet, apiGetPaged, apiPost } from "@/lib/api-client";

import {
  RefundPayoutSchema,
  RefundPayoutStatsSchema,
  type RefundPayoutStatus,
} from "../schemas/refund-payout.schema";

export const DEFAULT_REFUND_PAYOUT_LIMIT = 20;

export type RefundPayoutListFilters = {
  /** Customer name or email, estate, or transfer reference. */
  search?: string;
  status?: RefundPayoutStatus;
  page?: number;
  limit?: number;
};

export const refundPayoutKeys = {
  all: ["refund-payouts"] as const,
  list: (filters: RefundPayoutListFilters) => [...refundPayoutKeys.all, "list", filters] as const,
  stats: () => [...refundPayoutKeys.all, "stats"] as const,
};

const listParams = (f: RefundPayoutListFilters, page: number, limit: number) => ({
  page,
  limit,
  search: f.search || undefined,
  status: f.status,
});

export const useRefundPayouts = (filters: RefundPayoutListFilters = {}) => {
  const { page = 1, limit = DEFAULT_REFUND_PAYOUT_LIMIT, ...rest } = filters;
  return useQuery({
    queryKey: refundPayoutKeys.list({ page, limit, ...rest }),
    queryFn: () =>
      apiGetPaged("/admin/refund-payouts", RefundPayoutSchema, { params: listParams(rest, page, limit) }),
    // Something with Paystack settles on its own: show it without a reload.
    refetchInterval: (query) =>
      query.state.data?.items.some((r) => r.status === "processing") ? 30_000 : false,
  });
};

export const useRefundPayoutStats = () =>
  useQuery({
    queryKey: refundPayoutKeys.stats(),
    queryFn: () => apiGet("/admin/refund-payouts/stats", RefundPayoutStatsSchema),
  });

function useRefundMutation<TInput, TOutput>(run: (input: TInput) => Promise<TOutput>) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: run,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: refundPayoutKeys.all });
      // The recovery record shows where its refund is up to.
      queryClient.invalidateQueries({ queryKey: ["recovery-windows"] });
    },
  });
}

/** Sends (or re-sends) through Paystack. 200 even when Paystack refuses: read `status`. */
export const useSendRefundPayout = () =>
  useRefundMutation((input: { id: string }) =>
    apiPost(`/admin/refund-payouts/${input.id}/send`, {}, RefundPayoutSchema)
  );

export const useMarkRefundPayoutPaid = () =>
  useRefundMutation((input: { id: string; reference: string; note?: string }) =>
    apiPost(
      `/admin/refund-payouts/${input.id}/mark-paid`,
      { reference: input.reference, ...(input.note ? { note: input.note } : {}) },
      RefundPayoutSchema
    )
  );

/** Every row the filters select, for the CSV. Capped; says when it stopped short. */
export async function fetchAllRefundPayouts(filters: RefundPayoutListFilters) {
  const PAGE = 100;
  const MAX_PAGES = 50;
  const rows: Awaited<ReturnType<typeof apiGetPaged<typeof RefundPayoutSchema>>>["items"] = [];
  let total: number | null = null;
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const { items, meta } = await apiGetPaged("/admin/refund-payouts", RefundPayoutSchema, {
      params: listParams(filters, page, PAGE),
    });
    if (meta.total != null) total = meta.total;
    rows.push(...items);
    if (items.length < PAGE) return { rows, total, truncated: false };
  }
  return { rows, total, truncated: total == null || rows.length < total };
}
