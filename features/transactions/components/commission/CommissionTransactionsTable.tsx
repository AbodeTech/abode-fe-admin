"use client";

import { format } from "date-fns";
import { TrendingUp } from "lucide-react";
import Link from "next/link";

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
import { formatNaira, formatPercent } from "@/lib/utils/format";

import {
  COMMISSION_SOURCE_TYPE_LABELS,
  type CommissionSourceType,
  type CommissionTransactionRow,
} from "../../schemas/commission-transaction.schema";

const formatDateTime = (value: string) => {
  try {
    const date = new Date(value);
    return {
      date: format(date, "dd MMM yyyy,"),
      time: format(date, "hh:mm a").toLowerCase(),
    };
  } catch {
    return { date: "—", time: "" };
  }
};

const sourceLabel = (sourceType: string | null) => {
  if (!sourceType) return "—";
  if (sourceType in COMMISSION_SOURCE_TYPE_LABELS) {
    return COMMISSION_SOURCE_TYPE_LABELS[sourceType as CommissionSourceType];
  }
  return sourceType;
};

interface CommissionTransactionsTableProps {
  data?: CommissionTransactionRow[] | null;
  isLoading?: boolean;
}

export function CommissionTransactionsTable({
  data,
  isLoading,
}: CommissionTransactionsTableProps) {
  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading transactions...</div>;
  }

  const rows = data ?? [];

  if (rows.length === 0) {
    return (
      <Card className="border border-gray-200">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <TrendingUp className="mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-semibold text-gray-900">No commission data found</h3>
          <p className="max-w-md text-center text-gray-600">
            There are no commission transactions to display at this time.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-w-0 w-full space-y-3">
      <AdminMobileStack>
        {rows.map((row) => {
          const formatted = formatDateTime(row.created_at);
          return (
            <AdminMobileCard
              key={row.id}
              title={
                row.referrer_id ? (
                  <Link
                    href={`/users/${row.referrer_id}`}
                    className="text-primary hover:underline"
                  >
                    {row.referrer_name || "—"}
                  </Link>
                ) : (
                  row.referrer_name || "—"
                )
              }
              subtitle={`${formatted.date} ${formatted.time}`}
            >
              <AdminMobileField label="Buyer" value={row.source_user_name || "—"} />
              <AdminMobileField label="Asset" value={row.asset_name || "—"} />
              <AdminMobileField label="Source" value={sourceLabel(row.source_type)} />
              <AdminMobileField label="TIN" value={row.referrer_tin || "—"} />
              <AdminMobileField label="Gross" value={formatNaira(row.gross_commission)} />
              <AdminMobileField label="WHT" value={formatNaira(row.wht_deducted)} />
              <AdminMobileField label="Net" value={formatNaira(row.net_commission)} />
              <AdminMobileField label="Rate" value={formatPercent(row.rate_applied)} />
              <AdminMobileField label="Tier" value={row.tier_at_creation || "—"} />
              <AdminMobileField label="Status" value={row.status || "—"} />
            </AdminMobileCard>
          );
        })}
      </AdminMobileStack>

      <AdminDesktopTableWrap>
        <div className="min-w-0 overflow-x-auto">
          <Table className="min-w-[1200px]">
            <TableHeader className="border-b border-[#E5EAEF] bg-[#F9FAFB]">
              <TableRow className="text-xs font-medium text-[#5D6679]">
                <TableHead className="px-4 py-4 font-medium">Time</TableHead>
                <TableHead className="px-4 py-4 font-medium">Associate</TableHead>
                <TableHead className="px-4 py-4 font-medium">Buyer</TableHead>
                <TableHead className="px-4 py-4 font-medium">Asset</TableHead>
                <TableHead className="px-4 py-4 font-medium">Source</TableHead>
                <TableHead className="px-4 py-4 font-medium">TIN</TableHead>
                <TableHead className="px-4 py-4 font-medium">Gross</TableHead>
                <TableHead className="px-4 py-4 font-medium">WHT</TableHead>
                <TableHead className="px-4 py-4 font-medium">Net</TableHead>
                <TableHead className="px-4 py-4 font-medium">Rate</TableHead>
                <TableHead className="px-4 py-4 font-medium">Tier</TableHead>
                <TableHead className="px-4 py-4 font-medium">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const formatted = formatDateTime(row.created_at);
                return (
                  <TableRow
                    key={row.id}
                    className="border-b border-[#E5EAEF] transition-colors hover:bg-gray-50"
                  >
                    <TableCell className="px-4 py-5 text-sm text-[#333333]">
                      <div className="flex flex-col">
                        <span>{formatted.date}</span>
                        <span className="text-[#667085]">{formatted.time}</span>
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[160px] whitespace-normal wrap-break-word px-4 py-5 text-sm font-medium text-[#333333] sm:max-w-none">
                      {row.referrer_id ? (
                        <Link
                          href={`/users/${row.referrer_id}`}
                          className="text-primary hover:underline"
                        >
                          {row.referrer_name || "—"}
                        </Link>
                      ) : (
                        row.referrer_name || "—"
                      )}
                    </TableCell>
                    <TableCell className="max-w-[160px] whitespace-normal wrap-break-word px-4 py-5 text-sm text-[#333333] sm:max-w-none">
                      {row.source_user_name || "—"}
                    </TableCell>
                    <TableCell className="max-w-[160px] whitespace-normal wrap-break-word px-4 py-5 text-sm text-[#667085] sm:max-w-none">
                      {row.asset_name || "—"}
                    </TableCell>
                    <TableCell className="px-4 py-5">
                      <Badge
                        variant="outline"
                        className="border-[#E0E2E7] bg-[#F0F1F3] text-xs font-medium text-[#333333]"
                      >
                        {sourceLabel(row.source_type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-5 text-sm text-[#667085]">
                      {row.referrer_tin || "—"}
                    </TableCell>
                    <TableCell className="px-4 py-5 text-sm tabular-nums text-[#333333]">
                      {formatNaira(row.gross_commission)}
                    </TableCell>
                    <TableCell className="px-4 py-5 text-sm tabular-nums text-[#667085]">
                      {formatNaira(row.wht_deducted)}
                    </TableCell>
                    <TableCell className="px-4 py-5 text-sm font-semibold tabular-nums text-[#333333]">
                      {formatNaira(row.net_commission)}
                    </TableCell>
                    <TableCell className="px-4 py-5 text-sm text-[#667085]">
                      {formatPercent(row.rate_applied)}
                    </TableCell>
                    <TableCell className="px-4 py-5">
                      <Badge
                        variant="outline"
                        className="border-[#E0E2E7] bg-[#F0F1F3] text-xs font-medium text-[#333333]"
                      >
                        {row.tier_at_creation || "—"}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-5">
                      <Badge className="border-0 bg-[#1A1A1A] text-xs font-medium text-white hover:bg-[#333333]">
                        {row.status || "—"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </AdminDesktopTableWrap>
    </div>
  );
}
