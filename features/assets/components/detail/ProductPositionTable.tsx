"use client";

import { useState } from "react";

import { Skeleton } from "@/components/ui/skeleton";
import { useAdminPermissions } from "@/hooks/use-admin-permission";
import { cn } from "@/lib/utils";
import { formatNairaCompact } from "@/lib/utils/format";

import { useAssetDetail } from "../../hooks/use-asset-detail";
import { useLandConfiguration } from "../../hooks/use-land-configuration";
import { useSqmInventory } from "../../hooks/use-sqm-inventory";
import { OFFER_TYPES, OFFER_TYPE_LABELS, type OfferType } from "../../schemas/asset.schema";
import type { AssetDetail } from "../../schemas/asset-detail.schema";
import { lensFigures, productPositions, type LensFigures } from "../../schemas/sqm-inventory.schema";
import { DetailPanel } from "./DetailPanel";

const LENSES = ["sqm", "units", "value"] as const;
type Lens = (typeof LENSES)[number];

const LENS_LABELS: Record<Lens, string> = { sqm: "SQM", units: "Units", value: "Value" };

const COLUMNS = [
  { key: "assigned", label: "Assigned" },
  { key: "available", label: "Available" },
  { key: "selling", label: "Selling" },
  { key: "sold", label: "Sold" },
  { key: "defaulted", label: "Defaulted retained" },
  { key: "allocated", label: "Allocated" },
] as const satisfies readonly { key: keyof LensFigures; label: string }[];

const LENS_NOTES: Record<Lens, string | null> = {
  sqm: null,
  units: "Units are counted from land already divided into sizes. A product with no sizes has no unit count.",
  value:
    "Assigned, Available, Selling and Allocated are estimates at today's catalogue price. Sold and Defaulted retained use the plan's contract price when its held land matches the sqm ledger; a dash means that value cannot be reconciled. Contract value is not cash received.",
};

/** `null` is "not knowable from the backend", shown as an em-dash — never a zero. */
function cellText(value: number | null, lens: Lens): string {
  if (value == null) return "—";
  if (lens === "value") return formatNairaCompact(value);
  // Units can come out fractional if a pool isn't a whole number of plots.
  const rounded = lens === "units" ? Math.round(value * 10) / 10 : value;
  return `${rounded.toLocaleString()}${lens === "sqm" ? " sqm" : ""}`;
}

/**
 * What one unit of each size sells for today: its outright plan's land
 * price, or the cheapest active plan when there is no outright one. Sizes
 * with no active plan are left out, which makes their product's value "—".
 */
function currentPriceBySize(asset: AssetDetail | undefined): Map<string, number> {
  const prices = new Map<string, number>();
  for (const offer of asset?.offers ?? []) {
    for (const size of offer.sizes) {
      const plans = size.plans.filter((plan) => plan.is_active);
      if (plans.length === 0) continue;
      const outright = plans.find((plan) => plan.tenor_months === 0);
      prices.set(size._id, outright?.land_price ?? Math.min(...plans.map((plan) => plan.land_price)));
    }
  }
  return prices;
}

/**
 * Product position — one row per product, in the design's column order, under
 * three lenses.
 *
 * SQM lens (read straight from the backend):
 *  - Assigned            the product's land pool. From the ledger's pool row
 *                        once it exists, otherwise from the land account.
 *  - Available / Selling / Sold
 *                        GET .../sqm-inventory, the product's pool row only
 *                        (see `ProductPosition` for why not the size rows).
 *                        "Selling" is what the ledger holds as reserved,
 *                        "Sold" what it holds as committed, and Available is
 *                        the pool minus both.
 *  - Defaulted retained  sqm on live plans flagged as defaulted. A subset of
 *                        Selling/Sold, not a fifth bucket — the land is still
 *                        held for the customer.
 *  - Allocated           sqm of exact plots bound to a customer's plan.
 *
 * Units are derived from the per-size ledger rows. In the Value lens, stock
 * without a buyer is valued at today's catalogue price, while Sold and
 * Defaulted retained use held plans' contract prices returned by the backend.
 *
 * There is no per-product "Event reserved" column: event places are first
 * come, first served for eligible customers, and Developer Plot is excluded.
 */
