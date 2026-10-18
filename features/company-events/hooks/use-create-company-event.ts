'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { apiPost } from '@/lib/api-client';

import { CompanyEventSchema, type CompanyEventType } from '../schemas/company-event.schema';
import { companyEventKeys } from './query-keys';

export interface CreateCompanyEventInput {
  title: string;
  type: CompanyEventType;
  assetId: string;
  date: string;
  time: string;
  availableSize?: number;
  sizeUnit?: string;
  /** Free-text location names — the BE assigns each an `_id`. */
  pickupLocations?: string[];
}

/** `POST /admin/company-events` — creates either tab's event shape. */
export const useCreateCompanyEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      title,
      type,
      assetId,
      date,
      time,
      availableSize,
      sizeUnit,
      pickupLocations,
    }: CreateCompanyEventInput) =>
      apiPost(
        '/admin/company-events',
        {
          title,
          type,
          asset_id: assetId,
          date,
          time,
          ...(availableSize !== undefined ? { available_size: availableSize } : {}),
          ...(sizeUnit ? { size_unit: sizeUnit } : {}),
          ...(pickupLocations?.length
            ? { pickup_locations: pickupLocations.map((name) => ({ name })) }
            : {}),
        },
        CompanyEventSchema
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyEventKeys.all });
    },
  });
};
