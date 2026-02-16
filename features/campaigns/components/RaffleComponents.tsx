"use client";

import React from "react";
import { graphql } from "@/lib/gql";
import { FragmentType, useFragment } from "@/lib/gql";
import { MetricCard, ProgressCard } from "./CampaignCards";
import { GenericTable } from "./SimpleTables";

// --- Fragments ---

export const RaffleSalesMetricsFragment = graphql(`
  fragment RaffleSalesMetrics on SalesMetrics {
    dailySqmTargetRemaining
    percentageSold
    sqmRemainingToSell
    targetSqm
    totalSqmSold
  }
`);

export const RaffleFinancialMetricsFragment = graphql(`
  fragment RaffleFinancialMetrics on FinancialMetrics {
    totalRevenueGenerated
    totalAssetValueSold
    averagePaymentPerPlan
    totalBalance
  }
`);

export const RaffleAssetBreakdownFragment = graphql(`
  fragment RaffleAssetBreakdown on AssetBreakdown {
    assetName
    percentageOfTotal
    totalSqmSold
    totalTickets
  }
`);

export const RaffleUserTicketFragment = graphql(`
  fragment RaffleUserTicket on UserWithTicket {
    email
    name
    ticketId
  }
`);

// --- Components ---

const currency = (value?: number | null) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value || 0);

export function RaffleMetricsSection({
  salesData,
  financialData,
}: {
  salesData?: FragmentType<typeof RaffleSalesMetricsFragment> | null;
  financialData?: FragmentType<typeof RaffleFinancialMetricsFragment> | null;
}) {
  const sales = useFragment(RaffleSalesMetricsFragment, salesData);
  const financial = useFragment(RaffleFinancialMetricsFragment, financialData);

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

export function RaffleAssetTable({
  data,
}: {
  data?: (FragmentType<typeof RaffleAssetBreakdownFragment> | null)[] | null;
}) {
  const rowsRaw = data || [];
  const rows = rowsRaw.map((r) => useFragment(RaffleAssetBreakdownFragment, r)).filter((r): r is NonNullable<typeof r> => r !== null && r !== undefined);

  return (
    <GenericTable
      title="Asset Breakdown"
      columns={["Asset", "SQM Sold", "Tickets", "% of Total"]}
      rows={rows.map((row) => [
        row.assetName || "-",
        Number(row.totalSqmSold || 0).toLocaleString(),
        Number(row.totalTickets || 0).toLocaleString(),
        `${Number(row.percentageOfTotal || 0).toFixed(1)}%`,
      ])}
    />
  );
}

export function RaffleUsersTable({
  data,
}: {
  data?: (FragmentType<typeof RaffleUserTicketFragment> | null)[] | null;
}) {
  const rowsRaw = data || [];
  const rows = rowsRaw.map((r) => useFragment(RaffleUserTicketFragment, r)).filter((r): r is NonNullable<typeof r> => r !== null && r !== undefined);

  return (
    <GenericTable
      title="Users With Tickets"
      columns={["Name", "Email", "Ticket ID"]}
      rows={rows.map((row) => [
        row.name || "-",
        row.email || "-",
        row.ticketId || "-",
      ])}
    />
  );
}
