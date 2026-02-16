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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { useState } from "react";
import { AdminLogMetadataModal } from "./AdminLogMetadataModal";

const formatTimestamp = (value: string) => {
  const d = new Date(value);
  return isNaN(d.getTime()) ? value : format(d, "PPpp");
};

const actionBadge = (action: string) => {
  const lower = action.toLowerCase();
  if (lower.includes("create") || lower.includes("approve") || lower.includes("add"))
    return "bg-green-100 text-green-800";
  if (lower.includes("delete") || lower.includes("decline") || lower.includes("remove"))
    return "bg-red-100 text-red-800";
  if (lower.includes("update")) return "bg-amber-100 text-amber-800";
  return "bg-gray-100 text-gray-800";
};

import { ResultOf } from "@graphql-typed-document-node/core";
import { FragmentType, useFragment } from "@/lib/gql";
import { graphql } from "@/lib/gql";

export const AdminLogsRowFragment = graphql(`
  fragment AdminLogsRowFragment on LogAdmin {
    _id
    timestamp
    description
    action
    adminEmail
    adminId
    metadata
    oldState
  }
`);

export type AdminLog = ResultOf<typeof AdminLogsRowFragment>;

export function AdminLogsTable({ logs }: { logs: FragmentType<typeof AdminLogsRowFragment>[] | null | undefined }) {
  const data = useFragment(AdminLogsRowFragment, logs);
  const items = data || [];
  const [selected, setSelected] = useState<AdminLog | null>(null);

  return (
    <>
      {/* Mobile cards */}
      <div className="lg:hidden space-y-3">
        {items.map((log) => (
          <Card key={log._id} className="border border-gray-200">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-base">
                <span>{formatTimestamp(log.timestamp)}</span>
                <Badge className={actionBadge(log.action || "")}>{log.action}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Admin</span>
                <span className="font-medium break-all">{log.adminEmail}</span>
              </div>
              <p className="text-muted-foreground leading-relaxed">{log.description}</p>
              <Button variant="outline" size="sm" onClick={() => setSelected(log)} className="w-full">
                <Eye className="h-4 w-4 mr-2" /> View Details
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop table */}
      <Card className="border border-gray-200 hidden lg:block">
        <ScrollArea className="w-full">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-200">
                <TableHead>Timestamp</TableHead>
                <TableHead>Admin Email</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-24">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length ? (
                items.map((log) => (
                  <TableRow key={log._id}>
                    <TableCell>{formatTimestamp(log.timestamp)}</TableCell>
                    <TableCell>{log.adminEmail}</TableCell>
                    <TableCell>
                      <Badge className={actionBadge(log.action || "")}>{log.action}</Badge>
                    </TableCell>
                    <TableCell className="max-w-xl truncate">{log.description}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => setSelected(log)}>
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                    No admin logs found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>

      <AdminLogMetadataModal log={selected} open={!!selected} onOpenChange={(o) => (!o ? setSelected(null) : undefined)} />
    </>
  );
}
