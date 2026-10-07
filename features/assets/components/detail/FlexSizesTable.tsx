"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight, MoreVertical, Plus } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

import { formatNairaTrim } from "../../lib/flex-pricing-format";
import { sortedPlans, type Size } from "../../schemas/asset-detail.schema";
import { checkpointSummary } from "../../schemas/flex-pricing.schema";
import { useAssetFormStore } from "../../store/asset-form-store";
import { PlansTable } from "./PlansTable";

/* ============================================================
 * The Flex offer's sizes — screen 1 of the Flex 2.0 admin mockup.
 *
 * One row per size: Size · Units available · Pricing · Price version · Status,
 * and a single action. A size is in exactly one pricing mode:
 *
 *   base_plan  — one-line summary + “Edit pricing” (the editor sheet).
 *   tenor_list — the hand-entered plans it has always had, summarised, with
 *                “Convert to base plan”. It keeps working until converted, and
 *                its plans stay editable (expand the row), so nothing existing
 *                is taken away. Existing buyers are never affected.
 *   unpriced   — a new Flex size, created with no plan. Not on sale until its
 *                first price is published, so the action reads “Set pricing”.
 *
 * Full-ownership and commercial offers don't use this — their plans table is
 * untouched.
 * ============================================================ */

const BADGE_TONES = {
  info: "border-transparent bg-blue-100 text-blue-700",
  warn: "border-transparent bg-amber-100 text-amber-700",
  ok: "border-transparent bg-emerald-100 text-emerald-700",
  muted: "border-transparent bg-muted text-muted-foreground",
} as const;

function ToneBadge({ tone, children }: { tone: keyof typeof BADGE_TONES; children: React.ReactNode }) {
  return (
    <Badge variant="outline" className={BADGE_TONES[tone]}>
      {children}
    </Badge>
  );
}

function PricingCell({ size }: { size: Size }) {
  if (size.pricing_mode === "base_plan" && size.pricing) {
    return (
      <>
        <ToneBadge tone="info">Base plan</ToneBadge>
        <p className="mt-1 text-xs text-muted-foreground tabular-nums">
          {formatNairaTrim(size.pricing.base_price_per_unit)} · {size.pricing.base_tenor_months} mo · {checkpointSummary(size.pricing.checkpoints)}
        </p>
      </>
    );
  }

  if (size.pricing_mode === "unpriced") {
    return (
      <>
        <ToneBadge tone="muted">Not priced yet</ToneBadge>
        <p className="mt-1 text-xs text-muted-foreground">Not on sale until its first price is published</p>
      </>
    );
  }

  const tenors = sortedPlans(size.plans).map((plan) => plan.tenor_months);
  return (
    <>
      <ToneBadge tone="warn">Tenor list</ToneBadge>
      <p className="mt-1 text-xs text-muted-foreground">
        {tenors.length} hand-entered plan{tenors.length === 1 ? "" : "s"}
        {tenors.length > 0 ? `: ${tenors.join(" · ")} months` : ""}
      </p>
    </>
  );
}

function VersionCell({ size }: { size: Size }) {
  return size.pricing_mode === "base_plan" && size.pricing ? (
    <Badge variant="outline">Pricing v{size.pricing.live_version}</Badge>
  ) : (
    <span className="text-muted-foreground">—</span>
  );
}

function StatusCell({ size }: { size: Size }) {
  return size.is_active ? <ToneBadge tone="ok">Active</ToneBadge> : <ToneBadge tone="muted">Inactive</ToneBadge>;
}

const ACTION_LABELS: Record<Size["pricing_mode"], string> = {
  base_plan: "Edit pricing",
  tenor_list: "Convert to base plan",
  unpriced: "Set pricing",
};

