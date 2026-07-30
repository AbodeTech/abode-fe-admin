"use client";

import { useFormContext, useWatch } from "react-hook-form";
import { AlertTriangle, Check, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { formatNaira } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

import {
  expectedLandPrice,
  planTolerance,
  type CreateAssetFormValues,
} from "../../schemas/create-asset.schema";

/**
 * Live feedback on the backend's plan arithmetic.
 *
 * The rule is `initial + monthly × (tenor − 1) ≈ land_price`, within
 * `max(1, tenor)`. Showing the sum as it's typed means the admin corrects it
 * in place — rather than submitting a four-level form and getting the whole
 * thing rejected atomically with a class-validator message.
 */
function PlanMathHint({ offerIndex, sizeIndex, planIndex }: PlanRowProps) {
  const control = useFormContext<CreateAssetFormValues>().control;
  const base = `offers.${offerIndex}.sizes.${sizeIndex}.plans.${planIndex}` as const;

  const [tenor, land, initial, monthly] = useWatch({
    control,
    name: [
      `${base}.tenor_months`,
      `${base}.land_price`,
      `${base}.initial_payment`,
      `${base}.monthly_installment`,
    ],
  });

  const values = {
    tenor_months: Number(tenor) || 0,
    land_price: Number(land) || 0,
    initial_payment: Number(initial) || 0,
    monthly_installment: Number(monthly) || 0,
  };

  if (!values.land_price) return null;

  if (values.tenor_months === 0) {
    const ok = values.monthly_installment === 0 && values.initial_payment === values.land_price;
    return (
      <Hint ok={ok}>
        {ok
          ? "Outright — paid in full on purchase"
          : "An outright plan is paid in full: no monthly instalment, and the deposit equals the land price"}
      </Hint>
    );
  }

  const expected = expectedLandPrice(values);
  const drift = Math.abs(expected - values.land_price);
  const tolerance = planTolerance(values.tenor_months);
  const ok = drift <= tolerance;

  return (
    <Hint ok={ok}>
      {values.tenor_months === 1
        ? "One month — the deposit covers the whole price"
        : `${formatNaira(values.initial_payment)} + ${formatNaira(values.monthly_installment)} × ${values.tenor_months - 1}`}{" "}
      = <strong>{formatNaira(expected)}</strong>
      {ok ? null : ` — off by ${formatNaira(drift)} (allowed: ${formatNaira(tolerance)})`}
    </Hint>
  );
}

function Hint({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <p
      className={cn(
        "flex items-start gap-1.5 text-xs",
        ok ? "text-muted-foreground" : "text-destructive"
      )}
    >
      {ok ? (
        <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" aria-hidden />
      ) : (
        <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
      )}
      <span>{children}</span>
    </p>
  );
}

function NumberField({
  name,
  label,
  suffix,
  prefix,
  disabled,
}: {
  name: string;
  label: string;
  suffix?: string;
  prefix?: string;
  disabled?: boolean;
}) {
  const { control } = useFormContext<CreateAssetFormValues>();

  return (
    <FormField
      control={control}
      // Paths are built from indices, so they can't be literal-checked.
      name={name as never}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs">{label}</FormLabel>
          <FormControl>
            <div className="relative">
              {prefix ? (
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {prefix}
                </span>
              ) : null}
              <Input
                type="number"
                step={1}
                min={0}
                disabled={disabled}
                className={cn(prefix && "pl-6", suffix && "pr-8")}
                value={(field.value as number | undefined) ?? ""}
                onChange={(event) =>
                  field.onChange(event.target.value === "" ? undefined : event.target.valueAsNumber)
                }
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
              />
              {suffix ? (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  {suffix}
                </span>
              ) : null}
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

interface PlanRowProps {
  offerIndex: number;
  sizeIndex: number;
  planIndex: number;
}

export function PlanRow({
  offerIndex,
  sizeIndex,
  planIndex,
  isFlex,
  onRemove,
  canRemove,
}: PlanRowProps & { isFlex: boolean; onRemove: () => void; canRemove: boolean }) {
  const base = `offers.${offerIndex}.sizes.${sizeIndex}.plans.${planIndex}`;

  return (
    <div className="space-y-2 rounded-md border p-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <NumberField
          name={`${base}.tenor_months`}
          label={isFlex ? "Tenor (months, min 1)" : "Tenor (months, 0 = outright)"}
          suffix="mo"
        />
        <NumberField name={`${base}.land_price`} label="Land price" prefix="₦" />
        <NumberField name={`${base}.initial_payment`} label="Initial payment" prefix="₦" />
        <NumberField name={`${base}.monthly_installment`} label="Monthly instalment" prefix="₦" />
      </div>

      <div className="flex items-start justify-between gap-3">
        <PlanMathHint offerIndex={offerIndex} sizeIndex={sizeIndex} planIndex={planIndex} />

        {canRemove ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="mr-1 h-3.5 w-3.5" />
            Remove
          </Button>
        ) : null}
      </div>
    </div>
  );
}
