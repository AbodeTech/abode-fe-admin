"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useCommissionConfigHistory } from "../hooks/use-commission-config";

const LIMIT = 10;

export function ConfigHistoryTable() {
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useCommissionConfigHistory(page, LIMIT);

  if (error) {
    return (
      <div className="p-4 rounded-md bg-red-50 text-red-500 border border-red-200">
        <p className="font-bold">Error loading history</p>
        <p>{(error as Error).message}</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const entries = data?.history ?? [];
  const total = data?.pagination?.total ?? 0;
  const totalPages = data?.pagination?.pages ?? 1;

  if (entries.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-12">
        No configuration changes recorded yet.
      </p>
    );
  }

  return (
    <div className="min-w-0 space-y-4">
      <div className="min-w-0 overflow-x-auto rounded-md border border-border">
        <Table className="min-w-[800px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[70px]">Version</TableHead>
            <TableHead>Changed By</TableHead>
            <TableHead>Changed Fields</TableHead>
            <TableHead>Description</TableHead>
            <TableHead className="w-[160px]">Date</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry._id}>
              <TableCell className="font-medium">v{entry.version}</TableCell>
              <TableCell className="text-sm">
                {entry.changedByEmail || "System"}
              </TableCell>
              <TableCell className="text-sm max-w-[200px] truncate" title={entry.changedFields.join(", ")}>
                {entry.changedFields.join(", ")}
              </TableCell>
              <TableCell className="text-sm max-w-[250px] truncate" title={entry.changeDescription}>
                {entry.changeDescription}
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(entry.createdAt).toLocaleDateString("en-NG", {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-center text-sm text-muted-foreground sm:text-left">
            Page {page} of {totalPages} ({total} total)
          </p>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
