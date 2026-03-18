"use client";

import React, { useState, useEffect } from "react";
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
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useUpsertAssetCommissionOverride } from "../hooks/use-asset-commission-overrides";
import type { AssetCommissionOverride } from "../hooks/use-asset-commission-overrides";
import { useCommissionConfig } from "../hooks/use-commission-config";
import { useAssetOptions } from "../hooks/use-asset-options";

// Convert decimal to display percentage (0.05 -> 5)
const toDisplay = (val: number | null | undefined) =>
  val != null ? Number((val * 100).toFixed(4)) : null;
// Convert display percentage back to decimal (5 -> 0.05)
const toDecimal = (val: number) => val / 100;

interface FieldState {
  enabled: boolean;
  value: number;
}

interface FormFields {
  // Flex direct
  flex_founder: FieldState;
  flex_associate_pro: FieldState;
  flex_premium: FieldState;
  flex_default: FieldState;
  // Full ownership direct
  fo_direct_founder: FieldState;
  fo_direct_associate_pro: FieldState;
  fo_direct_premium: FieldState;
  fo_direct_default: FieldState;
  // Full ownership upline
  fo_upline_founder: FieldState;
  fo_upline_associate_pro: FieldState;
  fo_upline_premium: FieldState;
  // Full ownership topline
  fo_topline_founder: FieldState;
  fo_topline_associate_pro: FieldState;
  // Flex removal
  flex_removal_associate_pro: FieldState;
  flex_removal_default: FieldState;
  // Full ownership removal
  fo_removal_direct_associate_pro: FieldState;
  fo_removal_direct_default: FieldState;
  fo_removal_upline: FieldState;
  fo_removal_topline: FieldState;
}

type FieldKey = keyof FormFields;

function initFields(override: AssetCommissionOverride | null): FormFields {
  const f = (val: number | null | undefined, fallback: number = 0): FieldState => ({
    enabled: val != null,
    value: toDisplay(val) ?? toDisplay(fallback) ?? 0,
  });

  return {
    flex_founder: f(override?.flexCommission?.direct?.founder),
    flex_associate_pro: f(override?.flexCommission?.direct?.associate_pro),
    flex_premium: f(override?.flexCommission?.direct?.premium),
    flex_default: f(override?.flexCommission?.direct?.default),
    fo_direct_founder: f(override?.fullOwnershipCommission?.direct?.founder),
    fo_direct_associate_pro: f(override?.fullOwnershipCommission?.direct?.associate_pro),
    fo_direct_premium: f(override?.fullOwnershipCommission?.direct?.premium),
    fo_direct_default: f(override?.fullOwnershipCommission?.direct?.default),
    fo_upline_founder: f(override?.fullOwnershipCommission?.upline?.founder),
    fo_upline_associate_pro: f(override?.fullOwnershipCommission?.upline?.associate_pro),
    fo_upline_premium: f(override?.fullOwnershipCommission?.upline?.premium),
    fo_topline_founder: f(override?.fullOwnershipCommission?.topline?.founder),
    fo_topline_associate_pro: f(override?.fullOwnershipCommission?.topline?.associate_pro),
    flex_removal_associate_pro: f(override?.flexRemoval?.direct?.associate_pro),
    flex_removal_default: f(override?.flexRemoval?.direct?.default),
    fo_removal_direct_associate_pro: f(override?.fullOwnershipRemoval?.direct?.associate_pro),
    fo_removal_direct_default: f(override?.fullOwnershipRemoval?.direct?.default),
    fo_removal_upline: f(override?.fullOwnershipRemoval?.upline),
    fo_removal_topline: f(override?.fullOwnershipRemoval?.topline),
  };
}

