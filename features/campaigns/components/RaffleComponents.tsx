"use client";

import React, { useState } from "react";
import { graphql } from "@/lib/gql";
import { FragmentType, useFragment } from "@/lib/gql";
import { MetricCard, ProgressCard } from "./CampaignCards";
import { GenericTable } from "./SimpleTables";
import { useCampaignPaymentPlans, useRaffleTickets } from "../hooks/use-campaigns";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { saveAs } from "file-saver";

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

      <div className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
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

export function RaffleTransactionTable() {
  const [page, setPage] = useState(1);
  const limit = 10;
  const { data, isLoading } = useCampaignPaymentPlans({ page, limit });

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

export function RaffleTicketsSection() {
  const { data, isLoading, refetch } = useRaffleTickets("ALL");
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      const res = await refetch();
      const ticketData = res.data?.data;

      if (!ticketData || ticketData.length === 0) {
        alert("No tickets available to download.");
        return;
      }

      // Simple CSV generation
      const headers = ["Name", "Email", "Phone", "Asset Name", "Ticket ID", "Total Size", "Units Purchased", "Created Date"];
      const csvContent = [
        headers.join(","),
        ...ticketData.map((row) => {
          const name = row?.user_id?.firstName ? `${row.user_id.firstName} ${row.user_id.lastName || ''}` : "-";
          const email = row?.user_id?.email || "-";
          const phone = row?.user_id?.phoneNumber || "-";
          return [
            `"${name}"`,
            `"${email}"`,
            `"${phone}"`,
            `"${row?.asset_name || "-"}"`,
            `"${row?.ticket_id || "-"}"`,
            `"${row?.total_size || "-"}"`,
            `"${row?.units_purchased || "-"}"`,
            `"${row?.created_date || "-"}"`
          ].join(",");
        })
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
      saveAs(blob, "raffle-tickets.csv");
    } catch (e) {
      console.error(e);
      alert("Failed to download tickets");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h3 className="text-lg font-semibold text-foreground">Raffle Tickets</h3>
        <p className="text-sm text-muted-foreground">Download the full list of generated raffle tickets.</p>
      </div>
      <Button className="w-full shrink-0 sm:w-auto" onClick={handleDownload} disabled={isDownloading || isLoading}>
        <Download className="mr-2 h-4 w-4" />
        {isDownloading ? "Generating..." : "Download CSV"}
      </Button>
    </div>
  );
}
