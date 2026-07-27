import { cn } from '@/lib/utils';

import {
  OFFER_TYPE_LABELS,
  activeOffers,
  type OfferSummary,
} from '../../schemas/asset.schema';

/**
 * The cell that makes a single assets table possible.
 *
 * An asset can carry a flex offer, a full-ownership offer, or both — so offer
 * type is a property of the row rather than a reason for a second table.
 *
 * Filled badge when the offer is on sale, outlined and muted when it isn't.
 */
function OfferBadge({ offer }: { offer: OfferSummary }) {
  return (
    <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
      <span
        className={cn(
          'inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium',
          offer.is_active
            ? 'border-transparent bg-secondary text-secondary-foreground'
            : 'border-border text-muted-foreground'
        )}
      >
        <span
          className={cn(
            'h-1.5 w-1.5 shrink-0 rounded-full',
            offer.is_active ? 'bg-foreground/60' : 'bg-muted-foreground/40'
          )}
          aria-hidden
        />
        {OFFER_TYPE_LABELS[offer.offer_type]}
      </span>

      <span className="text-xs text-muted-foreground tabular-nums">
        {offer.size_count} {offer.size_count === 1 ? 'size' : 'sizes'} ·{' '}
        {offer.plan_count} {offer.plan_count === 1 ? 'plan' : 'plans'}
      </span>
    </div>
  );
}

export function AssetOffersCell({ offers }: { offers: OfferSummary[] }) {
  if (offers.length === 0) {
    return <span className="text-sm text-muted-foreground">No offers</span>;
  }

  // All offers switched off — say so once rather than showing two greyed
  // badges the reader has to decode.
  if (offers.every((offer) => !offer.is_active)) {
    return (
      <div className="space-y-1">
        <span className="text-sm text-muted-foreground">No active offers</span>
        <div className="flex flex-wrap gap-1">
          {activeOffers(offers).map((offer) => (
            <span
              key={offer.offer_type}
              className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground"
            >
              {OFFER_TYPE_LABELS[offer.offer_type]}
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0 space-y-1">
      {activeOffers(offers).map((offer) => (
        <OfferBadge key={offer.offer_type} offer={offer} />
      ))}
    </div>
  );
}
