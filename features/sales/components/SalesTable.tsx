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

interface SalesTableProps {
  records: FragmentType<typeof SalesRowFragment>[] | null | undefined;
}

export function SalesTable({ records }: SalesTableProps) {
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
            return (
              <AdminMobileCard
                key={idx}
                title={`${sale.user_firstName} ${sale.user_lastName}`}
                subtitle={sale.email}
              >
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
                <TableHead>Size</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Amount Paid</TableHead>
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
                      <TableCell>{totalSize}</TableCell>
                      <TableCell>{formatCurrency(Number(sale.price))}</TableCell>
                      <TableCell>{formatCurrency(Number(sale.amount_paid))}</TableCell>
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
