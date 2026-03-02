import { useQuery } from '@tanstack/react-query';
import { executeRaw } from '@/lib/graphql-client';
import { requestKeys } from './query-keys';

/**
 * NOTE: `getAllClientRequests` returns a JSON scalar on the backend, so GraphQL
 * codegen cannot generate types for the response shape. Types are defined manually
 * here. This is a known limitation (Option A) — accepted until the schema is updated
 * to return a properly typed object.
 */

const GET_CLIENT_REQUESTS_QUERY = `
  query GetAllClientRequests($page: Int!, $limit: Int!, $filters: ClientRequestFilters) {
    getAllClientRequests(page: $page, limit: $limit, filters: $filters)
  }
`;

export type RequestType =
  | 'asset_update'
  | 'document_change'
  | 'location_change'
  | 'custom_request';

export interface ClientRequest {
  _id: string;
  requestId?: string;
  requestType: string;
  status: string;
  paymentStatus?: string;
  createdAt?: string;
  fee?: number;
  user?: {
    _id?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    phoneNumber?: string;
  };
  details?: Record<string, unknown>;
}

export interface ClientRequestFilters {
  page?: number;
  limit?: number;
  requestType?: RequestType;
  status?: string | null;
  paymentStatus?: string | null;
  searchQuery?: string | null;
  assetType?: string | null;
  updateType?: string | null;
  category?: string | null;
  hasAsset?: boolean | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface ClientRequestsPayload {
  requests: ClientRequest[];
  total: number;
  page: number;
  limit: number;
  analytics?: Record<string, number>;
}

export const DEFAULT_REQUESTS_LIMIT = 25;

// Shape returned by the GraphQL JSON scalar — parsed manually because codegen can't type it.
interface RawResponse {
  getAllClientRequests: ClientRequestsPayload & { data?: ClientRequestsPayload };
}

function parsePayload(raw: RawResponse): ClientRequestsPayload {
  const outer = raw?.getAllClientRequests;
  if (!outer) return { requests: [], total: 0, page: 1, limit: DEFAULT_REQUESTS_LIMIT };

  // Backend may return payload flat or nested under `.data`
  const payload: ClientRequestsPayload = Array.isArray(outer.requests)
    ? outer
    : (outer.data ?? outer);

  return {
    requests: Array.isArray(payload.requests) ? payload.requests : [],
    total: payload.total ?? 0,
    page: payload.page ?? 1,
    limit: payload.limit ?? DEFAULT_REQUESTS_LIMIT,
    analytics: payload.analytics,
  };
}

export const useClientRequests = (filters: ClientRequestFilters) => {
  const {
    page = 1,
    limit = DEFAULT_REQUESTS_LIMIT,
    requestType,
    status,
    paymentStatus,
    searchQuery,
    assetType,
    updateType,
    category,
    hasAsset,
    startDate,
    endDate,
  } = filters;

  return useQuery({
    queryKey: requestKeys.list(filters as Record<string, unknown>),
    queryFn: async () => {
      const raw = await executeRaw<RawResponse>(GET_CLIENT_REQUESTS_QUERY, {
        page,
        limit,
        filters: {
          requestType: requestType || undefined,
          status: status || undefined,
          paymentStatus: paymentStatus || undefined,
          searchQuery: searchQuery || undefined,
          assetType: assetType || undefined,
          updateType: updateType || undefined,
          category: category || undefined,
          hasAsset: typeof hasAsset === "boolean" ? hasAsset : undefined,
          dateRange:
            startDate || endDate
              ? { from: startDate || undefined, to: endDate || undefined }
              : undefined,
        },
      });
      return parsePayload(raw);
    },
  });
};
