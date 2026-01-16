"use client";

import { useQuery } from "@tanstack/react-query";
import { getAdminDashboardDetails, type DashboardData } from "@/lib/api/admin/dashboard";
import DashboardQuickOverview from "@/components/features/dashboard/DashboardQuickOverview";
import TopSellingProducts from "@/components/features/dashboard/TopSellingProducts";
import TopAssociates from "@/components/features/dashboard/TopAssociates";
import { useAuthStore } from "@/store/auth-store";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ["adminDashboard"],
    queryFn: () => getAdminDashboardDetails(),
  });

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
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome back, {user?.firstName || "Admin"}. Here&apos;s an overview of your platform.
        </p>
      </div>

      {data && (
        <>
          <DashboardQuickOverview {...data} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopSellingProducts data={data.top_selling_prop} />
            <TopAssociates data={data.top_associates} />
          </div>
        </>
      )}
    </div>
  );
}