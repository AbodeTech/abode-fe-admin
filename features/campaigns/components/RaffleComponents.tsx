"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { graphql } from "@/lib/gql";
import { FragmentType, useFragment } from "@/lib/gql";
import { useCampaignPaymentPlans, useRaffleTickets } from "../hooks/use-campaigns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  AdminDesktopTableWrap,
  AdminMobileCard,
  AdminMobileField,
  AdminMobileStack,
} from "@/components/shared/admin-responsive-table";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, CalendarDays, ChevronLeft, ChevronRight, Download, Landmark, Banknote, Target, Ticket, UserPlus, Users, Wallet } from "lucide-react";
import { saveAs } from "file-saver";
import { cn } from "@/lib/utils";

const TOTAL_PLOTS = 1000;

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

export const RafflePromoDetailsFragment = graphql(`
  fragment RafflePromoDetails on PromoDetails {
    daysElapsed
    daysRemaining
    endDate
    percentageDaysRemaining
    totalPromoDays
  }
`);

export const RaffleTicketMetricsFragment = graphql(`
  fragment RaffleTicketMetrics on TicketMetrics {
    totalTicketsIssued
    regularUsersWithTickets
    associatesWithTickets
    userTicketPercentage
    associatePercentage
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

// --- Helpers ---

const currency = (value?: number | null) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value || 0);

const sqm = (value?: number | null) => `${Number(value || 0).toLocaleString()} sqm`;

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

// --- KPI primitives ---

function StatCard({
  icon: Icon,
  title,
  value,
  note,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  value: React.ReactNode;
  note?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <Card className="min-w-0 overflow-hidden border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="min-w-0 wrap-break-word text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      </CardHeader>
      <CardContent className="min-w-0">
        <div className="min-w-0 max-w-full break-all text-xl font-bold tabular-nums text-foreground sm:text-2xl">{value}</div>
        {note ? <p className="mt-1 text-xs text-muted-foreground">{note}</p> : null}
        {children}
      </CardContent>
    </Card>
  );
}

// --- Land progress (grid-pattern visual + milestones) ---

function LandProgressCard({ sold, target, percentage }: { sold?: number | null; target?: number | null; percentage?: number | null }) {
  const pct = Math.max(0, Math.min(100, Number(percentage || 0)));
  const targetValue = Number(target || 0);

  return (
    <Card className="min-w-0 overflow-hidden border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-foreground">Total Land Sold</CardTitle>
        <p className="text-sm text-muted-foreground">
          {Number(sold || 0).toLocaleString()} sqm of {targetValue.toLocaleString()} sqm target
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div
          className="relative h-24 w-full overflow-hidden rounded-lg border border-border bg-secondary/40"
          style={{
            backgroundImage:
              "linear-gradient(to right, color-mix(in srgb, var(--border) 60%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in srgb, var(--border) 60%, transparent) 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        >
          <div
            className="absolute inset-y-0 left-0 bg-primary/85 transition-all duration-1000 ease-in-out"
            style={{ width: `${pct}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-md bg-card/80 px-2 py-0.5 text-lg font-bold text-foreground backdrop-blur-sm">
              {pct.toFixed(1)}%
            </span>
          </div>
        </div>
        <Progress value={pct} className="h-2" />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0 sqm</span>
          <span>{(targetValue / 2).toLocaleString()} sqm</span>
          <span>{targetValue.toLocaleString()} sqm</span>
        </div>
      </CardContent>
    </Card>
  );
}

// --- Metrics section (progress + 6 KPI cards) ---

