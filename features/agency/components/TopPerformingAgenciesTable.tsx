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
    <Card className="min-w-0 border border-gray-200">
      <CardHeader className="min-w-0 pb-2 sm:pb-3">
        <CardTitle className="text-lg sm:text-xl">Top Performing Agencies</CardTitle>
      </CardHeader>
      <CardContent className="min-w-0 p-0 sm:p-6">
        <div className="min-w-0 overflow-x-auto px-4 pb-4 sm:px-0 sm:pb-0">
          <Table className="min-w-[720px]">
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
                  <TableCell className="max-w-40 font-medium">
                    <span className="line-clamp-2 wrap-break-word" title={agency.agency_name}>
                      {agency.agency_name}
                    </span>
                  </TableCell>
                  <TableCell className="max-w-44 wrap-break-word text-sm" title={agency.email ?? undefined}>
                    {agency.email || "-"}
                  </TableCell>
                  <TableCell className="max-w-36 wrap-break-word text-sm">{agency.phoneNumber || "-"}</TableCell>
                  <TableCell className="tabular-nums">{agency.clients ?? 0}</TableCell>
                  <TableCell className="max-w-40 tabular-nums wrap-break-word">
                    {formatCurrency(agency.sales_volume)}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </CardContent>
    </Card>
  );
}
