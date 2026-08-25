"use client";

import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { Plus, Trash2, Wand2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  OFFER_TYPE_LABELS,
  PAYMENT_TYPES,
  usesFoModel,
  type OfferType,
} from "../../schemas/asset.schema";
import type { CreateAssetFormValues } from "../../schemas/create-asset.schema";
import { useAssetFormStore } from "../../store/asset-form-store";
import { FormSection } from "./FormSection";
import { PlanRow } from "./PlanRow";

const PAYMENT_TYPE_LABELS: Record<(typeof PAYMENT_TYPES)[number], string> = {
  "all-inclusive": "All inclusive",
  "partially-inclusive": "Partially inclusive",
};

const emptyPlan = () => ({
  tenor_months: undefined as unknown as number,
  land_price: undefined as unknown as number,
  initial_payment: undefined as unknown as number,
  monthly_installment: undefined as unknown as number,
});

const emptySize = () => ({
  size_sqm: undefined as unknown as number,
  units_available: undefined as unknown as number,
  document_fee: undefined,
  plans: [emptyPlan()],
});

/** One size, its document fee where applicable, and its plans. */
function SizeCard({
  offerIndex,
  sizeIndex,
  offerType,
  onRemove,
  canRemove,
}: {
  offerIndex: number;
  sizeIndex: number;
  offerType: OfferType;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const { control } = useFormContext<CreateAssetFormValues>();
  const openGenerator = useAssetFormStore((state) => state.openGenerator);

  const plans = useFieldArray({
    control,
    name: `offers.${offerIndex}.sizes.${sizeIndex}.plans` as const,
  });

  // Two different questions. Flex is the only type that can't sell outright;
  // the full-ownership model — full ownership and commercial — is the one that
  // carries a document fee.
  const isFlex = offerType === "flex";
  const isFo = usesFoModel(offerType);

  return (
    <div className="space-y-3 rounded-lg border bg-muted/20 p-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <FormField
          control={control}
          name={`offers.${offerIndex}.sizes.${sizeIndex}.size_sqm` as const}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Size</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type="number"
                    min={1}
                    className="pr-12"
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(e.target.value === "" ? undefined : e.target.valueAsNumber)
                    }
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    sqm
                  </span>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name={`offers.${offerIndex}.sizes.${sizeIndex}.units_available` as const}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Units available</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={0}
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(e.target.value === "" ? undefined : e.target.valueAsNumber)
                  }
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Required on the full-ownership model; the backend rejects the offer without it. */}
        {isFo ? (
          <FormField
            control={control}
            name={`offers.${offerIndex}.sizes.${sizeIndex}.document_fee` as const}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Document fee</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      ₦
                    </span>
                    <Input
                      type="number"
                      min={0}
                      className="pl-6"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(e.target.value === "" ? undefined : e.target.valueAsNumber)
                      }
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </div>
                </FormControl>
                <FormDescription className="text-xs">Enter 0 if there isn&apos;t one.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        ) : null}
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-medium">
            Payment plans <span className="text-muted-foreground">({plans.fields.length})</span>
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => openGenerator({ offerIndex, sizeIndex })}
            >
              <Wand2 className="mr-1 h-3.5 w-3.5" />
              Generate
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => plans.append(emptyPlan())}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              Add plan
            </Button>
          </div>
        </div>

        {plans.fields.map((plan, planIndex) => (
          <PlanRow
            key={plan.id}
            offerIndex={offerIndex}
            sizeIndex={sizeIndex}
            planIndex={planIndex}
            isFlex={isFlex}
            canRemove={plans.fields.length > 1}
            onRemove={() => plans.remove(planIndex)}
          />
        ))}
      </div>

      {canRemove ? (
        <div className="flex justify-end">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="mr-1 h-3.5 w-3.5" />
            Remove size
          </Button>
        </div>
      ) : null}
    </div>
  );
}

export function OfferSection({
  offerIndex,
  onRemove,
  canRemove,
}: {
  offerIndex: number;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const { control } = useFormContext<CreateAssetFormValues>();

  const offerType = useWatch({ control, name: `offers.${offerIndex}.offer_type` as const });
  const isFlex = offerType === "flex";
  const isFo = usesFoModel(offerType as OfferType);

  const sizes = useFieldArray({ control, name: `offers.${offerIndex}.sizes` as const });

  return (
    <FormSection
      id={`offer-${offerIndex}`}
      title={OFFER_TYPE_LABELS[offerType as keyof typeof OFFER_TYPE_LABELS] ?? "Offer"}
      description={
        isFlex
          ? "Instalment plans only — only full ownership and commercial sell outright."
          : "Supports outright purchase (tenor 0) as well as instalments."
      }
      badge={
        <span className="rounded-full border px-2 py-0.5 text-xs text-muted-foreground">
          {sizes.fields.length} size{sizes.fields.length === 1 ? "" : "s"}
        </span>
      }
      actions={
        canRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="mr-1 h-3.5 w-3.5" />
            Remove
          </Button>
        ) : null
      }
    >
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField
            control={control}
            name={`offers.${offerIndex}.allocation_qualification_pct` as const}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Allocation qualification</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      className="pr-8"
                      value={field.value ?? ""}
                      onChange={(e) =>
                        field.onChange(e.target.value === "" ? undefined : e.target.valueAsNumber)
                      }
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                      %
                    </span>
                  </div>
                </FormControl>
                <FormDescription className="text-xs">
                  How much of the price must be paid before a plot is allocated.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Full-ownership model only — sending it on a flex offer is a 400. */}
          {isFo ? (
            <FormField
              control={control}
              name={`offers.${offerIndex}.payment_type` as const}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Payment type</FormLabel>
                  <Select value={field.value ?? ""} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PAYMENT_TYPES.map((type) => (
                        <SelectItem key={type} value={type}>
                          {PAYMENT_TYPE_LABELS[type]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          ) : null}
        </div>

        <div className="space-y-3">
          {sizes.fields.map((size, sizeIndex) => (
            <SizeCard
              key={size.id}
              offerIndex={offerIndex}
              sizeIndex={sizeIndex}
              offerType={offerType as OfferType}
              canRemove={sizes.fields.length > 1}
              onRemove={() => sizes.remove(sizeIndex)}
            />
          ))}

          <Button type="button" variant="outline" size="sm" onClick={() => sizes.append(emptySize())}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Add size
          </Button>
        </div>
      </div>
    </FormSection>
  );
}

export { emptySize };
