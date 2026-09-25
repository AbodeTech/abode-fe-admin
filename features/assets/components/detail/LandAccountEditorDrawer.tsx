"use client";

import { useEffect, useRef, useState } from "react";
import { useFieldArray, useForm, useWatch, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ApiClientError } from "@/lib/api-client";
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
import { Textarea } from "@/components/ui/textarea";
import { NumberInput } from "./NumberInput";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatSqm } from "@/lib/utils/format";

import { OFFER_TYPES, OFFER_TYPE_LABELS, type OfferType } from "../../schemas/asset.schema";
import {
  landConfigurationFormSchema,
  reconcileLand,
  type LandConfiguration,
  type LandConfigurationFormValues,
} from "../../schemas/land-configuration.schema";
import { assetKeys } from "../../hooks/query-keys";
import { useLandConfiguration } from "../../hooks/use-land-configuration";
import { useSaveLandConfiguration } from "../../hooks/use-land-configuration-mutations";
import { LandUseFieldArray } from "./LandUseFieldArray";

function toFormValues(data: LandConfiguration): LandConfigurationFormValues {
  return {
    expected_version: data.version,
    reason: "",
    total_land_sqm: data.total_land_sqm ?? (undefined as unknown as number),
    products: data.products.map((product) => ({
      offer_type: product.offer_type,
      assigned_sqm: product.assigned_sqm,
    })),
    // The read shape only ever returns active rows (see AssetLandUseSchema's
    // doc comment) — a row loaded here is always active until the admin
    // unchecks it in this session. `row.id` can be `null` for a row created
    // by the PUT that's about to be re-loaded (a confirmed real backend bug,
    // see AssetLandUseSchema's doc comment) — treated the same as "no id
    // yet," which the write DTO already accepts for a genuinely new row.
    non_saleable: data.non_saleable.map((row) => ({
      land_use_id: row.id ?? undefined,
      category: row.category,
      label: row.label,
      allocated_sqm: row.allocated_sqm,
      is_active: true,
    })),
  };
}

interface FormProps {
  assetId: string;
  landConfiguration: LandConfiguration;
  onClose: () => void;
  /** Scrolls to the non-saleable section on mount — e.g. opened from a non-saleable land row click, never routes to Costs. */
  focusSection?: "non-saleable";
}

