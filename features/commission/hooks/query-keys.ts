import type { OfferType } from '../schemas/commission.schema';

/**
 * Filters the overrides list query is keyed by — mirrors `OverrideQueryDto`.
 * Named `…ListFilters` to leave `OverrideFilters` free for the UI component.
 */
export type OverrideListFilters = {
  offer_type?: OfferType;
  user_id?: string;
  asset_id?: string;
  include_inactive?: boolean;
};

export type ResolveParams = {
  user_id?: string;
  asset_id?: string;
  offer_type?: OfferType;
};

export const commissionKeys = {
  all: ['commission'] as const,

  /** The active config plus its recent versions — one query, one cache entry. */
  config: () => [...commissionKeys.all, 'config'] as const,

  overrides: () => [...commissionKeys.all, 'overrides'] as const,
  overrideList: (filters?: OverrideListFilters) =>
    [...commissionKeys.overrides(), filters ?? {}] as const,

  /** ⛔ ticket 9b — the resolve endpoint does not exist yet. */
  resolve: (params: ResolveParams) => [...commissionKeys.all, 'resolve', params] as const,

  audits: () => [...commissionKeys.all, 'audit'] as const,
  audit: (paymentPlanId: string) => [...commissionKeys.audits(), paymentPlanId] as const,
};
