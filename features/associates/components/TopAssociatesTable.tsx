"use client";

import React from "react";
import { graphql } from "@/lib/gql";
import { FragmentType, useFragment } from "@/lib/gql";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export const TopAssociatesTableRowFragment = graphql(`
  fragment TopAssociatesTableRowFragment on Associate {
    name
    status
    email
    sales_person
    no_of_clients
    units_sold
    size_sold
    expected_revenue
    received_revenue
    commission
  }
`);

interface TopAssociatesTableProps {
  data?: (FragmentType<typeof TopAssociatesTableRowFragment> | null)[] | null;
  isLoading?: boolean;
}

const formatCurrency = (amount?: number | null) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount ?? 0);

const formatNumber = (value?: number | null) =>
  new Intl.NumberFormat("en-NG").format(value ?? 0);

const getStatusBadge = (status?: string | null) => {
  if (!status) return <Badge variant="secondary">unknown</Badge>;
  const tone =
    status === "associate-pro"
      ? "bg-blue-500"
      : status === "associate"
      ? "bg-green-500"
      : "bg-muted text-foreground";
  return <Badge className={tone}>{status}</Badge>;
};

export function TopAssociatesTable({ data, isLoading }: TopAssociatesTableProps) {
  const safeRows = (data ?? []).filter(
    (item): item is NonNullable<typeof item> => item !== null
  );
  const associates = useFragment(TopAssociatesTableRowFragment, safeRows);

  if (isLoading) {
    return (
      <div className="rounded-xl bg-white p-4 shadow-sm">
        <Skeleton className="h-6 w-40 mb-3" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, idx) => (
            <Skeleton key={idx} className="h-10 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white shadow-sm overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-semibold">Name</TableHead>
            <TableHead className="font-semibold">Status</TableHead>
            <TableHead className="font-semibold">Email</TableHead>
            <TableHead className="font-semibold">Referrer</TableHead>
            <TableHead className="font-semibold text-right">Clients</TableHead>
            <TableHead className="font-semibold text-right">Units Sold</TableHead>
            <TableHead className="font-semibold text-right">Total Size</TableHead>
            <TableHead className="font-semibold text-right">
              Expected Revenue
            </TableHead>
            <TableHead className="font-semibold text-right">
              Received Revenue
            </TableHead>
            <TableHead className="font-semibold text-right">Commission</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {safeRows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={10} className="text-center text-sm text-muted-foreground">
                No associates found.
              </TableCell>
            </TableRow>
          ) : (
            associates.map((associate, idx) => {
              return (
                <TableRow key={`${associate.email}-${idx}`}>
                  <TableCell className="font-medium">{associate.name}</TableCell>
                  <TableCell>{getStatusBadge(associate.status)}</TableCell>
                  <TableCell>{associate.email}</TableCell>
                  <TableCell>{associate.sales_person}</TableCell>
                  <TableCell className="text-right">
                    {formatNumber(associate.no_of_clients)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(associate.units_sold)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatNumber(associate.size_sold)} sqm
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(associate.expected_revenue)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(associate.received_revenue)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(associate.commission)}
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
