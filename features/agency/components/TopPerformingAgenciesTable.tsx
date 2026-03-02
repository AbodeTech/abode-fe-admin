"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TopPerformingAgency } from "./AgencyDashboardPanels";

interface TopPerformingAgenciesTableProps {
  rows?: TopPerformingAgency[] | null;
}

const formatCurrency = (value?: number | null) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(value ?? 0);

export function TopPerformingAgenciesTable({ rows }: TopPerformingAgenciesTableProps) {
  const items = rows ?? [];

  return (
    <Card className="border border-gray-200">
      <CardHeader>
        <CardTitle>Top Performing Agencies</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agency</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Clients</TableHead>
              <TableHead>Sales Volume</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                  No top-performing agencies found.
                </TableCell>
              </TableRow>
            ) : (
              items.map((agency) => (
                <TableRow key={agency._id}>
                  <TableCell className="font-medium">{agency.agency_name}</TableCell>
                  <TableCell>{agency.email || "-"}</TableCell>
                  <TableCell>{agency.phoneNumber || "-"}</TableCell>
                  <TableCell>{agency.clients ?? 0}</TableCell>
                  <TableCell>{formatCurrency(agency.sales_volume)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
