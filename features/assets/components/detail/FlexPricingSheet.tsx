"use client";

import { useEffect, useId, useState } from "react";
import { useForm, useWatch, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2, TriangleAlert, X } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiClientError } from "@/lib/api-client";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { useHasPermission } from "@/hooks/use-admin-permission";
import { cn } from "@/lib/utils";

import {
  useConvertLegacyPricing,
  usePublishPricing,
  useSavePricingDraft,
  useSizePricing,
} from "../../hooks/use-flex-pricing";
import {
  BASE_TENOR_MONTHS,
  basePlanPayments,
  previewRows,
  validatePricing,
  type PricingInput,
} from "../../lib/flex-pricing";
import { formatDiscount, formatNairaTrim } from "../../lib/flex-pricing-format";
import type { Size } from "../../schemas/asset-detail.schema";
import { discountAt, toCheckpoints, type SizePricingResponse } from "../../schemas/flex-pricing.schema";
import { NumberInput } from "./NumberInput";

/* ============================================================
 * Flex pricing editor — screen 2 of the Flex 2.0 admin mockup, with the
 * recorded decisions applied to it:
 *
 *   D01  the base tenor is a fixed 36 months — the mockup's "Maximum tenor"
 *        field is gone, and so is the warning that depended on it.
 *   D02  the admin enters only the base price. First and monthly payment are
 *        calculated (base ÷ 36) and read-only, so the "payments don't
 *        reconcile" check has nothing left to check.
 *   D03  rounding is settled, so the preview's note no longer calls it open.
 *   Q9   no Finance approval reference — publishing rides on the existing
 *        asset permission, enforced by the backend.
 *
 * The preview is a pure function of the three form values (lib/flex-pricing),
 * so it stays instant; the backend re-validates on publish and is the
 * authority. The mockup's "Load example" chips were demo scaffolding and are
 * not built.
 * ============================================================ */

const formSchema = z
  .object({
    base_price_per_unit: z.number({ message: "Enter the base price" }),
    discount_24_pct: z.number({ message: "Enter the 24-month discount" }),
    discount_12_pct: z.number({ message: "Enter the 12-month discount" }),
  })
  .superRefine((values, ctx) => {
    for (const error of validatePricing(values)) {
      ctx.addIssue({ code: "custom", path: [error.field], message: error.message });
    }
  });

type FormValues = z.infer<typeof formSchema>;

type Alert = { tone: "err" | "ok" | "info"; children: React.ReactNode };

const ALERT_TONES: Record<Alert["tone"], string> = {
  err: "border-red-200 bg-red-50 text-red-900",
  ok: "border-emerald-200 bg-emerald-50 text-emerald-900",
  info: "border-blue-200 bg-blue-50 text-blue-900",
};

function AlertRow({ tone, children }: Alert) {
  const Icon = tone === "err" ? X : tone === "ok" ? Check : TriangleAlert;
  return (
    <div className={cn("flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-[13px]", ALERT_TONES[tone])}>
      <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
      <div>{children}</div>
    </div>
  );
}

function Panel({ title, aside, children }: { title: string; aside?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3.5">
        <h3 className="text-sm font-semibold">{title}</h3>
        {aside}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

/** A calculated or fixed value: shown, labelled, never editable. */
function ReadOnlyField({ label, value, hint }: { label: string; value: string | number; hint: string }) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id} className="text-[13px]">
        {label}
      </Label>
      <Input id={id} value={value} readOnly className="bg-muted text-muted-foreground" />
      <Hint>{hint}</Hint>
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <span className="text-xs text-muted-foreground">{children}</span>;
}

function initialValues(data: SizePricingResponse): Partial<FormValues> {
  // A saved draft wins, then the live version. A tenor-list size has neither:
  // its existing 36-month price pre-fills the base price, and nothing else is
  // guessed — missing or inconsistent legacy data stays blank (Q7).
  const source = data.draft ?? data.live;
  if (source) {
    return {
      base_price_per_unit: source.base_price_per_unit,
      discount_24_pct: discountAt(source.checkpoints, 24),
      discount_12_pct: discountAt(source.checkpoints, 12),
    };
  }
  return { base_price_per_unit: data.legacy?.tenor_36_land_price ?? undefined };
}

