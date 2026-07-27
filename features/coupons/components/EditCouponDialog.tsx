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
import type { Coupon, UsageLimitType, ExpiryType } from "@/lib/gql/graphql";

interface EditCouponDialogProps {
  coupon: Coupon;
  open: boolean;
  isPending?: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: {
    couponCode: string;
    discountPercentage: number;
    usageLimitType: string;
    usageLimit?: number;
    expiryType: string;
    startDate?: Date;
    endDate?: Date;
    expiryDate?: Date;
  }) => Promise<void>;
}

export function EditCouponDialog({
  coupon,
  open,
  isPending,
  onOpenChange,
  onSubmit,
}: EditCouponDialogProps) {
  const [discount, setDiscount] = useState(Number(coupon.discountPercentage ?? 0));
  const [usageLimitType, setUsageLimitType] = useState<UsageLimitType>(coupon.usageLimitType ?? "unlimited");
  const [usageLimit, setUsageLimit] = useState<number | undefined>(coupon.usageLimit ?? undefined);
  const [expiryType, setExpiryType] = useState<ExpiryType>(coupon.expiryType ?? "no_expiry");
  const [startDate, setStartDate] = useState(coupon.startDate ? new Date(coupon.startDate).toISOString().slice(0, 10) : "");
  const [endDate, setEndDate] = useState(coupon.endDate ? new Date(coupon.endDate).toISOString().slice(0, 10) : "");
  const [expiryDate, setExpiryDate] = useState(coupon.expiryDate ? new Date(coupon.expiryDate).toISOString().slice(0, 10) : "");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    await onSubmit({
      couponCode: coupon.couponCode,
      discountPercentage: discount,
      usageLimitType,
      usageLimit: usageLimitType === "limited" ? usageLimit : undefined,
      expiryType,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
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

          <div className="space-y-2">
            <Label>Discount %</Label>
            <Input
              type="number"
              min={1}
              max={100}
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
              disabled={isPending}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Usage Limit Type</Label>
              <Select value={usageLimitType} onValueChange={(value) => setUsageLimitType(value as UsageLimitType)} disabled={isPending}>
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
            <Label>Expiry Type</Label>
            <Select value={expiryType} onValueChange={(value) => setExpiryType(value as ExpiryType)} disabled={isPending}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="no_expiry">No Expiry</SelectItem>
                <SelectItem value="expires_on">Expires On</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {expiryType === "expires_on" && (
            <div className="space-y-2">
              <Label>Expiry Date</Label>
              <Input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                disabled={isPending}
              />
            </div>
          )}

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
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                disabled={isPending}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
