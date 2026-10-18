'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

import { CompanyEventSchema } from '../schemas/company-event.schema';
import { companyEventKeys } from './query-keys';
import { useCompanyEventAssets } from './use-company-event-assets';

/**
 * `GET /admin/company-events/:id`. `asset_name` isn't on the real response —
 * joined in from `useCompanyEventAssets()`, same as `useCompanyEvents`.
 */
export const useCompanyEvent = (eventId: string | undefined) => {
  const assetsQuery = useCompanyEventAssets();

  const query = useQuery({
    queryKey: companyEventKeys.detail(eventId ?? ''),
    queryFn: () => apiGet(`/admin/company-events/${eventId}`, CompanyEventSchema),
    enabled: !!eventId,
  });

  const data = useMemo(() => {
    if (!query.data) return query.data;
    const asset = (assetsQuery.data ?? []).find((a) => a._id === query.data!.asset_id);
    return { ...query.data, asset_name: asset?.name ?? query.data.asset_id };
  }, [query.data, assetsQuery.data]);

  return { ...query, data };
};
