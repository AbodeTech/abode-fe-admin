'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { apiGetPaged } from '@/lib/api-client';

import { CompanyEventSchema, type CompanyEventStatus, type CompanyEventType } from '../schemas/company-event.schema';
import { companyEventKeys } from './query-keys';
import { useCompanyEventAssets } from './use-company-event-assets';

export interface CompanyEventFilters {
  page?: number;
  limit?: number;
  type?: CompanyEventType | null;
  status?: CompanyEventStatus | null;
  /** Sent as `q` — the real `ListCompanyEventsQueryDto`'s param name. */
  search?: string | null;
  [key: string]: unknown;
}

export const DEFAULT_COMPANY_EVENT_LIMIT = 20;

/**
 * `GET /admin/company-events` — list, newest first.
 * `asset_name` isn't on the real response (`toEventDto()` only sends
 * `asset_id`) — joined in here from `useCompanyEventAssets()` so every
 * consumer keeps reading `.asset_name` unchanged.
 */
export const useCompanyEvents = (filters: CompanyEventFilters = {}) => {
  const { page = 1, limit = DEFAULT_COMPANY_EVENT_LIMIT, type, status, search } = filters;
  const assetsQuery = useCompanyEventAssets();

  const query = useQuery({
    queryKey: companyEventKeys.list(filters),
    queryFn: () =>
      apiGetPaged('/admin/company-events', CompanyEventSchema, {
        params: {
          page,
          limit,
          type: type || undefined,
          status: status || undefined,
          q: search || undefined,
        },
      }),
  });

  const data = useMemo(() => {
    if (!query.data) return query.data;
    const nameById = new Map((assetsQuery.data ?? []).map((asset) => [asset._id, asset.name]));
    return {
      ...query.data,
      items: query.data.items.map((event) => ({
        ...event,
        asset_name: nameById.get(event.asset_id) ?? event.asset_id,
      })),
    };
  }, [query.data, assetsQuery.data]);

  return { ...query, data };
};
