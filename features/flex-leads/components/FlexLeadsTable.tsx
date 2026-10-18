"use client";

import React from "react";
import { Eye } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AdminDesktopTableWrap,
  AdminMobileCard,
  AdminMobileField,
  AdminMobileStack,
} from "@/components/shared/admin-responsive-table";

import { FLEX_LEAD_TYPE_LABELS, type FlexLeadRow } from "../schemas/flex-lead.schema";
import { FlexLeadStatusBadge } from "./FlexLeadStatusBadge";

const formatDate = (value: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
};

const HEAD =
  "whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground";

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

  const viewButton = (row: FlexLeadRow, mobile = false) => (
    <Button
      variant="outline"
      size="sm"
      className={mobile ? "w-full gap-2" : "gap-2"}
      onClick={() => onView(row)}
    >
      <Eye className="h-4 w-4" aria-hidden />
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
              <AdminMobileCard key={row.id} title={row.full_name} subtitle={row.email}>
                <AdminMobileField label="Phone" value={row.phone || "—"} />
                <AdminMobileField
                  label="Type"
                  value={
                    <Badge variant="outline" className="font-normal">
                      {FLEX_LEAD_TYPE_LABELS[row.type]}
                    </Badge>
                  }
                />
                <AdminMobileField label="Location" value={row.location ?? "—"} />
                {row.preferred_date ? (
                  <AdminMobileField label="Preferred date" value={row.preferred_date} />
                ) : null}
                <AdminMobileField label="Status" value={<FlexLeadStatusBadge status={row.status} />} />
                <AdminMobileField label="Submitted" value={formatDate(row.createdAt)} />
                <div className="border-t border-border pt-2">{viewButton(row, true)}</div>
              </AdminMobileCard>
            ))
          )}
        </AdminMobileStack>

        <AdminDesktopTableWrap>
          <Table className="w-max min-w-[1100px] table-auto text-sm">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className={`min-w-44 ${HEAD}`}>Name</TableHead>
                <TableHead className={`min-w-48 ${HEAD}`}>Email</TableHead>
                <TableHead className={`min-w-36 whitespace-nowrap ${HEAD}`}>Phone</TableHead>
                <TableHead className={`min-w-32 ${HEAD}`}>Type</TableHead>
                <TableHead className={`min-w-36 ${HEAD}`}>Location</TableHead>
                <TableHead className={`min-w-28 ${HEAD}`}>Status</TableHead>
                <TableHead className={`min-w-28 whitespace-nowrap ${HEAD}`}>Submitted</TableHead>
                <TableHead className={`min-w-28 ${HEAD}`}>Action</TableHead>
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
                  <TableRow key={row.id} className={row.is_deleted ? "opacity-50" : undefined}>
                    <TableCell className="min-w-0 whitespace-normal px-4 py-4 align-top leading-relaxed">
                      <span className="block font-medium wrap-break-word">{row.full_name}</span>
                      {row.is_deleted ? (
                        <span className="text-xs text-muted-foreground">Deleted</span>
                      ) : null}
                    </TableCell>
                    <TableCell className="min-w-0 whitespace-normal px-4 py-4 align-top leading-relaxed wrap-break-word">
                      {row.email}
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-4 py-4 align-top leading-relaxed tabular-nums">
                      {row.phone || "—"}
                    </TableCell>
                    <TableCell className="min-w-0 whitespace-normal px-4 py-4 align-top leading-relaxed">
                      <Badge variant="outline" className="font-normal">
                        {FLEX_LEAD_TYPE_LABELS[row.type]}
                      </Badge>
                    </TableCell>
                    <TableCell className="min-w-0 whitespace-normal px-4 py-4 align-top leading-relaxed wrap-break-word">
                      {row.location ?? <span className="text-muted-foreground">—</span>}
                    </TableCell>
                    <TableCell className="min-w-0 whitespace-normal px-4 py-4 align-top leading-relaxed">
                      <FlexLeadStatusBadge status={row.status} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap px-4 py-4 align-top leading-relaxed">
                      {formatDate(row.createdAt)}
                    </TableCell>
                    <TableCell className="min-w-0 whitespace-normal px-4 py-4 align-top">
                      {viewButton(row)}
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
