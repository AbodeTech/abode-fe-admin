"use client";

import { useParams } from "next/navigation";
import { useAdminWithRole } from "@/features/roles-permissions";
import { AdminDetailHeader, AdminDetailFragment } from "@/features/roles-permissions/components/AdminDetailHeader";
import { AdminLogsTable, DEFAULT_ADMIN_LOGS_LIMIT, useAdminLogs } from "@/features/admin-logs";
import { AdminLogsRowFragment } from "@/features/admin-logs/components/AdminLogsTable";
import { useFragment } from "@/lib/gql";
import { Pagination } from "@/components/shared/Pagination";
import { Loader2 } from "lucide-react";

export default function AdminDetailPage() {
  const params = useParams();
  const adminId = params?.id as string;

  const { data: adminData, isLoading: loadingAdmin, error: adminError } = useAdminWithRole(adminId);
  const admin = useFragment(AdminDetailFragment, adminData);

  const { data: logsData, isLoading: loadingLogs, error: logsError } = useAdminLogs({
    page: 1,
    limit: DEFAULT_ADMIN_LOGS_LIMIT,
    adminEmail: admin?.adminEmail || undefined,
  });

  if (adminError) {
    return (
      <div className="p-4 rounded-md bg-red-50 text-red-500 border border-red-200">
        <h3 className="font-bold">Error loading admin</h3>
        <p>{(adminError as Error).message || "An unexpected error occurred."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {loadingAdmin && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading admin details...
        </div>
      )}

      <AdminDetailHeader
        admin={adminData}
        logs={logsData?.data?.filter((log): log is NonNullable<typeof log> => log !== null) || []}
        isLoadingLogs={loadingLogs}
      />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold">Activity History</h3>
          <span className="text-sm text-muted-foreground">
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
