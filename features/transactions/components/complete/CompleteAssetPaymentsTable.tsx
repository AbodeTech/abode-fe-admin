"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { graphql } from "@/lib/gql";
import { FragmentType, useFragment } from "@/lib/gql";
import {
  AdminDesktopTableWrap,
  AdminMobileCard,
  AdminMobileField,
  AdminMobileStack,
} from "@/components/shared/admin-responsive-table";

export const CompleteAssetPaymentsFragment = graphql(`
  fragment CompleteAssetPaymentsTable_data on ZeroBalance {
    name
    email
    phone_number
    sales_person
    asset_name
    unit
    size
    price
    amount_paid
    month_subscription
    start_date
    next_payment_date
  }
`);

interface CompleteAssetPaymentsTableProps {
  data: FragmentType<typeof CompleteAssetPaymentsFragment>[];
}

const formatCurrency = (value?: number | null) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value || 0);

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-NG", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
};

export function CompleteAssetPaymentsTable({ data }: CompleteAssetPaymentsTableProps) {
  const rows = useFragment(CompleteAssetPaymentsFragment, data);

  return (
    <Card className="min-w-0 overflow-hidden border border-gray-200">
      <AdminMobileStack className="border-b border-gray-200 p-3">
        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No completed payments found.</p>
        ) : (
          rows.map((row, idx) => (
            <AdminMobileCard key={`${row.email}-${idx}`} title={row.name || "-"} subtitle={row.email || undefined}>
              <AdminMobileField label="Phone" value={row.phone_number || "-"} />
              <AdminMobileField label="Sales person" value={row.sales_person || "-"} />
              <AdminMobileField label="Asset" value={row.asset_name || "-"} />
              <AdminMobileField label="Unit" value={row.unit ?? "-"} />
              <AdminMobileField label="Size" value={row.size ?? "-"} />
              <AdminMobileField label="Price" value={formatCurrency(row.price)} />
              <AdminMobileField label="Amount paid" value={formatCurrency(row.amount_paid)} />
              <AdminMobileField
                label="Subscription"
                value={
                  row.month_subscription !== null && row.month_subscription !== undefined
                    ? `${row.month_subscription} months`
                    : "-"
                }
              />
              <AdminMobileField label="Start" value={formatDate(row.start_date)} />
              <AdminMobileField label="Next payment" value={formatDate(row.next_payment_date)} />
            </AdminMobileCard>
          ))
        )}
      </AdminMobileStack>

      <AdminDesktopTableWrap>
        <div className="min-w-0 overflow-x-auto">
          <Table className="min-w-[1200px]">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Sales Person</TableHead>
                <TableHead>Asset Name</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Amount Paid</TableHead>
                <TableHead>Month Subscription</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Next Payment Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={12} className="py-6 text-center text-sm text-muted-foreground">
                    No completed payments found.
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row, idx) => (
                  <TableRow key={`${row.email}-${idx}`}>
                    <TableCell>{row.name || "-"}</TableCell>
                    <TableCell className="max-w-[200px] whitespace-normal wrap-break-word">{row.email || "-"}</TableCell>
                    <TableCell>{row.phone_number || "-"}</TableCell>
                    <TableCell>{row.sales_person || "-"}</TableCell>
                    <TableCell>{row.asset_name || "-"}</TableCell>
                    <TableCell>{row.unit ?? "-"}</TableCell>
                    <TableCell>{row.size ?? "-"}</TableCell>
                    <TableCell>{formatCurrency(row.price)}</TableCell>
                    <TableCell>{formatCurrency(row.amount_paid)}</TableCell>
                    <TableCell>
                      {row.month_subscription !== null && row.month_subscription !== undefined
                        ? `${row.month_subscription} months`
                        : "-"}
                    </TableCell>
                    <TableCell>{formatDate(row.start_date)}</TableCell>
                    <TableCell>{formatDate(row.next_payment_date)}</TableCell>
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
