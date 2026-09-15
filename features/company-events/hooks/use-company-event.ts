'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { TypedDocumentNode } from '@graphql-typed-document-node/core';
import { parse } from 'graphql';
import { execute } from '@/lib/graphql-client';

import type {
  CompanyEventStatus,
  CompanyEventType,
  EventSizeUnit,
} from '../schemas/company-event.schema';
import { companyEventKeys } from './query-keys';
import { joinAssetNames, type RawCompanyEvent } from './use-company-events';
import { useCompanyEventAssets } from './use-company-event-assets';

// NOTE: excluded from codegen (see codegen.ts) until the allocation-events
// backend lands on staging. See the note in use-event-registrations.ts.
const GET_COMPANY_EVENT_QUERY = parse(`
  query GetCompanyEvent($id: ID!) {
    companyEvent(id: $id) {
      id
      title
      slug
      public_url
      open_registration
      type
      assets
      date
      time
      starts_at
      available_size
      reserved_size
      remaining_capacity
      size_unit
      status
      createdAt
      pickup_locations {
        id
        name
        seat_limit
      }
    }
  }
`) as unknown as TypedDocumentNode<
  { companyEvent: RawCompanyEvent },
  { id: string }
>;

/** `companyEvent(id)`. Estate names are joined in, same as `useCompanyEvents`. */
export const useCompanyEvent = (eventId: string | undefined) => {
  const assetsQuery = useCompanyEventAssets();

  const query = useQuery({
    queryKey: companyEventKeys.detail(eventId ?? ''),
    queryFn: () => execute(GET_COMPANY_EVENT_QUERY, { id: eventId as string }),
    enabled: !!eventId,
    select: (data) => ({
      ...data.companyEvent,
      // Narrowed here for the same reason as in useCompanyEvents.
      type: data.companyEvent.type as CompanyEventType,
      status: data.companyEvent.status as CompanyEventStatus,
      size_unit: data.companyEvent.size_unit as EventSizeUnit,
    }),
  });

  const data = useMemo(() => {
    if (!query.data) return query.data;
    const byId = new Map((assetsQuery.data ?? []).map((a) => [a._id, a]));
    return { ...query.data, ...joinAssetNames(query.data.assets, byId) };
  }, [query.data, assetsQuery.data]);

  return { ...query, data };
};

export type CompanyEventDetail = NonNullable<ReturnType<typeof useCompanyEvent>['data']>;
