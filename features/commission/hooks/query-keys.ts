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

export type PreviewParams = {
  userId: string;
  assetId: string;
  offerType: OfferType | '';
};

export const commissionKeys = {
  all: ['commission'] as const,

  /** The active config plus its recent versions — one query, one cache entry. */
  config: () => [...commissionKeys.all, 'config'] as const,

  overrides: () => [...commissionKeys.all, 'overrides'] as const,
  overrideList: (filters?: OverrideListFilters) =>
    [...commissionKeys.overrides(), filters ?? {}] as const,

  /** The dry-run resolve (ticket 9b, live 2026-07-28). */
  preview: (params: PreviewParams) => [...commissionKeys.all, 'preview', params] as const,

  audits: () => [...commissionKeys.all, 'audit'] as const,
  audit: (paymentPlanId: string) => [...commissionKeys.audits(), paymentPlanId] as const,
};
