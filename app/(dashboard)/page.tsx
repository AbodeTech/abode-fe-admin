"use client";

import { Suspense } from "react";
import {
  useAdminDashboard,
  DashboardQuickOverview,
  TopSellingProducts,
  TopAssociates,
  InviteAdminDialog,
} from "@/features/dashboard";
import { useAuthStore } from "@/store/auth-store";
import { Loader2 } from "lucide-react";
import { DateFilter } from "@/components/shared/DateFilter";
import { useSearchParams } from "next/navigation";

function DashboardContent() {
  const { user } = useAuthStore();
  const searchParams = useSearchParams();
  const startDate = searchParams.get("start_date");
  const endDate = searchParams.get("end_date");

  const { data, isLoading, error } = useAdminDashboard({
    startDate,
    endDate,
  });

  const isAdmin = user?.role === "admin";

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-md bg-red-50 text-red-500 border border-red-200">
        <h3 className="font-bold">Error loading dashboard</h3>
        <p>{(error as Error).message || "An unexpected error occurred."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <div className="flex items-center gap-3">
          <DateFilter />
          {isAdmin && <InviteAdminDialog />}
        </div>
      </div>
      <p className="text-muted-foreground">
        Welcome back, {user?.firstName || "Admin"}. Here&apos;s an overview of your platform.
      </p>

      {data && (
        <>
          <DashboardQuickOverview data={data} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopSellingProducts data={data.top_selling_prop} />
            <TopAssociates data={data.top_associates} />
          </div>
        </>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <DashboardContent />
    </Suspense>
  );
}