export function RaffleMetricsSection({
  salesData,
  financialData,
  promoData,
}: {
  salesData?: FragmentType<typeof RaffleSalesMetricsFragment> | null;
  financialData?: FragmentType<typeof RaffleFinancialMetricsFragment> | null;
  promoData?: FragmentType<typeof RafflePromoDetailsFragment> | null;
}) {
  const sales = useFragment(RaffleSalesMetricsFragment, salesData);
  const financial = useFragment(RaffleFinancialMetricsFragment, financialData);
  const promo = useFragment(RafflePromoDetailsFragment, promoData);

  const pctSold = Number(sales?.percentageSold || 0);
  const plotsSold = Math.round((pctSold / 100) * TOTAL_PLOTS);
  const plotsRemaining = Math.max(0, TOTAL_PLOTS - plotsSold);
  const totalSqmSold = Number(sales?.totalSqmSold || 0);
  const avgPerSqm = totalSqmSold > 0 ? Number(financial?.totalAssetValueSold || 0) / totalSqmSold : 0;

  const daysRemaining = promo?.daysRemaining ?? null;
  const daysElapsed = Number(promo?.daysElapsed || 0);
  const totalPromoDays = Number(promo?.totalPromoDays || 0);
  const elapsedPct = totalPromoDays > 0 ? Math.min(100, (daysElapsed / totalPromoDays) * 100) : 0;

  return (
    <div className="space-y-6">
      <LandProgressCard sold={sales?.totalSqmSold} target={sales?.targetSqm} percentage={sales?.percentageSold} />

      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          icon={CalendarDays}
          title="Days Remaining"
          value={daysRemaining ?? "—"}
          note={promo ? `${Number(promo.percentageDaysRemaining || 0).toFixed(1)}% of campaign period left` : undefined}
        >
          {promo ? <Progress value={elapsedPct} className="mt-3 h-1.5" /> : null}
        </StatCard>

        <StatCard
          icon={Landmark}
          title="Total Asset Value"
          value={currency(financial?.totalAssetValueSold)}
          note={`${currency(avgPerSqm)} per sqm average`}
        />

        <StatCard icon={Banknote} title="Total Revenue" value={currency(financial?.totalRevenueGenerated)} />

        <StatCard
          icon={Wallet}
          title="Total Balance"
          value={currency(financial?.totalBalance)}
          note="Outstanding across payment plans"
        />

        <StatCard
          icon={BarChart3}
          title="Plots Sold"
          value={`${plotsSold.toLocaleString()} / ${TOTAL_PLOTS.toLocaleString()}`}
          note={`${plotsRemaining.toLocaleString()} plots remaining`}
        />

        <StatCard
          icon={Target}
          title="Daily Sales Required"
          value={sqm(sales?.dailySqmTargetRemaining)}
          note="To reach target in remaining days"
        />
      </div>
    </div>
  );
}

// --- Asset breakdown visual map ---

export function RaffleAssetMap({
  data,
}: {
  data?: (FragmentType<typeof RaffleAssetBreakdownFragment> | null)[] | null;
}) {
  const safe = (data ?? []).filter((x): x is NonNullable<typeof x> => x != null);
  const rows = useFragment(RaffleAssetBreakdownFragment, safe);
  const sorted = [...rows].sort((a, b) => Number(b.totalSqmSold || 0) - Number(a.totalSqmSold || 0));

  return (
    <Card className="min-w-0 overflow-hidden border-border bg-card">
      <CardHeader>
        <CardTitle className="text-foreground">Land Plot Sales</CardTitle>
        <p className="text-sm text-muted-foreground">
          {sorted.length > 0 ? "Distribution of sold plots across assets" : "No asset data available"}
        </p>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No records found.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {sorted.map((asset, index) => {
                // Shade by rank: top asset darkest, fading down.
                const opacity = Math.max(0.4, 1 - index * 0.12);
                return (
                  <div
                    key={`${asset.assetName}-${index}`}
                    className="relative overflow-hidden rounded-lg border border-border p-4 text-primary-foreground transition-transform hover:scale-[1.02]"
                    style={{ backgroundColor: `color-mix(in srgb, var(--primary) ${Math.round(opacity * 100)}%, var(--card))` }}
                  >
                    <div
                      className="pointer-events-none absolute inset-0 opacity-20"
                      style={{
                        backgroundImage: "radial-gradient(currentColor 1px, transparent 1px)",
                        backgroundSize: "12px 12px",
                      }}
                    />
                    <div className="relative">
                      <span className="text-xs font-semibold">{Number(asset.percentageOfTotal || 0).toFixed(1)}%</span>
                      <p className="mt-6 wrap-break-word text-lg font-bold">{asset.assetName || "-"}</p>
                      <p className="text-sm opacity-90">{sqm(asset.totalSqmSold)}</p>
                      <p className="text-xs opacity-75">{Number(asset.totalTickets || 0).toLocaleString()} tickets issued</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: "color-mix(in srgb, var(--primary) 100%, var(--card))" }} />
                Highest sales
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: "color-mix(in srgb, var(--primary) 60%, var(--card))" }} />
                Medium
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: "color-mix(in srgb, var(--primary) 40%, var(--card))" }} />
                Lower sales
              </span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// --- Campaign transactions (clickable rows + numbered pagination) ---

