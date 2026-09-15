'use client';

import { useQuery } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';

import { companyEventKeys } from './query-keys';

const DROPDOWN_LIMIT = 200;

const GET_COMPANY_EVENT_ASSETS_QUERY = graphql(`
  query GetCompanyEventAssets($page: Int!, $limit: Int!) {
    getAllAdminAssets(page: $page, limit: $limit) {
      data {
        _id
        asset_name
        asset_location
        asset_type
        asset_option {
          size
        }
      }
    }
  }
`);

export interface CompanyEventAssetOption {
  _id: string;
  name: string;
  location: string | null;
  /**
   * `flex` | `full-ownership`. Nine of the twelve estates exist as one row
   * of each, so this is what tells the two apart in the picker — without it
   * the list shows e.g. "Greencity" twice with nothing to choose between.
   */
  type: string | null;
  /**
   * False for an asset carrying no sellable size. The create form hides
   * these — no allocation day can be run against one — but they stay in the
   * list so an existing event still resolves its estate name.
   */
  selectable: boolean;
}

/**
 * Site/estate options for the create-event form and the event header.
 * Mirrors `useAllocationAssets` in `features/allocation/` — reimplemented
 * locally rather than imported, per CLAUDE.md's no-cross-feature-import rule.
 *
 * Every asset is returned, flagged rather than filtered: the create form
 * shows only `selectable` ones (the same `asset_option` test the allocation
 * filter uses), while `useCompanyEvent`/`useCompanyEvents` need the whole
 * list to resolve an existing event's estate name.
 *
 * `location` rides along as a label for the site picker, not as something to
 * filter on: it is near-1:1 with the site and the stored strings vary for
 * one place ("Agbowa-Ikorodu" vs "Agbowa-Ikorodu, Lagos").
 */
export const useCompanyEventAssets = () => {
  const query = useQuery({
    queryKey: companyEventKeys.assets,
    queryFn: () => execute(GET_COMPANY_EVENT_ASSETS_QUERY, { page: 1, limit: DROPDOWN_LIMIT }),
    // Estates change rarely — no reason to refetch on every mount.
    staleTime: 10 * 60 * 1000,
    select: (data): CompanyEventAssetOption[] =>
      (data.getAllAdminAssets?.data ?? [])
        .filter((asset) => !!asset?._id)
        .map((asset) => ({
          _id: asset!._id as string,
          name: asset!.asset_name ?? (asset!._id as string),
          location: asset!.asset_location?.trim() || null,
          type: asset!.asset_type?.trim() || null,
          selectable: (asset!.asset_option?.length ?? 0) > 0,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
  });

  return query;
};

export type CompanyEventAssetOptions = NonNullable<
  ReturnType<typeof useCompanyEventAssets>['data']
>;
