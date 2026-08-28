"use client";

import Link from "next/link";
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
import { formatNaira } from "@/lib/utils/format";

import {
  commercialAsset,
  commercialBuyer,
  type CommercialPlan,
} from "../schemas/commercial-plan.schema";

const HEAD =
  "whitespace-nowrap px-4 py-3.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground";
const CELL = "px-4 py-3.5 align-middle";

function allocationLabel(plan: CommercialPlan): string {
  const block = plan.block?.trim();
  const plot = plan.plot?.trim();
  if (block && plot) return `Block ${block} · Plot ${plot}`;
  if (block || plot) {
    return [block && `Block ${block}`, plot && `Plot ${plot}`].filter(Boolean).join(" · ");
  }
  return "Unallocated";
}

interface CommercialPlansTableProps {
  rows?: CommercialPlan[] | null;
  isLoading?: boolean;
}

export function CommercialPlansTable({ rows, isLoading }: CommercialPlansTableProps) {
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

  const viewButton = (row: CommercialPlan, mobile = false) => (
    <Button variant="outline" size="sm" className={mobile ? "w-full gap-2" : "gap-2"} asChild>
      <Link href={`/commercial-plots/${row._id}`}>
        <Eye className="h-4 w-4" aria-hidden />
        View
      </Link>
    </Button>
  );

  return (
    <Card className="min-w-0 border-none shadow-sm">
      <CardContent className="min-w-0 space-y-3 p-3 sm:p-4">
        <AdminMobileStack>
          {safeRows.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No commercial plot plans match this filter.
            </p>
          ) : (
            safeRows.map((row) => {
              const buyer = commercialBuyer(row);
              const asset = commercialAsset(row);
              return (
                <AdminMobileCard
                  key={row._id}
                  title={asset.label || "Commercial plot"}
                  subtitle={buyer.label || "Buyer unavailable"}
                >
                  <AdminMobileField label="Allocation" value={allocationLabel(row)} />
                  <AdminMobileField
                    label="Paid"
                    value={row.amount_paid != null ? formatNaira(row.amount_paid) : "—"}
                  />
                  <AdminMobileField
                    label="Status"
                    value={row.is_suspended ? "Suspended" : "Active"}
                  />
                  {viewButton(row, true)}
                </AdminMobileCard>
              );
            })
          )}
        </AdminMobileStack>

        <AdminDesktopTableWrap>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={HEAD}>Buyer</TableHead>
                <TableHead className={HEAD}>Asset</TableHead>
                <TableHead className={HEAD}>Size</TableHead>
                <TableHead className={HEAD}>Paid</TableHead>
                <TableHead className={HEAD}>Balance</TableHead>
                <TableHead className={HEAD}>Allocation</TableHead>
                <TableHead className={HEAD}>Status</TableHead>
                <TableHead className={HEAD} />
              </TableRow>
            </TableHeader>
            <TableBody>
              {safeRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-sm text-muted-foreground">
                    No commercial plot plans match this filter.
                  </TableCell>
                </TableRow>
              ) : (
                safeRows.map((row) => {
                  const buyer = commercialBuyer(row);
                  const asset = commercialAsset(row);
                  return (
                    <TableRow key={row._id}>
                      <TableCell className={`${CELL} font-medium`}>{buyer.label || "—"}</TableCell>
                      <TableCell className={CELL}>{asset.label || "—"}</TableCell>
                      <TableCell className={`${CELL} tabular-nums`}>
                        {row.size != null ? `${row.size.toLocaleString()} sqm` : "—"}
                      </TableCell>
                      <TableCell className={`${CELL} tabular-nums`}>
                        {row.amount_paid != null ? formatNaira(row.amount_paid) : "—"}
                      </TableCell>
                      <TableCell className={`${CELL} tabular-nums`}>
                        {row.balance != null ? formatNaira(row.balance) : "—"}
                      </TableCell>
                      <TableCell className={CELL}>{allocationLabel(row)}</TableCell>
                      <TableCell className={CELL}>
                        <Badge
                          className={
                            row.is_suspended
                              ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                              : "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                          }
                        >
                          {row.is_suspended ? "Suspended" : "Active"}
                        </Badge>
                      </TableCell>
                      <TableCell className={`${CELL} text-right`}>{viewButton(row)}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </AdminDesktopTableWrap>
      </CardContent>
    </Card>
  );
}