const TXN_COLUMNS = [
  "Name",
  "Email",
  "Asset",
  "Size",
  "Unit",
  "Months",
  "Land Price",
  "Land Paid",
  "Doc Price",
  "Doc Paid",
  "Next Payment",
];

function buildPageList(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  if (start > 2) pages.push("...");
  for (let p = start; p <= end; p++) pages.push(p);
  if (end < total - 1) pages.push("...");
  pages.push(total);
  return pages;
}

export function RaffleTransactionTable() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const limit = 10;
  const { data, isLoading } = useCampaignPaymentPlans({ page, limit });

  const txns = (data?.data ?? []).filter((row): row is NonNullable<typeof row> => row != null);
  const totalPages = typeof data?.count === "number" ? Math.ceil(data.count / limit) : 1;

  const goToUser = (userId?: string | null) => {
    if (userId) router.push(`/users/${userId}`);
  };

  return (
    <Card className="min-w-0 overflow-hidden border-border bg-card">
      <CardHeader>
        <CardTitle className="text-foreground">Campaign Transactions</CardTitle>
        <p className="text-sm text-muted-foreground">Land sales payment plans for this campaign</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Loading transactions…</p>
        ) : txns.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No transaction data available.</p>
        ) : (
          <>
            <AdminMobileStack className="px-0.5">
              {txns.map((row, idx) => (
                <AdminMobileCard
                  key={row.userId ?? idx}
                  title={row.name || "-"}
                  subtitle={row.email || undefined}
                  onClick={() => goToUser(row.userId)}
                >
                  <AdminMobileField label="Asset" value={row.assetName || "-"} />
                  <AdminMobileField label="Size" value={`${row.size ?? "-"} ${row.unit ?? ""}`.trim()} />
                  <AdminMobileField label="Months" value={row.monthsOfSubscription ?? "-"} />
                  <AdminMobileField label="Land Price" value={currency(row.landPrice)} />
                  <AdminMobileField label="Land Paid" value={currency(row.landAmountPaid)} />
                  <AdminMobileField label="Doc Price" value={currency(row.documentPrice)} />
                  <AdminMobileField label="Doc Paid" value={currency(row.documentAmountPaid)} />
                  <AdminMobileField label="Next Payment" value={formatDate(row.nextDateOfPayment)} />
                </AdminMobileCard>
              ))}
            </AdminMobileStack>
            <AdminDesktopTableWrap>
              <div className="min-w-0 overflow-x-auto">
                <Table className="min-w-[1100px]">
                  <TableHeader>
                    <TableRow className="border-border hover:bg-transparent">
                      {TXN_COLUMNS.map((col) => (
                        <TableHead key={col} className="whitespace-nowrap text-muted-foreground">
                          {col}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {txns.map((row, idx) => (
                      <TableRow
                        key={row.userId ?? idx}
                        className="cursor-pointer border-border hover:bg-muted/50"
                        onClick={() => goToUser(row.userId)}
                      >
                        <TableCell className="font-medium text-foreground">{row.name || "-"}</TableCell>
                        <TableCell className="text-muted-foreground">{row.email || "-"}</TableCell>
                        <TableCell className="text-muted-foreground">{row.assetName || "-"}</TableCell>
                        <TableCell className="text-muted-foreground">{row.size ?? "-"}</TableCell>
                        <TableCell className="text-muted-foreground">{row.unit ?? "-"}</TableCell>
                        <TableCell className="text-muted-foreground">{row.monthsOfSubscription ?? "-"}</TableCell>
                        <TableCell className="text-foreground">{currency(row.landPrice)}</TableCell>
                        <TableCell className="text-foreground">{currency(row.landAmountPaid)}</TableCell>
                        <TableCell className="text-foreground">{currency(row.documentPrice)}</TableCell>
                        <TableCell className="text-foreground">{currency(row.documentAmountPaid)}</TableCell>
                        <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(row.nextDateOfPayment)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </AdminDesktopTableWrap>

            {totalPages > 1 && (
              <div className="flex flex-wrap items-center justify-center gap-1 pt-2 sm:justify-end">
                <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {buildPageList(page, totalPages).map((p, i) =>
                  p === "..." ? (
                    <span key={`gap-${i}`} className="px-2 text-xs text-muted-foreground">
                      …
                    </span>
                  ) : (
                    <Button
                      key={p}
                      variant={p === page ? "default" : "outline"}
                      size="icon"
                      className="h-8 w-8 shrink-0 text-xs"
                      onClick={() => setPage(p)}
                    >
                      {p}
                    </Button>
                  )
                )}
                <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// --- Ticket KPI cards ---

export function RaffleTicketMetricsCards({
  data,
}: {
  data?: FragmentType<typeof RaffleTicketMetricsFragment> | null;
}) {
  const metrics = useFragment(RaffleTicketMetricsFragment, data);

  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        icon={Ticket}
        title="Total Tickets Issued"
        value={Number(metrics?.totalTicketsIssued || 0).toLocaleString()}
        note="Distributed across all holders"
      />
      <StatCard
        icon={Users}
        title="Regular Users with Tickets"
        value={Number(metrics?.regularUsersWithTickets || 0).toLocaleString()}
        note={`${Number(metrics?.userTicketPercentage || 0).toFixed(1)}% of all ticket holders`}
      />
      <StatCard
        icon={UserPlus}
        title="Associates with Tickets"
        value={Number(metrics?.associatesWithTickets || 0).toLocaleString()}
        note={`${Number(metrics?.associatePercentage || 0).toFixed(1)}% of all ticket holders`}
      />
    </div>
  );
}

// --- Recent raffle tickets (activity-style list) ---

export function RaffleRecentTickets({
  data,
}: {
  data?: (FragmentType<typeof RaffleUserTicketFragment> | null)[] | null;
}) {
  const safe = (data ?? []).filter((x): x is NonNullable<typeof x> => x != null);
  const tickets = useFragment(RaffleUserTicketFragment, safe);

  return (
    <Card className="min-w-0 overflow-hidden border-border bg-card">
      <CardHeader>
        <CardTitle className="text-foreground">Recent Raffle Tickets</CardTitle>
        <p className="text-sm text-muted-foreground">
          {tickets.length > 0 ? "Latest ticket distributions to customers" : "No recent ticket distributions"}
        </p>
      </CardHeader>
      <CardContent>
        {tickets.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No ticket data available.</p>
        ) : (
          <div className="space-y-2">
            {tickets.map((ticket, idx) => (
              <div
                key={ticket.ticketId ?? idx}
                className="flex min-w-0 flex-col gap-1 rounded-lg border border-border p-3 transition-colors hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
              >
                <p className="min-w-0 wrap-break-word text-sm text-foreground">
                  <span className="font-medium">{ticket.name || "-"}</span>{" "}
                  <span className="text-muted-foreground">({ticket.email || "-"})</span> received a raffle ticket
                </p>
                <span className={cn("shrink-0 rounded bg-muted px-2 py-1 font-mono text-xs text-foreground")}>
                  #{ticket.ticketId || "-"}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// --- Tickets download bar ---

export function RaffleTicketsSection() {
  const { isLoading, refetch } = useRaffleTickets("ALL");
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
