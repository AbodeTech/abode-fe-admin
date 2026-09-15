"use client";

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

import type { EventRegistrationRow } from "../hooks/use-event-registrations";
import type {
  EventAllocationStatus,
  EventAttendeeType,
  RegistrationCategory,
} from "../schemas/company-event.schema";

const CATEGORY_LABELS: Record<RegistrationCategory, string> = {
  associate_pro: "Associate Pro",
  associate: "Associate",
  client: "Client",
};

const STATUS_LABELS: Record<EventAllocationStatus, string> = {
  invited: "Invited",
  registered: "Registered",
  checked_in: "Checked in",
  confirmed: "Confirmed",
  cancelled: "Cancelled",
};

/**
 * The two populations, and why the labels are worded this way.
 *
 * "Getting land" is what an allocated attendee is here for; "Visitor" is
 * somebody who signed themselves up and is coming to look. Saying "Registrant"
 * for the second group would be wrong now that everyone in this table has
 * registered, or will have.
 */
const ATTENDEE_TYPE_LABELS: Record<EventAttendeeType, string> = {
  allocated: "Getting land",
  visitor: "Visitor",
};

const formatDateTime = (value?: string | null) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

/** Em dash rather than an empty cell: a blank reads as a rendering fault. */
const orDash = (value?: string | null) => (value?.trim() ? value : "—");

function AttendeeTypeBadge({ type }: { type: EventAttendeeType }) {
  return (
    <Badge variant={type === "allocated" ? "default" : "secondary"}>
      {ATTENDEE_TYPE_LABELS[type]}
    </Badge>
  );
}

function CategoryCell({ category }: { category: RegistrationCategory | null }) {
  // Null until they fill the form in — an allocated row exists from the moment
  // we invite them, which is before they have told us anything about themselves.
  if (!category) return <span className="text-muted-foreground">—</span>;
  return <Badge variant="secondary">{CATEGORY_LABELS[category]}</Badge>;
}

interface EventRegistrationsTableProps {
  rows?: EventRegistrationRow[] | null;
  isLoading?: boolean;
}

export function EventRegistrationsTable({ rows, isLoading }: EventRegistrationsTableProps) {
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
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nobody is on this event yet.
            </p>
          ) : (
            safeRows.map((row) => (
              <AdminMobileCard
                key={row.id}
                title={orDash(row.name)}
                subtitle={row.email ?? undefined}
              >
                <AdminMobileField
                  label="Type"
                  value={<AttendeeTypeBadge type={row.attendee_type} />}
                />
                <AdminMobileField
                  label="Status"
                  value={<Badge variant="outline">{STATUS_LABELS[row.status]}</Badge>}
                />
                <AdminMobileField
                  label="Category"
                  value={<CategoryCell category={row.category} />}
                />
                <AdminMobileField label="Pickup" value={orDash(row.pickup_location)} />
                <AdminMobileField label="Registered" value={formatDateTime(row.registered_at)} />
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
                <TableHead className="min-w-32 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Type
                </TableHead>
                <TableHead className="min-w-52 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Contact
                </TableHead>
                <TableHead className="min-w-28 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Category
                </TableHead>
                <TableHead className="min-w-28 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Status
                </TableHead>
                <TableHead className="min-w-40 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Pickup
                </TableHead>
                <TableHead className="min-w-40 whitespace-normal px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Registered
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {safeRows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="whitespace-normal px-4 py-12 text-center text-sm text-muted-foreground"
                  >
                    Nobody is on this event yet.
                  </TableCell>
                </TableRow>
              ) : (
                safeRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4 leading-relaxed">
                      <span className="block wrap-break-word font-medium">{orDash(row.name)}</span>
                    </TableCell>
                    <TableCell className="align-top whitespace-nowrap px-4 py-4">
                      <AttendeeTypeBadge type={row.attendee_type} />
                    </TableCell>
                    <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4 leading-relaxed wrap-break-word">
                      <span className="block">{orDash(row.email)}</span>
                      <span className="block text-muted-foreground">{orDash(row.phone)}</span>
                    </TableCell>
                    <TableCell className="align-top whitespace-nowrap px-4 py-4">
                      <CategoryCell category={row.category} />
                    </TableCell>
                    <TableCell className="align-top whitespace-nowrap px-4 py-4">
                      <Badge variant="outline">{STATUS_LABELS[row.status]}</Badge>
                    </TableCell>
                    <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4 leading-relaxed wrap-break-word">
                      {orDash(row.pickup_location)}
                    </TableCell>
                    <TableCell className="min-w-0 align-top whitespace-normal px-4 py-4 leading-relaxed wrap-break-word">
                      {formatDateTime(row.registered_at)}
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
