import { useQuery } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';
import { requestKeys } from './query-keys';

const GET_CLIENT_REQUESTS = graphql(`
  query GetAllClientRequests($page: Int!, $limit: Int!, $filters: ClientRequestFilters) {
    getAllClientRequests(page: $page, limit: $limit, filters: $filters)
  }
`);

export type RequestType =
  | 'asset_update'
  | 'document_change'
  | 'location_change'
  | 'custom_request'
  | 'flex'
  | 'full_ownership';

export interface ClientRequestFilters {
  page?: number;
  limit?: number;
  requestType?: RequestType;
  status?: string | null;
  paymentStatus?: string | null;
  searchQuery?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface ClientRequest {
  _id: string;
  requestId?: string;
  requestType: string;
  status: string;
  paymentStatus?: string;
  createdAt?: string;
  fee?: number;
  user?: {
    firstName?: string;
    lastName?: string;
    email?: string;
  };
  details?: Record<string, unknown>;
}

interface ClientRequestResponse {
  requests: ClientRequest[];
  total: number;
  page: number;
  limit: number;
}

interface RequestsPayload {
  requests?: ClientRequest[];
  total?: number;
  page?: number;
  limit?: number;
}

export const DEFAULT_REQUESTS_LIMIT = 25;

export const useClientRequests = (filters: ClientRequestFilters) => {
  const {
    page = 1,
    limit = DEFAULT_REQUESTS_LIMIT,
    requestType,
    status,
    paymentStatus,
    searchQuery,
    startDate,
    endDate,
  } = filters;

  return useQuery({
    queryKey: requestKeys.list(filters as any),
    queryFn: async () => {
      const raw = (await execute(GET_CLIENT_REQUESTS as any, {
        page,
        limit,
        filters: {
          requestType: requestType || undefined,
          status: status || undefined,
          paymentStatus: paymentStatus || undefined,
          searchQuery: searchQuery || undefined,
          dateRange:
            startDate || endDate
              ? {
                from: startDate || undefined,
                to: endDate || undefined,
              }
              : undefined,
        },
      })) as any;

      // getAllClientRequests returns JSON; shape it.
      const parsed = (raw.getAllClientRequests || {}) as RequestsPayload & {
        data?: RequestsPayload;
      };
      const payload: RequestsPayload = parsed?.requests ? parsed : parsed?.data || {};
      const requests: ClientRequest[] = Array.isArray(parsed.requests)
        ? parsed.requests
        : Array.isArray(payload.requests)
          ? payload.requests
          : [];
      const total = parsed.total ?? payload.total ?? 0;
      const res: ClientRequestResponse = {
        requests,
        total,
        page: parsed.page ?? payload.page ?? page,
        limit: parsed.limit ?? payload.limit ?? limit,
      };
      return res;
    },
  });
};

export type ClientRequestsData = Awaited<ReturnType<typeof useClientRequests>['data']>;