interface Props {
  assetId: string;
  /** Every Flex size on this asset — the editor's size chips. */
  sizes: Pick<Size, "_id" | "size_sqm">[];
  /** The size the editor opens on. The parent remounts the sheet (new `key`) for each open, so this seeds state once. */
  sizeId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Published = { sizeId: string; version: number };

/** The sheet's frame: title, size chips and the scrolling body. Shared by the loaded editor and its loading/error states. */
function EditorShell({
  sizes,
  activeSizeId,
  onSelectSize,
  badge,
  children,
}: {
  sizes: Props["sizes"];
  activeSizeId: string | null;
  onSelectSize: (sizeId: string) => void;
  badge?: React.ReactNode;
  children: React.ReactNode;
}) {
  const activeSize = sizes.find((size) => size._id === activeSizeId);

  return (
    <>
      <SheetHeader className="border-b px-6 py-5 text-left">
        <div className="flex flex-wrap items-start justify-between gap-3 pr-8">
          <div>
            <SheetTitle>Flex pricing · {activeSize ? `${activeSize.size_sqm} sqm` : "…"}</SheetTitle>
            <SheetDescription>One base plan and two discount checkpoints. Every other whole month is calculated.</SheetDescription>
          </div>
          {badge}
        </div>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto px-6 py-5">
        <div className="mb-4 flex flex-wrap items-center gap-1.5">
          <span className="mr-1 text-xs text-muted-foreground">Size</span>
          {sizes.map((size) => (
            <button
              key={size._id}
              type="button"
              aria-pressed={size._id === activeSizeId}
              onClick={() => onSelectSize(size._id)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground",
                size._id === activeSizeId && "border-neutral-300 bg-muted text-foreground"
              )}
            >
              {size.size_sqm} sqm
            </button>
          ))}
        </div>
        {children}
      </div>
    </>
  );
}

export function FlexPricingSheet({ assetId, sizes, sizeId, open, onOpenChange }: Props) {
  const [activeSizeId, setActiveSizeId] = useState<string | null>(sizeId);
  const [published, setPublished] = useState<Published | null>(null);
  const { data, isLoading, isError, error, refetch } = useSizePricing(assetId, activeSizeId, { enabled: open });

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-[1180px]">
        {data && activeSizeId ? (
          // One editor (and one form) per size: switching size starts a fresh form, so nothing
          // typed for one size can carry over into another.
          <PricingEditor
            key={data.size_id}
            assetId={assetId}
            sizes={sizes}
            sizeId={activeSizeId}
            data={data}
            refetch={refetch}
            published={published}
            onPublished={setPublished}
            onSelectSize={setActiveSizeId}
          />
        ) : (
          <EditorShell sizes={sizes} activeSizeId={activeSizeId} onSelectSize={setActiveSizeId}>
            {isLoading ? (
              <div className="grid gap-4 lg:grid-cols-2">
                <Skeleton className="h-96 w-full" />
                <Skeleton className="h-96 w-full" />
              </div>
            ) : isError ? (
              <AlertRow tone="err">{error?.message || "Couldn't load this size's pricing."}</AlertRow>
            ) : null}
          </EditorShell>
        )}
      </SheetContent>
    </Sheet>
  );
}

