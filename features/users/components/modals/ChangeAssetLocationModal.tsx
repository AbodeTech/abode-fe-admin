"use client";

import { useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, ArrowRight } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import { UserAsset } from "@/lib/api/admin/user-assets.types";
import {
  changeAssetLocationSchema,
  type ChangeAssetLocationFormValues,
} from "@/lib/schemas/admin/change-asset-location.schema";
import {
  useChangeAssetLocation,
  useDestinationAssets,
  type DestinationAsset,
  type DestinationAssetOption,
  type DestinationFlexPlan,
} from "../../hooks/use-change-asset-location";
import { getErrorMessage } from "../../utils/error-message";

interface ChangeAssetLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: UserAsset;
  userId: string;
}

const FO_DURATIONS = [
  { value: 0, label: "Outright (0 months)" },
  { value: 1, label: "1 month" },
  { value: 3, label: "3 months" },
  { value: 5, label: "5 months" },
  { value: 6, label: "6 months" },
  { value: 12, label: "12 months" },
];

const formatNGN = (n: number | undefined | null) =>
  n == null
    ? "₦0"
    : new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 0,
      }).format(n);

const formatNumber = (value: number | string | undefined) => {
  if (value === undefined || value === null || value === "") return "";
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

export function ChangeAssetLocationModal({
  isOpen,
  onClose,
  asset,
  userId,
}: ChangeAssetLocationModalProps) {
  const mutation = useChangeAssetLocation(userId);
  const { data: catalog, isLoading: isLoadingCatalog } = useDestinationAssets(isOpen);

  const pd = asset.payment_details;
  const doc = asset.document_plan;
  const aq = asset.asset_questions?.find((q) => q.unique_asset_id === pd?.unique_asset_id);

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ChangeAssetLocationFormValues>({
    resolver: zodResolver(
      changeAssetLocationSchema
    ) as unknown as import("react-hook-form").Resolver<ChangeAssetLocationFormValues>,
  });

  const newAssetType = watch("newAssetType");
  const newAssetId = watch("newAssetId");
  const newSize = watch("newSize");
  const newDurationMonths = watch("newDurationMonths");

  const filteredCatalog = useMemo<DestinationAsset[]>(
    () =>
      ((catalog ?? []) as (DestinationAsset | null)[])
        .filter((a): a is DestinationAsset => a?.asset_type === newAssetType && !a?.sold),
    [catalog, newAssetType]
  );

  const selectedAsset = useMemo(
    () => filteredCatalog.find((a) => a._id === newAssetId),
    [filteredCatalog, newAssetId]
  );

  const sizeOptions = useMemo<DestinationAssetOption[]>(
    () =>
      ((selectedAsset?.asset_option ?? []) as (DestinationAssetOption | null)[])
        .filter((opt): opt is DestinationAssetOption => opt?.size != null),
    [selectedAsset]
  );

  const selectedSizeOption = useMemo(
    () => sizeOptions.find((opt) => Number(opt?.size) === Number(newSize)),
    [sizeOptions, newSize]
  );

  const flexDurations = useMemo<DestinationFlexPlan[]>(
    () =>
      ((selectedSizeOption?.flex_payment_plans ?? []) as (DestinationFlexPlan | null)[])
        .filter((p): p is DestinationFlexPlan => p != null),
    [selectedSizeOption]
  );

  // Initial reset when the dialog opens — preload from current asset
  useEffect(() => {
    if (!isOpen || !pd) return;
    reset({
      newAssetId: "",
      newAssetType: (pd.asset_type === "flex" ? "flex" : "full-ownership") as "flex" | "full-ownership",
      newSize: pd.size ?? 0,
      newNoOfUnits: pd.no_of_units ?? 1,
      newMonthSubscription: pd.month_subscription ?? 0,

      newAssetPrice: 0,
      newAmountPaid: pd.amount_paid ?? 0,
      newMonthlyInstallment: 0,
      newDurationMonths: undefined,

      newDocumentPrice: pd.fullownerhsip_documentprice ?? undefined,
      newDocumentAmountPaid: doc?.amount_paid ?? undefined,
      newDocumentMonthlyInstallment: undefined,

      name_of_property: aq?.name_of_property ?? "",
      mode_of_communication: aq?.mode_of_communication ?? "",
      source_of_funds: aq?.source_of_funds ?? "",
      desired_landuse: aq?.desired_landuse ?? "",
      address: aq?.address ?? "",
      reason: "",
    });
  }, [isOpen, pd, doc, aq, reset]);

  // When admin picks new asset/size/duration, pre-fill pricing from catalog (overridable)
  useEffect(() => {
    if (!selectedSizeOption) return;

    if (newAssetType === "flex") {
      const dur = flexDurations.find(
        (p) => Number(p?.duration_months) === Number(newDurationMonths)
      );
      if (dur) {
        setValue("newAssetPrice", Number(dur.price ?? selectedSizeOption.price ?? 0));
        setValue("newMonthlyInstallment", Number(dur.monthly_installment ?? 0));
        setValue("newMonthSubscription", Number(dur.duration_months ?? 0));
      }
    } else {
      setValue("newAssetPrice", Number(selectedSizeOption.price ?? 0));
      const months = Number(newDurationMonths ?? 0);
      const monthsToKey: Record<number, keyof DestinationAssetOption> = {
        0: "zero_months",
        1: "one_month",
        3: "three_months",
        5: "five_months",
        6: "six_months",
        12: "twelve_months",
      };
      const monthlyKey = monthsToKey[months];
      if (monthlyKey) {
        const monthly = Number(selectedSizeOption[monthlyKey] ?? 0);
        if (monthly > 0) setValue("newMonthlyInstallment", monthly);
      }
      setValue("newMonthSubscription", months);
    }
  }, [
    newAssetType,
    newDurationMonths,
    selectedSizeOption,
    flexDurations,
    setValue,
  ]);

  const onSubmit = async (data: ChangeAssetLocationFormValues) => {
    if (!pd?.unique_asset_id) {
      toast.error("Source asset is missing a unique asset id.");
      return;
    }
    try {
      const result = await mutation.mutateAsync({
        userId,
        currentUniqueAssetId: pd.unique_asset_id,
        newAssetId: data.newAssetId,
        newAssetType: data.newAssetType,
        newSize: data.newSize,
        newNoOfUnits: data.newNoOfUnits,
        newMonthSubscription: data.newMonthSubscription,
        newAssetPrice: data.newAssetPrice,
        newAmountPaid: data.newAmountPaid,
        newMonthlyInstallment: data.newMonthlyInstallment,
        newDurationMonths: data.newDurationMonths,
        newDocumentPrice: data.newAssetType === "full-ownership" ? data.newDocumentPrice : undefined,
        newDocumentAmountPaid: data.newAssetType === "full-ownership" ? data.newDocumentAmountPaid : undefined,
        newDocumentMonthlyInstallment:
          data.newAssetType === "full-ownership" ? data.newDocumentMonthlyInstallment : undefined,
        assetQuestion: {
          name_of_property: data.name_of_property,
          mode_of_communication: data.mode_of_communication,
          source_of_funds: data.source_of_funds,
          desired_landuse: data.desired_landuse,
          address: data.address,
        },
        reason: data.reason,
      });
      toast.success(
        `Transfer complete. New unique asset id: ${result.changeAssetLocation.newUniqueAssetId}`
      );
      onClose();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Couldn't change asset location."));
    }
  };

  const renderNumberInput = (
    name: keyof ChangeAssetLocationFormValues,
    label: string,
    disabled = false
  ) => (
    <div className="space-y-2" key={name}>
      <Label htmlFor={name}>{label}</Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Input
            id={name}
            disabled={disabled}
            value={formatNumber(field.value as number | string | undefined)}
            onChange={(e) => {
              const raw = e.target.value.replace(/,/g, "");
              const num = Number(raw);
              field.onChange(isNaN(num) ? undefined : num);
            }}
          />
        )}
      />
      {errors[name] && (
        <p className="text-red-500 text-sm">{errors[name]?.message as string}</p>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Change Asset Location</DialogTitle>
          <DialogDescription>
            Transfer this user&apos;s asset to a different property. Enter the negotiated numbers
            — they won&apos;t come from the public catalog and won&apos;t appear in sales analytics.
          </DialogDescription>
        </DialogHeader>

        {/* Source summary */}
        <div className="rounded-md border bg-muted/40 p-3 text-sm">
          <div className="font-medium">Transferring from</div>
          <div className="flex items-center gap-2 mt-1 text-muted-foreground">
            <span className="font-mono text-xs">{pd?.unique_asset_id}</span>
            <span>·</span>
            <span>{asset.asset_name}</span>
            <span>·</span>
            <span>{pd?.size}sqm</span>
            <span>·</span>
            <span>{pd?.no_of_units} unit(s)</span>
            <ArrowRight className="ml-auto h-4 w-4" />
            <span>Paid {formatNGN(pd?.amount_paid)} of {formatNGN(pd?.asset_price)}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-6 p-1">
              {/* Destination */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Destination</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="newAssetType">Plan type</Label>
                    <Controller
                      name="newAssetType"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onValueChange={(v) => {
                            field.onChange(v);
                            // Reset cascaded fields when type changes
                            setValue("newAssetId", "");
                            setValue("newDurationMonths", undefined);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pick plan type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="flex">Flex</SelectItem>
                            <SelectItem value="full-ownership">Full Ownership</SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newAssetId">Destination asset</Label>
                    <Controller
                      name="newAssetId"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger>
                            <SelectValue
                              placeholder={
                                isLoadingCatalog
                                  ? "Loading catalog…"
                                  : filteredCatalog.length === 0
                                    ? "No assets of this type"
                                    : "Pick an asset"
                              }
                            />
                          </SelectTrigger>
                          <SelectContent>
                            {filteredCatalog.map((a) =>
                              a?._id ? (
                                <SelectItem key={a._id} value={a._id}>
                                  {a.asset_name} — {a.asset_location}
                                </SelectItem>
                              ) : null
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.newAssetId && (
                      <p className="text-red-500 text-sm">{errors.newAssetId.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newSize">Size (sqm)</Label>
                    <Controller
                      name="newSize"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={String(field.value ?? "")}
                          onValueChange={(v) => field.onChange(Number(v))}
                          disabled={!selectedAsset}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pick size" />
                          </SelectTrigger>
                          <SelectContent>
                            {sizeOptions.map((opt, i) =>
                              opt?.size != null ? (
                                <SelectItem key={`${opt.size}-${i}`} value={String(opt.size)}>
                                  {opt.size}sqm{opt.price ? ` — ${formatNGN(Number(opt.price))}` : ""}
                                </SelectItem>
                              ) : null
                            )}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  {renderNumberInput("newNoOfUnits", "Number of units")}

                  {newAssetType === "flex" ? (
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="newDurationMonths">Duration</Label>
                      <Controller
                        name="newDurationMonths"
                        control={control}
                        render={({ field }) => (
                          <Select
                            value={field.value != null ? String(field.value) : ""}
                            onValueChange={(v) => field.onChange(Number(v))}
                            disabled={!selectedSizeOption}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pick duration" />
                            </SelectTrigger>
                            <SelectContent>
                              {flexDurations.map((p) =>
                                p?.duration_months != null ? (
                                  <SelectItem
                                    key={p.duration_months}
                                    value={String(p.duration_months)}
                                  >
                                    {p.duration_months} months — {formatNGN(Number(p.monthly_installment))}/mo · {p.unit ?? 0} avail.
                                  </SelectItem>
                                ) : null
                              )}
                            </SelectContent>
                          </Select>
                        )}
                      />
                      {errors.newDurationMonths && (
                        <p className="text-red-500 text-sm">
                          {errors.newDurationMonths.message}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="newDurationMonths">Month subscription (FO)</Label>
                      <Controller
                        name="newDurationMonths"
                        control={control}
                        render={({ field }) => (
                          <Select
                            value={field.value != null ? String(field.value) : ""}
                            onValueChange={(v) => field.onChange(Number(v))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Pick duration" />
                            </SelectTrigger>
                            <SelectContent>
                              {FO_DURATIONS.map((d) => (
                                <SelectItem key={d.value} value={String(d.value)}>
                                  {d.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Pricing */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Pricing (negotiated)</h3>
                <p className="text-xs text-muted-foreground">
                  Pre-loaded from the catalog when available — edit to match the negotiated terms.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {renderNumberInput(
                    "newAssetPrice",
                    newAssetType === "full-ownership" ? "Land price (total)" : "Asset price (total)"
                  )}
                  {renderNumberInput("newAmountPaid", "Amount paid (carry over)")}
                  {renderNumberInput("newMonthlyInstallment", "Monthly installment")}
                  {renderNumberInput("newMonthSubscription", "Month subscription")}

                  {newAssetType === "full-ownership" && (
                    <>
                      {renderNumberInput("newDocumentPrice", "Document price (total)")}
                      {renderNumberInput("newDocumentAmountPaid", "Document amount paid")}
                      {renderNumberInput("newDocumentMonthlyInstallment", "Document monthly installment")}
                    </>
                  )}
                </div>
              </div>

              <Separator />

              {/* Asset question */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm">Asset details (pre-loaded from current)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name_of_property">Name on document</Label>
                    <Controller
                      name="name_of_property"
                      control={control}
                      render={({ field }) => <Input id="name_of_property" {...field} />}
                    />
                    {errors.name_of_property && (
                      <p className="text-red-500 text-sm">{errors.name_of_property.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="mode_of_communication">Mode of communication</Label>
                    <Controller
                      name="mode_of_communication"
                      control={control}
                      render={({ field }) => <Input id="mode_of_communication" {...field} />}
                    />
                    {errors.mode_of_communication && (
                      <p className="text-red-500 text-sm">{errors.mode_of_communication.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="source_of_funds">Source of funds</Label>
                    <Controller
                      name="source_of_funds"
                      control={control}
                      render={({ field }) => <Input id="source_of_funds" {...field} />}
                    />
                    {errors.source_of_funds && (
                      <p className="text-red-500 text-sm">{errors.source_of_funds.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="desired_landuse">Desired land use</Label>
                    <Controller
                      name="desired_landuse"
                      control={control}
                      render={({ field }) => <Input id="desired_landuse" {...field} />}
                    />
                    {errors.desired_landuse && (
                      <p className="text-red-500 text-sm">{errors.desired_landuse.message}</p>
                    )}
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="address">Address</Label>
                    <Controller
                      name="address"
                      control={control}
                      render={({ field }) => <Input id="address" {...field} />}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label htmlFor="reason">Reason for transfer (internal note)</Label>
                <Controller
                  name="reason"
                  control={control}
                  render={({ field }) => (
                    <Textarea
                      id="reason"
                      rows={3}
                      placeholder="Why was this transfer negotiated?"
                      {...field}
                    />
                  )}
                />
              </div>
            </div>
          </ScrollArea>

          <DialogFooter className="mt-4">
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm transfer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
