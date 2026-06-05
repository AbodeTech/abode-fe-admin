"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import type { CommissionConfig } from "../hooks/use-commission-config";
import { useUpdateCommissionConfig } from "../hooks/use-commission-config";

// Convert decimal to display percentage (0.05 → 5)
const toDisplay = (val: number) => Number((val * 100).toFixed(4));
// Convert display percentage back to decimal (5 → 0.05)
const toDecimal = (val: number) => val / 100;

interface EditCommissionConfigDialogProps {
  config: CommissionConfig;
}

interface FormState {
  // Flex direct (displayed as %)
  flex_founder: number;
  flex_associate_pro: number;
  flex_premium: number;
  flex_default: number;
  // Full ownership direct
  fo_direct_founder: number;
  fo_direct_associate_pro: number;
  fo_direct_premium: number;
  fo_direct_default: number;
  // Full ownership upline (no default)
  fo_upline_founder: number;
  fo_upline_associate_pro: number;
  fo_upline_premium: number;
  // Full ownership topline (only associate_pro, founder)
  fo_topline_founder: number;
  fo_topline_associate_pro: number;
  // Flex removal direct (associate_pro, default)
  flex_removal_associate_pro: number;
  flex_removal_default: number;
  // Full ownership removal
  fo_removal_direct_associate_pro: number;
  fo_removal_direct_default: number;
  fo_removal_upline: number;
  fo_removal_topline: number;
  // General (displayed as %)
  wht_percentage: number;
  upgrade_commission_percentage: number;
  // Marketplace
  marketplace_platform_fee_percentage: number;
  // General (raw NGN)
  high_commission_alert_threshold: number;
  associate_pro_fee: number;
  // Required
  changeDescription: string;
}

function initFormState(c: CommissionConfig): FormState {
  return {
    flex_founder: toDisplay(c.flexCommission.direct.founder),
    flex_associate_pro: toDisplay(c.flexCommission.direct.associate_pro),
    flex_premium: toDisplay(c.flexCommission.direct.premium),
    flex_default: toDisplay(c.flexCommission.direct.default),

    fo_direct_founder: toDisplay(c.fullOwnershipCommission.direct.founder),
    fo_direct_associate_pro: toDisplay(c.fullOwnershipCommission.direct.associate_pro),
    fo_direct_premium: toDisplay(c.fullOwnershipCommission.direct.premium),
    fo_direct_default: toDisplay(c.fullOwnershipCommission.direct.default),

    fo_upline_founder: toDisplay(c.fullOwnershipCommission.upline.founder),
    fo_upline_associate_pro: toDisplay(c.fullOwnershipCommission.upline.associate_pro),
    fo_upline_premium: toDisplay(c.fullOwnershipCommission.upline.premium),

    fo_topline_founder: toDisplay(c.fullOwnershipCommission.topline.founder),
    fo_topline_associate_pro: toDisplay(c.fullOwnershipCommission.topline.associate_pro),

    flex_removal_associate_pro: toDisplay(c.flexRemoval.direct.associate_pro),
    flex_removal_default: toDisplay(c.flexRemoval.direct.default),

    fo_removal_direct_associate_pro: toDisplay(c.fullOwnershipRemoval.direct.associate_pro),
    fo_removal_direct_default: toDisplay(c.fullOwnershipRemoval.direct.default),
    fo_removal_upline: toDisplay(c.fullOwnershipRemoval.upline),
    fo_removal_topline: toDisplay(c.fullOwnershipRemoval.topline),

    marketplace_platform_fee_percentage: toDisplay(c.marketplacePlatformFeePercentage),
    wht_percentage: toDisplay(c.whtPercentage),
    upgrade_commission_percentage: toDisplay(c.upgradeCommissionPercentage),
    high_commission_alert_threshold: c.highCommissionAlertThreshold,
    associate_pro_fee: c.associateProFee,

    changeDescription: "",
  };
}

function PercentField({
  id,
  label,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (val: number) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs">{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type="number"
          step="0.01"
          min={0}
          max={100}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className="pr-8"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">%</span>
      </div>
    </div>
  );
}