function PricingEditor({
  assetId,
  sizes,
  sizeId,
  data,
  refetch,
  published,
  onPublished,
  onSelectSize,
}: {
  assetId: string;
  sizes: Props["sizes"];
  sizeId: string;
  data: SizePricingResponse;
  refetch: () => unknown;
  published: Published | null;
  onPublished: (published: Published) => void;
  onSelectSize: (sizeId: string) => void;
}) {
  const canEdit = useHasPermission("manage_assets");
  const saveDraft = useSavePricingDraft(assetId, sizeId);
  const publish = usePublishPricing(assetId, sizeId);
  const convert = useConvertLegacyPricing(assetId, sizeId);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialValues(data) as FormValues,
  });

  // A saved draft or a publish arrives as new server data. Take it in unless the
  // admin has unsaved edits — a conflict that reloads the live version must not
  // throw away what they typed.
  useEffect(() => {
    if (!form.formState.isDirty) form.reset(initialValues(data) as FormValues);
  }, [data, form]);

  const watched = useWatch({ control: form.control }) as Partial<FormValues>;
  const { base_price_per_unit: price, discount_24_pct: d24, discount_12_pct: d12 } = watched;

  const complete = price !== undefined && d24 !== undefined && d12 !== undefined;
  const input: PricingInput | null = complete ? { base_price_per_unit: price, discount_24_pct: d24, discount_12_pct: d12 } : null;

  // A field only complains once it has something in it; what's still missing is
  // said once, in the note, rather than as a red alert on a form being filled in.
  const filled: Record<string, unknown> = { base_price_per_unit: price, discount_24_pct: d24, discount_12_pct: d12 };
  const errors = validatePricing(watched).filter((issue) => filled[issue.field] !== undefined);
  const valid = complete && errors.length === 0;

  const rows = input && valid ? previewRows(input) : [];
  const payments = input && valid ? basePlanPayments(input) : null;
  const rowsByMonth = new Map(rows.map((row) => [row.months, row]));

  const isConversion = data.pricing_mode === "tenor_list";
  const live = data.live;
  const nextVersion = (live?.version ?? 0) + 1;
  const pending = saveDraft.isPending || publish.isPending || convert.isPending;

  const wasJustPublished = published?.sizeId === sizeId && live?.version === published.version && !form.formState.isDirty;

  const onPublish = form.handleSubmit((values) => {
    const payload = {
      base_price_per_unit: values.base_price_per_unit,
      checkpoints: toCheckpoints(values.discount_24_pct, values.discount_12_pct),
    };
    const onError = (err: Error) => {
      toast.error(err.message || "Couldn't publish the pricing");
      // 409: another admin published first. Re-read what is live; the form keeps the admin's edits.
      if (err instanceof ApiClientError && err.statusCode === 409) void refetch();
    };

    if (isConversion) {
      convert.mutate(payload, {
        onSuccess: ({ version }) => {
          toast.success(`Converted to a base plan — Pricing v${version.version} is live`);
          form.reset(values); // what was typed is now what is saved, so the form is clean again
          onPublished({ sizeId, version: version.version });
        },
        onError,
      });
      return;
    }

    publish.mutate(
      { ...payload, expected_live_version: live?.version ?? null },
      {
        onSuccess: (version) => {
          toast.success(`Pricing v${version.version} is live`);
          form.reset(values);
          onPublished({ sizeId, version: version.version });
        },
        onError,
      }
    );
  });

  const onSaveDraft = () => {
    if (!complete) return;
    saveDraft.mutate(
      { base_price_per_unit: price, checkpoints: toCheckpoints(d24, d12) },
      {
        onSuccess: () => {
          toast.success("Draft saved — customers are not affected");
          form.reset({ base_price_per_unit: price, discount_24_pct: d24, discount_12_pct: d12 });
        },
        onError: (err) => toast.error(err.message || "Couldn't save the draft"),
      }
    );
  };

  const publishLabel = isConversion ? "Convert to base plan" : `Publish as v${nextVersion}`;

  const pubNote = !canEdit
    ? "You don't have permission to change pricing."
    : !complete
      ? "Enter the base price and both discounts to see the preview and publish."
      : errors.length > 0
        ? live
          ? `Publishing is blocked until the problems above are fixed. The live version (v${live.version}) stays active.`
          : "Publishing is blocked until the problems above are fixed."
        : isConversion
          ? "Converting creates v1. New quotes use it; existing buyers keep the plans they were bought under."
          : `Publishing creates v${nextVersion}. New quotes use it; existing purchases keep the version they were bought under.`;

  const badge = wasJustPublished ? (
    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
      Published · v{published?.version}
    </Badge>
  ) : (
    <Badge variant="secondary">
      Draft v{nextVersion} · {live ? `based on v${live.version}` : isConversion ? "converting from a tenor list" : "first version"}
    </Badge>
  );

  const activeSizeSqm = sizes.find((size) => size._id === sizeId)?.size_sqm;

  return (
    <EditorShell sizes={sizes} activeSizeId={sizeId} onSelectSize={onSelectSize} badge={badge}>
    <Form {...form}>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <div className="grid content-start gap-4">
          <Panel title="Base plan">
            <div className="grid gap-3.5">
              <div className="grid gap-3 sm:grid-cols-2">
                <ReadOnlyField
                  label="Base tenor (months)"
                  value={BASE_TENOR_MONTHS}
                  hint="The standard plan customers see first. Fixed at 36 months."
                />
                <FormField
                  control={form.control}
                  name="base_price_per_unit"
                  render={({ field }) => (
                    <FormItem className="gap-1.5">
                      <FormLabel className="text-[13px]">Base price per unit (₦)</FormLabel>
                      <FormControl>
                        <NumberInput field={field} prefix="₦" disabled={!canEdit} />
                      </FormControl>
                      <Hint>The full price for one unit over 36 months.</Hint>
                      <FormMessage className="sr-only" />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <ReadOnlyField
                  label="First payment (₦)"
                  value={payments ? formatNairaTrim(payments.first_payment) : "—"}
                  hint="Calculated: the base price ÷ 36. It is month one, not an extra deposit."
                />
                <ReadOnlyField
                  label="Monthly payment (₦)"
                  value={payments ? formatNairaTrim(payments.monthly_payment) : "—"}
                  hint="Calculated. Rounded down to the kobo."
                />
              </div>

              {payments && input ? (
                <AlertRow tone="ok">
                  {formatNairaTrim(payments.monthly_payment)} × {BASE_TENOR_MONTHS - 1}, then {formatNairaTrim(payments.final_payment)} in month{" "}
                  {BASE_TENOR_MONTHS} — adds up to {formatNairaTrim(input.base_price_per_unit)}.
                </AlertRow>
              ) : null}
            </div>
          </Panel>

          <Panel title="Discount checkpoints" aside={<span className="text-xs text-muted-foreground">% off the base price</span>}>
            <div className="grid gap-3">
              <div className="grid grid-cols-[96px_1fr_1fr] items-center gap-2.5">
                <span />
                <span className="text-xs text-muted-foreground">Months</span>
                <span className="text-xs text-muted-foreground">Discount %</span>

                <Badge variant="secondary" className="justify-self-start">
                  Base
                </Badge>
                <Input value={BASE_TENOR_MONTHS} readOnly className="bg-muted text-muted-foreground" aria-label="Base months" />
                <Input value={0} readOnly className="bg-muted text-muted-foreground" aria-label="Base discount percent" />

                {(
                  [
                    { name: "discount_24_pct", months: 24, label: "Checkpoint 1" },
                    { name: "discount_12_pct", months: 12, label: "Checkpoint 2" },
                  ] as const
                ).map((checkpoint) => (
                  <CheckpointRow key={checkpoint.name} form={form} canEdit={canEdit} {...checkpoint} />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Discounts between checkpoints follow a straight line between the two nearest ones. The 12-month discount isn&apos;t spread
                across all 24 months.
              </p>
            </div>
          </Panel>

          <Panel title="Publish">
            <div className="grid gap-3">
              <div className="grid gap-2">
                {errors.length > 0 ? (
                  errors.map((issue) => (
                    <AlertRow key={`${issue.field}-${issue.code}`} tone="err">
                      {issue.message}
                    </AlertRow>
                  ))
                ) : valid ? (
                  <AlertRow tone="ok">
                    <b>All checks pass.</b> Discounts are within range and never fall as plans get shorter, and every whole month from 12
                    to {BASE_TENOR_MONTHS} has a price.
                  </AlertRow>
                ) : null}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" disabled={!canEdit || !complete || pending} onClick={onSaveDraft}>
                  {saveDraft.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden /> : null}
                  Save draft
                </Button>
                <Button type="button" disabled={!canEdit || !valid || pending} onClick={onPublish}>
                  {publish.isPending || convert.isPending ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" aria-hidden /> : null}
                  {publishLabel}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">{pubNote}</p>
            </div>
          </Panel>
        </div>

        <section className="min-w-0 self-start rounded-lg border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3.5">
            <h3 className="text-sm font-semibold">Preview — every whole month a customer can get</h3>
            <span className="text-xs text-muted-foreground">1 unit · {activeSizeSqm ? `${activeSizeSqm} sqm` : ""}</span>
          </div>
          <div className="max-h-[470px] overflow-auto">
            <table className="w-full border-collapse text-[13.5px]">
              <thead>
                <tr>
                  {["Months", "Discount", "Total", "Payment", "Final payment", "Needs ≥ / mo"].map((heading, index) => (
                    <th
                      key={heading}
                      className={cn(
                        "sticky top-0 whitespace-nowrap border-b bg-card px-3 py-2 text-left text-xs font-medium text-muted-foreground",
                        index > 0 && "text-right"
                      )}
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: BASE_TENOR_MONTHS - 11 }, (_, offset) => BASE_TENOR_MONTHS - offset).map((months) => {
                  const row = rowsByMonth.get(months);
                  const emphasised = months === BASE_TENOR_MONTHS || months === 24 || months === 12;
                  return (
                    <tr key={months} className={cn("border-b last:border-0", emphasised && "bg-muted/40 font-medium")}>
                      <td className="px-3 py-2.5 align-top">
                        {months}{" "}
                        {months === BASE_TENOR_MONTHS ? (
                          <Badge variant="secondary" className="ml-1 text-[11px]">
                            base
                          </Badge>
                        ) : emphasised ? (
                          <Badge variant="secondary" className="ml-1 bg-blue-100 text-[11px] text-blue-700">
                            checkpoint
                          </Badge>
                        ) : null}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{row ? formatDiscount(row.discount_pct) : "—"}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{row ? formatNairaTrim(row.total) : "—"}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{row ? formatNairaTrim(row.regular_payment) : "—"}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums">
                        {row ? (row.final_payment !== row.regular_payment ? formatNairaTrim(row.final_payment) : "same") : "—"}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums">{row ? formatNairaTrim(row.largest_payment) : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <p className="border-t p-4 text-xs text-muted-foreground">
            “Needs ≥ / mo” is the largest single payment, so a customer&apos;s entered budget always covers the plan shown. Regular payments
            round down to the kobo and the final payment collects the residual. Shaded rows are checkpoints.
          </p>
        </section>
      </div>
    </Form>
    </EditorShell>
  );
}

function CheckpointRow({
  form,
  canEdit,
  name,
  months,
  label,
}: {
  form: UseFormReturn<FormValues>;
  canEdit: boolean;
  name: "discount_24_pct" | "discount_12_pct";
  months: number;
  label: string;
}) {
  return (
    <>
      <Badge variant="secondary" className="justify-self-start bg-blue-100 text-blue-700">
        {label}
      </Badge>
      <Input value={months} readOnly className="bg-muted text-muted-foreground" aria-label={`${label} months`} />
      <FormField
        control={form.control}
        name={name}
        render={({ field }) => (
          <FormItem>
            <FormLabel className="sr-only">{label} discount percent</FormLabel>
            <FormControl>
              <NumberInput field={field} suffix="%" disabled={!canEdit} />
            </FormControl>
            <FormMessage className="sr-only" />
          </FormItem>
        )}
      />
    </>
  );
}