export function FlexSizesTable({
  sizes,
  onEditPricing,
}: {
  sizes: Size[];
  /** Opens the pricing editor on a size (Edit pricing, Set pricing and Convert to base plan all land there). */
  onEditPricing: (sizeId: string) => void;
}) {
  const openOfferEdit = useAssetFormStore((state) => state.openOfferEdit);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const sizeMenu = (size: Size) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`More actions for ${size.size_sqm} sqm`}>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => openOfferEdit({ kind: "size", offerType: "flex", sizeId: size._id })}>Edit size</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => openOfferEdit({ kind: "delete-size", offerType: "flex", sizeId: size._id })}>
          Delete size
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      <AdminDesktopTableWrap>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Size</TableHead>
              <TableHead>Units available</TableHead>
              <TableHead>Pricing</TableHead>
              <TableHead>Price version</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-px" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sizes.map((size) => {
              const isTenorList = size.pricing_mode === "tenor_list";
              const isOpen = Boolean(expanded[size._id]);
              return (
                <Fragment key={size._id}>
                  <TableRow>
                    <TableCell className="text-sm font-semibold whitespace-nowrap tabular-nums">
                      <span className="inline-flex items-center gap-1">
                        {isTenorList ? (
                          <button
                            type="button"
                            aria-expanded={isOpen}
                            aria-label={`${isOpen ? "Hide" : "Show"} the hand-entered plans for ${size.size_sqm} sqm`}
                            onClick={() => setExpanded((current) => ({ ...current, [size._id]: !isOpen }))}
                            className="-ml-1 rounded p-0.5 text-muted-foreground hover:bg-muted"
                          >
                            {isOpen ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
                          </button>
                        ) : null}
                        {size.size_sqm.toLocaleString()} sqm
                      </span>
                    </TableCell>
                    <TableCell className="text-sm tabular-nums">{size.configured_units.toLocaleString()}</TableCell>
                    <TableCell className="text-sm">
                      <PricingCell size={size} />
                    </TableCell>
                    <TableCell className="text-sm">
                      <VersionCell size={size} />
                    </TableCell>
                    <TableCell className="text-sm">
                      <StatusCell size={size} />
                    </TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <Button type="button" variant="outline" size="sm" onClick={() => onEditPricing(size._id)}>
                        {ACTION_LABELS[size.pricing_mode]}
                      </Button>
                      {sizeMenu(size)}
                    </TableCell>
                  </TableRow>

                  {isTenorList && isOpen ? (
                    <TableRow className="hover:bg-transparent">
                      <TableCell colSpan={6} className="space-y-3 bg-muted/20 p-4 whitespace-normal">
                        <PlansTable size={size} offerType="flex" />
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => openOfferEdit({ kind: "plan", offerType: "flex", sizeId: size._id })}
                        >
                          <Plus className="mr-1 h-3.5 w-3.5" />
                          Add plan
                        </Button>
                      </TableCell>
                    </TableRow>
                  ) : null}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </AdminDesktopTableWrap>

      <AdminMobileStack>
        {sizes.map((size) => (
          <AdminMobileCard key={size._id} title={`${size.size_sqm.toLocaleString()} sqm`} subtitle={<StatusCell size={size} />}>
            <AdminMobileField label="Units available" value={size.configured_units.toLocaleString()} />
            <AdminMobileField label="Pricing" value={<PricingCell size={size} />} />
            <AdminMobileField label="Price version" value={<VersionCell size={size} />} />
            <div className="flex items-center justify-end gap-1 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={() => onEditPricing(size._id)}>
                {ACTION_LABELS[size.pricing_mode]}
              </Button>
              {sizeMenu(size)}
            </div>
            {size.pricing_mode === "tenor_list" ? (
              <div className="space-y-3 border-t pt-3">
                <PlansTable size={size} offerType="flex" />
                <Button type="button" variant="outline" size="sm" onClick={() => openOfferEdit({ kind: "plan", offerType: "flex", sizeId: size._id })}>
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Add plan
                </Button>
              </div>
            ) : null}
          </AdminMobileCard>
        ))}
      </AdminMobileStack>
    </>
  );
}
