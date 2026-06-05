"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Building2, DollarSign, TrendingUp, Users } from "lucide-react";

export interface TopPerformingAgency {
  _id: string;
  agency_name: string;
  clients: number;
  email: string;
  phoneNumber: string;
  sales_volume: number;
}

export interface TopSellingLand {
  asset_name: string;
  location: string;
  units_sold: number;
  value: number;
}

interface AgencyDashboardPanelsProps {
  totalAgencies?: number;
  totalClientsRecruited?: number;
  totalLandValueSold?: number;
  outstandingBalance?: number;
  topPerformingAgencies?: TopPerformingAgency[] | null;
  topSellingLands?: TopSellingLand[] | null;
}

const formatCurrency = (value?: number | null) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(value ?? 0);

export function AgencyDashboardPanels({
  totalAgencies,
  totalClientsRecruited,
  totalLandValueSold,
  outstandingBalance,
  topPerformingAgencies,
  topSellingLands,
}: AgencyDashboardPanelsProps) {
  const agencies = topPerformingAgencies ?? [];
  const lands = topSellingLands ?? [];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:gap-4 xl:grid-cols-4">
        <Card className="min-w-0 overflow-hidden border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Agencies</CardTitle>
            <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-xl font-bold tabular-nums sm:text-2xl">{totalAgencies ?? 0}</CardContent>
        </Card>

        <Card className="min-w-0 overflow-hidden border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Clients Recruited</CardTitle>
            <Users className="h-4 w-4 shrink-0 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-xl font-bold tabular-nums sm:text-2xl">{totalClientsRecruited ?? 0}</CardContent>
        </Card>

        <Card className="min-w-0 overflow-hidden border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Land Value Sold</CardTitle>
            <TrendingUp className="h-4 w-4 shrink-0 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-lg font-bold tabular-nums wrap-break-word sm:text-xl md:text-2xl">
            {formatCurrency(totalLandValueSold)}
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-hidden border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Outstanding Balance</CardTitle>
            <DollarSign className="h-4 w-4 shrink-0 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-lg font-bold tabular-nums wrap-break-word text-rose-600 sm:text-xl md:text-2xl">
            {formatCurrency(outstandingBalance)}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="min-w-0 overflow-hidden border border-gray-200">
          <CardHeader>
            <CardTitle>Top Performing Agencies</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0 p-2 sm:p-6">
            <div className="min-w-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Agency</TableHead>
                    <TableHead>Clients</TableHead>
                    <TableHead>Sales Volume</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agencies.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                        No agency data available.
                      </TableCell>
                    </TableRow>
                  ) : (
                    agencies.map((agency) => (
                      <TableRow key={agency._id}>
                        <TableCell className="max-w-48 min-w-0">
                          <div className="truncate font-medium" title={agency.agency_name}>
                            {agency.agency_name}
                          </div>
                          <div className="truncate text-xs text-muted-foreground" title={agency.email}>
                            {agency.email}
                          </div>
                        </TableCell>
                        <TableCell>{agency.clients}</TableCell>
                        <TableCell className="whitespace-nowrap tabular-nums">
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

        <Card className="min-w-0 overflow-hidden border border-gray-200">
          <CardHeader>
            <CardTitle>Top Selling Lands</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0 p-2 sm:p-6">
            <div className="min-w-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Asset</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Units</TableHead>
                    <TableHead>Value</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lands.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                        No sales data available.
                      </TableCell>
                    </TableRow>
                  ) : (
                    lands.map((land) => (
                      <TableRow key={`${land.asset_name}-${land.location}`}>
                        <TableCell className="max-w-40 min-w-0 font-medium wrap-break-word">{land.asset_name}</TableCell>
                        <TableCell className="max-w-40 min-w-0 wrap-break-word">{land.location}</TableCell>
                        <TableCell>{land.units_sold}</TableCell>
                        <TableCell className="whitespace-nowrap tabular-nums">{formatCurrency(land.value)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
