"use client";

import React from "react";
import { graphql } from "@/lib/gql";
import { FragmentType, useFragment } from "@/lib/gql";
import { MetricCard, ProgressCard } from "./CampaignCards";
import { GenericTable } from "./SimpleTables";

// --- Fragments ---

export const AssociateProProgressFragment = graphql(`
  fragment AssociateProProgress on AssociateProProgress {
    currentAssociatePro
    percentageComplete
    targetAssociatePro
  }
`);

export const AssociateProRevenueMetricsFragment = graphql(`
  fragment AssociateProRevenueMetrics on RevenueMetrics {
    totalRevenue
    growthRate
  }
`);

export const AssociateProTicketMetricsFragment = graphql(`
  fragment AssociateProTicketMetrics on TicketMetrics {
    totalTicketsIssued
  }
`);

export const AssociateProConversionMetricsFragment = graphql(`
  fragment AssociateProConversionMetrics on ConversionMetrics {
    overallConversionRate
  }
`);

export const AssociateProUpgradeDetailFragment = graphql(`
  fragment AssociateProUpgradeDetail on AssociateProUpgradeDetail {
    userFullName
    referrerFullName
    amountPaid
    adminStatus
    ticketId
  }
`);

export const AssociateProTopReferrerFragment = graphql(`
  fragment AssociateProTopReferrer on TopReferrer {
    rank
    fullName
    totalReferrals
  }
`);


// --- Components ---

const currency = (value?: number | null) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value || 0);

export function AssociateProMetricsSection({
  progressData,
  revenueData,
  ticketData,
  conversionData,
}: {
  progressData?: any;
  revenueData?: any;
  ticketData?: any;
  conversionData?: any;
}) {
  const progress = useFragment(AssociateProProgressFragment as any, progressData) as any;
  const revenue = useFragment(AssociateProRevenueMetricsFragment as any, revenueData) as any;
  const ticket = useFragment(AssociateProTicketMetricsFragment as any, ticketData) as any;
  const conversion = useFragment(AssociateProConversionMetricsFragment as any, conversionData) as any;

  return (
    <div className="space-y-6">
      <ProgressCard
        title="Associate Pro Progress"
        sold={progress?.currentAssociatePro}
        target={progress?.targetAssociatePro}
        percentage={progress?.percentageComplete}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Total Revenue" value={currency(revenue?.totalRevenue)} />
        <MetricCard
          title="Revenue Growth"
          value={`${Number(revenue?.growthRate || 0).toFixed(1)}%`}
        />
        <MetricCard
          title="Total Tickets"
          value={Number(ticket?.totalTicketsIssued || 0).toLocaleString()}
        />
        <MetricCard
          title="Overall Conversion"
          value={`${Number(conversion?.overallConversionRate || 0).toFixed(1)}%`}
        />
      </div>
    </div>
  );
}

export function AssociateProUpgradesTable({
  data,
}: {
  data?: any;
}) {
  const rowsRaw = data || [];
  const rows = rowsRaw.map((r: any) => useFragment(AssociateProUpgradeDetailFragment as any, r) as any).filter((r: any) => r !== null && r !== undefined);

  return (
    <GenericTable
      title="Recent Upgrades"
      columns={["User", "Referrer", "Amount Paid", "Status", "Ticket"]}
      rows={rows.map((u: any) => [
        u.userFullName || "-",
        u.referrerFullName || "-",
        currency(u.amountPaid),
        u.adminStatus || "-",
        u.ticketId || "-",
      ])}
    />
  );
}

export function AssociateProTopReferrersTable({
  data,
}: {
  data?: any;
}) {
  const rowsRaw = data || [];
  const rows = rowsRaw.map((r: any) => useFragment(AssociateProTopReferrerFragment as any, r) as any).filter((r: any) => r !== null && r !== undefined);

  return (
    <GenericTable
      title="Top Referrers"
      columns={["Rank", "Name", "Total Referrals"]}
      rows={rows.map((r: any) => [
        r.rank || "-",
        r.fullName || "-",
        Number(r.totalReferrals || 0).toLocaleString(),
      ])}
    />
  );
}
