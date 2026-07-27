"use client";

import { useState } from "react";
import { useForm, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
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
import {
  Form,
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import {
  COMMISSION_TIERS,
  COMMISSION_TIER_LABELS,
  OFFER_TYPES,
  OFFER_TYPE_LABELS,
} from "../../schemas/commission.schema";
import {
  assetFormToPayload,
  assetOverrideFormSchema,
  assetOverrideToForm,
  emptyAssetOverrideForm,
  type AssetOverrideFormValues,
} from "../../schemas/override-form.schema";
import { assetRefName, type NormalisedOverride } from "../../schemas/override.schema";
import { useUpsertAssetOverride } from "../../hooks/use-upsert-override";
import { AssetPicker } from "../shared/AssetPicker";

type FormControl = Control<AssetOverrideFormValues>;

const LEGS = [
  {
    key: "direct" as const,
    title: "Direct",
    hint: "Paid to the referrer who brought the buyer. At least one tier is required.",
  },
  {
    key: "upline" as const,
    title: "Upline",
    hint: "One level above the direct referrer. Full ownership only.",
  },
  {
    key: "topline" as const,
    title: "Topline",
    hint: "Two levels above. Full ownership only.",
  },
];

function TierInputs({
  control,
  leg,
  disabled,
}: {
  control: FormControl;
  leg: "direct" | "upline" | "topline";
  disabled: boolean;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-4">
      {COMMISSION_TIERS.map((tier) => (
        <FormField
          key={tier}
          control={control}
          name={`${leg}.${tier}` as const}
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">{COMMISSION_TIER_LABELS[tier]}</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    max={100}
                    placeholder="—"
                    disabled={disabled}
                    className="pr-7"
                    value={field.value ?? ""}
                    onChange={(e) =>
                      field.onChange(e.target.value === "" ? undefined : e.target.valueAsNumber)
                    }
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    %
                  </span>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ))}
    </div>
  );
}

interface AssetOverrideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when editing; absent when creating. */
  override?: NormalisedOverride;
}

export function AssetOverrideDialog({ open, onOpenChange, override }: AssetOverrideDialogProps) {
  const upsert = useUpsertAssetOverride();
  const isEdit = Boolean(override);

  const [formKey, setFormKey] = useState(0);
  const form = useForm<AssetOverrideFormValues>({
    resolver: zodResolver(assetOverrideFormSchema),
    defaultValues: override ? assetOverrideToForm(override) : emptyAssetOverrideForm(),
  });

  const handleOpenChange = (next: boolean) => {
    if (next) {
      form.reset(override ? assetOverrideToForm(override) : emptyAssetOverrideForm());
      setFormKey((key) => key + 1);
    }
    onOpenChange(next);
  };

  function onSubmit(values: AssetOverrideFormValues) {
    // Zod's transform has already dropped blank tiers by the time this runs.
    const payload = assetFormToPayload(assetOverrideFormSchema.parse(values));

    upsert.mutate(payload, {
      onSuccess: () => {
        toast.success(isEdit ? "Override updated" : "Override created");
        onOpenChange(false);
      },
      onError: (error) => toast.error(error.message || "Failed to save override"),
    });
  }

  const disabled = upsert.isPending;
  const control = form.control;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit asset override" : "New asset override"}</DialogTitle>
          <DialogDescription>
            Applies to every referrer selling this asset, unless a more specific override exists for
            them. Takes effect on new payment plans only — existing plans keep their frozen rate.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form key={formKey} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={control}
                name="asset_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset</FormLabel>
                    <FormControl>
                      <AssetPicker
                        value={field.value}
                        onChange={field.onChange}
                        disabled={disabled || isEdit}
                        fallbackLabel={override ? assetRefName(override.asset) : null}
                      />
                    </FormControl>
                    {isEdit ? (
                      <FormDescription>
                        Asset and offer type identify the override and can&apos;t be changed. Revoke
                        this one and create another to move it.
                      </FormDescription>
                    ) : null}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="offer_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Offer type</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={disabled || isEdit}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {OFFER_TYPES.map((offerType) => (
                          <SelectItem key={offerType} value={offerType}>
                            {OFFER_TYPE_LABELS[offerType]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {LEGS.map((leg) => (
              <section key={leg.key} className="space-y-3">
                <div>
                  <h3 className="text-sm font-semibold">{leg.title}</h3>
                  <p className="text-xs text-muted-foreground">{leg.hint}</p>
                </div>
                <TierInputs control={control} leg={leg.key} disabled={disabled} />
              </section>
            ))}

            <p className="text-xs text-muted-foreground">
              Leave a tier blank to leave it alone — a blank tier falls through to the default rate
              rather than paying zero.
            </p>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={control}
                name="expires_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expires</FormLabel>
                    <FormControl>
                      <Input type="date" disabled={disabled} {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormDescription>
                      Optional. Plans created before it expires keep this rate for life.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Why this asset pays a different rate"
                        disabled={disabled}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={disabled}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={disabled}>
                {disabled ? (
                  <>
                    Saving <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  </>
                ) : isEdit ? (
                  "Save override"
                ) : (
                  "Create override"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
