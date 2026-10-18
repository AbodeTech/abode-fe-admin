import type { PaymentStatus, RequestStatus, RequestType } from '../schemas/request.schema';

/** Mirrors `AdminRequestsFiltersDto` — every filter also narrows the analytics block. */
export type RequestListFilters = {
  request_type?: RequestType;
  status?: RequestStatus;
  payment_status?: PaymentStatus;
  search?: string;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
};

export type RequestStatsFilters = {
  date_from?: string;
  date_to?: string;
};

export const requestKeys = {
  all: ['requests'] as const,
  lists: () => [...requestKeys.all, 'list'] as const,
  list: (filters?: RequestListFilters) => [...requestKeys.lists(), filters ?? {}] as const,
  details: () => [...requestKeys.all, 'detail'] as const,
  detail: (id: string) => [...requestKeys.details(), id] as const,
  stats: (filters?: RequestStatsFilters) => [...requestKeys.all, 'stats', filters ?? {}] as const,
};
