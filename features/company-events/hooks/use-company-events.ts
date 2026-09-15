'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';

import type {
  CompanyEventStatus,
  CompanyEventType,
  EventSizeUnit,
} from '../schemas/company-event.schema';
import { companyEventKeys } from './query-keys';
import { useCompanyEventAssets } from './use-company-event-assets';

export const GET_COMPANY_EVENTS_QUERY = graphql(`
  query GetCompanyEvents($filter: CompanyEventFilterInput, $page: Int!, $limit: Int!) {
    companyEvents(filter: $filter, page: $page, limit: $limit) {
      count
      data {
        id
        title
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
  }
`);

/**
 * The filters proper. Kept free of an index signature so
 * `Omit<CompanyEventListFilters, 'page' | 'limit'>` still names its fields —
 * an index signature collapses every known key under Omit.
 */
export interface CompanyEventListFilters {
  page?: number;
  limit?: number;
  type?: CompanyEventType | null;
  status?: CompanyEventStatus | null;
  /** Sent as `q` — the schema's own param name for a title match. */
  search?: string | null;
}

/** The same shape, widened so it can be spread into a query key. */
export interface CompanyEventFilters extends CompanyEventListFilters {
  [key: string]: unknown;
}

export const DEFAULT_COMPANY_EVENT_LIMIT = 20;

/**
 * Turns the event's asset ids into display names. An id with no matching
 * asset falls back to the raw id rather than vanishing — a silently shorter
 * list would read as an event covering fewer estates than it does.
 */
export const joinAssetNames = (
  assetIds: readonly string[],
  byId: Map<string, { name: string; type: string | null }>
) => {
  const asset_names = assetIds.map((id) => {
    const asset = byId.get(id);
    if (!asset) return id;
    return asset.type ? `${asset.name} (${asset.type})` : asset.name;
  });
  return { asset_names, asset_label: asset_names.join(', ') };
};

/**
 * `companyEvents` — list, newest first.
 *
 * `assets` is a list of ids, so the estate names are joined in here from
 * `useCompanyEventAssets()`. Plural because one physical estate is two Asset
 * records — flex and full-ownership are separate documents — so a day covering
 * both products names both. Consumers read `.asset_names` (labelled with their
 * product) and `.asset_label` for a ready-made display string.
 */
export const useCompanyEvents = (filters: CompanyEventFilters = {}) => {
  const { page = 1, limit = DEFAULT_COMPANY_EVENT_LIMIT, type, status, search } = filters;
  const assetsQuery = useCompanyEventAssets();

  const query = useQuery({
    queryKey: companyEventKeys.list(filters),
    queryFn: () =>
      execute(GET_COMPANY_EVENTS_QUERY, {
        page,
        limit,
        filter: {
          type: type || undefined,
          status: status || undefined,
          q: search || undefined,
        },
      }),
    select: (data) => ({
      count: data.companyEvents.count,
      // The schema types these as String!, but the server only ever emits
      // the documented set, so they are narrowed once here rather than
      // cast at every badge map and filter in the UI.
      items: data.companyEvents.data.map((event) => ({
        ...event,
        type: event.type as CompanyEventType,
        status: event.status as CompanyEventStatus,
        size_unit: event.size_unit as EventSizeUnit,
      })),
    }),
  });

  const data = useMemo(() => {
    if (!query.data) return query.data;
    const byId = new Map((assetsQuery.data ?? []).map((asset) => [asset._id, asset]));
    return {
      ...query.data,
      items: query.data.items.map((event) => ({
        ...event,
        ...joinAssetNames(event.assets, byId),
      })),
    };
  }, [query.data, assetsQuery.data]);

  return { ...query, data };
};

export type CompanyEventRow = NonNullable<ReturnType<typeof useCompanyEvents>['data']>['items'][number];
