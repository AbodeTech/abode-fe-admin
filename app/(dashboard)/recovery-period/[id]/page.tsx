"use client";

import { useParams } from "next/navigation";

import { Skeleton } from "@/components/ui/skeleton";
import { useAdminPermissions } from "@/hooks/use-admin-permission";
import { RecoveryRecord, useRecoveryWindow } from "@/features/recovery-windows";

export default function RecoveryRecordPage() {
  const { id } = useParams<{ id: string }>();
  const permissions = useAdminPermissions();
  const { data, isLoading, error } = useRecoveryWindow(id);

  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1400px] px-3 pb-20 sm:px-4">
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-10 w-96" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : error || !data ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-600">
          <h3 className="font-bold">Couldn’t load this recovery record</h3>
          <p>{(error as Error | null)?.message ?? "Not found."}</p>
        </div>
      ) : (
        <RecoveryRecord
          record={data}
          listHref="/recovery-period"
          permissions={{
            remind: permissions.has("remind_recovery_customers"),
            sendTerms: permissions.has("send_recovery_terms"),
            approveRefunds: permissions.has("approve_recovery_refunds"),
          }}
        />
      )}
    </div>
  );
}
