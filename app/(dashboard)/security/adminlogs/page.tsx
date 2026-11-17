"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  ADMIN_LOG_PARAMS,
  AdminLogFilters,
  AdminLogsTable,
  useAdminLogs,
  DEFAULT_ADMIN_LOGS_LIMIT,
} from "@/features/admin-logs";
import { AdminLogsExport } from "@/features/admin-logs/components/AdminLogsExport";
import { Pagination } from "@/components/shared/Pagination";
import { SuspensePageFallback } from "@/components/shared/page-content-loader";
import { Card } from "@/components/ui/card";

function Content() {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;
  const adminId = searchParams.get(ADMIN_LOG_PARAMS.admin);
  const action = searchParams.get(ADMIN_LOG_PARAMS.action);

  const filters = { page, limit: DEFAULT_ADMIN_LOGS_LIMIT, adminId, action };
  const { data, isLoading, error } = useAdminLogs(filters);

  const total = data?.total ?? 0;

  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-400 space-y-6 px-3 pb-16 sm:px-4 sm:pb-20">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">Admin Logs</h1>
          <p className="text-sm text-muted-foreground">
            Every admin and system action, newest first.
            {!isLoading && !error && ` ${total.toLocaleString()} matching.`}
          </p>
        </div>
        <AdminLogsExport filters={filters} />
      </div>

      <Card className="min-w-0 overflow-hidden p-4">
        <AdminLogFilters />
      </Card>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-600">
          <h3 className="font-bold">Error loading admin logs</h3>
          <p>{(error as Error).message || "An unexpected error occurred."}</p>
        </div>
      ) : (
        <>
          <AdminLogsTable logs={data?.items} isLoading={isLoading} />
          {total > 0 && <Pagination count={total} currentIdx={page} limit={DEFAULT_ADMIN_LOGS_LIMIT} />}
        </>
      )}
    </div>
  );
}

export default function AdminLogsPage() {
  return (
    <Suspense fallback={<SuspensePageFallback />}>
      <Content />
    </Suspense>
  );
}
