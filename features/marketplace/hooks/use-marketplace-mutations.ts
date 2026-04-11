import { useMutation, useQueryClient } from '@tanstack/react-query';
import { executeRaw } from '@/lib/graphql-client';
import { marketplaceKeys } from './query-keys';

const SUSPEND_LISTING_MUTATION = `
  mutation SuspendMarketplaceListing($listingId: ID!, $reason: String!) {
    suspendMarketplaceListing(listingId: $listingId, reason: $reason) {
      success
      message
      listing { _id status }
    }
  }
`;

const UNSUSPEND_LISTING_MUTATION = `
  mutation UnsuspendMarketplaceListing($listingId: ID!) {
    unsuspendMarketplaceListing(listingId: $listingId) {
      success
      message
      listing { _id status }
    }
  }
`;

const APPROVE_PURCHASE_MUTATION = `
  mutation ApproveMarketplacePurchase($listingId: ID!) {
    approveMarketplacePurchase(listingId: $listingId) {
      success
      message
      listing { _id status }
    }
  }
`;

const REJECT_PURCHASE_MUTATION = `
  mutation RejectMarketplacePurchase($listingId: ID!, $reason: String!) {
    rejectMarketplacePurchase(listingId: $listingId, reason: $reason) {
      success
      message
      listing { _id status }
    }
  }
`;

export const useSuspendListing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ listingId, reason }: { listingId: string; reason: string }) =>
      executeRaw(SUSPEND_LISTING_MUTATION, { listingId, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketplaceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: marketplaceKeys.stats() });
    },
  });
};

export const useUnsuspendListing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (listingId: string) =>
      executeRaw(UNSUSPEND_LISTING_MUTATION, { listingId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketplaceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: marketplaceKeys.stats() });
    },
  });
};

export const useApproveMarketplacePurchase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (listingId: string) =>
      executeRaw(APPROVE_PURCHASE_MUTATION, { listingId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketplaceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: marketplaceKeys.pendingApprovalsList() });
      queryClient.invalidateQueries({ queryKey: marketplaceKeys.stats() });
    },
  });
};

export const useRejectMarketplacePurchase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ listingId, reason }: { listingId: string; reason: string }) =>
      executeRaw(REJECT_PURCHASE_MUTATION, { listingId, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: marketplaceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: marketplaceKeys.pendingApprovalsList() });
      queryClient.invalidateQueries({ queryKey: marketplaceKeys.stats() });
    },
  });
};
