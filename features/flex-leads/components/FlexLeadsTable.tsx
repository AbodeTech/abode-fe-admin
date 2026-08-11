"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye } from "lucide-react";
import {
  AdminDesktopTableWrap,
  AdminMobileCard,
  AdminMobileField,
  AdminMobileStack,
} from "@/components/shared/admin-responsive-table";

import type { FlexLeadRow } from "../hooks/types";
import { FlexLeadStatusBadge } from "./FlexLeadStatusBadge";

const formatDate = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

const typeLabel = (type: FlexLeadRow["type"]) =>
  type === "site_inspection" ? "Site inspection" : "Brochure";

interface FlexLeadsTableProps {
  rows?: FlexLeadRow[] | null;
  isLoading?: boolean;
  onView: (row: FlexLeadRow) => void;
}

export function FlexLeadsTable({ rows, isLoading, onView }: FlexLeadsTableProps) {
  if (isLoading) {
    return (
      <Card className="min-w-0 border-none shadow-sm">
        <CardContent className="space-y-3 p-4">
          <Skeleton className="h-6 w-48" />
          {Array.from({ length: 5 }).map((_, idx) => (
            <Skeleton key={idx} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const safeRows = rows ?? [];

  const rowActions = (row: FlexLeadRow, mobile = false) => (
    <Button
      variant="outline"
      size="sm"
      className={mobile ? "w-full gap-2" : "gap-2"}
      onClick={() => onView(row)}
    >
      <Eye className="h-4 w-4" />
      View
    </Button>
  );

  return (
    <Card className="min-w-0 border-none shadow-sm">
      <CardContent className="min-w-0 space-y-3 p-3 sm:p-4">
        <AdminMobileStack>
          {safeRows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No leads match these filters.
            </p>
          ) : (
            safeRows.map((row) => (
              <AdminMobileCard
                key={row.id}
                title={row.fullName}
                subtitle={row.email}
              >
                <AdminMobileField label="Phone" value={row.phone || "—"} />
                <AdminMobileField
                  label="Type"
                  value={
                    <Badge variant="outline" className="font-normal">
                      {typeLabel(row.type)}
                    </Badge>
                  }
                />
                <AdminMobileField
                  label="Location"
                  value={row.location ?? "—"}
                />
                <AdminMobileField
                  label="Status"
                  value={<FlexLeadStatusBadge status={row.status} />}
                />
                <AdminMobileField
                  label="Submitted"
                  value={formatDate(row.createdAt)}
                />
                <div className="border-t border-border pt-2">
                  {rowActions(row, true)}
                </div>
              </AdminMobileCard>
            ))
          )}
        </AdminMobileStack>

        <AdminDesktopTableWrap>
          <Table className="w-max min-w-[1100px] table-auto text-sm">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="min-w-44 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Name
                </TableHead>
                <TableHead className="min-w-48 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Email
                </TableHead>
                <TableHead className="min-w-36 whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Phone
                </TableHead>
                <TableHead className="min-w-32 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Type
                </TableHead>
                <TableHead className="min-w-36 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Location
                </TableHead>
                <TableHead className="min-w-28 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="min-w-28 whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Submitted
                </TableHead>
                <TableHead className="min-w-28 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Action
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {safeRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="whitespace-normal px-4 py-12 text-center text-sm text-muted-foreground"
                  >
                    No leads match these filters.
                  </TableCell>
                </TableRow>
              ) : (
                safeRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4 leading-relaxed">
                      <span className="block wrap-break-word font-medium">
                        {row.fullName}
                      </span>
                    </TableCell>
                    <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4 leading-relaxed wrap-break-word">
                      {row.email}
                    </TableCell>
                    <TableCell className="align-top whitespace-nowrap px-4 py-4 leading-relaxed tabular-nums">
                      {row.phone || "—"}
                    </TableCell>
                    <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4 leading-relaxed">
                      <Badge variant="outline" className="font-normal">
                        {typeLabel(row.type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4 leading-relaxed wrap-break-word">
                      {row.location ?? (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4 leading-relaxed">
                      <FlexLeadStatusBadge status={row.status} />
                    </TableCell>
                    <TableCell className="align-top whitespace-nowrap px-4 py-4 leading-relaxed">
                      {formatDate(row.createdAt)}
                    </TableCell>
                    <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4">
                      {rowActions(row)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </AdminDesktopTableWrap>
      </CardContent>
    </Card>
  );
}
