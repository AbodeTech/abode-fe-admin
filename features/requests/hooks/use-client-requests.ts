'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

import {
  AssetUpdateRequoteSchema,
  ClientRequestSchema,
  RequestListSchema,
} from '../schemas/request.schema';
import { requestKeys, type RequestListFilters } from './query-keys';

/** The BE defaults to 25 and caps at 100. */
export const DEFAULT_REQUESTS_LIMIT = 25;

/**
 * GET /admin/requests — the list plus its analytics block in one round trip.
 *
 * Not the standard paged envelope: the payload is
 * `{requests, total, page, limit, analytics}`, so this goes through `apiGet`
 * with the whole-object schema rather than `apiGetPaged`.
 *
 * `search` matches request_id or the user's name/email — server-side, against
 * the joined user document. Fully populated: names come back as names.
 */
export const useClientRequests = (filters?: RequestListFilters) => {
  const { page = 1, limit = DEFAULT_REQUESTS_LIMIT, ...rest } = filters ?? {};

  return useQuery({
    queryKey: requestKeys.list({ page, limit, ...rest }),
    queryFn: () =>
      apiGet('/admin/requests', RequestListSchema, {
        params: {
          page,
          limit,
          request_type: rest.request_type,
          status: rest.status,
          payment_status: rest.payment_status,
          search: rest.search || undefined,
          date_from: rest.date_from,
          date_to: rest.date_to,
        },
      }),
  });
};

/** GET /admin/requests/:request_id — one request, fully populated. Keyed on `request_id`, not `id`. */
export const useClientRequest = (requestId: string) =>
  useQuery({
    queryKey: requestKeys.detail(requestId),
    queryFn: () => apiGet(`/admin/requests/${requestId}`, ClientRequestSchema),
    enabled: Boolean(requestId),
  });

/**
 * GET /admin/requests/:request_id/asset-update-quote — the quote stored at
 * submit next to the same change priced at today's rates. Read when the
 * approval dialog opens, so it's never served from cache: the point is to
 * catch a catalogue price that moved since submit.
 */
export const useAssetUpdateQuote = (requestId: string, enabled: boolean) =>
  useQuery({
    queryKey: requestKeys.quote(requestId),
    queryFn: () =>
      apiGet(`/admin/requests/${requestId}/asset-update-quote`, AssetUpdateRequoteSchema),
    enabled: enabled && Boolean(requestId),
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
