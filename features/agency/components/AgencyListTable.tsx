"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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

import type { AgencyListRow } from "../schemas/agency.schema";

/**
 * The row contract is `Pick`ed from the Zod-derived list row, so a BE field
 * rename is a compile error here rather than a silently blank cell.
 */
type AgencyRow = Pick<
  AgencyListRow,
  | "id"
  | "name"
  | "code"
  | "commission_percentage"
  | "status"
  | "contact_email"
  | "contact_phone"
  | "member_count"
  | "created_at"
>;

interface AgencyListTableProps {
  rows?: AgencyRow[] | null;
  isLoading?: boolean;
}

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
};

export function AgencyStatusBadge({ status }: { status: AgencyListRow["status"] }) {
  return (
    <Badge variant={status === "active" ? "default" : "destructive"} className="capitalize">
      {status}
    </Badge>
  );
}

export function AgencyListTable({ rows, isLoading }: AgencyListTableProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <Card className="min-w-0 border border-gray-200 p-4 space-y-3">
        <Skeleton className="h-6 w-48" />
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </Card>
    );
  }

  const items = rows ?? [];

  return (
    <Card className="min-w-0 border border-gray-200">
      <AdminMobileStack className="border-b border-gray-200 p-3">
        {items.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No agencies found.</p>
        ) : (
          items.map((agency) => (
            <AdminMobileCard
              key={agency.id}
              title={agency.name}
              subtitle={agency.code}
              onClick={() => router.push(`/agency/lists/${agency.id}`)}
            >
              <AdminMobileField label="Status" value={<AgencyStatusBadge status={agency.status} />} />
              <AdminMobileField label="Commission" value={`${agency.commission_percentage}%`} />
              <AdminMobileField label="Members" value={agency.member_count} />
              <AdminMobileField label="Email" value={agency.contact_email || "—"} />
              <AdminMobileField label="Phone" value={agency.contact_phone || "—"} />
            </AdminMobileCard>
          ))
        )}
      </AdminMobileStack>

      <AdminDesktopTableWrap>
        <div className="min-w-0 overflow-x-auto">
          <Table className="min-w-[900px]">
            <TableHeader>
              <TableRow>
                <TableHead>Agency</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Commission</TableHead>
                <TableHead className="text-right">Members</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-6 text-center text-sm text-muted-foreground">
                    No agencies found.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((agency) => (
                  <TableRow key={agency.id} className="hover:bg-muted/30">
                    <TableCell className="max-w-56 font-medium">
                      <span className="wrap-break-word">{agency.name}</span>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{agency.code}</TableCell>
                    <TableCell>
                      <AgencyStatusBadge status={agency.status} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {agency.commission_percentage}%
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{agency.member_count}</TableCell>
                    <TableCell className="max-w-56 text-sm">
                      <span className="wrap-break-word">{agency.contact_email || "—"}</span>
                      {agency.contact_phone && (
                        <span className="block text-xs text-muted-foreground">
                          {agency.contact_phone}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(agency.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/agency/lists/${agency.id}`}>
                          <Eye className="mr-1 h-4 w-4" />
                          View
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </AdminDesktopTableWrap>
    </Card>
  );
}
