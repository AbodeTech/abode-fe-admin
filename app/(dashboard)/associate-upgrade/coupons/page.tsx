"use client";

import { useDeferredValue, useState } from "react";
import {
  CouponFilters,
  CouponsTable,
  CreateCouponDialog,
  useCoupons,
  useDeleteCoupon,
  useUpdateCoupon,
  useUpdateCouponStatus,
} from "@/features/coupons";
import type {
  CouponStatus,
  ManualCouponStatus,
  UpdateCouponInput,
} from "@/features/coupons/schemas/coupon.schema";
import { toast } from "sonner";

export default function CouponsPage() {
  const [status, setStatus] = useState<CouponStatus | null>(null);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  const { data, isLoading, error } = useCoupons({
    status: status ?? undefined,
    search: deferredSearch.trim() || undefined,
    applies_to: "associate-pro-upgrade",
  });
  const { mutateAsync: updateStatus, isPending: updating } = useUpdateCouponStatus();
  const { mutateAsync: deleteCoupon, isPending: deleting } = useDeleteCoupon();
  const { mutateAsync: updateCoupon, isPending: editing } = useUpdateCoupon();

  const handleStatusChange = async (
    code: string,
    nextStatus: ManualCouponStatus,
    reason?: string
  ) => {
    try {
      await updateStatus({ couponCode: code, status: nextStatus, reason });
      toast.success("Coupon status updated");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update status");
    }
  };

  const handleDelete = async (code: string) => {
    try {
      await deleteCoupon(code);
      toast.success("Coupon deleted");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to delete coupon");
    }
  };

  const handleUpdate = async (input: { couponCode: string } & UpdateCouponInput) => {
    try {
      await updateCoupon(input);
      toast.success("Coupon updated");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update coupon");
      throw err;
    }
  };

  if (error) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-[1600px] px-3 sm:px-4">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
          <h3 className="font-bold">Error loading coupons</h3>
          <p>{(error as Error).message || "An unexpected error occurred."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] space-y-4 px-3 pb-16 sm:space-y-6 sm:px-4 sm:pb-20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">Associate Upgrade Coupons</h1>
          <p className="text-sm text-muted-foreground sm:text-base">Manage discount codes for upgrade flows.</p>
        </div>
        <div className="w-full shrink-0 sm:w-auto">
          <CreateCouponDialog />
        </div>
      </div>

      <CouponFilters status={status} onStatusChange={setStatus} search={search} onSearchChange={setSearch} />

      <CouponsTable
        data={data?.items ?? []}
        isLoading={isLoading || updating || deleting || editing}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
