"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { graphql } from "@/lib/gql";
import { FragmentType, useFragment } from "@/lib/gql";

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
    <Card className="border border-gray-200 overflow-x-auto mt-4">
      <Table>
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
              <TableCell colSpan={12} className="text-center text-sm text-muted-foreground">
                No completed payments found.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row, idx) => (
              <TableRow key={`${row.email}-${idx}`}>
                <TableCell>{row.name || "-"}</TableCell>
                <TableCell>{row.email || "-"}</TableCell>
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
    </Card>
  );
}
