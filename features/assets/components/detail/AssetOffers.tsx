"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { History, Loader2, MoreVertical, Pencil, Plus } from "lucide-react";
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
import { isMockApiEnabled } from "@/lib/mocks/config";

import { OFFER_TYPES, OFFER_TYPE_LABELS, usesFoModel } from "../../schemas/asset.schema";
import {
  offerConfiguredSqm,
  sortedPlans,
  totalSellingPrice,
  type Offer,
  type Plan,
  type Size,
} from "../../schemas/asset-detail.schema";
import { productCapacity } from "../../schemas/land-configuration.schema";
import { formatSqm } from "@/lib/utils/format";
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
import { SellingChargesPanel } from "./SellingChargesPanel";

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  "all-inclusive": "All inclusive",
  "partially-inclusive": "Partially inclusive",
};

function planTerms(plan: Plan): string {
  if (plan.tenor_months === 0) return "Paid in full";
  if (plan.tenor_months === 1) return "Single payment";
  return `${formatNaira(plan.initial_payment)} then ${formatNaira(plan.monthly_installment)}/mo`;
}

function PlansTable({ size, offerType }: { size: Size; offerType: string }) {
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
                    <span className="rounded-full border px-2 py-0.5 text-xs">Promo</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
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
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b px-4 py-3">
        <p className="font-medium tabular-nums">
          {size.size_sqm.toLocaleString()} sqm
          <span className="ml-2 text-sm font-normal text-muted-foreground">
            {size.configured_units.toLocaleString()} configured units
          </span>
        </p>

        <div className="flex flex-wrap items-center gap-2">
          {isFo && typeof size.document_fee === "number" ? (
            <p className="text-sm text-muted-foreground tabular-nums">
              Document fee {formatNaira(size.document_fee)}
            </p>
          ) : null}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label={`Actions for ${size.size_sqm} sqm`}>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => openOfferEdit({ kind: "size", offerType, sizeId: size._id })}
              >
                Edit size
              </DropdownMenuItem>
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

function OfferCard({ assetId, offer }: { assetId: string; offer: Offer }) {
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

  // Only asset-level product pools set up through the Land Account carry a
  // real `assigned_sqm` — a legacy, not-yet-configured product has no
  // capacity to report against, so nothing renders rather than showing a
  // misleading "0 of 0 sqm" state.
  const hasLandAccount = offer.assigned_sqm > 0;
  const configured = offerConfiguredSqm(offer);
  const capacity = productCapacity({ assigned_sqm: offer.assigned_sqm, configured_sqm: configured });

  return (
    <section className="rounded-lg border">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3">
        <div className="min-w-0">
          <h2 className="font-medium">{OFFER_TYPE_LABELS[offer.offer_type]}</h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {offer.allocation_qualification_pct}% qualifies for allocation
            {offer.payment_type ? ` · ${PAYMENT_TYPE_LABELS[offer.payment_type]}` : ""}
          </p>
          {hasLandAccount ? (
            <p className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
              <span className="text-muted-foreground">
                {formatSqm(configured)} configured of {formatSqm(offer.assigned_sqm)} assigned
              </span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 font-medium",
                  capacity.isOverCapacity
                    ? "bg-rose-500/10 text-rose-600"
                    : capacity.unconfiguredSqm === 0
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-muted text-muted-foreground"
                )}
              >
                {capacity.isOverCapacity
                  ? `Over capacity by ${formatSqm(Math.abs(capacity.unconfiguredSqm))}`
                  : capacity.unconfiguredSqm === 0
                    ? "Fully configured"
                    : `${formatSqm(capacity.unconfiguredSqm)} unconfigured`}
              </span>
              {/* Assigned sqm is edited in exactly one place — the Land
                  Account editor — so this links there rather than adding a
                  second input here that could drift from it. */}
              <Link href={`/assets/${assetId}`} className="text-muted-foreground underline underline-offset-4 hover:text-foreground">
                Edit assigned sqm
              </Link>
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium",
              offer.is_active
                ? "border-[#ABEFC6] bg-[#ECFDF3AB] text-[#067647]"
                : "border-border text-muted-foreground"
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                offer.is_active ? "bg-[#067647]" : "bg-muted-foreground/40"
              )}
              aria-hidden
            />
            {offer.is_active ? "On sale" : "Off sale"}
          </span>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleToggle(!offer.is_active)}
            disabled={updateOffer.isPending}
          >
            {updateOffer.isPending ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" aria-hidden />
            ) : null}
            {offer.is_active ? "Take off sale" : "Put on sale"}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => openOfferEdit({ kind: "offer", offerType: offer.offer_type })}
          >
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Settings
          </Button>
        </div>
      </div>

      <div className="space-y-3 p-4">
        {offer.sizes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No sizes on this offer.</p>
        ) : (
          offer.sizes.map((size) => (
            <SizeCard key={size._id} size={size} isFo={isFo} offerType={offer.offer_type} />
          ))
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => openOfferEdit({ kind: "size", offerType: offer.offer_type })}
        >
          <Plus className="mr-1 h-3.5 w-3.5" />
          Add size
        </Button>
      </div>
    </section>
  );
}

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
      <SellingChargesPanel assetId={params.id} />

      {isMockApiEnabled() ? (
        <div className="flex justify-end">
          <Button type="button" variant="outline" size="sm" onClick={() => setHistoryOpen(true)}>
            <History className="mr-1.5 h-3.5 w-3.5" />
            History
          </Button>
        </div>
      ) : null}

      {asset.offers.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center">
          <p className="font-medium">No offers</p>
          <p className="mt-1 text-sm text-muted-foreground">
            This asset has nothing on sale.
          </p>
        </div>
      ) : (
        asset.offers.map((offer) => (
          <OfferCard key={offer._id} assetId={params.id} offer={offer} />
        ))
      )}

      {/* Ticket 18 resolved 2026-07-28 — the missing offer type can now be added. */}
      {missingOfferTypes.map((offerType) => (
        <button
          key={offerType}
          type="button"
          onClick={() => openOfferEdit({ kind: "add-offer", offerType })}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed p-4 text-sm text-muted-foreground hover:bg-muted/40 hover:text-foreground"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Add {OFFER_TYPE_LABELS[offerType].toLowerCase()} — this asset doesn&apos;t sell it yet
        </button>
      ))}

      <OfferEditDialogs asset={asset} />
      {isMockApiEnabled() ? (
        <OfferConfigHistorySheet assetId={params.id} open={historyOpen} onOpenChange={setHistoryOpen} />
      ) : null}
    </div>
  );
}
