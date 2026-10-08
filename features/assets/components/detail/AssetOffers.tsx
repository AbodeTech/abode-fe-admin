"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { ChevronDown, History, Loader2, MoreVertical, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { formatNaira } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

import { OFFER_TYPES, OFFER_TYPE_LABELS, usesFoModel } from "../../schemas/asset.schema";
import {
  configuredSqm,
  type Offer,
  type Size,
} from "../../schemas/asset-detail.schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useAssetDetail } from "../../hooks/use-asset-detail";
import { useUpdateOffer } from "../../hooks/use-offer-mutations";
import { useAssetFormStore } from "../../store/asset-form-store";
import { FlexPricingSheet } from "./FlexPricingSheet";
import { FlexSizesTable } from "./FlexSizesTable";
import { PlansTable } from "./PlansTable";
import { OfferConfigHistorySheet } from "./OfferConfigHistorySheet";
import { OfferEditDialogs } from "./OfferEditDialogs";
import { OfferLandPoolsPanel } from "./OfferLandPoolsPanel";

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  "all-inclusive": "All inclusive",
  "partially-inclusive": "Partially inclusive",
};

function SizeCard({
  size,
  isFo,
  offerType,
}: {
  size: Size;
  /** Full-ownership model — full ownership and commercial carry a document fee. */
  isFo: boolean;
  offerType: string;
}) {
  const openOfferEdit = useAssetFormStore((state) => state.openOfferEdit);

  return (
    <div className="rounded-lg border">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b bg-muted/30 px-3.5 py-2.5">
        <strong className="text-sm font-semibold tabular-nums">{size.size_sqm.toLocaleString()} sqm</strong>

        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs text-muted-foreground tabular-nums">
            {size.configured_units.toLocaleString()} configured units · {configuredSqm(size).toLocaleString()} sqm
            {isFo && typeof size.document_fee === "number"
              ? ` · document fee ${formatNaira(size.document_fee)}`
              : ""}
          </p>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => openOfferEdit({ kind: "size", offerType, sizeId: size._id })}
          >
            Edit
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`More actions for ${size.size_sqm} sqm`}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                variant="destructive"
                onClick={() => openOfferEdit({ kind: "delete-size", offerType, sizeId: size._id })}
              >
                Delete size
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="space-y-3 p-4">
        <PlansTable size={size} offerType={offerType} />

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => openOfferEdit({ kind: "plan", offerType, sizeId: size._id })}
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add plan
        </Button>
      </div>
    </div>
  );
}

function OfferCard({
  assetId,
  offer,
  onEditPricing,
  onOpenHistory,
}: {
  assetId: string;
  offer: Offer;
  /** Flex only — opens the pricing editor on a size. */
  onEditPricing: (sizeId: string) => void;
  /** Flex only — the mockup puts History in the Flex card's header. */
  onOpenHistory: () => void;
}) {
  const isFo = usesFoModel(offer.offer_type);
  const updateOffer = useUpdateOffer(assetId, offer.offer_type);
  const openOfferEdit = useAssetFormStore((state) => state.openOfferEdit);

  // A single boolean against its own endpoint — a Save button for a switch is
  // friction, so it writes immediately.
  const handleToggle = (next: boolean) => {
    updateOffer.mutate(
      { is_active: next },
      {
        onSuccess: () =>
          toast.success(
            next
              ? `${OFFER_TYPE_LABELS[offer.offer_type]} is on sale`
              : `${OFFER_TYPE_LABELS[offer.offer_type]} taken off sale`
          ),
        onError: (error) => toast.error(error.message || "Couldn't update the offer"),
      }
    );
  };

  const label = OFFER_TYPE_LABELS[offer.offer_type];
  const isFlex = offer.offer_type === "flex";

  return (
    <section className="overflow-hidden rounded-lg border">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3.5">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">{label}</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {isFlex
              ? `Allocation qualification ${offer.allocation_qualification_pct}%`
              : `${offer.allocation_qualification_pct}% qualifies for allocation`}
            {offer.payment_type ? ` · ${PAYMENT_TYPE_LABELS[offer.payment_type]}` : ""}
          </p>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2.5">
          {/* The status pill is also the control that changes it — the offer
              edit dialog has no on/off-sale field, and the design has no
              separate button for it. */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                disabled={updateOffer.isPending}
                aria-label={`${label} is ${offer.is_active ? "on sale" : "off sale"} — change`}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-semibold",
                  offer.is_active ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"
                )}
              >
                {updateOffer.isPending ? <Loader2 className="h-3 w-3 animate-spin" aria-hidden /> : null}
                {offer.is_active ? "On sale" : "Off sale"}
                <ChevronDown className="h-3 w-3" aria-hidden />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => handleToggle(!offer.is_active)}>
                {offer.is_active ? "Take off sale" : "Put on sale"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {isFlex ? (
            <Button type="button" variant="outline" size="sm" onClick={onOpenHistory}>
              <History className="mr-1.5 h-3.5 w-3.5" />
              History
            </Button>
          ) : null}

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => openOfferEdit({ kind: "offer", offerType: offer.offer_type })}
          >
            Edit offer
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => openOfferEdit({ kind: "size", offerType: offer.offer_type })}
          >
            Add size
          </Button>
        </div>
      </div>

      <div className="space-y-3 p-4">
        {offer.sizes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sizes on this offer.</p>
        ) : isFlex ? (
          <FlexSizesTable sizes={offer.sizes} onEditPricing={onEditPricing} />
        ) : (
          offer.sizes.map((size) => (
            <SizeCard
              key={size._id}
              size={size}
              isFo={isFo}
              offerType={offer.offer_type}
            />
          ))
        )}
      </div>
    </section>
  );
}

