"use client";

import {
  ArrowDownIcon,
  ArrowUpIcon,
  CreditCardIcon,
  DollarSignIcon,
  PackageIcon,
  ShoppingCartIcon,
  UsersIcon,
  WalletIcon,
} from "lucide-react";
import Link from "next/link";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { graphql } from '@/lib/gql';
import { FragmentType, useFragment } from '@/lib/gql';

export const DashboardQuickOverviewFragment = graphql(`
  fragment DashboardQuickOverview_data on AdminDashboard {
    users
    monthly_recurring_revenue
    associate_users
    associate_pro_users
    total_asset
    default_users
    suspended_users
    suspended_payment_plans
    total_payable
    sales
    inflow
    outflow
    total_wallet_balance
  }
`);

interface DashboardQuickOverviewProps {
  data: FragmentType<typeof DashboardQuickOverviewFragment>;
}

export default function DashboardQuickOverview(props: DashboardQuickOverviewProps) {
  const data = useFragment(DashboardQuickOverviewFragment, props.data);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold tracking-tight">Dashboard Data Points</h2>
      {/* DateFilter removed for now as I don't have the component yet */}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.users || 0}</div>
            <p className="text-xs text-muted-foreground">Total registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.monthly_recurring_revenue || 0)}</div>
            <p className="text-xs text-muted-foreground">Total revenue generated</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <PackageIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.total_asset || 0}</div>
            <p className="text-xs text-muted-foreground">Total products available</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Associates</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.associate_users || 0}</div>
            <p className="text-xs text-muted-foreground">Total associates</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Associates Pro</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.associate_pro_users || 0}</div>
            <p className="text-xs text-muted-foreground">Total pro associates</p>
          </CardContent>
        </Card>

        <Link href="/users/suspended" className="block">
          <Card className="h-full transition-colors hover:bg-muted/50 cursror-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suspended Users</CardTitle>
              <UsersIcon className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.suspended_users || 0}</div>
              <p className="text-xs text-muted-foreground">Click to view details</p>
            </CardContent>
          </Card>
        </Link>

      <Link href="/users/suspended-payment-plans" className="block">
        <Card className="h-full transition-colors hover:bg-muted/50 cursror-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended Payment Plans</CardTitle>
            <UsersIcon className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.suspended_payment_plans || 0}</div>
            <p className="text-xs text-muted-foreground">Click to view details</p>
          </CardContent>
        </Card>
      </Link>

      <Link href="/users/defaults" className="block">
        <Card className="h-full transition-colors hover:bg-muted/50 cursror-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Default Users</CardTitle>
            <UsersIcon className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.default_users || 0}</div>
            <p className="text-xs text-muted-foreground">Click to view details</p>
          </CardContent>
        </Card>
      </Link>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payables</CardTitle>
            <CreditCardIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.total_payable || 0)}</div>
            <p className="text-xs text-muted-foreground">Outstanding payments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales</CardTitle>
            <ShoppingCartIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.sales || 0}</div>
            <p className="text-xs text-muted-foreground">Total sales volume</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inflow</CardTitle>
            <ArrowDownIcon className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.inflow || 0)}</div>
            <p className="text-xs text-muted-foreground">Total incoming funds</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outflow</CardTitle>
            <ArrowUpIcon className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.outflow || 0)}</div>
            <p className="text-xs text-muted-foreground">Total outgoing funds</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
            <WalletIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.total_wallet_balance || 0)}</div>
            <p className="text-xs text-muted-foreground">Total wallet balance</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
// Helper to format currency
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value || 0);
};
