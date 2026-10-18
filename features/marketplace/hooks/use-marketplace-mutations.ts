'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiPost } from '@/lib/api-client';

import { MarketplaceListingSchema } from '../schemas/marketplace.schema';
import { marketplaceKeys } from './query-keys';

function invalidateAll(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: marketplaceKeys.lists() });
  queryClient.invalidateQueries({ queryKey: marketplaceKeys.pendingApprovalsList() });
  queryClient.invalidateQueries({ queryKey: marketplaceKeys.stats() });
}

/** POST /admin/marketplace/listings/:id/suspend — body: SuspendListingDto. */
export const useSuspendListing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiPost(`/admin/marketplace/listings/${id}/suspend`, { reason }, MarketplaceListingSchema),
    onSuccess: () => invalidateAll(queryClient),
  });
};

/** POST /admin/marketplace/listings/:id/unsuspend — no body. */
export const useUnsuspendListing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiPost(`/admin/marketplace/listings/${id}/unsuspend`, {}, MarketplaceListingSchema),
    onSuccess: () => invalidateAll(queryClient),
  });
};

/** POST /admin/marketplace/listings/:id/approve — transfers ownership, no body. */
export const useApproveMarketplacePurchase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiPost(`/admin/marketplace/listings/${id}/approve`, {}, MarketplaceListingSchema),
    onSuccess: () => invalidateAll(queryClient),
  });
};

/** POST /admin/marketplace/listings/:id/reject — body: RejectPurchaseDto. */
export const useRejectMarketplacePurchase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      apiPost(`/admin/marketplace/listings/${id}/reject`, { reason }, MarketplaceListingSchema),
    onSuccess: () => invalidateAll(queryClient),
  });
};
