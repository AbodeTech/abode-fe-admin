"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import {
  AdminDesktopTableWrap,
  AdminMobileCard,
  AdminMobileField,
  AdminMobileStack,
} from "@/components/shared/admin-responsive-table";
import type { SalesRow } from "../schemas/sales.schema";
import { PLAN_STATUS_BADGE_CLASSES, PLAN_STATUS_LABELS, excludedFromTotalsReason } from "../lib/plan-status";

type SalesTableRow = Pick<
  SalesRow,
  | "id"
  | "buyer"
  | "referrer"
  | "asset"
  | "size"
  | "no_of_units"
  | "price"
  | "amount_paid"
  | "balance"
  | "payment_completion_percentage"
  | "doc_price"
  | "doc_amount_paid"
  | "month_subscription"
  | "start_date"
  | "next_date_of_payment"
  | "plan_status"
  | "is_suspended"
  | "source_type"
  | "created_by_admin"
  | "admin_creation_subtype"
>;

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);

const formatDate = (dateString: string | null) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? "N/A" : format(date, "yyyy/MM/dd");
};

function PlanStatusBadge({ row }: { row: SalesTableRow }) {
  const excludedReason = excludedFromTotalsReason(row);
  return (
    <span className="flex flex-wrap items-center gap-1">
      <span className={`whitespace-nowrap rounded-full px-2 py-1 text-xs ${PLAN_STATUS_BADGE_CLASSES[row.plan_status]}`}>
        {PLAN_STATUS_LABELS[row.plan_status]}
      </span>
      {row.source_type === "marketplace_resale" && (
        <span className="whitespace-nowrap rounded-full bg-indigo-100 px-2 py-1 text-xs text-indigo-800">Resale</span>
      )}
      {row.source_type === "close_and_relocate" && (
        <span className="whitespace-nowrap rounded-full bg-cyan-100 px-2 py-1 text-xs text-cyan-800">Relocation</span>
      )}
      {excludedReason && (
        <span
          title={excludedReason}
          className="whitespace-nowrap rounded-full bg-orange-100 px-2 py-1 text-xs text-orange-800"
        >
          Excluded from totals
        </span>
      )}
    </span>
  );
}

interface SalesTableProps {
  records: SalesTableRow[] | null | undefined;
}

export function SalesTable({ records }: SalesTableProps) {
  const salesList = records ?? [];

  return (
    <div className="mt-4 min-w-0 space-y-4 px-0 sm:mt-8 sm:px-2 md:px-4">
      <AdminMobileStack>
        {salesList.length > 0 ? (
          salesList.map((sale) => {
            const totalSize = (sale.size ?? 0) * sale.no_of_units;
            const assetType = sale.asset.type?.toLowerCase() || "";
            return (
              <AdminMobileCard key={sale.id} title={sale.buyer.name ?? "No name"} subtitle={sale.buyer.email ?? undefined}>
                <AdminMobileField label="Status" value={<PlanStatusBadge row={sale} />} />
                <AdminMobileField label="Referrer" value={sale.referrer?.name || "No referrer"} />
                <AdminMobileField label="Referrer email" value={sale.referrer?.email || "—"} />
                <AdminMobileField label="Asset" value={sale.asset.name ?? "—"} />
                <AdminMobileField
                  label="Asset type"
                  value={
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        assetType === "flex" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                      }`}
                    >
                      {sale.asset.type}
                    </span>
                  }
                />
                <AdminMobileField label="Size (total sqm)" value={totalSize} />
                <AdminMobileField label="Price" value={formatCurrency(sale.price)} />
                <AdminMobileField label="Amount paid" value={formatCurrency(sale.amount_paid)} />
                <AdminMobileField label="Balance" value={formatCurrency(sale.balance)} />
                <AdminMobileField label="Progress" value={`${sale.payment_completion_percentage}%`} />
                <AdminMobileField label="Document price" value={formatCurrency(sale.doc_price ?? 0)} />
                <AdminMobileField label="Document paid" value={formatCurrency(sale.doc_amount_paid)} />
                <AdminMobileField label="Months subscription" value={sale.month_subscription} />
                <AdminMobileField label="Start" value={formatDate(sale.start_date)} />
                <AdminMobileField label="Next" value={formatDate(sale.next_date_of_payment)} />
              </AdminMobileCard>
            );
          })
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">No sales records found</p>
        )}
      </AdminMobileStack>

      <AdminDesktopTableWrap>
        <div className="min-w-0 overflow-x-auto rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Referrer</TableHead>
                <TableHead>Asset Name</TableHead>
                <TableHead>Asset Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Amount Paid</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Progress</TableHead>
                <TableHead>Document Price</TableHead>
                <TableHead>Document Amount Paid</TableHead>
                <TableHead>Month Subscription</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Next Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesList.length > 0 ? (
                salesList.map((sale) => {
                  const totalSize = (sale.size ?? 0) * sale.no_of_units;
                  const assetType = sale.asset.type?.toLowerCase() || "";
                  return (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.buyer.name ?? "No name"}</TableCell>
                      <TableCell>{sale.buyer.email ?? "—"}</TableCell>
                      <TableCell>{sale.referrer?.name || "No referrer"}</TableCell>
                      <TableCell>{sale.asset.name ?? "—"}</TableCell>
                      <TableCell>
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${
                            assetType === "flex" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                          }`}
                        >
                          {sale.asset.type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <PlanStatusBadge row={sale} />
                      </TableCell>
                      <TableCell>{totalSize}</TableCell>
                      <TableCell>{formatCurrency(sale.price)}</TableCell>
                      <TableCell>{formatCurrency(sale.amount_paid)}</TableCell>
                      <TableCell>{formatCurrency(sale.balance)}</TableCell>
                      <TableCell>{sale.payment_completion_percentage}%</TableCell>
                      <TableCell>{formatCurrency(sale.doc_price ?? 0)}</TableCell>
                      <TableCell>{formatCurrency(sale.doc_amount_paid)}</TableCell>
                      <TableCell>{sale.month_subscription}</TableCell>
                      <TableCell>{formatDate(sale.start_date)}</TableCell>
                      <TableCell>{formatDate(sale.next_date_of_payment)}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={16} className="py-4 text-center">
                    No sales records found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </AdminDesktopTableWrap>
    </div>
  );
}
