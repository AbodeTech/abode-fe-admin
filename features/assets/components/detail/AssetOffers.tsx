"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { ChevronDown, History, Loader2, MoreVertical, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AdminDesktopTableWrap,
  AdminMobileCard,
  AdminMobileField,
  AdminMobileStack,
} from "@/components/shared/admin-responsive-table";
import { formatNaira } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

import { OFFER_TYPES, OFFER_TYPE_LABELS, usesFoModel } from "../../schemas/asset.schema";
import {
  configuredSqm,
  sortedPlans,
  totalSellingPrice,
  type Offer,
  type Plan,
  type Size,
} from "../../schemas/asset-detail.schema";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { useAssetDetail } from "../../hooks/use-asset-detail";
import { useUpdateOffer } from "../../hooks/use-offer-mutations";
import { useAssetFormStore } from "../../store/asset-form-store";
import { OfferConfigHistorySheet } from "./OfferConfigHistorySheet";
import { OfferEditDialogs } from "./OfferEditDialogs";
import { OfferLandPoolsPanel } from "./OfferLandPoolsPanel";

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  "all-inclusive": "All inclusive",
  "partially-inclusive": "Partially inclusive",
};

function planTerms(plan: Plan): string {
  if (plan.tenor_months === 0) return "Paid in full";
  if (plan.tenor_months === 1) return "Single payment";
  return `${formatNaira(plan.initial_payment)} then ${formatNaira(plan.monthly_installment)}/mo`;
}

function PlansTable({
  size,
  offerType,
}: {
  size: Size;
  offerType: string;
}) {
  const openOfferEdit = useAssetFormStore((state) => state.openOfferEdit);
  const plans = sortedPlans(size.plans);
  // The backend refuses to delete a size's only plan (`LAST_PLAN`), so the
  // action is disabled rather than attempted.
  const isOnlyPlan = plans.length <= 1;

  if (plans.length === 0) {
    return <p className="text-sm text-muted-foreground">No plans on this size.</p>;
  }

  return (
    <>
      <AdminDesktopTableWrap>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tenor</TableHead>
              <TableHead>Land price</TableHead>
              <TableHead>Terms</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-px" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {plans.map((plan) => (
              <TableRow key={plan.tenor_months}>
                <TableCell className="text-sm whitespace-nowrap">
                  {plan.tenor_months === 0 ? (
                    <span className="font-medium">Outright</span>
                  ) : (
                    <span className="tabular-nums">{plan.tenor_months} months</span>
                  )}
                </TableCell>
                <TableCell className="text-sm font-medium tabular-nums">
                  {formatNaira(plan.land_price)}
                  {plan.development_levy > 0 || plan.document_levy > 0 ? (
                    <span className="block text-xs font-normal text-muted-foreground">
                      Total {formatNaira(totalSellingPrice(plan))}
                    </span>
                  ) : null}
                </TableCell>
                <TableCell className="text-sm tabular-nums text-muted-foreground">
                  {planTerms(plan)}
                </TableCell>
                <TableCell className="text-sm">
                  {plan.is_active === false ? (
                    <span className="text-muted-foreground">Inactive</span>
                  ) : plan.is_promo ? (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">Promo</span>
                  ) : (
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600">
                      Active
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" aria-label="Plan actions">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() =>
                          openOfferEdit({
                            kind: "plan",
                            offerType,
                            sizeId: size._id,
                            tenor: plan.tenor_months,
                          })
                        }
                      >
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        disabled={isOnlyPlan}
                        onClick={() =>
                          openOfferEdit({
                            kind: "delete-plan",
                            offerType,
                            sizeId: size._id,
                            tenor: plan.tenor_months,
                          })
                        }
                      >
                        {isOnlyPlan ? "Can't delete the only plan" : "Delete"}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminDesktopTableWrap>

      <AdminMobileStack>
        {plans.map((plan) => (
          <AdminMobileCard
            key={plan.tenor_months}
            title={plan.tenor_months === 0 ? "Outright" : `${plan.tenor_months} months`}
            subtitle={formatNaira(plan.land_price)}
          >
            <AdminMobileField label="Terms" value={planTerms(plan)} />
            {plan.development_levy > 0 || plan.document_levy > 0 ? (
              <AdminMobileField label="Total selling price" value={formatNaira(totalSellingPrice(plan))} />
            ) : null}
            {plan.is_promo ? <AdminMobileField label="Promo" value="Yes" /> : null}
          </AdminMobileCard>
        ))}
      </AdminMobileStack>
    </>
  );
}

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
}: {
  assetId: string;
  offer: Offer;
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

  return (
    <section className="overflow-hidden rounded-lg border">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3.5">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">{label}</h3>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            {offer.allocation_qualification_pct}% qualifies for allocation
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

  if (!asset) return null;

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
            <Button type="button" variant="outline" size="sm" onClick={() => setHistoryOpen(true)}>
              <History className="mr-1.5 h-3.5 w-3.5" />
              History
            </Button>
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
          <OfferCard key={offer._id} assetId={params.id} offer={offer} />
        ))
      )}

      <OfferEditDialogs asset={asset} />
      <OfferConfigHistorySheet assetId={params.id} open={historyOpen} onOpenChange={setHistoryOpen} />
    </div>
  );
}
