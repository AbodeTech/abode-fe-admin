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
import { useCreateCoupon } from "../../hooks/use-coupons";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

export function CreateCouponDialog() {
  const [open, setOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState<number>(5);
  const [expiryType, setExpiryType] = useState("date");
  const [expiryDate, setExpiryDate] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [usageLimitType, setUsageLimitType] = useState("unlimited");
  const [usageLimit, setUsageLimit] = useState<number | undefined>(undefined);
  const [activeImmediately, setActiveImmediately] = useState(true);

  const { mutateAsync: createCoupon, isPending } = useCreateCoupon();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCoupon({
        couponCode,
        discountPercentage: discount,
        expiryType,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        usageLimitType,
        usageLimit: usageLimitType === "limited" ? usageLimit : undefined,
        activeImmediately,
      });
      toast.success("Coupon created");
      setOpen(false);
      setCouponCode("");
      setDiscount(5);
      setExpiryDate("");
      setStartDate("");
      setUsageLimit(undefined);
      setUsageLimitType("unlimited");
      setActiveImmediately(true);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create coupon");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Create Coupon
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Coupon</DialogTitle>
          <DialogDescription>Define discount and usage limits.</DialogDescription>
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
          <div className="space-y-2">
            <Label htmlFor="discount">Discount %</Label>
            <Input
              id="discount"
              type="number"
              min={1}
              max={100}
              value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))}
              required
              disabled={isPending}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Expiry Type</Label>
              <Select
                value={expiryType}
                onValueChange={setExpiryType}
                disabled={isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Expiry type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="none">None</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Usage Limit Type</Label>
              <Select
                value={usageLimitType}
                onValueChange={setUsageLimitType}
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
          {expiryType === "date" && (
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
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  disabled={isPending}
                />
              </div>
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
