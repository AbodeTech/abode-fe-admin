"use client";

import {
  AdminDesktopTableWrap,
  AdminMobileCard,
  AdminMobileField,
  AdminMobileStack,
} from "@/components/shared/admin-responsive-table";
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

import type { EventRegistrationRow, RegistrationCategory } from "../schemas/company-event.schema";

const CATEGORY_LABELS: Record<RegistrationCategory, string> = {
  associate_pro: "Associate Pro",
  associate: "Associate",
  client: "Client",
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

interface EventRegistrationsTableProps {
  rows?: EventRegistrationRow[] | null;
  isLoading?: boolean;
  onChangePickup?: (row: EventRegistrationRow) => void;
}

export function EventRegistrationsTable({ rows, isLoading, onChangePickup }: EventRegistrationsTableProps) {
  if (isLoading) {
    return (
      <Card className="min-w-0 border-none shadow-sm">
        <CardContent className="space-y-3 p-4">
          <Skeleton className="h-6 w-48" />
          {Array.from({ length: 3 }).map((_, idx) => (
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
            <p className="py-8 text-center text-sm text-muted-foreground">No one has registered yet.</p>
          ) : (
            safeRows.map((row) => (
              <AdminMobileCard key={row.registration_id} title={row.name} subtitle={row.email}>
                <AdminMobileField label="Category" value={<Badge variant="secondary">{CATEGORY_LABELS[row.category]}</Badge>} />
                <AdminMobileField label="Attending as" value={row.getting_land ? 'Getting land' : 'Visitor'} />
                <AdminMobileField label="Status" value={row.status ?? 'Registered'} />
                <AdminMobileField label="Pickup" value={row.pickup_location ?? "—"} />
                <AdminMobileField label="Submitted" value={formatDateTime(row.submitted_at)} />
                {onChangePickup && row.status !== 'cancelled' && <Button variant="outline" size="sm" onClick={() => onChangePickup(row)}>Change pickup</Button>}
              </AdminMobileCard>
            ))
          )}
        </AdminMobileStack>

        <AdminDesktopTableWrap>
          <Table className="w-full table-auto text-sm">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="min-w-44 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Name
                </TableHead>
                <TableHead className="min-w-52 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Contact
                </TableHead>
                <TableHead className="min-w-28 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Category
                </TableHead>
                <TableHead className="min-w-28 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Attending as</TableHead>
                <TableHead className="min-w-28 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</TableHead>
                <TableHead className="min-w-40 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Pickup
                </TableHead>
                <TableHead className="min-w-40 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Submitted
                </TableHead>
                <TableHead className="min-w-28 px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {safeRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="whitespace-normal px-4 py-12 text-center text-sm text-muted-foreground">
                    No one has registered yet.
                  </TableCell>
                </TableRow>
              ) : (
                safeRows.map((row) => (
                  <TableRow key={row.registration_id}>
                    <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4 leading-relaxed">
                      <span className="block wrap-break-word font-medium">{row.name}</span>
                    </TableCell>
                    <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4 leading-relaxed wrap-break-word">
                      <span className="block">{row.email}</span>
                      <span className="block text-muted-foreground">{row.phone || "—"}</span>
                    </TableCell>
                    <TableCell className="align-top whitespace-nowrap px-4 py-4">
                      <Badge variant="secondary">{CATEGORY_LABELS[row.category]}</Badge>
                    </TableCell>
                    <TableCell className="align-top px-4 py-4">{row.getting_land ? 'Getting land' : 'Visitor'}</TableCell>
                    <TableCell className="align-top px-4 py-4">{row.status ?? 'Registered'}</TableCell>
                    <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4 leading-relaxed wrap-break-word">
                      {row.pickup_location ?? "—"}
                    </TableCell>
                    <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4 leading-relaxed wrap-break-word">
                      {formatDateTime(row.submitted_at)}
                    </TableCell>
                    <TableCell className="align-top px-4 py-4">{onChangePickup && row.status !== 'cancelled' && <Button variant="outline" size="sm" onClick={() => onChangePickup(row)}>Change pickup</Button>}</TableCell>
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
