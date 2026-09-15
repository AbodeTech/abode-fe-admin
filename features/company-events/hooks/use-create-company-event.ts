'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';

import type { CompanyEventType } from '../schemas/company-event.schema';
import { companyEventKeys } from './query-keys';

const CREATE_COMPANY_EVENT_MUTATION = graphql(`
  mutation CreateCompanyEvent($input: CreateCompanyEventInput!) {
    createCompanyEvent(input: $input) {
      id
      title
      type
      status
    }
  }
`);

export interface CreateCompanyEventInput {
  title: string;
  type: CompanyEventType;
  /**
   * One or more estates. Name both the flex and the full-ownership record to
   * run one allocation day across both products.
   */
  assets: string[];
  date: string;
  time: string;
  availableSize?: number;
  sizeUnit?: string;
  /** Free-text location names — the server assigns each an id. */
  pickupLocations?: string[];
}

/** `createCompanyEvent` — creates either tab's event shape, always `draft`. */
export const useCreateCompanyEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      title,
      type,
      assets,
      date,
      time,
      availableSize,
      sizeUnit,
      pickupLocations,
    }: CreateCompanyEventInput) =>
      execute(CREATE_COMPANY_EVENT_MUTATION, {
        input: {
          title,
          type,
          assets,
          date,
          time,
          // `available_size` and `size_unit` are ignored on a site
          // inspection, so only send them when they carry meaning.
          ...(availableSize !== undefined ? { available_size: availableSize } : {}),
          ...(sizeUnit ? { size_unit: sizeUnit } : {}),
          ...(pickupLocations?.length
            ? { pickup_locations: pickupLocations.map((name) => ({ name })) }
            : {}),
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyEventKeys.all });
    },
  });
};
