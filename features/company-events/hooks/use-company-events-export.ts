'use client';

import { useMutation } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';

import { companyEventKeys } from './query-keys';
import { GET_COMPANY_EVENTS_QUERY, type CompanyEventListFilters } from './use-company-events';

const GET_COMPANY_EVENT_ASSET_NAMES_QUERY = graphql(`
  query GetCompanyEventAssetNames($page: Int!, $limit: Int!) {
    getAllAdminAssets(page: $page, limit: $limit) {
      data {
        _id
        asset_name
        asset_type
      }
    }
  }
`);

export const COMPANY_EVENTS_EXPORT_ROW_CAP = 1_000;
const EXPORT_PAGE_SIZE = 100;
const ASSET_LOOKUP_LIMIT = 200;

export const fetchCompanyEventsExportRows = async (
  filters: Omit<CompanyEventListFilters, 'page' | 'limit'>
) => {
  const fetchPage = (page: number) =>
    execute(GET_COMPANY_EVENTS_QUERY, {
      page,
      limit: EXPORT_PAGE_SIZE,
      filter: {
        type: filters.type || undefined,
        status: filters.status || undefined,
        q: filters.search || undefined,
      },
    }).then((result) => result.companyEvents);

  const rows: Awaited<ReturnType<typeof fetchPage>>['data'] = [];
  let page = 1;
  let total = Infinity;

  while (rows.length < total && rows.length < COMPANY_EVENTS_EXPORT_ROW_CAP) {
    const pageResult = await fetchPage(page);
    total = pageResult.count ?? pageResult.data.length;
    rows.push(...pageResult.data);
    if (pageResult.data.length < EXPORT_PAGE_SIZE) break;
    page += 1;
  }

  // `asset` is an ID on the schema — the estate name is joined in here
  // rather than read off the list query's cache, since this fetches its own
  // pages independently of whatever the table is currently showing.
  const assets = await execute(GET_COMPANY_EVENT_ASSET_NAMES_QUERY, {
    page: 1,
    limit: ASSET_LOOKUP_LIMIT,
  });
  const byId = new Map(
    (assets.getAllAdminAssets?.data ?? [])
      .filter((a): a is NonNullable<typeof a> => a !== null)
      .map((a) => [a._id, a])
  );
  // An event can name several estates, so these are joined into one cell
  // with a count beside it — one row per event keeps the sheet pivotable,
  // and asset_count makes a multi-estate day visible without parsing the
  // string.
  const joined = rows.map((event) => ({
    ...event,
    asset_names: event.assets
      .map((id) => {
        const asset = byId.get(id);
        if (!asset) return id;
        return asset.asset_type ? `${asset.asset_name} (${asset.asset_type})` : asset.asset_name;
      })
      .join(', '),
    asset_count: event.assets.length,
  }));

  return { rows: joined, truncated: rows.length < total };
};

export interface CompanyEventsExportResult {
  rows: Awaited<ReturnType<typeof fetchCompanyEventsExportRows>>['rows'];
  truncated: boolean;
}

export const useCompanyEventsExport = () => {
  return useMutation({
    mutationKey: companyEventKeys.export('list'),
    mutationFn: (filters: Omit<CompanyEventListFilters, 'page' | 'limit'>) =>
      fetchCompanyEventsExportRows(filters),
  });
};
