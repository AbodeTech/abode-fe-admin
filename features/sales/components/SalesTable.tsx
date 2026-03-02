"use client";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { FragmentType, useFragment } from "@/lib/gql";
import { graphql } from "@/lib/gql";

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
    <div className="mt-8 px-4 space-y-4">
      <div className="rounded-md border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Referrer Name</TableHead>
              <TableHead>Referrer Email</TableHead>
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
                    <TableCell className="font-medium">{sale.user_firstName} {sale.user_lastName}</TableCell>
                    <TableCell>{sale.email}</TableCell>
                    <TableCell>{sale.referrer_name || "No referrer"}</TableCell>
                    <TableCell>{sale.referrer_email || "No referrer"}</TableCell>
                    <TableCell>{sale.asset_name}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${assetType === "flex"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-green-100 text-green-800"
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
                <TableCell colSpan={14} className="text-center py-4">
                  No sales records found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
