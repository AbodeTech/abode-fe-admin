'use client';

import { useMutation } from '@tanstack/react-query';

import { apiGetPaged } from '@/lib/api-client';

import {
  CompanyEventAssetOptionSchema,
  CompanyEventSchema,
  type CompanyEvent,
  type CompanyEventWithAssetName,
} from '../schemas/company-event.schema';
import { companyEventKeys } from './query-keys';
import type { CompanyEventFilters } from './use-company-events';

export const COMPANY_EVENTS_EXPORT_ROW_CAP = 1_000;
const EXPORT_PAGE_SIZE = 100;

export interface CompanyEventsExportResult {
  rows: CompanyEventWithAssetName[];
  truncated: boolean;
}

export const fetchCompanyEventsExportRows = async (
  filters: Omit<CompanyEventFilters, 'page' | 'limit'>
): Promise<CompanyEventsExportResult> => {
  const rows: CompanyEvent[] = [];
  let page = 1;
  let total = Infinity;

  while (rows.length < total && rows.length < COMPANY_EVENTS_EXPORT_ROW_CAP) {
    const { items, meta } = await apiGetPaged('/admin/company-events', CompanyEventSchema, {
      params: {
        page,
        limit: EXPORT_PAGE_SIZE,
        type: filters.type || undefined,
        status: filters.status || undefined,
        q: filters.search || undefined,
      },
    });
    total = meta.total ?? items.length;
    rows.push(...items);
    if (items.length < EXPORT_PAGE_SIZE) break;
    page += 1;
  }

  // `asset_name` isn't on the real event response — joined in here, same as
  // `useCompanyEvents`, since this fetches its own pages independent of
  // whatever's currently in the list query's cache.
  const { items: assets } = await apiGetPaged('/admin/assets', CompanyEventAssetOptionSchema, {
    params: { limit: 200 },
  });
  const nameById = new Map(assets.map((a) => [a._id, a.name]));
  const joined = rows.map((event) => ({ ...event, asset_name: nameById.get(event.asset_id) ?? event.asset_id }));

  return { rows: joined, truncated: rows.length < total };
};

export const useCompanyEventsExport = () => {
  return useMutation({
    mutationKey: companyEventKeys.export('list'),
    mutationFn: (filters: Omit<CompanyEventFilters, 'page' | 'limit'>) => fetchCompanyEventsExportRows(filters),
  });
};