function OverridePercentField({
  id,
  label,
  field,
  globalValue,
  onToggle,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  field: FieldState;
  globalValue?: number;
  onToggle: (enabled: boolean) => void;
  onChange: (val: number) => void;
  disabled: boolean;
}) {
  const globalDisplay = globalValue != null ? Number((globalValue * 100).toFixed(4)) : undefined;
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-2">
        <Checkbox
          id={`${id}_toggle`}
          checked={field.enabled}
          onCheckedChange={(checked) => onToggle(!!checked)}
          disabled={disabled}
        />
        <Label htmlFor={`${id}_toggle`} className="text-xs">
          {label}
        </Label>
      </div>
      <div className="relative">
        <Input
          id={id}
          type="number"
          step="0.01"
          min={0}
          max={100}
          value={field.enabled ? field.value : ""}
          placeholder={globalDisplay != null ? `Global: ${globalDisplay}%` : ""}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled || !field.enabled}
          className="pr-8"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          %
        </span>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold pt-2">{children}</h3>;
}

interface EditAssetOverrideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  override: AssetCommissionOverride | null;
}

export function EditAssetOverrideDialog({
  open,
  onOpenChange,
  override,
}: EditAssetOverrideDialogProps) {
  const isEdit = !!override;
  const [assetId, setAssetId] = useState(override?.asset._id ?? "");
  const [fields, setFields] = useState<FormFields>(() => initFields(override));
  const [changeDescription, setChangeDescription] = useState("");

  const [assetPopoverOpen, setAssetPopoverOpen] = useState(false);

  const { data: globalConfig } = useCommissionConfig();
  const { mutateAsync, isPending } = useUpsertAssetCommissionOverride();
  const { data: assetOptions, isLoading: assetsLoading } = useAssetOptions(
    open && !isEdit
  );

  const selectedAsset = assetOptions?.find((a) => a._id === assetId);

  useEffect(() => {
    if (open) {
      setFields(initFields(override));
      setAssetId(override?.asset._id ?? "");
      setChangeDescription("");
    }
  }, [open, override]);

  const setField = (key: FieldKey, update: Partial<FieldState>) =>
    setFields((prev) => ({ ...prev, [key]: { ...prev[key], ...update } }));

  const buildInput = () => {
    const val = (f: FieldState) => (f.enabled ? toDecimal(f.value) : undefined);

    const flexCommission = {
      direct: {
        ...(fields.flex_founder.enabled && { founder: val(fields.flex_founder) }),
        ...(fields.flex_associate_pro.enabled && { associate_pro: val(fields.flex_associate_pro) }),
        ...(fields.flex_premium.enabled && { premium: val(fields.flex_premium) }),
        ...(fields.flex_default.enabled && { default: val(fields.flex_default) }),
      },
    };

    const fullOwnershipCommission = {
      direct: {
        ...(fields.fo_direct_founder.enabled && { founder: val(fields.fo_direct_founder) }),
        ...(fields.fo_direct_associate_pro.enabled && { associate_pro: val(fields.fo_direct_associate_pro) }),
        ...(fields.fo_direct_premium.enabled && { premium: val(fields.fo_direct_premium) }),
        ...(fields.fo_direct_default.enabled && { default: val(fields.fo_direct_default) }),
      },
      upline: {
        ...(fields.fo_upline_founder.enabled && { founder: val(fields.fo_upline_founder) }),
        ...(fields.fo_upline_associate_pro.enabled && { associate_pro: val(fields.fo_upline_associate_pro) }),
        ...(fields.fo_upline_premium.enabled && { premium: val(fields.fo_upline_premium) }),
      },
      topline: {
        ...(fields.fo_topline_founder.enabled && { founder: val(fields.fo_topline_founder) }),
        ...(fields.fo_topline_associate_pro.enabled && { associate_pro: val(fields.fo_topline_associate_pro) }),
      },
    };

    const flexRemoval = {
      direct: {
        ...(fields.flex_removal_associate_pro.enabled && { associate_pro: val(fields.flex_removal_associate_pro) }),
        ...(fields.flex_removal_default.enabled && { default: val(fields.flex_removal_default) }),
      },
    };

    const fullOwnershipRemoval: Record<string, any> = {
      direct: {
        ...(fields.fo_removal_direct_associate_pro.enabled && { associate_pro: val(fields.fo_removal_direct_associate_pro) }),
        ...(fields.fo_removal_direct_default.enabled && { default: val(fields.fo_removal_direct_default) }),
      },
    };
    if (fields.fo_removal_upline.enabled) fullOwnershipRemoval.upline = val(fields.fo_removal_upline);
    if (fields.fo_removal_topline.enabled) fullOwnershipRemoval.topline = val(fields.fo_removal_topline);

    // Only include sections that have at least one enabled field
    const input: Record<string, any> = {
      assetId,
      changeDescription: changeDescription.trim(),
    };
    if (Object.keys(flexCommission.direct).length > 0) input.flexCommission = flexCommission;
    if (
      Object.keys(fullOwnershipCommission.direct).length > 0 ||
      Object.keys(fullOwnershipCommission.upline).length > 0 ||
      Object.keys(fullOwnershipCommission.topline).length > 0
    ) {
      input.fullOwnershipCommission = fullOwnershipCommission;
    }
    if (Object.keys(flexRemoval.direct).length > 0) input.flexRemoval = flexRemoval;
    if (
      Object.keys(fullOwnershipRemoval.direct).length > 0 ||
      fullOwnershipRemoval.upline !== undefined ||
      fullOwnershipRemoval.topline !== undefined
    ) {
      input.fullOwnershipRemoval = fullOwnershipRemoval;
    }

    return input;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!assetId.trim()) {
      toast.error("Please select an asset");
      return;
    }
    if (!changeDescription.trim()) {
      toast.error("Please provide a change description");
      return;
    }

    // Validate enabled percentage fields are 0-100
    const enabledFields = Object.values(fields).filter((f) => f.enabled);
    if (enabledFields.some((f) => f.value < 0 || f.value > 100)) {
      toast.error("All percentage values must be between 0 and 100");
      return;
    }

    if (enabledFields.length === 0) {
      toast.error("Please enable at least one rate override");
      return;
    }

    try {
      await mutateAsync(buildInput() as any);
      toast.success(isEdit ? "Override updated" : "Override created");
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to save override");
    }
  };

  const gc = globalConfig;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit" : "Create"} Per-Asset Commission Override
          </DialogTitle>
          <DialogDescription>
            Override specific commission rates for this asset. Unchecked fields use global defaults.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Asset Selection */}
          <div className="space-y-1">
            <Label className="text-sm font-semibold">
              Asset <span className="text-red-500">*</span>
            </Label>
            {isEdit ? (
              <Input
                value={
                  override?.asset
                    ? `${override.asset.asset_name} (${override.asset.asset_type})`
                    : assetId
                }
                disabled
              />
            ) : (
              <Popover
                open={assetPopoverOpen}
                onOpenChange={setAssetPopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={assetPopoverOpen}
                    className="w-full justify-between font-normal"
                    disabled={isPending}
                  >
                    {selectedAsset
                      ? `${selectedAsset.asset_name} (${selectedAsset.asset_type})`
                      : "Select an asset..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command>
                    <CommandInput placeholder="Search assets..." />
                    <CommandList>
                      <CommandEmpty>
                        {assetsLoading ? "Loading assets..." : "No assets found."}
                      </CommandEmpty>
                      <CommandGroup>
                        {assetOptions?.map((asset) => (
                          <CommandItem
                            key={asset._id}
                            value={`${asset.asset_name} ${asset.asset_type}`}
                            onSelect={() => {
                              setAssetId(asset._id);
                              setAssetPopoverOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                assetId === asset._id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            <span className="truncate">
                              {asset.asset_name}{" "}
                              <span className="text-muted-foreground">
                                ({asset.asset_type})
                              </span>
                            </span>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            )}
          </div>

          <Separator />

          {/* Flex Commission Direct */}
          <SectionTitle>Flex Commission (Direct)</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <OverridePercentField id="ov_flex_founder" label="Founder" field={fields.flex_founder} globalValue={gc?.flexCommission.direct.founder} onToggle={(e) => setField("flex_founder", { enabled: e })} onChange={(v) => setField("flex_founder", { value: v })} disabled={isPending} />
            <OverridePercentField id="ov_flex_ap" label="Associate Pro" field={fields.flex_associate_pro} globalValue={gc?.flexCommission.direct.associate_pro} onToggle={(e) => setField("flex_associate_pro", { enabled: e })} onChange={(v) => setField("flex_associate_pro", { value: v })} disabled={isPending} />
            <OverridePercentField id="ov_flex_premium" label="Premium" field={fields.flex_premium} globalValue={gc?.flexCommission.direct.premium} onToggle={(e) => setField("flex_premium", { enabled: e })} onChange={(v) => setField("flex_premium", { value: v })} disabled={isPending} />
            <OverridePercentField id="ov_flex_default" label="Default" field={fields.flex_default} globalValue={gc?.flexCommission.direct.default} onToggle={(e) => setField("flex_default", { enabled: e })} onChange={(v) => setField("flex_default", { value: v })} disabled={isPending} />
          </div>

          <Separator />

          {/* Full Ownership Direct */}
          <SectionTitle>Full Ownership -- Direct</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <OverridePercentField id="ov_fo_d_founder" label="Founder" field={fields.fo_direct_founder} globalValue={gc?.fullOwnershipCommission.direct.founder} onToggle={(e) => setField("fo_direct_founder", { enabled: e })} onChange={(v) => setField("fo_direct_founder", { value: v })} disabled={isPending} />
            <OverridePercentField id="ov_fo_d_ap" label="Associate Pro" field={fields.fo_direct_associate_pro} globalValue={gc?.fullOwnershipCommission.direct.associate_pro} onToggle={(e) => setField("fo_direct_associate_pro", { enabled: e })} onChange={(v) => setField("fo_direct_associate_pro", { value: v })} disabled={isPending} />
            <OverridePercentField id="ov_fo_d_premium" label="Premium" field={fields.fo_direct_premium} globalValue={gc?.fullOwnershipCommission.direct.premium} onToggle={(e) => setField("fo_direct_premium", { enabled: e })} onChange={(v) => setField("fo_direct_premium", { value: v })} disabled={isPending} />
            <OverridePercentField id="ov_fo_d_default" label="Default" field={fields.fo_direct_default} globalValue={gc?.fullOwnershipCommission.direct.default} onToggle={(e) => setField("fo_direct_default", { enabled: e })} onChange={(v) => setField("fo_direct_default", { value: v })} disabled={isPending} />
          </div>

          {/* Full Ownership Upline */}
          <SectionTitle>Full Ownership -- Upline</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <OverridePercentField id="ov_fo_u_founder" label="Founder" field={fields.fo_upline_founder} globalValue={gc?.fullOwnershipCommission.upline.founder} onToggle={(e) => setField("fo_upline_founder", { enabled: e })} onChange={(v) => setField("fo_upline_founder", { value: v })} disabled={isPending} />
            <OverridePercentField id="ov_fo_u_ap" label="Associate Pro" field={fields.fo_upline_associate_pro} globalValue={gc?.fullOwnershipCommission.upline.associate_pro} onToggle={(e) => setField("fo_upline_associate_pro", { enabled: e })} onChange={(v) => setField("fo_upline_associate_pro", { value: v })} disabled={isPending} />
            <OverridePercentField id="ov_fo_u_premium" label="Premium" field={fields.fo_upline_premium} globalValue={gc?.fullOwnershipCommission.upline.premium} onToggle={(e) => setField("fo_upline_premium", { enabled: e })} onChange={(v) => setField("fo_upline_premium", { value: v })} disabled={isPending} />
          </div>

          {/* Full Ownership Topline */}
          <SectionTitle>Full Ownership -- Topline</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <OverridePercentField id="ov_fo_t_ap" label="Associate Pro" field={fields.fo_topline_associate_pro} globalValue={gc?.fullOwnershipCommission.topline.associate_pro} onToggle={(e) => setField("fo_topline_associate_pro", { enabled: e })} onChange={(v) => setField("fo_topline_associate_pro", { value: v })} disabled={isPending} />
            <OverridePercentField id="ov_fo_t_founder" label="Founder" field={fields.fo_topline_founder} globalValue={gc?.fullOwnershipCommission.topline.founder} onToggle={(e) => setField("fo_topline_founder", { enabled: e })} onChange={(v) => setField("fo_topline_founder", { value: v })} disabled={isPending} />
          </div>

          <Separator />

          {/* Flex Removal */}
          <SectionTitle>Flex Removal (Direct)</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <OverridePercentField id="ov_flex_rem_ap" label="Associate Pro" field={fields.flex_removal_associate_pro} globalValue={gc?.flexRemoval.direct.associate_pro} onToggle={(e) => setField("flex_removal_associate_pro", { enabled: e })} onChange={(v) => setField("flex_removal_associate_pro", { value: v })} disabled={isPending} />
            <OverridePercentField id="ov_flex_rem_def" label="Default" field={fields.flex_removal_default} globalValue={gc?.flexRemoval.direct.default} onToggle={(e) => setField("flex_removal_default", { enabled: e })} onChange={(v) => setField("flex_removal_default", { value: v })} disabled={isPending} />
          </div>

          {/* Full Ownership Removal */}
          <SectionTitle>Full Ownership Removal</SectionTitle>
          <div className="grid grid-cols-2 gap-3">
            <OverridePercentField id="ov_fo_rem_d_ap" label="Direct - Associate Pro" field={fields.fo_removal_direct_associate_pro} globalValue={gc?.fullOwnershipRemoval.direct.associate_pro} onToggle={(e) => setField("fo_removal_direct_associate_pro", { enabled: e })} onChange={(v) => setField("fo_removal_direct_associate_pro", { value: v })} disabled={isPending} />
            <OverridePercentField id="ov_fo_rem_d_def" label="Direct - Default" field={fields.fo_removal_direct_default} globalValue={gc?.fullOwnershipRemoval.direct.default} onToggle={(e) => setField("fo_removal_direct_default", { enabled: e })} onChange={(v) => setField("fo_removal_direct_default", { value: v })} disabled={isPending} />
            <OverridePercentField id="ov_fo_rem_u" label="Upline" field={fields.fo_removal_upline} globalValue={gc?.fullOwnershipRemoval.upline} onToggle={(e) => setField("fo_removal_upline", { enabled: e })} onChange={(v) => setField("fo_removal_upline", { value: v })} disabled={isPending} />
            <OverridePercentField id="ov_fo_rem_t" label="Topline" field={fields.fo_removal_topline} globalValue={gc?.fullOwnershipRemoval.topline} onToggle={(e) => setField("fo_removal_topline", { enabled: e })} onChange={(v) => setField("fo_removal_topline", { value: v })} disabled={isPending} />
          </div>

          <Separator />

          {/* Change Description */}
          <div className="space-y-1">
            <Label htmlFor="ov_changeDescription" className="text-sm font-semibold">
              Change Description <span className="text-red-500">*</span>
            </Label>
            <Input
              id="ov_changeDescription"
              placeholder="e.g. Special rates for Lagos Mainland flex project"
              value={changeDescription}
              onChange={(e) => setChangeDescription(e.target.value)}
              disabled={isPending}
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isPending || !changeDescription.trim() || !assetId.trim()}
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? "Update Override" : "Create Override"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
