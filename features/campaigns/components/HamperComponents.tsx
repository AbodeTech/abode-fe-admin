"use client";

import React from "react";
import { graphql } from "@/lib/gql";
import { FragmentType, useFragment } from "@/lib/gql";
import { MetricCard, ProgressCard } from "./CampaignCards";
import { GenericTable } from "./SimpleTables";

// --- Fragments ---

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
    referrerEmail
    referrerName
    referrerStatus
    totalHampers
  }
`);

// --- Components ---

const currency = (value?: number | null) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value || 0);

export function HamperMetricsSection({
  salesData,
  financialData,
}: {
  salesData?: any;
  financialData?: any;
}) {
  const sales = useFragment(HamperSalesMetricsFragment as any, salesData) as any;
  const financial = useFragment(HamperFinancialMetricsFragment as any, financialData) as any;

  return (
    <div className="space-y-6">
      <ProgressCard
        title="Land Sales Progress"
        sold={sales?.totalSqmSold}
        target={sales?.targetSqm}
        percentage={sales?.percentageSold}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Revenue" value={currency(financial?.totalRevenueGenerated)} />
        <MetricCard title="Asset Value Sold" value={currency(financial?.totalAssetValueSold)} />
        <MetricCard title="Avg Payment Plan" value={currency(financial?.averagePaymentPerPlan)} />
        <MetricCard title="Balance Outstanding" value={currency(financial?.totalBalance)} />
      </div>
    </div>
  );
}

export function HamperAssetTable({
  data,
}: {
  data?: any;
}) {
  const rowsRaw = data || [];
  const rows = rowsRaw.map((r: any) => useFragment(HamperAssetBreakdownFragment as any, r) as any).filter((r: any) => r !== null && r !== undefined);

  return (
    <GenericTable
      title="Asset Breakdown"
      columns={["Asset", "SQM Sold", "Hampers", "% of Total"]}
      rows={rows.map((row: any) => [
        row.assetName || "-",
        Number(row.totalSqmSold || 0).toLocaleString(),
        Number(row.totalHampers || 0).toLocaleString(),
        `${Number(row.percentageOfTotal || 0).toFixed(1)}%`,
      ])}
    />
  );
}

export function HamperReferrersTable({
  data,
}: {
  data?: any;
}) {
  const rowsRaw = data || [];
  const rows = rowsRaw.map((r: any) => useFragment(HamperReferrerFragment as any, r) as any).filter((r: any) => r !== null && r !== undefined);

  return (
    <GenericTable
      title="Referrers With Hampers"
      columns={["Name", "Email", "Status", "Total Hampers"]}
      rows={rows.map((row: any) => [
        row.referrerName || "-",
        row.referrerEmail || "-",
        row.referrerStatus || "-",
        Number(row.totalHampers || 0).toLocaleString(),
      ])}
    />
  );
}
