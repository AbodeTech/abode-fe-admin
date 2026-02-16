"use client";

import { useMemo, useState } from "react";
import { useCoupons, useUpdateCouponStatus, useDeleteCoupon } from "@/features/associate-upgrade/hooks/use-coupons";
import { CouponsTable } from "@/features/associate-upgrade/components/coupons/CouponsTable";
import { CouponFilters } from "@/features/associate-upgrade/components/coupons/CouponFilters";
import { CreateCouponDialog } from "@/features/associate-upgrade/components/coupons/CreateCouponDialog";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function CouponsPage() {
  const { data, isLoading, error } = useCoupons();
  const { mutateAsync: updateStatus, isPending: updating } = useUpdateCouponStatus();
  const { mutateAsync: deleteCoupon, isPending: deleting } = useDeleteCoupon();

  const [status, setStatus] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const rows = data?.data ?? [];
    return rows
      .filter((c: any) => (status ? c?.status?.toLowerCase() === status : true))
      .filter((c: any) => (search ? c?.couponCode?.toLowerCase().includes(search.toLowerCase()) : true));
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

  if (error) {
    return (
      <div className="p-4 rounded-md bg-red-50 text-red-500 border border-red-200">
        <h3 className="font-bold">Error loading coupons</h3>
        <p>{(error as Error).message || "An unexpected error occurred."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Associate Upgrade Coupons</h1>
          <p className="text-muted-foreground">Manage discount codes for upgrade flows.</p>
        </div>
        <CreateCouponDialog />
      </div>

      <CouponFilters status={status} onStatusChange={setStatus} search={search} onSearchChange={setSearch} />

      <CouponsTable
        data={filtered}
        isLoading={isLoading || updating || deleting}
        onStatusChange={handleStatusChange}
        onDelete={handleDelete}
      />

      {(isLoading || updating || deleting) && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Working...
        </div>
      )}
    </div>
  );
}
