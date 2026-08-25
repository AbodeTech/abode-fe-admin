"use client";

import { useEffect } from "react";
import { useForm, useWatch, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import { formatNaira } from "@/lib/utils/format";

import {
  OFFER_TYPE_LABELS,
  PAYMENT_TYPES,
  usesFoModel,
  type OfferType,
} from "../../schemas/asset.schema";
import type { AssetDetail, Plan, Size } from "../../schemas/asset-detail.schema";
import {
  expectedLandPrice,
  planFormSchema,
  planTolerance,
  type PlanFormValues,
} from "../../schemas/create-asset.schema";
import {
  useAddOffer,
  useAddPlan,
  useAddSize,
  useDeletePlan,
  useDeleteSize,
  useUpdateOffer,
  useUpdatePlan,
  useUpdateSize,
} from "../../hooks/use-offer-mutations";
import { useAssetFormStore } from "../../store/asset-form-store";

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  "all-inclusive": "All inclusive",
  "partially-inclusive": "Partially inclusive",
};

type NumberFieldLike = {
  value: unknown;
  onChange: (value: number | undefined) => void;
  onBlur: () => void;
  name: string;
  ref: React.Ref<HTMLInputElement>;
};

/**
 * `value` and `onChange` are replaced so an empty input yields `undefined`
 * rather than `NaN`; the rest of the field (including `ref`) is spread through
 * untouched — reading `field.ref` directly counts as accessing a ref during
 * render.
 */
function NumberInput({
  field,
  prefix,
  suffix,
  min = 0,
}: {
  field: NumberFieldLike;
  prefix?: string;
  suffix?: string;
  min?: number;
}) {
  const { value, onChange, ...rest } = field;

  return (
    <div className="relative">
      {prefix ? (
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          {prefix}
        </span>
      ) : null}
      <Input
        {...rest}
        type="number"
        min={min}
        className={`${prefix ? "pl-6" : ""} ${suffix ? "pr-10" : ""}`}
        value={(value as number | undefined) ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? undefined : e.target.valueAsNumber)}
      />
      {suffix ? (
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          {suffix}
        </span>
      ) : null}
    </div>
  );
}

/* ==================== offer ==================== */

const offerFormSchema = z.object({
  allocation_qualification_pct: z
    .number({ message: "Enter a percentage" })
    .int("Whole percentages only")
    .min(1, "At least 1%")
    .max(100, "At most 100%"),
  payment_type: z.enum(PAYMENT_TYPES).optional(),
});

type OfferFormValues = z.infer<typeof offerFormSchema>;

