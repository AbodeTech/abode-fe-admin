"use client";

import { useMemo, useState } from "react";
import { ArrowDown, Banknote, Calendar, ChevronLeft, ChevronRight, Download, Loader2, Search, Ticket, TrendingUp, UserCheck, UserPlus, Users } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FragmentType, graphql, useFragment } from "@/lib/gql";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#82ca9d", "#e76f51"];

const formatCurrency = (value?: number | null) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(value ?? 0);

const formatDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "2-digit",
      })
    : "-";

const downloadCsv = (rows: Record<string, string | number | boolean>[], filename: string) => {
  if (!rows.length) return;

  const headers = Object.keys(rows[0]);
  const content = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = String(row[header] ?? "");
          if (value.includes(",") || value.includes('"')) return `"${value.replace(/"/g, '""')}"`;
          return value;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const AssociateProMetricsSectionDashboardFragment = graphql(`
  fragment AssociateProMetricsSection_dashboard on CampaignDashboard {
    associateProProgress {
      currentAssociatePro
      percentageComplete
      targetAssociatePro
    }
    revenueMetrics {
      totalRevenue
      revenueGoal
      percentageComplete
    }
    campaignPeriod {
      daysRemaining
      endDate
    }
    ticketMetrics {
      totalTicketsIssued
    }
    conversionMetrics {
      overallConversionRate
      userToAssociatePro {
        totalUsers
        convertedToAssociatePro
        conversionRate
      }
      associateToAssociatePro {
        totalAssociates
        convertedToAssociatePro
        conversionRate
      }
    }
    graphs {
      revenueGraph {
        chartData {
          date
          amount
        }
      }
      conversionGraph {
        userToAssociateProConversions {
          chartData {
            date
            count
          }
        }
      }
    }
  }
`);

export const AssociateProUpgradeDetailFragment = graphql(`
  fragment AssociateProUpgradeDetail on AssociateProUpgradeDetail {
    upgradeId
    userFullName
    userSince
    associateSince
    associateProSince
    referrerFullName
    amountPaid
    adminStatus
    ticketId
  }
`);

export const AssociateProTopReferrerFragment = graphql(`
  fragment AssociateProTopReferrer on TopReferrer {
    referrerId
    referrerFullName
    referrerEmail
    totalReferrals
  }
`);

export const AssociateProRevenueLeaderFragment = graphql(`
  fragment AssociateProRevenueLeader on RevenueLeader {
    referrerId
    referrerFullName
    referrerEmail
    totalRevenue
  }
`);

export const AssociateProSourceBreakdownFragment = graphql(`
  fragment AssociateProSourceBreakdown on HowYouHeardSource {
    source
    count
    percentage
  }
`);

export const AssociateProTicketHolderFragment = graphql(`
  fragment AssociateProTicketHolder on TicketDetail {
    ticketId
    ticketType
    userFullName
    userEmail
    referrerFullName
    amountPaid
    createdDate
    isActive
  }
`);

export const AssociateProReferralAnalyticsFragment = graphql(`
  fragment AssociateProReferralAnalytics on ReferralAnalytics {
    topReferrers {
      referrers {
        ...AssociateProTopReferrer
      }
    }
    revenueLeaders {
      leaders {
        ...AssociateProRevenueLeader
      }
    }
    howYouHeardBreakdown {
      totalResponses
      breakdown {
        ...AssociateProSourceBreakdown
      }
    }
  }
`);

interface AssociateProMetricsSectionProps {
  dashboard: FragmentType<typeof AssociateProMetricsSectionDashboardFragment>;
}

export function AssociateProMetricsSection({ dashboard }: AssociateProMetricsSectionProps) {
  const data = useFragment(AssociateProMetricsSectionDashboardFragment, dashboard);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Pro Signup Goal</CardTitle>
          <TrendingUp className="h-4 w-4 text-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">
            {data.associateProProgress.currentAssociatePro.toLocaleString()}
            <span className="text-sm font-normal text-muted-foreground">
              {" "}/ {data.associateProProgress.targetAssociatePro.toLocaleString()}
            </span>
          </div>
          <Progress value={data.associateProProgress.percentageComplete} className="mt-2 h-2" />
          <p className="mt-1 text-xs text-muted-foreground">{data.associateProProgress.percentageComplete.toFixed(1)}% of goal</p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
          <Banknote className="h-4 w-4 text-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{formatCurrency(data.revenueMetrics.totalRevenue)}</div>
          <Progress value={data.revenueMetrics.percentageComplete} className="mt-2 h-2" />
          <p className="mt-1 text-xs text-muted-foreground">
            {data.revenueMetrics.percentageComplete.toFixed(1)}% of {formatCurrency(data.revenueMetrics.revenueGoal)} goal
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Days Remaining</CardTitle>
          <Calendar className="h-4 w-4 text-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{data.campaignPeriod.daysRemaining}</div>
          <p className="mt-1 text-xs text-muted-foreground">Campaign ends {formatDate(data.campaignPeriod.endDate)}</p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Raffle Tickets</CardTitle>
          <Ticket className="h-4 w-4 text-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-foreground">{data.ticketMetrics.totalTicketsIssued.toLocaleString()}</div>
          <p className="mt-1 text-xs text-muted-foreground">Tickets issued to Pro members</p>
        </CardContent>
      </Card>
    </div>
  );
}

