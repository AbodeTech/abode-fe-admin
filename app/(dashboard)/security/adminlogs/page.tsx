"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  AdminLogFilters,
  AdminLogsTable,
  useAdminLogs,
  DEFAULT_ADMIN_LOGS_LIMIT,
} from "@/features/admin-logs";
import { AdminLogsExport } from "@/features/admin-logs/components/AdminLogsExport";
import { Pagination } from "@/components/shared/Pagination";
import { Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

function Content() {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const adminEmail = searchParams.get("query") || null;
  const action = searchParams.get("action") || null;

  const { data, isLoading, error } = useAdminLogs({
    page,
    limit: DEFAULT_ADMIN_LOGS_LIMIT,
    adminEmail,
    action,
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
        <h3 className="font-bold">Error loading admin logs</h3>
        <p>{(error as Error).message || "An unexpected error occurred."}</p>
      </div>
    );
  }

  const logs = data?.data || [];
  const count = data?.count || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Admin Logs</h1>
        <AdminLogsExport
          filters={{
            page,
            limit: DEFAULT_ADMIN_LOGS_LIMIT,
            adminEmail,
            action,
          }}
        />
      </div>

      <Card className="p-4">
        <AdminLogFilters />
      </Card>

      <AdminLogsTable logs={logs?.filter((log): log is NonNullable<typeof log> => log !== null)} />

      <Pagination count={count} currentIdx={page} limit={DEFAULT_ADMIN_LOGS_LIMIT} />
    </div>
  );
}

export default function AdminLogsPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <Content />
    </Suspense>
  );
}