function EditOfferDialog({ asset, offerType }: { asset: AssetDetail; offerType: OfferType }) {
  const close = useAssetFormStore((state) => state.closeOfferEdit);
  const update = useUpdateOffer(asset._id, offerType);

  const offer = asset.offers.find((candidate) => candidate.offer_type === offerType);
  const isFo = usesFoModel(offerType);

  const form = useForm<OfferFormValues>({
    resolver: zodResolver(offerFormSchema),
    defaultValues: {
      allocation_qualification_pct: offer?.allocation_qualification_pct ?? 30,
      payment_type: offer?.payment_type,
    },
  });

  if (!offer) return null;

  const submit = form.handleSubmit((values) => {
    update.mutate(
      {
        allocation_qualification_pct: values.allocation_qualification_pct,
        // Sending payment_type on a flex offer is a 400.
        ...(isFo ? { payment_type: values.payment_type } : {}),
      },
      {
        onSuccess: () => {
          toast.success("Offer saved");
          close();
        },
        onError: (error) => toast.error(error.message || "Couldn't save the offer"),
      }
    );
  });

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : close())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{OFFER_TYPE_LABELS[offerType]} settings</DialogTitle>
          <DialogDescription>
            Sizes and plans are edited individually below.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="allocation_qualification_pct"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Allocation qualification</FormLabel>
                  <FormControl>
                    <NumberInput field={field} suffix="%" min={1} />
                  </FormControl>
                  <FormDescription className="text-xs">
                    How much of the price must be paid before a plot is allocated.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isFo ? (
              <FormField
                control={form.control}
                name="payment_type"
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
        </Form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={close} disabled={update.isPending}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={update.isPending}>
            {update.isPending ? (
              <>
                Saving <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ==================== add offer (ticket 18, resolved 2026-07-28) ==================== */

const addOfferSchema = z.object({
  allocation_qualification_pct: z
    .number({ message: "Enter a percentage" })
    .int("Whole percentages only")
    .min(1, "At least 1%")
    .max(100, "At most 100%"),
  payment_type: z.enum(PAYMENT_TYPES).optional(),
  size_sqm: z.number({ message: "Enter a size" }).int("Whole square metres").positive("Must be above zero"),
  units_available: z.number({ message: "Enter a unit count" }).int("Whole units").min(0, "Cannot be negative"),
  document_fee: z.number().int("Whole naira only").min(0, "Cannot be negative").optional(),
});

type AddOfferValues = z.infer<typeof addOfferSchema>;

/**
 * Adds the offer type the asset lacks, with its first size.
 *
 * `OfferInputDto` requires at least one size, and a size arrives with plans —
 * so, like SizeDialog, this seeds a minimal valid plan and sends the admin to
 * price it immediately after. One dialog for settings + first size keeps the
 * common case (one size to start) to a single step.
 */
function AddOfferDialog({ asset, offerType }: { asset: AssetDetail; offerType: OfferType }) {
  const close = useAssetFormStore((state) => state.closeOfferEdit);
  const addOffer = useAddOffer(asset._id);
  const isFlex = offerType === "flex";
  const isFo = usesFoModel(offerType);

  const form = useForm<AddOfferValues>({
    resolver: zodResolver(addOfferSchema),
    defaultValues: {
      allocation_qualification_pct: 30,
      payment_type: undefined,
      size_sqm: undefined as unknown as number,
      units_available: undefined as unknown as number,
      document_fee: undefined,
    },
  });

  const submit = form.handleSubmit((values) => {
    if (isFo && !values.payment_type) {
      form.setError("payment_type", { message: "Choose how documents are paid for" });
      return;
    }

    addOffer.mutate(
      {
        offer_type: offerType,
        is_active: true,
        allocation_qualification_pct: values.allocation_qualification_pct,
        ...(isFo ? { payment_type: values.payment_type } : {}),
        sizes: [
          {
            size_sqm: values.size_sqm,
            units_available: values.units_available,
            ...(isFo ? { document_fee: values.document_fee ?? 0 } : {}),
            plans: [
              {
                tenor_months: isFlex ? 12 : 0,
                land_price: 1,
                initial_payment: 1,
                monthly_installment: 0,
                is_active: true,
              },
            ],
          },
        ],
      },
      {
        onSuccess: () => {
          toast.success(`${OFFER_TYPE_LABELS[offerType]} added — set its plan pricing next`);
          close();
        },
        onError: (error) => toast.error(error.message || "Couldn't add the offer"),
      }
    );
  });

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : close())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add {OFFER_TYPE_LABELS[offerType].toLowerCase()}</DialogTitle>
          <DialogDescription>
            Starts with one size and a placeholder plan — price the plan right after.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="allocation_qualification_pct"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Allocation qualification</FormLabel>
                  <FormControl>
                    <NumberInput field={field} suffix="%" min={1} />
                  </FormControl>
                  <FormDescription className="text-xs">
                    How much of the price must be paid before a plot is allocated.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isFo ? (
              <FormField
                control={form.control}
                name="payment_type"
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

            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="size_sqm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">First size</FormLabel>
                    <FormControl>
                      <NumberInput field={field} suffix="sqm" min={1} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="units_available"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Units available</FormLabel>
                    <FormControl>
                      <NumberInput field={field} min={0} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {isFo ? (
              <FormField
                control={form.control}
                name="document_fee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Document fee</FormLabel>
                    <FormControl>
                      <NumberInput field={field} prefix="₦" min={0} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}
          </div>
        </Form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={close} disabled={addOffer.isPending}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={addOffer.isPending}>
            {addOffer.isPending ? (
              <>
                Adding <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              </>
            ) : (
              "Add offer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ==================== size ==================== */

const sizeFieldsSchema = z.object({
  size_sqm: z.number({ message: "Enter a size" }).int("Whole square metres").positive("Must be above zero"),
  units_available: z.number({ message: "Enter a unit count" }).int("Whole units").min(0, "Cannot be negative"),
  document_fee: z.number().int("Whole naira only").min(0, "Cannot be negative").optional(),
});

type SizeFieldsValues = z.infer<typeof sizeFieldsSchema>;

function SizeDialog({
  asset,
  offerType,
  sizeId,
}: {
  asset: AssetDetail;
  offerType: OfferType;
  sizeId?: string;
}) {
  const close = useAssetFormStore((state) => state.closeOfferEdit);
  const addSize = useAddSize(asset._id, offerType);
  const updateSize = useUpdateSize(asset._id, offerType);

  const offer = asset.offers.find((candidate) => candidate.offer_type === offerType);
  const size = offer?.sizes.find((candidate) => candidate._id === sizeId);
  const isFlex = offerType === "flex";
  const isFo = usesFoModel(offerType);
  const isEdit = Boolean(sizeId);

  const form = useForm<SizeFieldsValues>({
    resolver: zodResolver(sizeFieldsSchema),
    defaultValues: {
      size_sqm: size?.size_sqm ?? (undefined as unknown as number),
      units_available: size?.units_available ?? (undefined as unknown as number),
      document_fee: size?.document_fee,
    },
  });

  const submit = form.handleSubmit((values) => {
    const document_fee = isFo ? (values.document_fee ?? 0) : undefined;

    if (isEdit && sizeId) {
      updateSize.mutate(
        {
          sizeId,
          size_sqm: values.size_sqm,
          units_available: values.units_available,
          ...(document_fee === undefined ? {} : { document_fee }),
        },
        {
          onSuccess: () => {
            toast.success("Size saved");
            close();
          },
          onError: (error) => toast.error(error.message || "Couldn't save the size"),
        }
      );
      return;
    }

    // AddSizeDto extends SizeInputDto, so a new size must arrive with at least
    // one plan. A placeholder outright/one-month plan priced at zero would be
    // rejected by the arithmetic rules, so we seed a minimal valid one and let
    // the admin price it immediately after.
    addSize.mutate(
      {
        size_sqm: values.size_sqm,
        units_available: values.units_available,
        ...(document_fee === undefined ? {} : { document_fee }),
        plans: [
          {
            tenor_months: isFlex ? 12 : 0,
            land_price: 1,
            initial_payment: isFlex ? 1 : 1,
            monthly_installment: 0,
            is_active: true,
          },
        ],
      },
      {
        onSuccess: () => {
          toast.success("Size added — set its plan pricing next");
          close();
        },
        onError: (error) => toast.error(error.message || "Couldn't add the size"),
      }
    );
  });

  const saving = addSize.isPending || updateSize.isPending;

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : close())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit size" : "Add size"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Plans on this size are edited separately."
              : "A size needs a plan to exist, so one is created with it — price it straight after."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <div className="grid gap-4 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="size_sqm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Size</FormLabel>
                  <FormControl>
                    <NumberInput field={field} suffix="sqm" min={1} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="units_available"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Units available</FormLabel>
                  <FormControl>
                    <NumberInput field={field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isFo ? (
              <FormField
                control={form.control}
                name="document_fee"
                render={({ field }) => (
                  <FormItem className="sm:col-span-2">
                    <FormLabel className="text-xs">Document fee</FormLabel>
                    <FormControl>
                      <NumberInput field={field} prefix="₦" />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Required on full-ownership and commercial sizes. Enter 0 if there
                      isn&apos;t one.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : null}
          </div>
        </Form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={close} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={saving}>
            {saving ? (
              <>
                Saving <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              </>
            ) : isEdit ? (
              "Save size"
            ) : (
              "Add size"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ==================== plan ==================== */

function PlanMathHint({ form }: { form: UseFormReturn<PlanFormValues> }) {
  const values = useWatch({ control: form.control });

  const tenor = Number(values.tenor_months) || 0;
  const land = Number(values.land_price) || 0;
  const initial = Number(values.initial_payment) || 0;
  const monthly = Number(values.monthly_installment) || 0;

  if (!land) return null;

  if (tenor === 0) {
    const ok = monthly === 0 && initial === land;
    return (
      <p className={`text-xs ${ok ? "text-muted-foreground" : "text-destructive"}`}>
        {ok
          ? "Outright — paid in full on purchase"
          : "An outright plan has no monthly instalment, and the deposit equals the land price"}
      </p>
    );
  }

  const expected = expectedLandPrice({
    tenor_months: tenor,
    initial_payment: initial,
    monthly_installment: monthly,
  });
  const drift = Math.abs(expected - land);
  const ok = drift <= planTolerance(tenor);

  return (
    <p className={`text-xs ${ok ? "text-muted-foreground" : "text-destructive"}`}>
      {tenor === 1
        ? "One month — the deposit covers the whole price"
        : `${formatNaira(initial)} + ${formatNaira(monthly)} × ${tenor - 1}`}{" "}
      = <strong>{formatNaira(expected)}</strong>
      {ok ? "" : ` — off by ${formatNaira(drift)}`}
    </p>
  );
}

function PlanDialog({
  asset,
  offerType,
  sizeId,
  tenor,
}: {
  asset: AssetDetail;
  offerType: OfferType;
  sizeId: string;
  tenor?: number;
}) {
  const close = useAssetFormStore((state) => state.closeOfferEdit);
  const addPlan = useAddPlan(asset._id, offerType);
  const updatePlan = useUpdatePlan(asset._id, offerType);
  const updateSize = useUpdateSize(asset._id, offerType);

  const offer = asset.offers.find((candidate) => candidate.offer_type === offerType);
  const size = offer?.sizes.find((candidate) => candidate._id === sizeId);
  const plan = size?.plans.find((candidate) => candidate.tenor_months === tenor);
  const isFlex = offerType === "flex";
  const isFo = usesFoModel(offerType);
  const isEdit = tenor !== undefined;

  const form = useForm<PlanFormValues>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      tenor_months: plan?.tenor_months ?? (undefined as unknown as number),
      land_price: plan?.land_price ?? (undefined as unknown as number),
      initial_payment: plan?.initial_payment ?? (undefined as unknown as number),
      monthly_installment: plan?.monthly_installment ?? 0,
      is_promo: plan?.is_promo ?? false,
    },
  });

  const nextTenor = Number(useWatch({ control: form.control, name: "tenor_months" }));
  const tenorChanged = isEdit && Number.isFinite(nextTenor) && nextTenor !== tenor;

  const otherTenors = (size?.plans ?? [])
    .filter((candidate) => candidate.tenor_months !== tenor)
    .map((candidate) => candidate.tenor_months);

  const submit = form.handleSubmit((values) => {
    if (!size) return;

    if (isFlex && values.tenor_months < 1) {
      form.setError("tenor_months", {
        message:
          "Flex plans run for at least one month — only full ownership and commercial sell outright",
      });
      return;
    }

    if (otherTenors.includes(values.tenor_months)) {
      form.setError("tenor_months", { message: "This size already has a plan at that tenor" });
      return;
    }

    const done = (message: string) => () => {
      toast.success(message);
      close();
    };
    const fail = (error: Error) => toast.error(error.message || "Couldn't save the plan");

    // Editing a plan's money in place is a single PATCH addressed by tenor.
    if (isEdit && !tenorChanged) {
      updatePlan.mutate(
        {
          sizeId,
          tenor: tenor!,
          land_price: values.land_price,
          initial_payment: values.initial_payment,
          monthly_installment: values.monthly_installment,
          ...(isFo ? { is_promo: values.is_promo ?? false } : {}),
        },
        { onSuccess: done("Plan saved"), onError: fail }
      );
      return;
    }

    // A brand-new plan goes through its own endpoint (ticket 19's add half,
    // resolved 2026-07-28): atomic, and a concurrent duplicate tenor is a
    // server-side conflict instead of a silent overwrite.
    if (!isEdit) {
      addPlan.mutate(
        {
          sizeId,
          tenor_months: values.tenor_months,
          land_price: values.land_price,
          initial_payment: values.initial_payment,
          monthly_installment: values.monthly_installment,
          is_active: true,
          ...(isFo ? { is_promo: values.is_promo ?? false } : {}),
        },
        { onSuccess: done("Plan added"), onError: fail }
      );
      return;
    }

    // ⛔ ticket 19 (open half) — changing a tenor still has no endpoint, so
    // the size's whole plans[] is replaced. That is a read-modify-write: it
    // sends the list as it was when this page loaded, and can drop a plan
    // another admin added in the meantime.
    const next: Plan[] = [
      ...(size.plans ?? []).filter((candidate) => candidate.tenor_months !== tenor),
      {
        tenor_months: values.tenor_months,
        land_price: values.land_price,
        initial_payment: values.initial_payment,
        monthly_installment: values.monthly_installment,
        is_active: true,
        ...(isFo ? { is_promo: values.is_promo ?? false } : {}),
      },
    ].sort((a, b) => a.tenor_months - b.tenor_months);

    updateSize.mutate(
      { sizeId, plans: next },
      { onSuccess: done("Plan replaced"), onError: fail }
    );
  });

  const saving = updatePlan.isPending || updateSize.isPending || addPlan.isPending;

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : close())}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit plan" : "Add plan"}</DialogTitle>
          <DialogDescription>
            {size ? `${size.size_sqm.toLocaleString()} sqm · ` : ""}
            {isFlex
              ? "Flex plans run for at least one month."
              : "Use a tenor of 0 for an outright purchase."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="tenor_months"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Tenor</FormLabel>
                    <FormControl>
                      <NumberInput field={field} suffix="mo" min={isFlex ? 1 : 0} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="land_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Land price</FormLabel>
                    <FormControl>
                      <NumberInput field={field} prefix="₦" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="initial_payment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Initial payment</FormLabel>
                    <FormControl>
                      <NumberInput field={field} prefix="₦" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="monthly_installment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Monthly instalment</FormLabel>
                    <FormControl>
                      <NumberInput field={field} prefix="₦" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <PlanMathHint form={form} />

            {/*
              A tenor change isn't an edit — the API addresses plans by tenor,
              so it is a delete and a re-create. Said out loud, because a plan's
              history restarting later is otherwise inexplicable.
            */}
            {tenorChanged ? (
              <p className="flex items-start gap-2 rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                Changing the tenor replaces this plan rather than editing it — the API identifies a
                plan by its tenor. Every plan on this size is rewritten, so avoid doing it while a
                colleague is editing the same size.
              </p>
            ) : null}
          </div>
        </Form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={close} disabled={saving}>
            Cancel
          </Button>
          <Button type="button" onClick={submit} disabled={saving}>
            {saving ? (
              <>
                Saving <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              </>
            ) : isEdit ? (
              "Save plan"
            ) : (
              "Add plan"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ==================== deletes ==================== */

function DeleteSizeDialog({
  asset,
  offerType,
  sizeId,
}: {
  asset: AssetDetail;
  offerType: OfferType;
  sizeId: string;
}) {
  const close = useAssetFormStore((state) => state.closeOfferEdit);
  const deleteSize = useDeleteSize(asset._id, offerType);

  const offer = asset.offers.find((candidate) => candidate.offer_type === offerType);
  const size = offer?.sizes.find((candidate) => candidate._id === sizeId);

  return (
    <AlertDialog open onOpenChange={(open) => (open ? undefined : close())}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete the {size?.size_sqm.toLocaleString()} sqm size?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm">
              <p>
                This removes the size and its {size?.plans.length ?? 0} plan
                {size?.plans.length === 1 ? "" : "s"} from the offer.
              </p>
              {/*
                The backend refuses when anyone is on a payment plan for this
                size — the count isn't in this payload, so we can't disable the
                action ahead of time, only explain the refusal when it comes.
              */}
              <p className="text-muted-foreground">
                If any customer is on a payment plan for this size, the backend will refuse and
                nothing changes.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteSize.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              deleteSize.mutate(sizeId, {
                onSuccess: () => {
                  toast.success("Size deleted");
                  close();
                },
                onError: (error) => toast.error(error.message || "Couldn't delete the size"),
              });
            }}
            disabled={deleteSize.isPending}
          >
            {deleteSize.isPending ? (
              <>
                Deleting <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              </>
            ) : (
              "Delete size"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function DeletePlanDialog({
  asset,
  offerType,
  sizeId,
  tenor,
}: {
  asset: AssetDetail;
  offerType: OfferType;
  sizeId: string;
  tenor: number;
}) {
  const close = useAssetFormStore((state) => state.closeOfferEdit);
  const deletePlan = useDeletePlan(asset._id, offerType);

  const offer = asset.offers.find((candidate) => candidate.offer_type === offerType);
  const size = offer?.sizes.find((candidate) => candidate._id === sizeId);
  const label = tenor === 0 ? "outright" : `${tenor}-month`;

  return (
    <AlertDialog open onOpenChange={(open) => (open ? undefined : close())}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete the {label} plan?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm">
              <p>
                It&apos;s removed from the {size?.size_sqm.toLocaleString()} sqm size. Buyers
                already on it keep their existing payment plan.
              </p>
              <p className="text-muted-foreground">
                The backend refuses if any customer is on a plan for this size — note that check
                covers the whole size, not just this tenor.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deletePlan.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              event.preventDefault();
              deletePlan.mutate(
                { sizeId, tenor },
                {
                  onSuccess: () => {
                    toast.success("Plan deleted");
                    close();
                  },
                  onError: (error) => toast.error(error.message || "Couldn't delete the plan"),
                }
              );
            }}
            disabled={deletePlan.isPending}
          >
            {deletePlan.isPending ? (
              <>
                Deleting <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              </>
            ) : (
              "Delete plan"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/* ==================== router ==================== */

/**
 * One mount point for every offer-tree dialog, driven by the store's
 * `offerEdit` target. Keeps the tree components free of dialog plumbing.
 */
export function OfferEditDialogs({ asset }: { asset: AssetDetail }) {
  const target = useAssetFormStore((state) => state.offerEdit);
  const close = useAssetFormStore((state) => state.closeOfferEdit);

  // A target pointing at something that has since been deleted would render an
  // empty dialog, so clear it if the tree no longer contains it. `add-offer`
  // is the one target whose offer is *supposed* to be missing.
  useEffect(() => {
    if (!target || target.kind === "add-offer") return;
    const offer = asset.offers.find((candidate) => candidate.offer_type === target.offerType);
    if (!offer) close();
  }, [target, asset, close]);

  if (!target) return null;

  const offerType = target.offerType as OfferType;

  switch (target.kind) {
    case "add-offer":
      return <AddOfferDialog asset={asset} offerType={offerType} />;
    case "offer":
      return <EditOfferDialog asset={asset} offerType={offerType} />;
    case "size":
      return <SizeDialog asset={asset} offerType={offerType} sizeId={target.sizeId} />;
    case "plan":
      return (
        <PlanDialog
          asset={asset}
          offerType={offerType}
          sizeId={target.sizeId}
          tenor={target.tenor}
        />
      );
    case "delete-size":
      return <DeleteSizeDialog asset={asset} offerType={offerType} sizeId={target.sizeId} />;
    case "delete-plan":
      return (
        <DeletePlanDialog
          asset={asset}
          offerType={offerType}
          sizeId={target.sizeId}
          tenor={target.tenor}
        />
      );
    default:
      return null;
  }
}

export type { Size };
