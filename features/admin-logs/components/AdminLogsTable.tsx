"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Eye } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import {
  adminLogActor,
  formatAdminLogAction,
  type AdminLog,
} from "../schemas/admin-log.schema";
import { AdminLogMetadataModal } from "./AdminLogMetadataModal";

const formatTimestamp = (value: string) => {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? value : format(d, "PPpp");
};

const actionBadge = (action: string) => {
  const lower = action.toLowerCase();
  if (lower.includes("create") || lower.includes("approve") || lower.includes("add"))
    return "bg-green-100 text-green-800";
  if (lower.includes("delete") || lower.includes("decline") || lower.includes("remove"))
    return "bg-red-100 text-red-800";
  if (lower.includes("update") || lower.includes("edit") || lower.includes("modify"))
    return "bg-amber-100 text-amber-800";
  return "bg-gray-100 text-gray-800";
};

type AdminLogRowView = Pick<
  AdminLog,
  | "id"
  | "timestamp"
  | "action"
  | "description"
  | "isSystem"
  | "adminId"
  | "adminEmail"
  | "reason"
  | "metadata"
  | "oldState"
  | "newState"
>;

function ActorCell({ log }: { log: AdminLogRowView }) {
  return (
    <span className={log.isSystem ? "italic text-muted-foreground" : "text-foreground"}>
      {adminLogActor(log)}
    </span>
  );
}

export function AdminLogsTable({
  logs,
  isLoading = false,
}: {
  logs: AdminLogRowView[] | null | undefined;
  isLoading?: boolean;
}) {
  const items = logs ?? [];
  const [selected, setSelected] = useState<AdminLogRowView | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-md" />
        ))}
      </div>
    );
  }

  return (
    <>
      {/* Mobile cards */}
      <div className="min-w-0 space-y-3 lg:hidden">
        {items.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No admin logs found.</p>
        )}
        {items.map((log) => (
          <Card key={log.id} className="min-w-0 border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base">
                <span>{formatTimestamp(log.timestamp)}</span>
                <Badge className={actionBadge(log.action)}>{formatAdminLogAction(log.action)}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">By:</span>
                <span className="break-all font-medium">
                  <ActorCell log={log} />
                </span>
              </div>
              <p className="pt-1 leading-relaxed text-muted-foreground">{log.description}</p>
              {log.reason && (
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">Reason:</span> {log.reason}
                </p>
              )}
              <Button variant="outline" size="sm" onClick={() => setSelected(log)} className="w-full">
                <Eye className="mr-2 h-4 w-4" /> View details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop table */}
      <Card className="hidden min-w-0 overflow-hidden border-border bg-card lg:block">
        <div className="min-w-0 overflow-x-auto">
          <Table className="min-w-225">
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="whitespace-nowrap px-6 text-muted-foreground">Time</TableHead>
                <TableHead className="whitespace-nowrap px-6 text-muted-foreground">By</TableHead>
                <TableHead className="whitespace-nowrap px-6 text-muted-foreground">Action</TableHead>
                <TableHead className="whitespace-nowrap px-6 text-muted-foreground">Description</TableHead>
                <TableHead className="w-24 whitespace-nowrap px-6 text-muted-foreground">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length ? (
                items.map((log) => (
                  <TableRow key={log.id} className="border-border hover:bg-muted/50">
                    <TableCell className="whitespace-nowrap px-6 py-4 font-medium">
                      {formatTimestamp(log.timestamp)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-6 py-4">
                      <ActorCell log={log} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-6 py-4">
                      <Badge className={actionBadge(log.action)}>{formatAdminLogAction(log.action)}</Badge>
                    </TableCell>
                    <TableCell className="min-w-75 max-w-xl px-6 py-4 text-muted-foreground">
                      <p className="truncate">{log.description}</p>
                      {log.reason && (
                        <p className="truncate text-xs">
                          <span className="font-medium text-foreground">Reason:</span> {log.reason}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-6 py-4 text-center">
                      <Button variant="outline" size="sm" onClick={() => setSelected(log)}>
                        <Eye className="mr-1 h-4 w-4" /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground hover:bg-transparent">
                    No admin logs found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <AdminLogMetadataModal
        log={selected}
        open={!!selected}
        onOpenChange={(o) => (!o ? setSelected(null) : undefined)}
      />
    </>
  );
}
