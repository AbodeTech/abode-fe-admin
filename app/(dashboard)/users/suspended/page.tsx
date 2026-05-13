"use client";

import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/shared/Pagination";
import {
  SuspendedUsersTable,
  useSuspendedUsers,
  useExportSuspendedUsers,
} from "@/features/users";
import { useSearchParams } from "next/navigation";
import { Loader2, Download } from "lucide-react";

const PAGE_SIZE = 25;

function SuspendedUsersContent() {
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;

  const { data, isLoading, error } = useSuspendedUsers(page, PAGE_SIZE);
  const exportMutation = useExportSuspendedUsers();

  const handleExport = async () => {
    await exportMutation.mutateAsync();
  };

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
        <h3 className="font-bold">Error loading suspended users</h3>
        <p>{(error as Error).message || "An unexpected error occurred."}</p>
      </div>
    );
  }

  const rows = data?.data ?? [];
  const count = data?.count ?? 0;

  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] space-y-4 px-3 pb-20 sm:px-4">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Suspended Users</h2>
        <Button
          variant="outline"
          className="w-full shrink-0 sm:w-auto"
          onClick={handleExport}
          disabled={exportMutation.isPending}
        >
          {exportMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Downloading...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Download Suspended Users
            </>
          )}
        </Button>
      </div>

      <Card className="min-w-0 overflow-hidden">
        <CardHeader className="px-4">
          <CardTitle>Users currently suspended</CardTitle>
        </CardHeader>
        <CardContent className="min-w-0 space-y-4 px-4">
          <div className="min-w-0 overflow-x-auto">
            <SuspendedUsersTable users={rows} />
          </div>
          <Pagination count={count} currentIdx={page} limit={PAGE_SIZE} />
        </CardContent>
      </Card>
    </div>
  );
}

export default function SuspendedUsersPage() {
  return (
    <Suspense fallback={<div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
      <SuspendedUsersContent />
    </Suspense>
  );
}
