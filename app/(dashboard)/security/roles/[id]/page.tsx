"use client";

import { useParams } from "next/navigation";
import { useAdminWithRole } from "@/features/roles-permissions";
import { AdminDetailHeader, type AdminLogLike } from "@/features/roles-permissions/components/AdminDetailHeader";
import { AdminLogsTable, DEFAULT_ADMIN_LOGS_LIMIT, useAdminLogs } from "@/features/admin-logs";
import { Pagination } from "@/components/shared/Pagination";
import { PageContentLoader } from "@/components/shared/page-content-loader";

export default function AdminDetailPage() {
  const params = useParams();
  const adminId = params?.id as string;

  const { data: admin, isLoading: loadingAdmin, error: adminError } = useAdminWithRole(adminId);

  const { data: logsData, isLoading: loadingLogs, error: logsError } = useAdminLogs({
    page: 1,
    limit: DEFAULT_ADMIN_LOGS_LIMIT,
    adminEmail: admin?.email || undefined,
  });

  if (adminError) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-[1600px] px-3 sm:px-4">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
          <h3 className="font-bold">Error loading admin</h3>
          <p>{(adminError as Error).message || "An unexpected error occurred."}</p>
        </div>
      </div>
    );
  }

  if (loadingAdmin) {
    return (
      <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] px-3 sm:px-4">
        <PageContentLoader label="Loading admin details…" />
      </div>
    );
  }

  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] space-y-6 px-3 pb-16 sm:px-4 sm:pb-20">
      <AdminDetailHeader
        admin={admin}
        logs={
          (logsData?.data?.filter((log): log is NonNullable<typeof log> => log !== null) ||
            []) as AdminLogLike[]
        }
        isLoadingLogs={loadingLogs}
      />

      <div className="min-w-0 space-y-3">
        <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="text-xl font-semibold">Activity History</h3>
          <span className="shrink-0 text-sm text-muted-foreground">
            {logsData?.count ?? 0} total activities
          </span>
        </div>

        {logsError ? (
          <div className="text-sm text-red-500">Failed to load activity history.</div>
        ) : (
          <AdminLogsTable logs={logsData?.data?.filter((log): log is NonNullable<typeof log> => log !== null)} />
        )}

        <Pagination
          count={logsData?.count ?? 0}
          currentIdx={1}
          limit={DEFAULT_ADMIN_LOGS_LIMIT}
        />
      </div>
    </div>
  );
}
