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
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="border border-gray-200">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-muted-foreground">Total Agencies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-2xl font-bold">{totalAgencies ?? 0}</CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-muted-foreground">Clients Recruited</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-2xl font-bold">{totalClientsRecruited ?? 0}</CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-muted-foreground">Land Value Sold</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-2xl font-bold">{formatCurrency(totalLandValueSold)}</CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-muted-foreground">Outstanding Balance</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="text-2xl font-bold text-rose-600">{formatCurrency(outstandingBalance)}</CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle>Top Performing Agencies</CardTitle>
          </CardHeader>
          <CardContent>
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
                      <TableCell>
                        <div className="font-medium">{agency.agency_name}</div>
                        <div className="text-xs text-muted-foreground">{agency.email}</div>
                      </TableCell>
                      <TableCell>{agency.clients}</TableCell>
                      <TableCell>{formatCurrency(agency.sales_volume)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardHeader>
            <CardTitle>Top Selling Lands</CardTitle>
          </CardHeader>
          <CardContent>
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
                      <TableCell className="font-medium">{land.asset_name}</TableCell>
                      <TableCell>{land.location}</TableCell>
                      <TableCell>{land.units_sold}</TableCell>
                      <TableCell>{formatCurrency(land.value)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