export function ProductPositionTable({ assetId }: { assetId: string }) {
  const permissions = useAdminPermissions();
  const canView = permissions.has("view_assets");
  const [lens, setLens] = useState<Lens>("sqm");

  const { data: inventory, isLoading: inventoryLoading } = useSqmInventory(assetId, { enabled: canView });
  const { data: land, isLoading: landLoading } = useLandConfiguration(assetId, { enabled: canView });
  const { data: asset } = useAssetDetail(assetId);

  if (!canView) return null;

  const positions = inventory?.positions ?? [];
  const byProduct = new Map(productPositions(positions).map((position) => [position.offer_type, position]));
  const pools = new Map((land?.products ?? []).map((product) => [product.offer_type, product]));
  const prices = currentPriceBySize(asset);
  const contractValues = new Map((inventory?.contract_values ?? []).map((row) => [row.offer_type, row]));

  function figuresFor(offerType: OfferType): LensFigures {
    const position = byProduct.get(offerType);
    const pool = pools.get(offerType);

    if (lens === "sqm") {
      return {
        assigned: position?.assigned_sqm ?? pool?.assigned_sqm ?? null,
        available: position?.available_sqm ?? null,
        selling: position?.selling_sqm ?? null,
        sold: position?.sold_sqm ?? null,
        defaulted: position?.defaulted_sqm ?? null,
        allocated: position?.allocated_sqm ?? null,
      };
    }

    const worth = (sizeId: string) => (lens === "units" ? 1 : (prices.get(sizeId) ?? null));
    const figures = lensFigures(positions, offerType, worth);
    const contract = contractValues.get(offerType);
    const valued = lens === "value"
      ? { ...figures, sold: contract?.sold_contract_value ?? null, defaulted: contract?.defaulted_contract_value ?? null }
      : figures;
    if (valued.assigned != null) return valued;

    // No ledger rows for this product yet — the land account still knows how
    // many units each size was configured with.
    const sizes = pool?.takes_sizes ? pool.sizes : [];
    if (sizes.length === 0) return valued;
    let assigned = 0;
    for (const size of sizes) {
      const unitWorth = worth(size.id);
      if (unitWorth == null) return valued;
      assigned += size.configured_units * unitWorth;
    }
    return { ...valued, assigned };
  }

  const products = OFFER_TYPES.filter((type) => byProduct.has(type) || pools.has(type));
  const ledgerActive = inventory?.sqm_inventory_active ?? false;
  const note = LENS_NOTES[lens];

  return (
    <DetailPanel
      title="Product position"
      description={
        ledgerActive
          ? "Live square-metre ledger, by product"
          : "Assigned land only — the rest appears once sqm inventory is activated (see the notice above)"
      }
      flush
      action={
        <div className="flex">
          {LENSES.map((option, index) => (
            <button
              key={option}
              type="button"
              onClick={() => setLens(option)}
              aria-pressed={lens === option}
              className={cn(
                "border px-2.5 py-1.5 text-[11px]",
                index === 0 && "rounded-l-md",
                index > 0 && "-ml-px",
                index === LENSES.length - 1 && "rounded-r-md",
                lens === option ? "relative border-foreground bg-foreground text-background" : "bg-background"
              )}
            >
              {LENS_LABELS[option]}
            </button>
          ))}
        </div>
      }
    >
      {inventoryLoading || landLoading ? (
        <div className="p-4">
          <Skeleton className="h-24 w-full" />
        </div>
      ) : products.length === 0 ? (
        <p className="p-6 text-center text-sm text-muted-foreground">
          No product has land assigned yet — set up the land account above.
        </p>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="bg-muted/40">
                  <th className="border-b px-2.5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Product
                  </th>
                  {COLUMNS.map((column) => (
                    <th
                      key={column.key}
                      className="whitespace-nowrap border-b px-2.5 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                    >
                      {column.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.map((offerType) => {
                  const figures = figuresFor(offerType);
                  return (
                    <tr key={offerType} className="border-b last:border-b-0 hover:bg-muted/40">
                      <td className="whitespace-nowrap px-2.5 py-2.5 font-semibold">{OFFER_TYPE_LABELS[offerType]}</td>
                      {COLUMNS.map((column) => (
                        <td
                          key={column.key}
                          className={cn(
                            "whitespace-nowrap px-2.5 py-2.5 text-right tabular-nums",
                            column.key === "defaulted" && figures.defaulted ? "font-semibold text-rose-600" : null
                          )}
                        >
                          {cellText(figures[column.key], lens)}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {note ? <p className="border-t px-4 py-2.5 text-[11px] text-muted-foreground">{note}</p> : null}
        </>
      )}
    </DetailPanel>
  );
}
