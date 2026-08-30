"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { FragmentType, useFragment } from "@/lib/gql";
import { graphql } from "@/lib/gql";
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

export const SalesRowFragment = graphql(`
  fragment SalesRowFragment on SalesRecord {
    user_firstName
    user_lastName
    email
    user_phone
    referrer_name
    referrer_email
    referrer_phone
    asset_name
    asset_type
    no_of_units
    document_amount_paid
    fullownerhsip_documentprice
    month_subscription
    size
    price
    amount_paid
    amount_payable
    balance
    default_amount
    is_suspended
    start_date
    next_date
  }
`);

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);

const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  const date = new Date(dateString);
  return isNaN(date.getTime()) ? "N/A" : format(date, "yyyy/MM/dd");
};

interface TeamSalesTableProps {
  records: FragmentType<typeof SalesRowFragment>[] | null | undefined;
}

export function TeamSalesTable({ records }: TeamSalesTableProps) {
  const data = useFragment(SalesRowFragment, records);
  const salesList = data || [];

  return (
    <div className="mt-4 min-w-0 space-y-4 px-0 sm:mt-8 sm:px-2 md:px-4">
      <AdminMobileStack>
        {salesList.length > 0 ? (
          salesList.map((sale, idx) => {
            const units = Number(sale.no_of_units) || 0;
            const size = Number(sale.size) || 0;
            const totalSize = size * units;
            const assetType = sale.asset_type?.toLowerCase() || "";
            const status = derivePaymentStatus(sale);
            const progress = paymentProgress(sale);
            return (
              <AdminMobileCard
                key={idx}
                title={`${sale.user_firstName} ${sale.user_lastName}`}
                subtitle={sale.email}
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
                <AdminMobileField label="Buyer phone" value={sale.user_phone || "—"} />
                <AdminMobileField label="Referrer" value={sale.referrer_name || "No referrer"} />
                <AdminMobileField label="Referrer email" value={sale.referrer_email || "—"} />
                <AdminMobileField label="Referrer phone" value={sale.referrer_phone || "—"} />
                <AdminMobileField label="Asset" value={sale.asset_name} />
                <AdminMobileField
                  label="Asset type"
                  value={
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        assetType === "flex" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                      }`}
                    >
                      {sale.asset_type}
                    </span>
                  }
                />
                <AdminMobileField label="Size (total sqm)" value={totalSize} />
                <AdminMobileField label="Price" value={formatCurrency(Number(sale.price))} />
                <AdminMobileField label="Amount paid" value={formatCurrency(Number(sale.amount_paid))} />
                <AdminMobileField label="Balance" value={formatCurrency(outstandingBalance(sale))} />
                <AdminMobileField label="Progress" value={progress != null ? `${progress}%` : "—"} />
                <AdminMobileField label="Document price" value={formatCurrency(Number(sale.fullownerhsip_documentprice) || 0)} />
                <AdminMobileField label="Document paid" value={formatCurrency(Number(sale.document_amount_paid))} />
                <AdminMobileField label="Months subscription" value={sale.month_subscription} />
                <AdminMobileField label="Start" value={formatDate(sale.start_date)} />
                <AdminMobileField label="Next" value={formatDate(sale.next_date)} />
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
                <TableHead>Buyer phone</TableHead>
                <TableHead>Referrer Name</TableHead>
                <TableHead>Referrer Email</TableHead>
                <TableHead>Referrer Phone</TableHead>
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
                  const assetType = sale.asset_type?.toLowerCase() || "";
                  const status = derivePaymentStatus(sale);
                  const progress = paymentProgress(sale);

                  return (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">
                        {sale.user_firstName} {sale.user_lastName}
                      </TableCell>
                      <TableCell>{sale.email}</TableCell>
                      <TableCell>{sale.user_phone || "—"}</TableCell>
                      <TableCell>{sale.referrer_name || "No referrer"}</TableCell>
                      <TableCell>{sale.referrer_email || "No referrer"}</TableCell>
                      <TableCell>{sale.referrer_phone || "—"}</TableCell>
                      <TableCell>{sale.asset_name}</TableCell>
                      <TableCell>
                        <span
                          className={`rounded-full px-2 py-1 text-xs ${
                            assetType === "flex" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"
                          }`}
                        >
                          {sale.asset_type}
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
                      <TableCell>{formatCurrency(Number(sale.fullownerhsip_documentprice) || 0)}</TableCell>
                      <TableCell>{formatCurrency(Number(sale.document_amount_paid))}</TableCell>
                      <TableCell>{sale.month_subscription}</TableCell>
                      <TableCell>{formatDate(sale.start_date)}</TableCell>
                      <TableCell>{formatDate(sale.next_date)}</TableCell>
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
