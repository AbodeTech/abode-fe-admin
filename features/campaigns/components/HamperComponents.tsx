"use client";

import React, { useState } from "react";
import { FragmentType, graphql, useFragment } from "@/lib/gql";
import { MetricCard, ProgressCard } from "./CampaignCards";
import { GenericTable } from "./SimpleTables";
import { useHamperTransactions, useHamperLeaderboard } from "../hooks/use-campaigns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const HamperSalesMetricsFragment = graphql(`
  fragment HamperSalesMetrics on SalesMetricsHamper {
    dailySqmTargetRemaining
    percentageSold
    sqmRemainingToSell
    targetSqm
    totalSqmSold
  }
`);

export const HamperFinancialMetricsFragment = graphql(`
  fragment HamperFinancialMetrics on FinancialMetricsHamper {
    totalRevenueGenerated
    totalAssetValueSold
    averagePaymentPerPlan
    totalBalance
  }
`);

export const HamperAssetBreakdownFragment = graphql(`
  fragment HamperAssetBreakdown on AssetBreakdownHamper {
    assetName
    percentageOfTotal
    totalSqmSold
    totalHampers
  }
`);

export const HamperReferrerFragment = graphql(`
  fragment HamperReferrer on ReferrerWithHampers {
    name
    email
    hamperCount
    totalSqmReferred
  }
`);

const currency = (value?: number | null) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value || 0);

interface HamperMetricsSectionProps {
  salesData?: FragmentType<typeof HamperSalesMetricsFragment> | null;
  financialData?: FragmentType<typeof HamperFinancialMetricsFragment> | null;
}

export function HamperMetricsSection({ salesData, financialData }: HamperMetricsSectionProps) {
  const sales = useFragment(HamperSalesMetricsFragment, salesData);
  const financial = useFragment(HamperFinancialMetricsFragment, financialData);

  return (
    <div className="space-y-6">
      <ProgressCard
        title="Land Sales Progress"
        sold={sales?.totalSqmSold}
        target={sales?.targetSqm}
        percentage={sales?.percentageSold}
      />

      <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total Revenue" value={currency(financial?.totalRevenueGenerated)} />
        <MetricCard title="Asset Value Sold" value={currency(financial?.totalAssetValueSold)} />
        <MetricCard title="Avg Payment Plan" value={currency(financial?.averagePaymentPerPlan)} />
        <MetricCard title="Balance Outstanding" value={currency(financial?.totalBalance)} />
      </div>
    </div>
  );
}

interface HamperAssetTableProps {
  data?: (FragmentType<typeof HamperAssetBreakdownFragment> | null)[] | null;
}

export function HamperAssetTable({ data }: HamperAssetTableProps) {
  const rowsRaw = data || [];
  const rows = rowsRaw.map((r) => useFragment(HamperAssetBreakdownFragment, r)).filter((r): r is NonNullable<typeof r> => r !== null && r !== undefined);

  return (
    <GenericTable
      title="Asset Breakdown"
      columns={["Asset", "SQM Sold", "Hampers", "% of Total"]}
      rows={rows.map((row) => [
        row.assetName || "-",
        Number(row.totalSqmSold || 0).toLocaleString(),
        Number(row.totalHampers || 0).toLocaleString(),
        `${Number(row.percentageOfTotal || 0).toFixed(1)}%`,
      ])}
    />
  );
}

interface HamperReferrersTableProps {
  data?: (FragmentType<typeof HamperReferrerFragment> | null)[] | null;
}

export function HamperReferrersTable({ data }: HamperReferrersTableProps) {
  const rowsRaw = data || [];
  const rows = rowsRaw.map((r) => useFragment(HamperReferrerFragment, r)).filter((r): r is NonNullable<typeof r> => r !== null && r !== undefined);

  return (
    <GenericTable
      title="Referrers With Hampers"
      columns={["Name", "Email", "Total Hampers", "Total SQM Referred"]}
      rows={rows.map((row) => [
        row.name || "-",
        row.email || "-",
        Number(row.hamperCount || 0).toLocaleString(),
        Number(row.totalSqmReferred || 0).toLocaleString(),
      ])}
    />
  );
}

export function HamperTransactionTable() {
  const [page, setPage] = useState(1);
  const limit = 10;
  const { data, isLoading } = useHamperTransactions({ page, limit });

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <span className="text-muted-foreground">Loading transactions...</span>
      </div>
    );
  }

  const rows = data?.data?.map((row) => [
    row?.name || "-",
    row?.email || "-",
    row?.assetName || "-",
    `${row?.size || "-"} ${row?.unit || "-"}`,
    currency(row?.landPrice),
    currency(row?.landAmountPaid),
    currency(row?.documentPrice),
    currency(row?.documentAmountPaid),
  ]) || [];

  return (
    <div className="space-y-4">
      <GenericTable
        title="Recent Transactions"
        columns={[
          "Name",
          "Email",
          "Asset",
          "Size",
          "Land Price",
          "Land Amount Paid",
          "Doc Price",
          "Doc Amount Paid",
        ]}
        rows={rows}
      />
      {typeof data?.count === 'number' && data.count > limit && (
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="text-center text-sm text-muted-foreground">
            Page {page} of {Math.ceil(data.count / limit)}
          </span>
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            onClick={() => setPage((p) => p + 1)}
            disabled={page >= Math.ceil(data.count / limit)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

export function HamperLeaderboardSection() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const { data, isLoading } = useHamperLeaderboard({
    startDate: startDate || undefined,
    endDate: endDate || undefined
  });

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-yellow-100 text-yellow-800 font-bold text-xs">1</span>;
      case 2:
        return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-200 text-gray-800 font-bold text-xs">2</span>;
      case 3:
        return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-100 text-orange-800 font-bold text-xs">3</span>;
      default:
        return <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-muted-foreground font-bold text-xs">{rank}</span>;
    }
  };

  const rows = data?.map((row, index) => [
    getRankBadge(index + 1),
    row?.name || "-",
    row?.email || "-",
    Number(row?.hamperCount || 0).toLocaleString(),
    Number(row?.totalSqmSold || 0).toLocaleString(),
    currency(row?.totalAmountPaid),
    Number(row?.numberOfReferredUsers || 0).toLocaleString(),
  ]) || [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-end justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Hamper Leaderboard</h3>
          <p className="text-sm text-muted-foreground">Top referrers winning hampers</p>
        </div>
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end sm:justify-end">
          <div className="grid w-full min-w-0 gap-1 sm:w-auto sm:max-w-[11rem]">
            <span className="text-xs text-muted-foreground">Start Date</span>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full min-w-0 sm:w-[150px]"
            />
          </div>
          <div className="grid w-full min-w-0 gap-1 sm:w-auto sm:max-w-[11rem]">
            <span className="text-xs text-muted-foreground">End Date</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full min-w-0 sm:w-[150px]"
            />
          </div>
          <div className="grid w-full gap-1 self-end pb-px sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => { setStartDate(""); setEndDate(""); }}>
              Clear
            </Button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8">
          <span className="text-muted-foreground">Loading leaderboard...</span>
        </div>
      ) : (
        <GenericTable
          title="Top Referrers"
          columns={[
            "Rank",
            "Name",
            "Email",
            "Hampers",
            "SQM Sold",
            "Amount Paid",
            "Referrals",
          ]}
          rows={rows as any} // React nodes for Rank badge
        />
      )}
    </div>
  );
}