function CurrencyField({
  id,
  label,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  value: number;
  onChange: (val: number) => void;
  disabled: boolean;
}) {
  return (
    <div className="space-y-1">
      <Label htmlFor={id} className="text-xs">{label}</Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₦</span>
        <Input
          id={id}
          type="number"
          step="1"
          min={0}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          disabled={disabled}
          className="pl-7"
        />
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold pt-2">{children}</h3>;
}

export function EditCommissionConfigDialog({ config }: EditCommissionConfigDialogProps) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(() => initFormState(config));
  const { mutateAsync, isPending } = useUpdateCommissionConfig();

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) setForm(initFormState(config));
  };

  const set = <K extends keyof FormState>(key: K, val: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.changeDescription.trim()) {
      toast.error("Please provide a change description");
      return;
    }

    // Validate all percentage fields are 0-100
    const percentFields = [
      form.flex_founder, form.flex_associate_pro, form.flex_premium, form.flex_default,
      form.fo_direct_founder, form.fo_direct_associate_pro, form.fo_direct_premium, form.fo_direct_default,
      form.fo_upline_founder, form.fo_upline_associate_pro, form.fo_upline_premium,
      form.fo_topline_founder, form.fo_topline_associate_pro,
      form.flex_removal_associate_pro, form.flex_removal_default,
      form.fo_removal_direct_associate_pro, form.fo_removal_direct_default,
      form.fo_removal_upline, form.fo_removal_topline,
      form.marketplace_platform_fee_percentage,
      form.wht_percentage, form.upgrade_commission_percentage,
    ];
    if (percentFields.some((v) => v < 0 || v > 100)) {
      toast.error("All percentage values must be between 0 and 100");
      return;
    }
    if (form.high_commission_alert_threshold < 0 || form.associate_pro_fee < 0) {
      toast.error("Currency values must be 0 or greater");
      return;
    }

    try {
      await mutateAsync({
        flexCommission: {
          direct: {
            founder: toDecimal(form.flex_founder),
            associate_pro: toDecimal(form.flex_associate_pro),
            premium: toDecimal(form.flex_premium),
            default: toDecimal(form.flex_default),
          },
        },
        fullOwnershipCommission: {
          direct: {
            founder: toDecimal(form.fo_direct_founder),
            associate_pro: toDecimal(form.fo_direct_associate_pro),
            premium: toDecimal(form.fo_direct_premium),
            default: toDecimal(form.fo_direct_default),
          },
          upline: {
            founder: toDecimal(form.fo_upline_founder),
            associate_pro: toDecimal(form.fo_upline_associate_pro),
            premium: toDecimal(form.fo_upline_premium),
          },
          topline: {
            associate_pro: toDecimal(form.fo_topline_associate_pro),
            founder: toDecimal(form.fo_topline_founder),
          },
        },
        flexRemoval: {
          direct: {
            associate_pro: toDecimal(form.flex_removal_associate_pro),
            default: toDecimal(form.flex_removal_default),
          },
        },
        fullOwnershipRemoval: {
          direct: {
            associate_pro: toDecimal(form.fo_removal_direct_associate_pro),
            default: toDecimal(form.fo_removal_direct_default),
          },
          upline: toDecimal(form.fo_removal_upline),
          topline: toDecimal(form.fo_removal_topline),
        },
        marketplacePlatformFeePercentage: toDecimal(form.marketplace_platform_fee_percentage),
        whtPercentage: toDecimal(form.wht_percentage),
        highCommissionAlertThreshold: form.high_commission_alert_threshold,
        upgradeCommissionPercentage: toDecimal(form.upgrade_commission_percentage),
        associateProFee: form.associate_pro_fee,
        changeDescription: form.changeDescription.trim(),
      });
      toast.success("Commission configuration updated");
      handleOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update configuration");
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" className="w-full sm:w-auto">
          <Pencil className="mr-2 h-4 w-4" />
          Edit Configuration
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto sm:w-full">
        <DialogHeader>
          <DialogTitle>Edit Commission Configuration</DialogTitle>
          <DialogDescription>
            Update rates and fees. All percentage fields are 0–100. A change description is required.
          </DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {/* Flex Commission Direct */}
          <SectionTitle>Flex Commission (Direct)</SectionTitle>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <PercentField id="flex_founder" label="Founder" value={form.flex_founder} onChange={(v) => set("flex_founder", v)} disabled={isPending} />
            <PercentField id="flex_associate_pro" label="Associate Pro" value={form.flex_associate_pro} onChange={(v) => set("flex_associate_pro", v)} disabled={isPending} />
            <PercentField id="flex_premium" label="Premium" value={form.flex_premium} onChange={(v) => set("flex_premium", v)} disabled={isPending} />
            <PercentField id="flex_default" label="Default" value={form.flex_default} onChange={(v) => set("flex_default", v)} disabled={isPending} />
          </div>

          <Separator />

          {/* Full Ownership Direct */}
          <SectionTitle>Full Ownership — Direct</SectionTitle>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <PercentField id="fo_d_founder" label="Founder" value={form.fo_direct_founder} onChange={(v) => set("fo_direct_founder", v)} disabled={isPending} />
            <PercentField id="fo_d_ap" label="Associate Pro" value={form.fo_direct_associate_pro} onChange={(v) => set("fo_direct_associate_pro", v)} disabled={isPending} />
            <PercentField id="fo_d_premium" label="Premium" value={form.fo_direct_premium} onChange={(v) => set("fo_direct_premium", v)} disabled={isPending} />
            <PercentField id="fo_d_default" label="Default" value={form.fo_direct_default} onChange={(v) => set("fo_direct_default", v)} disabled={isPending} />
          </div>

          {/* Full Ownership Upline — no default */}
          <SectionTitle>Full Ownership — Upline</SectionTitle>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <PercentField id="fo_u_founder" label="Founder" value={form.fo_upline_founder} onChange={(v) => set("fo_upline_founder", v)} disabled={isPending} />
            <PercentField id="fo_u_ap" label="Associate Pro" value={form.fo_upline_associate_pro} onChange={(v) => set("fo_upline_associate_pro", v)} disabled={isPending} />
            <PercentField id="fo_u_premium" label="Premium" value={form.fo_upline_premium} onChange={(v) => set("fo_upline_premium", v)} disabled={isPending} />
          </div>

          {/* Full Ownership Topline — only associate_pro, founder */}
          <SectionTitle>Full Ownership — Topline</SectionTitle>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <PercentField id="fo_t_ap" label="Associate Pro" value={form.fo_topline_associate_pro} onChange={(v) => set("fo_topline_associate_pro", v)} disabled={isPending} />
            <PercentField id="fo_t_founder" label="Founder" value={form.fo_topline_founder} onChange={(v) => set("fo_topline_founder", v)} disabled={isPending} />
          </div>

          <Separator />

          {/* Flex Removal — direct only (associate_pro, default) */}
          <SectionTitle>Flex Removal (Direct)</SectionTitle>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <PercentField id="flex_removal_ap" label="Associate Pro" value={form.flex_removal_associate_pro} onChange={(v) => set("flex_removal_associate_pro", v)} disabled={isPending} />
            <PercentField id="flex_removal_def" label="Default" value={form.flex_removal_default} onChange={(v) => set("flex_removal_default", v)} disabled={isPending} />
          </div>

          {/* Full Ownership Removal */}
          <SectionTitle>Full Ownership Removal</SectionTitle>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <PercentField id="fo_removal_d_ap" label="Direct — Associate Pro" value={form.fo_removal_direct_associate_pro} onChange={(v) => set("fo_removal_direct_associate_pro", v)} disabled={isPending} />
            <PercentField id="fo_removal_d_def" label="Direct — Default" value={form.fo_removal_direct_default} onChange={(v) => set("fo_removal_direct_default", v)} disabled={isPending} />
            <PercentField id="fo_removal_u" label="Upline" value={form.fo_removal_upline} onChange={(v) => set("fo_removal_upline", v)} disabled={isPending} />
            <PercentField id="fo_removal_t" label="Topline" value={form.fo_removal_topline} onChange={(v) => set("fo_removal_topline", v)} disabled={isPending} />
          </div>

          <Separator />

          {/* General Settings */}
          <SectionTitle>General Settings</SectionTitle>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <PercentField id="wht" label="WHT" value={form.wht_percentage} onChange={(v) => set("wht_percentage", v)} disabled={isPending} />
            <PercentField id="upgrade_comm" label="Upgrade Commission" value={form.upgrade_commission_percentage} onChange={(v) => set("upgrade_commission_percentage", v)} disabled={isPending} />
            <PercentField id="marketplace_fee" label="Marketplace Platform Fee" value={form.marketplace_platform_fee_percentage} onChange={(v) => set("marketplace_platform_fee_percentage", v)} disabled={isPending} />
            <CurrencyField id="alert_threshold" label="High Commission Alert (NGN)" value={form.high_commission_alert_threshold} onChange={(v) => set("high_commission_alert_threshold", v)} disabled={isPending} />
            <CurrencyField id="ap_fee" label="Associate Pro Fee (NGN)" value={form.associate_pro_fee} onChange={(v) => set("associate_pro_fee", v)} disabled={isPending} />
          </div>

          <Separator />

          {/* Change Description */}
          <div className="space-y-1">
            <Label htmlFor="changeDescription" className="text-sm font-semibold">
              Change Description <span className="text-red-500">*</span>
            </Label>
            <Input
              id="changeDescription"
              placeholder="e.g. Increased WHT to comply with new tax regulation"
              value={form.changeDescription}
              onChange={(e) => set("changeDescription", e.target.value)}
              disabled={isPending}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !form.changeDescription.trim()}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
