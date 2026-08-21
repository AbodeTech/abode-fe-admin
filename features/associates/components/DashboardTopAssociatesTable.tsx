"use client";

import Link from "next/link";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
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
import { formatNaira } from "@/lib/utils/format";
import type { TopAssociate } from "@/features/dashboard";

function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

interface DashboardTopAssociatesTableProps {
  data?: TopAssociate[] | null;
  isLoading?: boolean;
}

export function DashboardTopAssociatesTable({
  data,
  isLoading,
}: DashboardTopAssociatesTableProps) {
  if (isLoading) {
    return (
      <Card className="border border-[#E5EAEF]">
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          Loading top associates…
        </CardContent>
      </Card>
    );
  }

  const rows = data ?? [];

  if (rows.length === 0) {
    return (
      <Card className="border border-[#E5EAEF]">
        <CardContent className="p-8 text-center text-sm text-muted-foreground">
          No top associates found.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-w-0 space-y-3 overflow-hidden rounded-lg border border-[#E5EAEF] bg-white">
      <AdminMobileStack className="p-3">
        {rows.map((row, index) => (
          <AdminMobileCard
            key={row.user_id}
            title={
              <Link href={`/users/${row.user_id}`} className="text-primary hover:underline">
                {row.name}
              </Link>
            }
            subtitle={`#${index + 1} · ${row.email || "—"}`}
          >
            <AdminMobileField
              label="Status"
              value={row.referral_status || "—"}
            />
            <AdminMobileField
              label="Commission"
              value={formatNaira(row.total_commission)}
            />
            <AdminMobileField
              label="Transactions"
              value={String(row.commission_transactions)}
            />
          </AdminMobileCard>
        ))}
      </AdminMobileStack>

      <AdminDesktopTableWrap>
        <Table>
          <TableHeader className="bg-[#F9FAFB]">
            <TableRow>
              <TableHead className="w-14 px-4 py-3 text-xs">#</TableHead>
              <TableHead className="px-4 py-3 text-xs">Associate</TableHead>
              <TableHead className="px-4 py-3 text-xs">Email</TableHead>
              <TableHead className="px-4 py-3 text-xs">Status</TableHead>
              <TableHead className="px-4 py-3 text-right text-xs">Commission</TableHead>
              <TableHead className="px-4 py-3 text-right text-xs">Txns</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row, index) => (
              <TableRow key={row.user_id} className="border-b border-[#E5EAEF]">
                <TableCell className="px-4 py-4 text-sm text-muted-foreground">
                  {index + 1}
                </TableCell>
                <TableCell className="px-4 py-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-xs text-primary">
                        {initials(row.name)}
                      </AvatarFallback>
                    </Avatar>
                    <Link
                      href={`/users/${row.user_id}`}
                      className="truncate text-sm font-medium capitalize text-primary hover:underline"
                    >
                      {row.name}
                    </Link>
                  </div>
                </TableCell>
                <TableCell className="max-w-[220px] truncate px-4 py-4 text-sm text-muted-foreground">
                  {row.email || "—"}
                </TableCell>
                <TableCell className="px-4 py-4">
                  <Badge
                    variant="outline"
                    className="border-[#E0E2E7] bg-[#F0F1F3] text-xs font-medium text-[#333333]"
                  >
                    {row.referral_status || "—"}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-4 text-right text-sm font-semibold tabular-nums">
                  {formatNaira(row.total_commission)}
                </TableCell>
                <TableCell className="px-4 py-4 text-right text-sm tabular-nums text-muted-foreground">
                  {row.commission_transactions}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminDesktopTableWrap>
    </div>
  );
}
