"use client";

import { useMemo, useState } from "react";
import { useCoupons, useUpdateCouponStatus, useDeleteCoupon, useUpdateCoupon } from "@/features/associate-upgrade/hooks/use-coupons";
import { CouponsTable } from "@/features/associate-upgrade/components/coupons/CouponsTable";
import { CouponFilters } from "@/features/associate-upgrade/components/coupons/CouponFilters";
import { CreateCouponDialog } from "@/features/associate-upgrade/components/coupons/CreateCouponDialog";
import { toast } from "sonner";

export default function CouponsPage() {
  const { data, isLoading, error } = useCoupons();
  const { mutateAsync: updateStatus, isPending: updating } = useUpdateCouponStatus();
  const { mutateAsync: deleteCoupon, isPending: deleting } = useDeleteCoupon();
  const { mutateAsync: updateCoupon, isPending: editing } = useUpdateCoupon();

  const [status, setStatus] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const rows = data?.data ?? [];
    return rows
      .filter((c): c is NonNullable<typeof c> => c !== null)
      .filter((c) => (status ? c.status?.toLowerCase() === status : true))
      .filter((c) => (search ? c.couponCode?.toLowerCase().includes(search.toLowerCase()) : true));
  }, [data?.data, status, search]);

  const handleStatusChange = async (code: string, nextStatus: string) => {
    try {
      await updateStatus({ couponCode: code, status: nextStatus });
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

  const handleUpdate = async (input: {
    couponCode: string;
    discountPercentage: number;
    usageLimitType: string;
    usageLimit?: number;
    expiryType: string;
    startDate?: Date;
    endDate?: Date;
    expiryDate?: Date;
  }) => {
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
        data={filtered}
        isLoading={isLoading || updating || deleting || editing}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
        onUpdate={handleUpdate}
      />
    </div>
  );
}