interface AssociateProConversionFunnelProps {
  dashboard: FragmentType<typeof AssociateProMetricsSectionDashboardFragment>;
}

export function AssociateProConversionFunnel({ dashboard }: AssociateProConversionFunnelProps) {
  const data = useFragment(AssociateProMetricsSectionDashboardFragment, dashboard);
  const userToPro = data.conversionMetrics.userToAssociatePro;
  const associateToPro = data.conversionMetrics.associateToAssociatePro;
  const daily = data.graphs.conversionGraph.userToAssociateProConversions.chartData;
  const maxDaily = Math.max(...daily.map((point) => point.count), 1);

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Conversion Funnels</CardTitle>
        <CardDescription>Track conversions to Associate Pro from different sources</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-lg border border-border p-4">
            <h3 className="mb-4 text-center text-sm font-medium text-muted-foreground">User to Associate Pro</h3>
            <div className="flex flex-col items-center gap-2">
              <div className="w-full max-w-[200px] rounded-lg bg-secondary p-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Users</span>
                </div>
                <p className="text-xl font-bold text-foreground">{userToPro.totalUsers.toLocaleString()}</p>
              </div>

              <div className="flex flex-col items-center">
                <ArrowDown className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">{userToPro.conversionRate.toFixed(1)}%</span>
              </div>

              <div className="w-full max-w-[160px] rounded-lg bg-primary p-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary-foreground" />
                  <span className="text-sm text-primary-foreground">Associate Pro</span>
                </div>
                <p className="text-xl font-bold text-primary-foreground">{userToPro.convertedToAssociatePro.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border p-4">
            <h3 className="mb-4 text-center text-sm font-medium text-muted-foreground">Associate to Associate Pro</h3>
            <div className="flex flex-col items-center gap-2">
              <div className="w-full max-w-[200px] rounded-lg bg-secondary p-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <UserPlus className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Associates</span>
                </div>
                <p className="text-xl font-bold text-foreground">{associateToPro.totalAssociates.toLocaleString()}</p>
              </div>

              <div className="flex flex-col items-center">
                <ArrowDown className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-foreground">{associateToPro.conversionRate.toFixed(1)}%</span>
              </div>

              <div className="w-full max-w-[160px] rounded-lg bg-primary p-3 text-center">
                <div className="flex items-center justify-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary-foreground" />
                  <span className="text-sm text-primary-foreground">Associate Pro</span>
                </div>
                <p className="text-xl font-bold text-primary-foreground">{associateToPro.convertedToAssociatePro.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="mb-4 text-sm font-medium text-muted-foreground">Daily Pro Conversions (User to Pro)</h3>
          <div className="flex h-[180px] items-end gap-1">
            {daily.slice(-10).map((point) => (
              <div key={point.date} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex w-full items-end justify-center" style={{ height: "150px" }}>
                  <div
                    className="w-4 rounded-t bg-foreground transition-all hover:opacity-80"
                    style={{
                      height: `${maxDaily > 0 ? (point.count / maxDaily) * 100 : 0}%`,
                      minHeight: point.count > 0 ? "4px" : "0px",
                    }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(point.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface AssociateProFinancialOverviewProps {
  dashboard: FragmentType<typeof AssociateProMetricsSectionDashboardFragment>;
}

export function AssociateProFinancialOverview({ dashboard }: AssociateProFinancialOverviewProps) {
  const data = useFragment(AssociateProMetricsSectionDashboardFragment, dashboard);
  const trend = data.graphs.revenueGraph.chartData;
  const max = Math.max(...trend.map((point) => point.amount), 1);

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Financial Overview</CardTitle>
        <CardDescription>Revenue collection and payment status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="mb-6 grid grid-cols-2 gap-4">
          <div className="rounded-lg bg-primary/10 p-4">
            <p className="text-sm text-muted-foreground">Collected</p>
            <p className="text-xl font-bold text-primary">{formatCurrency(data.revenueMetrics.totalRevenue)}</p>
          </div>
          <div className="rounded-lg bg-secondary p-4">
            <p className="text-sm text-muted-foreground">Goal</p>
            <p className="text-xl font-bold text-foreground">{formatCurrency(data.revenueMetrics.revenueGoal)}</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
            <span>Daily Revenue Trend</span>
            <span>{formatCurrency(max)} max</span>
          </div>
          <div className="flex h-[180px] items-end gap-2">
            {trend.slice(-10).map((point) => (
              <div key={point.date} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex w-full items-end justify-center" style={{ height: "150px" }}>
                  <div
                    className="w-full max-w-[40px] rounded-t bg-foreground transition-all hover:bg-foreground/80"
                    style={{ height: `${(point.amount / max) * 100}%` }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(point.date).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface AssociateProUpgradesTableProps {
  data: Array<FragmentType<typeof AssociateProUpgradeDetailFragment>>;
}

const statusBadge = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized === "approved" || normalized === "paid") {
    return <Badge className="border-0 bg-primary/20 text-primary hover:bg-primary/30">{status}</Badge>;
  }
  if (normalized === "pending") {
    return <Badge className="border-0 bg-muted text-muted-foreground hover:bg-muted/80">{status}</Badge>;
  }
  if (normalized === "rejected" || normalized === "failed") {
    return <Badge className="border-0 bg-destructive/20 text-destructive hover:bg-destructive/30">{status}</Badge>;
  }
  return <Badge variant="secondary">{status}</Badge>;
};

export function AssociateProUpgradesTable({ data }: AssociateProUpgradesTableProps) {
  const upgrades = useFragment(AssociateProUpgradeDetailFragment, data);

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Recent Pro Upgrades</CardTitle>
        <CardDescription>Latest members who upgraded from Associate to Pro</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="text-muted-foreground">Name</TableHead>
                <TableHead className="text-muted-foreground">User Since</TableHead>
                <TableHead className="text-muted-foreground">Associate Since</TableHead>
                <TableHead className="text-muted-foreground">Pro Since</TableHead>
                <TableHead className="text-muted-foreground">Payment</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-muted-foreground">Referrer</TableHead>
                <TableHead className="text-muted-foreground">Ticket #</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {upgrades.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="py-4 text-center text-muted-foreground">
                    No records found.
                  </TableCell>
                </TableRow>
              )}
              {upgrades.map((upgrade) => (
                <TableRow key={upgrade.upgradeId} className="border-border">
                  <TableCell className="font-medium text-foreground">{upgrade.userFullName ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(upgrade.userSince)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(upgrade.associateSince)}</TableCell>
                  <TableCell className="text-foreground">{formatDate(upgrade.associateProSince)}</TableCell>
                  <TableCell className="text-foreground">{formatCurrency(upgrade.amountPaid)}</TableCell>
                  <TableCell>{statusBadge(upgrade.adminStatus)}</TableCell>
                  <TableCell className="text-muted-foreground">{upgrade.referrerFullName ?? "-"}</TableCell>
                  <TableCell className="font-mono text-xs text-foreground">{upgrade.ticketId ?? "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

interface AssociateProTopPerformersProps {
  data: FragmentType<typeof AssociateProReferralAnalyticsFragment>;
}

export function AssociateProTopPerformers({ data }: AssociateProTopPerformersProps) {
  const referralAnalytics = useFragment(AssociateProReferralAnalyticsFragment, data);
  const topByReferrals = useFragment(AssociateProTopReferrerFragment, referralAnalytics.topReferrers.referrers);
  const topByRevenue = useFragment(AssociateProRevenueLeaderFragment, referralAnalytics.revenueLeaders.leaders);

  const [referralsPage, setReferralsPage] = useState(1);
  const [revenuePage, setRevenuePage] = useState(1);
  const ITEMS_PER_PAGE = 5;

  const referralPages = Math.ceil(topByReferrals.length / ITEMS_PER_PAGE);
  const revenuePages = Math.ceil(topByRevenue.length / ITEMS_PER_PAGE);

  const paginatedReferrals = useMemo(
    () => topByReferrals.slice((referralsPage - 1) * ITEMS_PER_PAGE, referralsPage * ITEMS_PER_PAGE),
    [topByReferrals, referralsPage]
  );
  const paginatedRevenue = useMemo(
    () => topByRevenue.slice((revenuePage - 1) * ITEMS_PER_PAGE, revenuePage * ITEMS_PER_PAGE),
    [topByRevenue, revenuePage]
  );

  const maxReferrals = topByReferrals[0]?.totalReferrals ?? 1;
  const maxRevenue = topByRevenue[0]?.totalRevenue ?? 1;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card className="bg-card border-border flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="space-y-1">
            <CardTitle className="text-foreground">Most Referrals</CardTitle>
            <CardDescription>Leaders in Associate Pro conversions</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1"
            onClick={() =>
              downloadCsv(
                topByReferrals.map((row) => ({
                  Name: row.referrerFullName ?? "-",
                  Email: row.referrerEmail ?? "-",
                  "Total Referrals": row.totalReferrals,
                })),
                `top_referrers_${new Date().toISOString().slice(0, 10)}.csv`
              )
            }
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-between">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-[50%] text-muted-foreground">Name</TableHead>
                <TableHead className="text-right text-muted-foreground">Conversions</TableHead>
                <TableHead className="text-right text-muted-foreground">Performance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedReferrals.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="py-4 text-center text-muted-foreground">
                    No data available
                  </TableCell>
                </TableRow>
              )}
              {paginatedReferrals.map((row) => (
                <TableRow key={row.referrerId} className="border-border">
                  <TableCell className="py-3 font-medium text-foreground">
                    <div className="flex flex-col">
                      <span>{row.referrerFullName ?? "-"}</span>
                      <span className="text-xs text-muted-foreground">{row.referrerEmail ?? "-"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold text-foreground">{row.totalReferrals}</TableCell>
                  <TableCell className="text-right">
                    <Progress value={(row.totalReferrals / maxReferrals) * 100} className="ml-auto h-2 w-[60px]" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {referralPages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setReferralsPage((page) => Math.max(1, page - 1))} disabled={referralsPage === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-xs text-muted-foreground">Page {referralsPage} of {referralPages}</div>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setReferralsPage((page) => Math.min(referralPages, page + 1))} disabled={referralsPage === referralPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border-border flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="space-y-1">
            <CardTitle className="text-foreground">Revenue Leaders</CardTitle>
            <CardDescription>Top revenue generated from direct referrals</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1"
            onClick={() =>
              downloadCsv(
                topByRevenue.map((row) => ({
                  Name: row.referrerFullName ?? "-",
                  Email: row.referrerEmail ?? "-",
                  "Total Revenue": formatCurrency(row.totalRevenue),
                })),
                `revenue_leaders_${new Date().toISOString().slice(0, 10)}.csv`
              )
            }
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col justify-between">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="w-[50%] text-muted-foreground">Name</TableHead>
                <TableHead className="text-right text-muted-foreground">Revenue</TableHead>
                <TableHead className="text-right text-muted-foreground">Share</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedRevenue.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="py-4 text-center text-muted-foreground">
                    No data available
                  </TableCell>
                </TableRow>
              )}
              {paginatedRevenue.map((row) => (
                <TableRow key={row.referrerId} className="border-border">
                  <TableCell className="py-3 font-medium text-foreground">
                    <div className="flex flex-col">
                      <span>{row.referrerFullName ?? "-"}</span>
                      <span className="text-xs text-muted-foreground">{row.referrerEmail ?? "-"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-bold text-foreground">{formatCurrency(row.totalRevenue)}</TableCell>
                  <TableCell className="text-right">
                    <Progress value={(row.totalRevenue / maxRevenue) * 100} className="ml-auto h-2 w-[60px]" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {revenuePages > 1 && (
            <div className="flex items-center justify-end space-x-2 py-4">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setRevenuePage((page) => Math.max(1, page - 1))} disabled={revenuePage === 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-xs text-muted-foreground">Page {revenuePage} of {revenuePages}</div>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setRevenuePage((page) => Math.min(revenuePages, page + 1))} disabled={revenuePage === revenuePages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface AssociateProSourceAnalyticsProps {
  data: FragmentType<typeof AssociateProReferralAnalyticsFragment>;
}

export function AssociateProSourceAnalytics({ data }: AssociateProSourceAnalyticsProps) {
  const referralAnalytics = useFragment(AssociateProReferralAnalyticsFragment, data);
  const rows = useFragment(AssociateProSourceBreakdownFragment, referralAnalytics.howYouHeardBreakdown.breakdown);
  const chartData = rows.map((item) => ({
    name: item.source,
    value: item.count,
    percentage: Number(item.percentage),
  }));
  const totalResponses = referralAnalytics.howYouHeardBreakdown.totalResponses;

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Source Analytics</CardTitle>
        <CardDescription>Breakdown of where Associate Pros heard about us</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-between gap-8 lg:flex-row">
          <div className="flex h-[300px] w-full items-center justify-center lg:w-1/2">
            {chartData.length > 0 ? (
              <div className="relative flex h-[220px] w-[220px] items-center justify-center">
                <div
                  className="h-full w-full rounded-full"
                  style={{
                    background: `conic-gradient(${chartData
                      .reduce<{ stops: string[]; cum: number }>(
                        (acc, item) => {
                          const start = acc.cum;
                          const end = start + item.percentage;
                          acc.stops.push(
                            `${COLORS[acc.stops.length % COLORS.length]} ${start.toFixed(1)}% ${end.toFixed(1)}%`
                          );
                          acc.cum = end;
                          return acc;
                        },
                        { stops: [], cum: 0 }
                      )
                      .stops.join(", ")})`,
                  }}
                />
                <div className="absolute h-[140px] w-[140px] rounded-full bg-card" />
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-bold text-foreground">{totalResponses}</span>
                  <span className="text-xs text-muted-foreground">responses</span>
                </div>
              </div>
            ) : (
              <div className="flex h-[220px] w-[220px] items-center justify-center rounded-full border-2 border-dashed border-border">
                <span className="text-sm text-muted-foreground">No data</span>
              </div>
            )}
          </div>

          <div className="w-full space-y-6 lg:w-1/2">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border border-border p-4 text-center">
                <p className="text-sm text-muted-foreground">Total Responses</p>
                <p className="text-2xl font-bold text-foreground">{totalResponses}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">Signup Breakdown</h4>
              <div className="space-y-3">
                {chartData.map((item, index) => (
                  <div key={`${item.name}-${index}`} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-foreground">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold text-foreground">{item.value}</span>
                        <span className="w-12 text-right text-muted-foreground">{item.percentage.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-secondary">
                      <div
                        className="h-1.5 rounded-full"
                        style={{ width: `${item.percentage}%`, backgroundColor: COLORS[index % COLORS.length] }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export const AssociateProRecruitmentUserFragment = graphql(`
  fragment AssociateProRecruitmentUser on FilteredUserAdminDetail {
    _id
    firstName
    lastName
    email
    createdAt
    referral {
      firstName
      lastName
      email
    }
  }
`);

type RecruitmentStatus = "total" | "associate-pro" | "associate";

const RECRUITMENT_STATUS_LABELS: Record<RecruitmentStatus, string> = {
  total: "Total",
  "associate-pro": "Associate Pro",
  associate: "Associate",
};

interface AssociateProRecruitmentTableProps {
  data: Array<FragmentType<typeof AssociateProRecruitmentUserFragment>>;
  count?: number | null;
  page: number;
  limit: number;
  onPageChange: (page: number) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  status: RecruitmentStatus;
  onStatusChange: (status: RecruitmentStatus) => void;
  isLoading?: boolean;
}

export function AssociateProRecruitmentTable({
  data,
  count,
  page,
  limit,
  onPageChange,
  searchQuery,
  onSearchChange,
  status,
  onStatusChange,
  isLoading,
}: AssociateProRecruitmentTableProps) {
  const users = useFragment(AssociateProRecruitmentUserFragment, data);
  const totalPages = Math.ceil((count ?? 0) / limit);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
          <CardTitle className="text-foreground">Associate Recruitment Leaders</CardTitle>
          <CardDescription>Users with active referrals in the campaign</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-8 gap-1"
            disabled={users.length === 0}
            onClick={() =>
              downloadCsv(
                users.map((u) => ({
                  Name: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() || "-",
                  Email: u.email ?? "-",
                  "Joined Date": formatDate(u.createdAt),
                  "Referrer Name": u.referral
                    ? `${u.referral.firstName} ${u.referral.lastName}`.trim()
                    : "-",
                  "Referrer Email": u.referral?.email ?? "-",
                })),
                `recruitment_leaders_${new Date().toISOString().slice(0, 10)}.csv`
              )
            }
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={status} onValueChange={(v) => onStatusChange(v as RecruitmentStatus)}>
          <TabsList>
            {(Object.keys(RECRUITMENT_STATUS_LABELS) as RecruitmentStatus[]).map((key) => (
              <TabsTrigger key={key} value={key}>
                {RECRUITMENT_STATUS_LABELS[key]}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-8"
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading…
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="text-muted-foreground">Name</TableHead>
                  <TableHead className="text-muted-foreground">Email</TableHead>
                  <TableHead className="text-muted-foreground">Joined</TableHead>
                  <TableHead className="text-muted-foreground">Referrer</TableHead>
                  <TableHead className="text-muted-foreground">Referrer Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="py-4 text-center text-muted-foreground">
                      No records found.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user, idx) => (
                    <TableRow key={user._id ?? idx} className="border-border">
                      <TableCell className="font-medium text-foreground">
                        {`${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.email ?? "-"}</TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(user.createdAt)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {user.referral
                          ? `${user.referral.firstName} ${user.referral.lastName}`.trim()
                          : "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{user.referral?.email ?? "-"}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-end space-x-2 pt-2">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="text-xs text-muted-foreground">
              Page {page} of {totalPages}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface AssociateProExportPanelProps {
  upgrades: Array<FragmentType<typeof AssociateProUpgradeDetailFragment>>;
  tickets: Array<FragmentType<typeof AssociateProTicketHolderFragment>>;
}

export function AssociateProExportPanel({ upgrades, tickets }: AssociateProExportPanelProps) {
  const upgradeRows = useFragment(AssociateProUpgradeDetailFragment, upgrades);
  const ticketRows = useFragment(AssociateProTicketHolderFragment, tickets);

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <CardTitle className="text-foreground">Export Data</CardTitle>
        <CardDescription>Download lists for outreach and reporting</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Button variant="outline" className="h-24 cursor-not-allowed flex-col gap-2 opacity-50" disabled>
            <Users className="h-6 w-6" />
            <span>Users Only (Not converted)</span>
          </Button>

          <Button variant="outline" className="h-24 cursor-not-allowed flex-col gap-2 opacity-50" disabled>
            <UserPlus className="h-6 w-6" />
            <span>Associates (Not Pro)</span>
          </Button>

          <Button
            variant="outline"
            className="h-24 flex-col gap-2 hover:border-primary hover:text-primary"
            onClick={() =>
              downloadCsv(
                upgradeRows.map((row) => ({
                  "Full Name": row.userFullName ?? "-",
                  "User Since": formatDate(row.userSince),
                  "Associate Since": formatDate(row.associateSince),
                  "Pro Since": formatDate(row.associateProSince),
                  Referrer: row.referrerFullName ?? "-",
                  "Amount Paid": formatCurrency(row.amountPaid),
                  Status: row.adminStatus,
                  "Ticket ID": row.ticketId ?? "-",
                })),
                `pro_members_${new Date().toISOString().slice(0, 10)}.csv`
              )
            }
            disabled={upgradeRows.length === 0}
          >
            <UserCheck className="h-6 w-6" />
            <span>Export Pro Members</span>
          </Button>

          <Button
            variant="outline"
            className="h-24 flex-col gap-2 hover:border-primary hover:text-primary"
            onClick={() =>
              downloadCsv(
                ticketRows.map((row) => ({
                  "Ticket ID": row.ticketId,
                  "Ticket Type": row.ticketType,
                  "User Name": row.userFullName ?? "-",
                  "User Email": row.userEmail ?? "-",
                  Referrer: row.referrerFullName ?? "-",
                  "Amount Paid": formatCurrency(row.amountPaid),
                  "Date Issued": formatDate(row.createdDate),
                  "Is Active": row.isActive ? "Yes" : "No",
                })),
                `raffle_entries_${new Date().toISOString().slice(0, 10)}.csv`
              )
            }
            disabled={ticketRows.length === 0}
          >
            <Ticket className="h-6 w-6" />
            <span>Export Raffle Entries</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
