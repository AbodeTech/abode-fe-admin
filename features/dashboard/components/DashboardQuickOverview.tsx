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
    <div className="space-y-3 sm:space-y-4">
      <h2 className="text-lg font-bold tracking-tight sm:text-xl md:text-2xl">Dashboard Data Points</h2>

      <div className="grid grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:gap-4 md:gap-4 lg:grid-cols-3">
        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <UsersIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold tabular-nums sm:text-2xl">{data.users || 0}</div>
            <p className="text-xs text-muted-foreground">Total registered users</p>
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSignIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="break-words text-lg font-bold tabular-nums sm:text-xl md:text-2xl">
              {formatCurrency(data.monthly_recurring_revenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total revenue generated</p>
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Products</CardTitle>
            <PackageIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold tabular-nums sm:text-2xl">{data.total_asset || 0}</div>
            <p className="text-xs text-muted-foreground">Total products available</p>
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Associates</CardTitle>
            <UsersIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold tabular-nums sm:text-2xl">{data.associate_users || 0}</div>
            <p className="text-xs text-muted-foreground">Total associates</p>
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Associates Pro</CardTitle>
            <UsersIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold tabular-nums sm:text-2xl">{data.associate_pro_users || 0}</div>
            <p className="text-xs text-muted-foreground">Total pro associates</p>
          </CardContent>
        </Card>

        <Link href="/users/suspended" className="block min-w-0">
          <Card className="h-full min-w-0 overflow-hidden transition-colors hover:bg-muted/50 cursor-pointer">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suspended Users</CardTitle>
              <UsersIcon className="h-4 w-4 shrink-0 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold tabular-nums sm:text-2xl">{data.suspended_users || 0}</div>
              <p className="text-xs text-muted-foreground">Click to view details</p>
            </CardContent>
          </Card>
        </Link>

      <Link href="/users/suspended-payment-plans" className="block min-w-0">
        <Card className="h-full min-w-0 overflow-hidden transition-colors hover:bg-muted/50 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspended Payment Plans</CardTitle>
            <UsersIcon className="h-4 w-4 shrink-0 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold tabular-nums sm:text-2xl">{data.suspended_payment_plans || 0}</div>
            <p className="text-xs text-muted-foreground">Click to view details</p>
          </CardContent>
        </Card>
      </Link>

      <Link href="/users/defaults" className="block min-w-0">
        <Card className="h-full min-w-0 overflow-hidden transition-colors hover:bg-muted/50 cursor-pointer">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Default Users</CardTitle>
            <UsersIcon className="h-4 w-4 shrink-0 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold tabular-nums sm:text-2xl">{data.default_users || 0}</div>
            <p className="text-xs text-muted-foreground">Click to view details</p>
          </CardContent>
        </Card>
      </Link>

        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payables</CardTitle>
            <CreditCardIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="break-words text-lg font-bold tabular-nums sm:text-xl md:text-2xl">
              {formatCurrency(data.total_payable || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Outstanding payments</p>
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sales</CardTitle>
            <ShoppingCartIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold tabular-nums sm:text-2xl">{data.sales || 0}</div>
            <p className="text-xs text-muted-foreground">Total sales volume</p>
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Inflow</CardTitle>
            <ArrowDownIcon className="h-4 w-4 shrink-0 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="break-words text-lg font-bold tabular-nums sm:text-xl md:text-2xl">
              {formatCurrency(data.inflow || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total incoming funds</p>
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outflow</CardTitle>
            <ArrowUpIcon className="h-4 w-4 shrink-0 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="break-words text-lg font-bold tabular-nums sm:text-xl md:text-2xl">
              {formatCurrency(data.outflow || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Total outgoing funds</p>
          </CardContent>
        </Card>

        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
            <WalletIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="break-words text-lg font-bold tabular-nums sm:text-xl md:text-2xl">
              {formatCurrency(data.total_wallet_balance || 0)}
            </div>
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
