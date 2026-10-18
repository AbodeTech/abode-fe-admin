"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import {
  AdminDesktopTableWrap,
  AdminMobileCard,
  AdminMobileField,
  AdminMobileStack,
} from "@/components/shared/admin-responsive-table";
import {
  derivePaymentStatus,
  outstandingBalance,
  paymentProgress,
  PAYMENT_STATUS_BADGE_CLASSES,
} from "../lib/payment-status";
import type { SalesRow } from "@/features/sales/schemas/sales.schema";

/* ============================================================
 * Scoped to this feature: getManagerSalesRecord / adminGetManagerSalesRecord
 * are explicitly deferred from the Sales v2 REST migration (see that design
 * doc's "Explicit Non-Ownership" section), so they still return the old
 * GraphQL row shape this fragment matches. Was previously borrowed from
 * features/sales/components/SalesTable — duplicated here now that feature
 * moved to a REST row shape this query doesn't return. The fragment keeps
 * its original name (`SalesRowFragment`) rather than a feature-local one:
 * codegen can't reach the GraphQL schema from this environment (see
 * use-allocate-land.ts's note in the allocation feature), so the generated
 * `graphql()` overload map in lib/gql/gql.ts is frozen at its last real
 * codegen run and keyed by exact query text — renaming the fragment would
 * make this query text a lookup miss and silently fall back to `unknown`.
 * ============================================================ */

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? "N/A" : format(date, "yyyy/MM/dd");
};

interface TeamSalesTableProps {
  records: SalesRow[] | null | undefined;
}

export function TeamSalesTable({ records }: TeamSalesTableProps) {
  const salesList = records ?? [];

  return (
    <div className="mt-4 min-w-0 space-y-4 px-0 sm:mt-8 sm:px-2 md:px-4">
      <AdminMobileStack>
        {salesList.length > 0 ? (
          salesList.map((sale, idx) => {
            const units = Number(sale.no_of_units) || 0;
            const size = Number(sale.size) || 0;
            const totalSize = size * units;
            const assetType = sale.asset.type?.toLowerCase() || "";
            const status = derivePaymentStatus(sale);
            const progress = paymentProgress(sale);
            return (
              <AdminMobileCard
                key={idx}
                title={sale.buyer.name ?? "—"}
                subtitle={sale.buyer.email}
              >
                <AdminMobileField
                  label="Status"
                  value={
                    <span className="flex flex-wrap items-center gap-1">
                      <span className={`rounded-full px-2 py-1 text-xs ${PAYMENT_STATUS_BADGE_CLASSES[status]}`}>
                        {status}
                      </span>
                      {sale.is_suspended && (
                        <span className="rounded-full bg-gray-200 px-2 py-1 text-xs text-gray-700">Suspended</span>
                      )}
                      {Number(sale.default_amount) > 0 && (
                        <span className="rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-800">Defaulting</span>
                      )}
                    </span>
                  }
                />
                <AdminMobileField label="Referrer" value={sale.referrer?.name || "No referrer"} />
                <AdminMobileField label="Referrer email" value={sale.referrer?.email || "—"} />
                <AdminMobileField label="Asset" value={sale.asset.name} />
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
                <AdminMobileField label="Price" value={formatCurrency(Number(sale.price))} />
                <AdminMobileField label="Amount paid" value={formatCurrency(Number(sale.amount_paid))} />
                <AdminMobileField label="Balance" value={formatCurrency(outstandingBalance(sale))} />
                <AdminMobileField label="Progress" value={progress != null ? `${progress}%` : "—"} />
                <AdminMobileField label="Document price" value={formatCurrency(Number(sale.doc_price) || 0)} />
                <AdminMobileField label="Document paid" value={formatCurrency(Number(sale.doc_amount_paid))} />
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
                <TableHead>Referrer Name</TableHead>
                <TableHead>Referrer Email</TableHead>
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
                salesList.map((sale, idx) => {
                  const units = Number(sale.no_of_units) || 0;
                  const size = Number(sale.size) || 0;
                  const totalSize = size * units;
                  const assetType = sale.asset.type?.toLowerCase() || "";
                  const status = derivePaymentStatus(sale);
                  const progress = paymentProgress(sale);

                  return (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">
                        {sale.buyer.name ?? "—"}
                      </TableCell>
                      <TableCell>{sale.buyer.email}</TableCell>
                      <TableCell>{sale.referrer?.name || "No referrer"}</TableCell>
                      <TableCell>{sale.referrer?.email || "No referrer"}</TableCell>
                      <TableCell>{sale.asset.name}</TableCell>
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
                        <span className="flex flex-wrap items-center gap-1">
                          <span className={`whitespace-nowrap rounded-full px-2 py-1 text-xs ${PAYMENT_STATUS_BADGE_CLASSES[status]}`}>
                            {status}
                          </span>
                          {sale.is_suspended && (
                            <span className="whitespace-nowrap rounded-full bg-gray-200 px-2 py-1 text-xs text-gray-700">
                              Suspended
                            </span>
                          )}
                          {Number(sale.default_amount) > 0 && (
                            <span className="whitespace-nowrap rounded-full bg-amber-100 px-2 py-1 text-xs text-amber-800">
                              Defaulting
                            </span>
                          )}
                        </span>
                      </TableCell>
                      <TableCell>{totalSize}</TableCell>
                      <TableCell>{formatCurrency(Number(sale.price))}</TableCell>
                      <TableCell>{formatCurrency(Number(sale.amount_paid))}</TableCell>
                      <TableCell>{formatCurrency(outstandingBalance(sale))}</TableCell>
                      <TableCell>{progress != null ? `${progress}%` : "—"}</TableCell>
                      <TableCell>{formatCurrency(Number(sale.doc_price) || 0)}</TableCell>
                      <TableCell>{formatCurrency(Number(sale.doc_amount_paid))}</TableCell>
                      <TableCell>{sale.month_subscription}</TableCell>
                      <TableCell>{formatDate(sale.start_date)}</TableCell>
                      <TableCell>{formatDate(sale.next_date_of_payment)}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={19} className="py-4 text-center">
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
