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
import { formatSqmExact } from "@/lib/utils/format";

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

function ReconciliationFigure({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string;
  tone?: "neutral" | "warn" | "bad";
}) {
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p
        className={cn(
          "text-sm font-semibold tabular-nums",
          tone === "warn" && "text-amber-600",
          tone === "bad" && "text-rose-600"
        )}
      >
        {value}
      </p>
    </div>
  );
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
  const share = (sqm: number) => `${total > 0 ? Math.min(100, Math.max(0, (sqm / total) * 100)) : 0}%`;

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
        {/* Live reconciliation — pinned above the scrolling fields so the
            effect of every edit is visible without scrolling to find it. */}
        <div
          className={cn(
            "border-b bg-muted/30 px-6 py-3",
            reconciliation.isOverAllocated && "bg-rose-500/5"
          )}
        >
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-4">
            <ReconciliationFigure label="Total" value={formatSqmExact(total || null)} />
            <ReconciliationFigure label="Products" value={formatSqmExact(reconciliation.saleableAssignedSqm)} />
            <ReconciliationFigure label="Roads & services" value={formatSqmExact(reconciliation.nonSaleableSqm)} />
            <ReconciliationFigure
              label="Unclassified"
              value={formatSqmExact(reconciliation.unclassifiedSqm)}
              tone={reconciliation.isOverAllocated ? "bad" : (reconciliation.unclassifiedSqm ?? 0) > 0 ? "warn" : "neutral"}
            />
          </div>
          <div className="mt-2.5 flex h-1.5 overflow-hidden rounded-full bg-muted">
            <div className="h-full bg-foreground/75" style={{ width: share(reconciliation.saleableAssignedSqm) }} />
            <div className="h-full bg-muted-foreground/50" style={{ width: share(reconciliation.nonSaleableSqm) }} />
            <div className="h-full bg-amber-500" style={{ width: share(Math.max(0, reconciliation.unclassifiedSqm ?? 0)) }} />
          </div>
          {reconciliation.isOverAllocated ? (
            <p className="mt-2 text-xs font-medium text-rose-600">
              Assigned and non-saleable sqm exceed the total estate size.
            </p>
          ) : null}
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
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

          <FormField
            control={form.control}
            name="total_land_sqm"
            render={({ field }) => (
              <FormItem className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2 space-y-0">
                <div>
                  <FormLabel className="text-sm font-medium">Total estate size</FormLabel>
                  <p className="text-xs text-muted-foreground">
                    The whole physical estate. Everything below is carved out of this figure.
                  </p>
                </div>
                <div className="w-48 space-y-1">
                  <FormControl>
                    <NumberInput field={field} suffix="sqm" />
                  </FormControl>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <Separator />

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-medium">Saleable product pools</h3>
                <p className="text-xs text-muted-foreground">
                  How much of the estate each product may sell. Splitting a pool into plot sizes happens on
                  the Offers tab.
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

            <div className="grid gap-2.5 sm:grid-cols-2">
              {pools.fields.map((pool, index) => {
                const canRemove = !initialOfferTypes.has(pool.offer_type);
                return (
                  <FormField
                    key={pool.id}
                    control={form.control}
                    name={`products.${index}.assigned_sqm` as const}
                    render={({ field }) => (
                      <FormItem className="space-y-1 rounded-lg border px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <FormLabel className="flex-1 text-sm font-medium">
                            {OFFER_TYPE_LABELS[pool.offer_type]}
                            <span className="sr-only"> — assigned sqm</span>
                          </FormLabel>
                          <div className="w-40">
                            <FormControl>
                              <NumberInput field={field} suffix="sqm" />
                            </FormControl>
                          </div>
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
                        <FormMessage className="text-right" />
                      </FormItem>
                    )}
                  />
                );
              })}
            </div>
            {pools.fields.length === 0 ? (
              <p className="text-xs text-muted-foreground">No product has land assigned yet.</p>
            ) : null}
          </section>

          <Separator />

          <div ref={nonSaleableRef} className="scroll-mt-4">
            <LandUseFieldArray />
          </div>

          <Separator />

          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Reason for this change</FormLabel>
                <FormControl>
                  <Textarea rows={2} placeholder="e.g. Added the confirmed roads and services breakdown" {...field} />
                </FormControl>
                <FormDescription className="text-xs">Shown in the configuration history.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
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
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-3xl">
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
