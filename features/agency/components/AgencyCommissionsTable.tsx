"use client";

import { Download, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

import type { AgencyCommissionRow } from "../schemas/agency.schema";

type CommissionRow = Pick<
  AgencyCommissionRow,
  | "id"
  | "date"
  | "buyer_name"
  | "asset_name"
  | "paid_to_name"
  | "rate"
  | "gross_commission"
  | "wht_deducted"
  | "net_commission"
>;

interface AgencyCommissionsTableProps {
  rows?: CommissionRow[] | null;
  isLoading?: boolean;
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
  /** Omit to hide the button — it takes the `export_agencies` permission. */
  onExport?: () => void;
  isExporting?: boolean;
}

const formatCurrency = (value?: number | null) =>
  value === null || value === undefined
    ? "—"
    : new Intl.NumberFormat("en-NG", {
        style: "currency",
        currency: "NGN",
        maximumFractionDigits: 2,
      }).format(value);

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
};

export function AgencyCommissionsTable({
  rows,
  isLoading,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onExport,
  isExporting,
}: AgencyCommissionsTableProps) {
  const items = rows ?? [];

  return (
    <div className="w-full min-w-0 space-y-3">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="min-w-0">
          <Label htmlFor="commission-start" className="text-sm text-muted-foreground">
            From
          </Label>
          <Input
            id="commission-start"
            type="date"
            className="mt-2 w-full min-w-0 sm:w-40"
            value={startDate}
            max={endDate || undefined}
            onChange={(event) => onStartDateChange(event.target.value)}
          />
        </div>
        <div className="min-w-0">
          <Label htmlFor="commission-end" className="text-sm text-muted-foreground">
            To
          </Label>
          <Input
            id="commission-end"
            type="date"
            className="mt-2 w-full min-w-0 sm:w-40"
            value={endDate}
            min={startDate || undefined}
            onChange={(event) => onEndDateChange(event.target.value)}
          />
        </div>
        {onExport && (
          <Button
            variant="outline"
            className="w-full sm:ml-auto sm:w-auto"
            onClick={onExport}
            disabled={isExporting}
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            Export CSV
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <>
          <AdminMobileStack>
            {items.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No commission earned in this period.
              </p>
            ) : (
              items.map((row) => (
                <AdminMobileCard
                  key={row.id}
                  title={row.asset_name || "—"}
                  subtitle={formatDate(row.date)}
                >
                  <AdminMobileField label="Buyer" value={row.buyer_name || "—"} />
                  <AdminMobileField label="Paid to" value={row.paid_to_name || "—"} />
                  <AdminMobileField
                    label="Rate"
                    value={row.rate === null || row.rate === undefined ? "—" : `${row.rate}%`}
                  />
                  <AdminMobileField label="Gross" value={formatCurrency(row.gross_commission)} />
                  <AdminMobileField label="WHT" value={formatCurrency(row.wht_deducted)} />
                  <AdminMobileField label="Net" value={formatCurrency(row.net_commission)} />
                </AdminMobileCard>
              ))
            )}
          </AdminMobileStack>

          <AdminDesktopTableWrap>
            <div className="min-w-0 overflow-x-auto rounded-md border border-gray-200">
              <Table className="min-w-[880px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Buyer</TableHead>
                    <TableHead>Asset</TableHead>
                    <TableHead>Paid To</TableHead>
                    <TableHead className="text-right">Rate</TableHead>
                    <TableHead className="text-right">Gross</TableHead>
                    <TableHead className="text-right">WHT</TableHead>
                    <TableHead className="text-right">Net</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="py-6 text-center text-sm text-muted-foreground">
                        No commission earned in this period.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((row) => (
                      <TableRow key={row.id} className="hover:bg-muted/30">
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(row.date)}
                        </TableCell>
                        <TableCell className="max-w-40 wrap-break-word text-sm">
                          {row.buyer_name || "—"}
                        </TableCell>
                        <TableCell className="max-w-40 wrap-break-word text-sm">
                          {row.asset_name || "—"}
                        </TableCell>
                        <TableCell className="max-w-40 wrap-break-word text-sm">
                          {row.paid_to_name || "—"}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {row.rate === null || row.rate === undefined ? "—" : `${row.rate}%`}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(row.gross_commission)}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {formatCurrency(row.wht_deducted)}
                        </TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {formatCurrency(row.net_commission)}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </AdminDesktopTableWrap>
        </>
      )}
    </div>
  );
}