/**
 * The Offers tab, in the asset-detail design's order: the "Offer land pools"
 * table, then one card per offer with its sizes and payment plans.
 */
export function AssetOffers() {
  const params = useParams<{ id: string }>();
  const { data: asset } = useAssetDetail(params.id);
  const openOfferEdit = useAssetFormStore((state) => state.openOfferEdit);
  const [historyOpen, setHistoryOpen] = useState(false);
  // Each open is a fresh editor session (its own key): the sheet starts on the size that was
  // clicked, with no leftover chip selection or "published" badge from the last time.
  const [pricing, setPricing] = useState<{ session: number; sizeId: string | null; open: boolean }>({
    session: 0,
    sizeId: null,
    open: false,
  });

  if (!asset) return null;

  const flexOffer = asset.offers.find((offer) => offer.offer_type === "flex");
  const openPricing = (sizeId: string) =>
    setPricing((current) => ({ session: current.session + 1, sizeId, open: true }));

  // Developer plot has no size/plan tree in Phase 1 (see asset.schema.ts's
  // OFFER_TYPES doc comment) — it exists only as a Land Account product pool,
  // never as an addable offer here.
  const missingOfferTypes = OFFER_TYPES.filter(
    (offerType) =>
      offerType !== 'developer-plot' && !asset.offers.some((offer) => offer.offer_type === offerType)
  );

  return (
    <div className="space-y-4">
      <OfferLandPoolsPanel
        assetId={params.id}
        action={
          <>
            {/* With a Flex offer, History lives in that card's header (the Flex 2.0 mockup);
                an asset without one keeps it here. */}
            {!flexOffer ? (
              <Button type="button" variant="outline" size="sm" onClick={() => setHistoryOpen(true)}>
                <History className="mr-1.5 h-3.5 w-3.5" />
                History
              </Button>
            ) : null}
            {missingOfferTypes.length > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="sm">
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Add offer
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {missingOfferTypes.map((offerType) => (
                    <DropdownMenuItem key={offerType} onClick={() => openOfferEdit({ kind: "add-offer", offerType })}>
                      {OFFER_TYPE_LABELS[offerType]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </>
        }
      />

      {asset.offers.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center">
          <p className="font-medium">No offers</p>
          <p className="mt-1 text-sm text-muted-foreground">
            This asset has nothing on sale. Use Add offer above to start one.
          </p>
        </div>
      ) : (
        asset.offers.map((offer) => (
          <OfferCard
            key={offer._id}
            assetId={params.id}
            offer={offer}
            onEditPricing={openPricing}
            onOpenHistory={() => setHistoryOpen(true)}
          />
        ))
      )}

      <OfferEditDialogs asset={asset} />
      {flexOffer ? (
        <FlexPricingSheet
          key={pricing.session}
          assetId={params.id}
          sizes={flexOffer.sizes}
          sizeId={pricing.sizeId}
          open={pricing.open}
          onOpenChange={(open) => setPricing((current) => ({ ...current, open }))}
        />
      ) : null}
      <OfferConfigHistorySheet assetId={params.id} open={historyOpen} onOpenChange={setHistoryOpen} />
    </div>
  );
}
