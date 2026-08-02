import type { AdminStatus, PaymentProvider } from '../schemas/withdrawal.schema';

/** Mirrors the queue's query params exactly. */
export type WithdrawalListFilters = {
  admin_status?: AdminStatus;
  payment_provider?: PaymentProvider;
  page?: number;
  limit?: number;
};

export const withdrawalKeys = {
  all: ['withdrawals'] as const,
  lists: () => [...withdrawalKeys.all, 'list'] as const,
  list: (filters?: WithdrawalListFilters) => [...withdrawalKeys.lists(), filters ?? {}] as const,
};
