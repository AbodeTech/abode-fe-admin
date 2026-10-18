'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGetPaged } from '@/lib/api-client';

import { CompanyEventAssetOptionSchema } from '../schemas/company-event.schema';
import { companyEventKeys } from './query-keys';

const DROPDOWN_LIMIT = 200;

/**
 * Site/estate options for the create-event form and eligibility filters,
 * sourced from `GET /admin/assets`. Mirrors `useAllocationAssets` in
 * `features/allocation/` — reimplemented locally rather than imported, per
 * CLAUDE.md's no-cross-feature-import rule.
 */
export const useCompanyEventAssets = () => {
  return useQuery({
    queryKey: companyEventKeys.assets,
    queryFn: () =>
      apiGetPaged('/admin/assets', CompanyEventAssetOptionSchema, {
        params: { limit: DROPDOWN_LIMIT },
      }),
    select: (data) => data.items,
  });
};

export type CompanyEventAssetOptions = NonNullable<ReturnType<typeof useCompanyEventAssets>['data']>;
