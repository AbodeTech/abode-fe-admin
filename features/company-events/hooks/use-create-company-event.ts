'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { parse } from 'graphql';
import { execute } from '@/lib/graphql-client';

import type { CompanyEventType } from '../schemas/company-event.schema';
import { companyEventKeys } from './query-keys';

// NOTE: excluded from codegen (see codegen.ts) until the allocation-events
// backend lands on staging. See the note in use-event-registrations.ts.
const CREATE_COMPANY_EVENT_MUTATION = parse(`
  mutation CreateCompanyEvent($input: CreateCompanyEventInput!) {
    createCompanyEvent(input: $input) {
      id
      title
      type
      status
    }
  }
`) as unknown as TypedDocumentNode<
  { createCompanyEvent: { id: string; title: string; type: string; status: string } },
  { input: Record<string, unknown> }
>;

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
  /**
   * Whether anybody may sign themselves up through the public link, as opposed
   * to only the people we invite. Defaults to true on the server; send false
   * for a closed guest list. It is not a capacity control — visitors are
   * allocated no land.
   */
  openRegistration?: boolean;
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
      openRegistration,
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
          // Only sent when closing the list: the server's default is open, and
          // sending true would restate it on every create.
          ...(openRegistration === false ? { open_registration: false } : {}),
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: companyEventKeys.all });
    },
  });
};
