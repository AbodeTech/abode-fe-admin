"use client";

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
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { useState } from "react";
import { AdminLogMetadataModal } from "./AdminLogMetadataModal";
import { ADMIN_LOG_ACTION_OPTIONS, type AdminLog } from "../schemas/admin-log.schema";

const formatTimestamp = (value: string) => {
  const d = new Date(value);
  return isNaN(d.getTime()) ? value : format(d, "PPpp");
};

/** "Denied attempt" for the actions the filter knows, otherwise the slug with spaces: "update-asset" → "Update asset". */
const actionLabel = (action: string) =>
  ADMIN_LOG_ACTION_OPTIONS.find((option) => option.value === action)?.label ??
  action.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());

/** A 24-character id is too wide for a table; the full id is in the title and the details dialog. */
const shortId = (id: string | null | undefined) => (id ? `…${id.slice(-6)}` : "—");

const actionBadge = (action: string) => {
  const lower = action.toLowerCase();
  // Changes to who can do what share one colour, so a reviewer can pick them out of a long list.
  if (/assign-admin|admin-(role|extra|start)|-admin-/.test(lower)) return "bg-purple-100 text-purple-800";
  if (lower.includes("create") || lower.includes("approve") || lower.includes("add"))
    return "bg-green-100 text-green-800";
  // A denied attempt (`permission-denied`) is the one entry a reviewer is looking for.
  if (lower.includes("delete") || lower.includes("decline") || lower.includes("remove") || lower.includes("denied"))
    return "bg-red-100 text-red-800";
  if (lower.includes("update")) return "bg-amber-100 text-amber-800";
  return "bg-gray-100 text-gray-800";
};

export type { AdminLog };

/** A system-actor row (a scheduled job) has no admin: say so rather than leave it blank. */
const actorLabel = (log: AdminLog) => log.admin_email || "System";

export function AdminLogsTable({ logs }: { logs: AdminLog[] | null | undefined }) {
  const items = logs || [];
  const [selected, setSelected] = useState<AdminLog | null>(null);

  return (
    <>
      {/* Mobile cards */}
      <div className="lg:hidden min-w-0 space-y-3">
        {items.map((log) => (
          <Card key={log.id} className="min-w-0 border-border bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <span>{formatTimestamp(log.timestamp)}</span>
                <Badge className={actionBadge(log.action || "")} title={log.action}>{actionLabel(log.action)}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Admin:</span>
                  <span className="font-medium break-all text-foreground">{actorLabel(log)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Admin ID:</span>
                  <span className="font-mono text-xs text-foreground" title={log.admin_id ?? undefined}>{shortId(log.admin_id)}</span>
                </div>
              </div>
              <p className="text-muted-foreground leading-relaxed pt-2">{log.description}</p>
              <Button variant="outline" size="sm" onClick={() => setSelected(log)} className="w-full">
                <Eye className="h-4 w-4 mr-2" /> View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop table */}
      <Card className="hidden min-w-0 overflow-hidden border-border bg-card lg:block">
        <div className="min-w-0 overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground whitespace-nowrap px-6">Timestamp</TableHead>
                <TableHead className="text-muted-foreground whitespace-nowrap px-6">Admin Email</TableHead>
                <TableHead className="text-muted-foreground whitespace-nowrap px-6">Admin ID</TableHead>
                <TableHead className="text-muted-foreground whitespace-nowrap px-6">Action</TableHead>
                <TableHead className="text-muted-foreground whitespace-nowrap px-6">Description</TableHead>
                {/* Pinned: the table is wider than the card, and the way into a log's details must not hide behind a sideways scroll. */}
                <TableHead className="text-muted-foreground whitespace-nowrap px-6 w-24 sticky right-0 z-10 bg-card shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.18)]">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length ? (
                items.map((log) => (
                  <TableRow key={log.id} className="border-border hover:bg-muted/50">
                    <TableCell className="px-6 py-4 font-medium text-foreground whitespace-nowrap">{formatTimestamp(log.timestamp)}</TableCell>
                    <TableCell className="px-6 py-4 text-foreground whitespace-nowrap">{actorLabel(log)}</TableCell>
                    <TableCell className="px-6 py-4 text-foreground font-mono text-xs whitespace-nowrap" title={log.admin_id ?? undefined}>{shortId(log.admin_id)}</TableCell>
                    <TableCell className="px-6 py-4 whitespace-nowrap">
                      <Badge className={actionBadge(log.action || "")} title={log.action}>{actionLabel(log.action)}</Badge>
                    </TableCell>
                    <TableCell className="px-6 py-4 max-w-sm truncate text-muted-foreground min-w-[240px]">{log.description}</TableCell>
                    <TableCell className="px-6 py-4 text-center whitespace-nowrap sticky right-0 z-10 bg-card shadow-[-8px_0_8px_-8px_rgba(0,0,0,0.18)]">
                      <Button variant="outline" size="sm" onClick={() => setSelected(log)}>
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground hover:bg-transparent">
                    No admin logs found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <AdminLogMetadataModal log={selected} open={!!selected} onOpenChange={(o) => (!o ? setSelected(null) : undefined)} />
    </>
  );
}
