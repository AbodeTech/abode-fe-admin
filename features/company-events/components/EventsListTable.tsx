"use client";

import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";

import {
  AdminDesktopTableWrap,
  AdminMobileCard,
  AdminMobileField,
  AdminMobileStack,
} from "@/components/shared/admin-responsive-table";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";

import type { CompanyEventStatus, CompanyEventType, CompanyEventWithAssetName } from "../schemas/company-event.schema";

const TYPE_LABELS: Record<CompanyEventType, string> = {
  site_inspection: "Site Inspection",
  allocation: "Allocation",
};

const STATUS_STYLES: Record<CompanyEventStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  published: "bg-green-100 text-green-800",
  closed: "bg-orange-100 text-orange-800",
};

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

interface EventsListTableProps {
  rows?: CompanyEventWithAssetName[] | null;
  isLoading?: boolean;
}

export function EventsListTable({ rows, isLoading }: EventsListTableProps) {
  const router = useRouter();

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

  return (
    <Card className="min-w-0 border-none shadow-sm">
      <CardContent className="min-w-0 space-y-3 p-3 sm:p-4">
        <AdminMobileStack>
          {safeRows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No company events yet.</p>
          ) : (
            safeRows.map((event) => (
              <AdminMobileCard
                key={event.id}
                title={event.title}
                subtitle={event.asset_name}
                onClick={() => router.push(`/company-events/${event.id}`)}
              >
                <AdminMobileField label="Type" value={TYPE_LABELS[event.type]} />
                <AdminMobileField label="Date" value={`${formatDate(event.date)} ${event.time}`} />
                <AdminMobileField
                  label="Status"
                  value={<Badge className={cn("font-normal", STATUS_STYLES[event.status])}>{event.status}</Badge>}
                />
              </AdminMobileCard>
            ))
          )}
        </AdminMobileStack>

        <AdminDesktopTableWrap>
          <Table className="w-full table-auto text-sm">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="min-w-52 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Event
                </TableHead>
                <TableHead className="min-w-36 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Type
                </TableHead>
                <TableHead className="min-w-44 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Site
                </TableHead>
                <TableHead className="min-w-34 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Date
                </TableHead>
                <TableHead className="min-w-28 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="w-10 px-4 py-3.5" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {safeRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="whitespace-normal px-4 py-12 text-center text-sm text-muted-foreground">
                    No company events yet.
                  </TableCell>
                </TableRow>
              ) : (
                safeRows.map((event) => (
                  <TableRow
                    key={event.id}
                    className="cursor-pointer hover:bg-muted/40"
                    onClick={() => router.push(`/company-events/${event.id}`)}
                  >
                    <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4 leading-relaxed">
                      <span className="font-medium">{event.title}</span>
                    </TableCell>
                    <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4 leading-relaxed">
                      {TYPE_LABELS[event.type]}
                    </TableCell>
                    <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4 leading-relaxed wrap-break-word">
                      {event.asset_name}
                    </TableCell>
                    <TableCell className="align-top whitespace-nowrap px-4 py-4 leading-relaxed">
                      {formatDate(event.date)} {event.time}
                    </TableCell>
                    <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4 leading-relaxed">
                      <Badge className={cn("font-normal", STATUS_STYLES[event.status])}>{event.status}</Badge>
                    </TableCell>
                    <TableCell className="align-top px-4 py-4">
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
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