function LandAccountEditorForm({ assetId, landConfiguration, onClose, focusSection }: FormProps) {
  const queryClient = useQueryClient();
  const save = useSaveLandConfiguration(assetId);
  const { refetch } = useLandConfiguration(assetId);
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);
  const nonSaleableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focusSection === "non-saleable") {
      nonSaleableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    // Only on mount — this form is remounted (key={data.version}) each time the drawer opens, so there is no "open" transition to key off separately.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pools already on the server when the drawer opened can't be removed here
  // — there is no delete-offer path anywhere in this feature (`is_active:
  // false` is how an offer is retired). Only a pool added during this
  // session, not yet saved, can be undone before submitting.
  const [initialOfferTypes] = useState(() => new Set(landConfiguration.products.map((p) => p.offer_type)));

  const form = useForm<LandConfigurationFormValues>({
    resolver: zodResolver(landConfigurationFormSchema),
    defaultValues: toFormValues(landConfiguration),
  });

  const pools = useFieldArray({ control: form.control, name: "products" });

  const watchedTotal = useWatch({ control: form.control, name: "total_land_sqm" });
  const watchedPools = useWatch({ control: form.control, name: "products" });
  const watchedNonSaleable = useWatch({ control: form.control, name: "non_saleable" });

  const usedOfferTypes = (watchedPools ?? []).map((pool) => pool?.offer_type);
  const availableOfferTypes = OFFER_TYPES.filter((type) => !usedOfferTypes.includes(type));

  const previewPools = (watchedPools ?? []).map((pool) => ({ assigned_sqm: Number(pool?.assigned_sqm) || 0 }));
  const previewNonSaleable = (watchedNonSaleable ?? []).map((row) => ({
    allocated_sqm: Number(row?.allocated_sqm) || 0,
    is_active: row?.is_active ?? true,
  }));
  const total = Number(watchedTotal) || 0;
  const reconciliation = reconcileLand(total > 0 ? total : null, previewPools, previewNonSaleable);

  function onSubmit(values: LandConfigurationFormValues) {
    setConflictMessage(null);
    const parsed = landConfigurationFormSchema.parse(values);
    save.mutate(parsed, {
      onSuccess: () => {
        toast.success("Land account saved");
        onClose();
      },
      onError: (error) => {
        if (error instanceof ApiClientError && error.code === "LAND_CONFIGURATION_VERSION_CONFLICT") {
          setConflictMessage(error.message);
          return;
        }
        toast.error(error.message || "Failed to save the land account");
      },
    });
  }

  async function reviewLatestVersion() {
    const result = await refetch();
    if (result.data) {
      form.reset(toFormValues(result.data));
      queryClient.setQueryData(assetKeys.landConfiguration(assetId), result.data);
    }
    setConflictMessage(null);
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-1 flex-col overflow-hidden">
        <div className="flex-1 space-y-6 overflow-y-auto px-6 py-5">
          {conflictMessage ? (
            <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-500/5 p-3 text-sm">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
              <div className="min-w-0 space-y-2">
                <p className="font-medium text-amber-700">{conflictMessage}</p>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => setConflictMessage(null)}>
                    Keep editing
                  </Button>
                  <Button type="button" size="sm" onClick={reviewLatestVersion}>
                    Review latest version
                  </Button>
                </div>
              </div>
            </div>
          ) : null}

          <section className="space-y-3">
            <h3 className="text-sm font-medium">Total land</h3>
            <FormField
              control={form.control}
              name="total_land_sqm"
              render={({ field }) => (
                <FormItem className="max-w-xs">
                  <FormLabel className="text-xs">Total estate size</FormLabel>
                  <FormControl>
                    <NumberInput field={field} suffix="sqm" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>

          <Separator />

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-medium">Saleable product pools</h3>
                <p className="text-xs text-muted-foreground">
                  Assigned to a product but not yet divided into sizes is <em>product-unconfigured</em> — not
                  the same as estate-unclassified below.
                </p>
              </div>
              {availableOfferTypes.length > 0 ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button type="button" variant="outline" size="sm">
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Add product
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {availableOfferTypes.map((offerType: OfferType) => (
                      <DropdownMenuItem
                        key={offerType}
                        onClick={() => pools.append({ offer_type: offerType, assigned_sqm: undefined as unknown as number })}
                      >
                        {OFFER_TYPE_LABELS[offerType]}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : null}
            </div>

            {pools.fields.map((pool, index) => {
              const canRemove = !initialOfferTypes.has(pool.offer_type);
              return (
                <div key={pool.id} className="flex items-end gap-3 rounded-lg border p-3">
                  <p className="flex-1 text-xs font-medium">{OFFER_TYPE_LABELS[pool.offer_type]}</p>
                  <FormField
                    control={form.control}
                    name={`products.${index}.assigned_sqm` as const}
                    render={({ field }) => (
                      <FormItem className="w-40">
                        <FormLabel className="text-xs">Assigned sqm</FormLabel>
                        <FormControl>
                          <NumberInput field={field} suffix="sqm" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {canRemove ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove ${OFFER_TYPE_LABELS[pool.offer_type]}`}
                      onClick={() => pools.remove(index)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  ) : null}
                </div>
              );
            })}
          </section>

          <Separator />

          <div ref={nonSaleableRef} className="scroll-mt-4">
            <LandUseFieldArray />
          </div>

          <Separator />

          <section
            className={cn(
              "space-y-2 rounded-lg border p-3 text-sm",
              reconciliation.isOverAllocated && "border-rose-200 bg-rose-500/5"
            )}
          >
            <h3 className="text-sm font-medium">Reconciliation</h3>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Total</p>
                <p className="font-medium tabular-nums">{formatSqm(total || null)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Products</p>
                <p className="font-medium tabular-nums">{formatSqm(reconciliation.saleableAssignedSqm)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Non-saleable</p>
                <p className="font-medium tabular-nums">{formatSqm(reconciliation.nonSaleableSqm)}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Unclassified</p>
                <p className={cn("font-medium tabular-nums", reconciliation.isOverAllocated && "text-rose-600")}>
                  {formatSqm(reconciliation.unclassifiedSqm)}
                </p>
              </div>
            </div>
            {reconciliation.isOverAllocated ? (
              <p className="text-xs font-medium text-rose-600">
                Assigned and non-saleable sqm exceed the total estate size.
              </p>
            ) : null}
            {form.formState.errors.total_land_sqm?.message ? (
              <p className="text-xs font-medium text-rose-600">{form.formState.errors.total_land_sqm.message}</p>
            ) : null}
          </section>

          <Separator />

          <section className="space-y-3">
            <h3 className="text-sm font-medium">Revision details</h3>
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Reason for this change</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="e.g. Added the confirmed roads and services breakdown" {...field} />
                  </FormControl>
                  <FormDescription className="text-xs">Shown in the configuration history.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>
        </div>

        <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? (
              <>
                Saving <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              </>
            ) : (
              "Save changes"
            )}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

interface Props {
  assetId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Scrolls to the non-saleable section on open — e.g. from a non-saleable land row click. */
  focusSection?: "non-saleable";
}

/**
 * The Land Account editor — a full-width Sheet rather than a small dialog,
 * since even a minimal estate has a total, several product pools, and
 * several non-saleable rows to review at once.
 */
export function LandAccountEditorDrawer({ assetId, open, onOpenChange, focusSection }: Props) {
  const { data } = useLandConfiguration(assetId, { enabled: open });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-2xl">
        <SheetHeader className="border-b px-6 py-5 text-left">
          <SheetTitle>Land account</SheetTitle>
          <SheetDescription>
            {data ? `Version ${data.version} · ${data.state === "not_configured" ? "Not configured" : data.state}` : "Loading…"}
          </SheetDescription>
        </SheetHeader>

        {data ? (
          <LandAccountEditorForm
            key={data.version}
            assetId={assetId}
            landConfiguration={data}
            onClose={() => onOpenChange(false)}
            focusSection={focusSection}
          />
        ) : (
          <div className="flex-1 space-y-4 p-6">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
