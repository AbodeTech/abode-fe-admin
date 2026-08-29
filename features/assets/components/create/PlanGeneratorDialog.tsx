"use client";

import { useFormContext } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatNaira } from "@/lib/utils/format";

import { derivePlan, type CreateAssetFormValues } from "../../schemas/create-asset.schema";
import { useAssetFormStore } from "../../store/asset-form-store";

/**
 * Generates a set of plans from one base tenor.
 *
 * Carries across v1's pricing rule: price moves by a fixed percentage per year
 * away from the base, so a 24-month plan is cheaper than a 36-month one and a
 * 48-month plan dearer.
 *
 * The deposit ratio is preserved and the instalment is then *solved* so each
 * generated plan satisfies the backend's arithmetic — the admin never has to
 * reconcile the sum by hand.
 */
export function PlanGeneratorDialog() {
  const { getValues, setValue } = useFormContext<CreateAssetFormValues>();

  const generator = useAssetFormStore((state) => state.generator);
  const setGenerator = useAssetFormStore((state) => state.setGenerator);
  const closeGenerator = useAssetFormStore((state) => state.closeGenerator);

  const target = generator.target;
  if (!target) return null;

  const path = `offers.${target.offerIndex}.sizes.${target.sizeIndex}.plans` as const;
  const existing = (getValues(path) ?? []) as CreateAssetFormValues["offers"][number]["sizes"][number]["plans"];
  const offerType = getValues(`offers.${target.offerIndex}.offer_type`);
  const isFlex = offerType === "flex";

  const basePlan = existing.find(
    (plan) => Number(plan?.tenor_months) === Number(generator.baseTenor)
  );

  const requestedTenors = generator.tenors
    .split(",")
    .map((value) => Number(value.trim()))
    .filter((value) => Number.isInteger(value) && value >= 0);

  const preview = basePlan
    ? requestedTenors
        .filter((tenor) => !existing.some((plan) => Number(plan?.tenor_months) === tenor))
        .filter((tenor) => !isFlex || tenor >= 1)
        .map((tenor) =>
          derivePlan(
            {
              tenor_months: Number(basePlan.tenor_months),
              land_price: Number(basePlan.land_price),
              initial_payment: Number(basePlan.initial_payment),
            },
            tenor,
            generator.adjustmentPct
          )
        )
    : [];

  const skipped = requestedTenors.filter(
    (tenor) =>
      existing.some((plan) => Number(plan?.tenor_months) === tenor) || (isFlex && tenor < 1)
  );

  const handleGenerate = () => {
    if (!basePlan) {
      toast.error(`Add a ${generator.baseTenor}-month plan first — it's the basis for the rest`);
      return;
    }
    if (preview.length === 0) {
      toast.error("Nothing to generate — those tenors already exist or aren't allowed here");
      return;
    }

    setValue(path, [...existing, ...preview], { shouldValidate: true, shouldDirty: true });
    toast.success(`Added ${preview.length} plan${preview.length === 1 ? "" : "s"}`);
    closeGenerator();
  };

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : closeGenerator())}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate plans</DialogTitle>
          <DialogDescription>
            Each plan is priced from the base tenor, moving by the adjustment below for every year
            of difference. Instalments are solved so the arithmetic balances.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="generator-base" className="text-xs">
                Base tenor (months)
              </Label>
              <Input
                id="generator-base"
                type="number"
                min={0}
                value={generator.baseTenor}
                onChange={(event) =>
                  setGenerator({ baseTenor: Number(event.target.value) || 0 })
                }
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="generator-pct" className="text-xs">
                Price change per year
              </Label>
              <div className="relative">
                <Input
                  id="generator-pct"
                  type="number"
                  step="0.1"
                  className="pr-8"
                  value={generator.adjustmentPct}
                  onChange={(event) =>
                    setGenerator({ adjustmentPct: Number(event.target.value) || 0 })
                  }
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  %
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="generator-tenors" className="text-xs">
              Tenors to generate
            </Label>
            <Input
              id="generator-tenors"
              placeholder={isFlex ? "12, 24, 48" : "0, 12, 24, 48"}
              value={generator.tenors}
              onChange={(event) => setGenerator({ tenors: event.target.value })}
            />
            <p className="text-xs text-muted-foreground">
              Comma separated.{" "}
              {isFlex
                ? "Flex plans run for at least one month — only full ownership and commercial sell outright."
                : "Use 0 for an outright purchase."}
            </p>
          </div>

          {!basePlan ? (
            <p className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground">
              No {generator.baseTenor}-month plan on this size yet. Add one first — every generated
              plan is priced from it.
            </p>
          ) : preview.length > 0 ? (
            <div className="rounded-md border">
              <p className="border-b px-3 py-2 text-xs font-medium">Preview</p>
              <ul className="divide-y">
                {preview.map((plan) => (
                  <li
                    key={plan.tenor_months}
                    className="flex flex-wrap items-baseline justify-between gap-2 px-3 py-2 text-sm"
                  >
                    <span className="font-medium tabular-nums">
                      {plan.tenor_months === 0 ? "Outright" : `${plan.tenor_months} months`}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      {formatNaira(plan.land_price)}
                      {plan.monthly_installment > 0
                        ? ` · ${formatNaira(plan.initial_payment)} then ${formatNaira(plan.monthly_installment)}/mo`
                        : " · paid in full"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {skipped.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              Skipping {skipped.join(", ")} — already added{isFlex ? ", or not valid for flex" : ""}.
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={closeGenerator}>
            Cancel
          </Button>
          <Button type="button" onClick={handleGenerate} disabled={preview.length === 0}>
            Add {preview.length > 0 ? preview.length : ""} plan{preview.length === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
