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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useCreateCoupon } from "../hooks/use-coupons";
import {
  COUPON_APPLY_SITE_LABELS,
  type CouponApplySite,
  type CouponExpiryType,
  type CouponUsageLimitType,
} from "../schemas/coupon.schema";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

function toIsoDate(date: string): string {
  return new Date(`${date}T00:00:00.000Z`).toISOString();
}

export function CreateCouponDialog() {
  const [open, setOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState("5");
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number | undefined>(undefined);
  const [appliesTo, setAppliesTo] = useState<CouponApplySite>("associate-pro-upgrade");
  const [expiryType, setExpiryType] = useState<CouponExpiryType>("no_expiry");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [usageLimitType, setUsageLimitType] = useState<CouponUsageLimitType>("unlimited");
  const [usageLimit, setUsageLimit] = useState<number | undefined>(undefined);
  const [maxUsesPerUser, setMaxUsesPerUser] = useState<number | undefined>(undefined);
  const [activeImmediately, setActiveImmediately] = useState(true);

  const { mutateAsync: createCoupon, isPending } = useCreateCoupon();

  const resetForm = () => {
    setCouponCode("");
    setDiscount("5");
    setMaxDiscountAmount(undefined);
    setAppliesTo("associate-pro-upgrade");
    setStartDate("");
    setEndDate("");
    setUsageLimit(undefined);
    setMaxUsesPerUser(undefined);
    setUsageLimitType("unlimited");
    setExpiryType("no_expiry");
    setActiveImmediately(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const discountPercentage = Number(discount);
    if (discount.trim() === "" || Number.isNaN(discountPercentage) || discountPercentage < 0 || discountPercentage > 100) {
      toast.error("Discount must be between 0 and 100");
      return;
    }

    if (!activeImmediately && !startDate) {
      toast.error("Start date is required unless the coupon activates immediately");
      return;
    }

    if (expiryType === "expires_on" && !endDate) {
      toast.error("End date is required when expiry is enabled");
      return;
    }

    if (expiryType === "expires_on" && startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      toast.error("End date must be after start date");
      return;
    }

    if (usageLimitType === "limited" && (!usageLimit || usageLimit < 1)) {
      toast.error("Usage limit is required for limited coupons");
      return;
    }

    try {
      await createCoupon({
        couponCode,
        discount_percentage: discountPercentage,
        max_discount_amount: maxDiscountAmount ?? null,
        applies_to: [appliesTo],
        expiry_type: expiryType,
        starts_at: !activeImmediately && startDate ? toIsoDate(startDate) : undefined,
        ends_at: expiryType === "expires_on" && endDate ? toIsoDate(endDate) : null,
        usage_limit_type: usageLimitType,
        usage_limit: usageLimitType === "limited" ? usageLimit : null,
        max_uses_per_user: maxUsesPerUser ?? null,
        activates_immediately: activeImmediately,
      });
      toast.success("Coupon created");
      setOpen(false);
      resetForm();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create coupon");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="w-full shrink-0 sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Create Coupon
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-lg overflow-y-auto sm:w-full">
        <DialogHeader>
          <DialogTitle>Create Coupon</DialogTitle>
          <DialogDescription>Define discount, apply-site, and usage limits.</DialogDescription>
        </DialogHeader>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="code">Code</Label>
            <Input
              id="code"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              required
              disabled={isPending}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="discount">Discount %</Label>
              <Input
                id="discount"
                type="number"
                min={0}
                max={100}
                inputMode="numeric"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                required
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxDiscount">Max discount (₦)</Label>
              <Input
                id="maxDiscount"
                type="number"
                min={0}
                value={maxDiscountAmount ?? ""}
                onChange={(e) =>
                  setMaxDiscountAmount(e.target.value === "" ? undefined : Number(e.target.value))
                }
                placeholder="No cap"
                disabled={isPending}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Applies to</Label>
            <Select
              value={appliesTo}
              onValueChange={(value) => setAppliesTo(value as CouponApplySite)}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(COUPON_APPLY_SITE_LABELS) as CouponApplySite[]).map((site) => (
                  <SelectItem key={site} value={site}>
                    {COUPON_APPLY_SITE_LABELS[site]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Expiry Type</Label>
              <Select
                value={expiryType}
                onValueChange={(value) => setExpiryType(value as CouponExpiryType)}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Expiry type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expires_on">Expires On</SelectItem>
                  <SelectItem value="no_expiry">No Expiry</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Usage Limit Type</Label>
              <Select
                value={usageLimitType}
                onValueChange={(value) => setUsageLimitType(value as CouponUsageLimitType)}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Usage limit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unlimited">Unlimited</SelectItem>
                  <SelectItem value="limited">Limited</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {usageLimitType === "limited" && (
            <div className="space-y-2">
              <Label htmlFor="limit">Usage Limit</Label>
              <Input
                id="limit"
                type="number"
                min={1}
                value={usageLimit ?? ""}
                onChange={(e) => setUsageLimit(Number(e.target.value))}
                disabled={isPending}
              />
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="perUser">Max uses per user</Label>
            <Input
              id="perUser"
              type="number"
              min={1}
              value={maxUsesPerUser ?? ""}
              onChange={(e) =>
                setMaxUsesPerUser(e.target.value === "" ? undefined : Number(e.target.value))
              }
              placeholder="Unlimited"
              disabled={isPending}
            />
          </div>
          {!activeImmediately && (
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isPending}
                required
              />
            </div>
          )}
          {expiryType === "expires_on" && (
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isPending}
                required
              />
            </div>
          )}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="activeImmediately"
              checked={activeImmediately}
              onCheckedChange={(checked) => setActiveImmediately(Boolean(checked))}
              disabled={isPending}
            />
            <Label htmlFor="activeImmediately">Active immediately</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !couponCode.trim()}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
