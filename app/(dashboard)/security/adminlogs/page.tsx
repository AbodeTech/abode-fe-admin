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
      <div className="mx-auto flex min-h-[40vh] w-full min-w-0 max-w-[1600px] items-center justify-center px-3 py-16 sm:px-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-[1600px] px-3 sm:px-4">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
          <h3 className="font-bold">Error loading admin logs</h3>
          <p>{(error as Error).message || "An unexpected error occurred."}</p>
        </div>
      </div>
    );
  }

  const logs = data?.data || [];
  const count = data?.count || 0;

  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] space-y-6 px-3 pb-16 sm:px-4 sm:pb-20">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="min-w-0 text-2xl font-bold tracking-tight">Admin Logs</h1>
        <AdminLogsExport
          filters={{
            page,
            limit: DEFAULT_ADMIN_LOGS_LIMIT,
            adminEmail,
            action,
          }}
        />
      </div>

      <Card className="min-w-0 overflow-hidden p-4">
        <AdminLogFilters />
      </Card>

      <AdminLogsTable logs={logs?.filter((log): log is NonNullable<typeof log> => log !== null)} />

      <Pagination count={count} currentIdx={page} limit={DEFAULT_ADMIN_LOGS_LIMIT} />
    </div>
  );
}

export default function AdminLogsPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex w-full min-w-0 max-w-[1600px] justify-center px-3 py-16 sm:px-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <Content />
    </Suspense>
  );
}
