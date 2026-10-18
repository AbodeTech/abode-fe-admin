import type { Campaign } from '../schemas/campaign.schema';

export const HAMPER_LEGACY_NAME = 'Hamper Campaign';
export const PLOTS_LEGACY_NAME = '1000 Plots Project';

export function findLegacyCampaignId(
  campaigns: Campaign[] | undefined,
  legacyName: string
): string | null {
  const match = campaigns?.find(
    (campaign) => campaign.name.toLowerCase() === legacyName.toLowerCase()
  );
  return match?.id ?? null;
}
