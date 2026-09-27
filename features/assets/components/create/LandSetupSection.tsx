"use client";

import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { cn } from "@/lib/utils";

import { OFFER_TYPES, OFFER_TYPE_LABELS, type OfferType } from "../../schemas/asset.schema";
import type { CreateAssetFormValues } from "../../schemas/create-asset.schema";
import { totalAssignedSqm, unclassifiedSqm } from "../../schemas/land-configuration.schema";
import { NumberInput } from "../detail/NumberInput";

/** A blank product-pool row, ready for the admin to enter its assigned sqm. */
export const emptyProductPool = (offerType: OfferType) => ({
  offer_type: offerType,
  assigned_sqm: undefined as unknown as number,
});

/**
 * Total estate size + initial per-product sqm assignment — the physical-land
 * account starts here instead of at a unit-count sales cap. Roads, services,
 * sizes and prices are all completed later, on the Offers tab.
 */
export function LandSetupSection() {
  const { control } = useFormContext<CreateAssetFormValues>();
  const pools = useFieldArray({ control, name: "product_pools" });

  const totalLandSqm = useWatch({ control, name: "total_land_sqm" });
  // `useWatch` rather than `form.watch()` — the latter returns a fresh
  // function each render, which makes React Compiler skip memoising this.
  const watchedPools = useWatch({ control, name: "product_pools" });

  const usedOfferTypes = watchedPools?.map((pool) => pool?.offer_type) ?? [];
  const availableOfferTypes = OFFER_TYPES.filter((type) => !usedOfferTypes.includes(type));

  const safePools = (watchedPools ?? []).map((pool) => ({
    assigned_sqm: Number(pool?.assigned_sqm) || 0,
  }));
  const total = Number(totalLandSqm) || 0;
  const assigned = totalAssignedSqm(safePools);
  const remainder = unclassifiedSqm(total, safePools);

  const remainderState = total <= 0 ? "empty" : remainder > 0 ? "positive" : remainder === 0 ? "exact" : "negative";

  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="total_land_sqm"
        render={({ field }) => (
          <FormItem className="sm:max-w-xs">
            <FormLabel className="text-xs">Total estate size</FormLabel>
            <FormControl>
              <NumberInput field={field} min={1} />
            </FormControl>
            <FormDescription className="text-xs">
              The legal or approved total size of the estate, in square metres.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-medium">Product pools</h3>
            <p className="text-xs text-muted-foreground">
              How much of the estate each product is assigned. Optional — land can stay
              unclassified and be divided later.
            </p>
          </div>

          {availableOfferTypes.length > 0 ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  Add product
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {availableOfferTypes.map((offerType) => (
                  <DropdownMenuItem
                    key={offerType}
                    onClick={() => pools.append(emptyProductPool(offerType))}
                  >
                    {OFFER_TYPE_LABELS[offerType]}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null}
        </div>

        {pools.fields.map((pool, index) => (
          <div key={pool.id} className="flex items-end gap-3 rounded-lg border p-3">
            <p className="flex-1 text-xs font-medium">{OFFER_TYPE_LABELS[pool.offer_type]}</p>

            <FormField
              control={control}
              name={`product_pools.${index}.assigned_sqm` as const}
              render={({ field }) => (
                <FormItem className="w-40">
                  <FormLabel className="text-xs">Assigned sqm</FormLabel>
                  <FormControl>
                    <NumberInput field={field} min={0} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove ${OFFER_TYPE_LABELS[pool.offer_type]}`}
              onClick={() => pools.remove(index)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}

        {pools.fields.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No products assigned yet — the whole estate will start out unclassified.
          </p>
        ) : null}
      </div>

      <div
        className={cn(
          "rounded-lg border p-3 text-sm",
          remainderState === "exact" && "border-emerald-200 bg-emerald-500/5",
          remainderState === "negative" && "border-rose-200 bg-rose-500/5"
        )}
      >
        {remainderState === "empty" ? (
          <p className="text-muted-foreground">Enter the total estate size to see the remainder.</p>
        ) : remainderState === "exact" ? (
          <p className="font-medium text-emerald-600">
            All {total.toLocaleString()} sqm is assigned to product pools.
          </p>
        ) : remainderState === "positive" ? (
          <p className="text-muted-foreground">
            <span className="font-medium tabular-nums text-foreground">{assigned.toLocaleString()}</span>{" "}
            sqm assigned ·{" "}
            <span className="font-medium tabular-nums text-foreground">
              {remainder.toLocaleString()} sqm
            </span>{" "}
            will remain unclassified. You can divide it later.
          </p>
        ) : (
          <p className="font-medium text-rose-600">
            {assigned.toLocaleString()} sqm assigned exceeds the {total.toLocaleString()} sqm total by{" "}
            {Math.abs(remainder).toLocaleString()} sqm.
          </p>
        )}
      </div>
    </div>
  );
}
