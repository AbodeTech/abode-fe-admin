"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  COUPON_APPLY_SITE_LABELS,
  type Coupon,
  type CouponApplySite,
  type CouponExpiryType,
  type CouponUsageLimitType,
  type UpdateCouponInput,
} from "../schemas/coupon.schema";

interface EditCouponDialogProps {
  coupon: Coupon;
  open: boolean;
  isPending?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: { couponCode: string } & UpdateCouponInput) => Promise<void>;
}

function toDateInput(value?: string | null) {
  if (!value) return "";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

function toIsoDate(date: string): string {
  return new Date(`${date}T00:00:00.000Z`).toISOString();
}

export function EditCouponDialog({
  coupon,
  open,
  isPending,
  onOpenChange,
  onSubmit,
}: EditCouponDialogProps) {
  const [discount, setDiscount] = useState(String(coupon.discount_percentage));
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number | undefined>(
    coupon.max_discount_amount ?? undefined
  );
  const [appliesTo, setAppliesTo] = useState<CouponApplySite>(
    coupon.applies_to[0] ?? "associate-pro-upgrade"
  );
  const [usageLimitType, setUsageLimitType] = useState<CouponUsageLimitType>(
    coupon.usage_limit_type
  );
  const [usageLimit, setUsageLimit] = useState<number | undefined>(coupon.usage_limit ?? undefined);
  const [maxUsesPerUser, setMaxUsesPerUser] = useState<number | undefined>(
    coupon.max_uses_per_user ?? undefined
  );
  const [expiryType, setExpiryType] = useState<CouponExpiryType>(coupon.expiry_type);
  const [startDate, setStartDate] = useState(toDateInput(coupon.starts_at));
  const [endDate, setEndDate] = useState(toDateInput(coupon.ends_at));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const discountPercentage = Number(discount);
    if (
      discount.trim() === "" ||
      Number.isNaN(discountPercentage) ||
      discountPercentage < 0 ||
      discountPercentage > 100
    ) {
      return;
    }

    if (usageLimitType === "limited" && (!usageLimit || usageLimit < 1)) {
      return;
    }

    if (expiryType === "expires_on" && !endDate) {
      return;
    }

    await onSubmit({
      couponCode: coupon.couponCode,
      discount_percentage: discountPercentage,
      max_discount_amount: maxDiscountAmount ?? null,
      applies_to: [appliesTo],
      usage_limit_type: usageLimitType,
      usage_limit: usageLimitType === "limited" ? usageLimit : null,
      max_uses_per_user: maxUsesPerUser ?? null,
      expiry_type: expiryType,
      starts_at: startDate ? toIsoDate(startDate) : null,
      ends_at: expiryType === "expires_on" && endDate ? toIsoDate(endDate) : null,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[calc(100vw-1.5rem)] max-w-lg overflow-y-auto sm:w-full">
        <DialogHeader>
          <DialogTitle>Edit Coupon</DialogTitle>
          <DialogDescription>Update coupon settings for {coupon.couponCode}.</DialogDescription>
        </DialogHeader>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label>Coupon Code</Label>
            <Input value={coupon.couponCode} disabled />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Discount %</Label>
              <Input
                type="number"
                min={0}
                max={100}
                inputMode="numeric"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
                disabled={isPending}
              />
            </div>
            <div className="space-y-2">
              <Label>Max discount (₦)</Label>
              <Input
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
              <Label>Usage Limit Type</Label>
              <Select
                value={usageLimitType}
                onValueChange={(value) => setUsageLimitType(value as CouponUsageLimitType)}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unlimited">Unlimited</SelectItem>
                  <SelectItem value="limited">Limited</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {usageLimitType === "limited" && (
              <div className="space-y-2">
                <Label>Usage Limit</Label>
                <Input
                  type="number"
                  min={1}
                  value={usageLimit ?? ""}
                  onChange={(e) => setUsageLimit(Number(e.target.value))}
                  disabled={isPending}
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Max uses per user</Label>
            <Input
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

          <div className="space-y-2">
            <Label>Expiry Type</Label>
            <Select
              value={expiryType}
              onValueChange={(value) => setExpiryType(value as CouponExpiryType)}
              disabled={isPending}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no_expiry">No Expiry</SelectItem>
                <SelectItem value="expires_on">Expires On</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                disabled={isPending}
              />
            </div>
            {expiryType === "expires_on" && (
              <div className="space-y-2">
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  disabled={isPending}
                />
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || coupon.status === "expired"}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
