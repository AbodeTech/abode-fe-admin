"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { useAssociateProCampaign, useAssociateRecruitmentAnalytics } from "@/features/campaigns/hooks/use-campaigns";
import {
  AssociateProConversionFunnel,
  AssociateProExportPanel,
  AssociateProFinancialOverview,
  AssociateProMetricsSection,
  AssociateProRecruitmentTable,
  AssociateProSourceAnalytics,
  AssociateProTopPerformers,
  AssociateProUpgradesTable,
} from "@/features/campaigns/components/AssociateProComponents";

const RECRUITMENT_LIMIT = 10;

type RecruitmentStatus = "total" | "associate-pro" | "associate";

export default function Campaign2000AssociateProPage() {
  const [recruitmentPage, setRecruitmentPage] = useState(1);
  const [recruitmentSearch, setRecruitmentSearch] = useState("");
  const [recruitmentStatus, setRecruitmentStatus] = useState<RecruitmentStatus>("total");

  const { data, isLoading, error } = useAssociateProCampaign();
  const { data: recruitmentData, isLoading: recruitmentLoading } = useAssociateRecruitmentAnalytics({
    page: recruitmentPage,
    limit: RECRUITMENT_LIMIT,
    hasReferral: true,
    searchQuery: recruitmentSearch || undefined,
    referralStatus: recruitmentStatus === "total" ? undefined : recruitmentStatus,
  });
  const dashboard = data?.getCampaignDashboard;
  const upgrades = data?.getAssociateProUpgrades?.upgrades ?? [];
  const referral = data?.getReferralAnalytics;
  const tickets = referral?.ticketHolders.tickets ?? [];

  if (error) {
    return (
      <div className="p-4 rounded-md bg-red-50 text-red-500 border border-red-200">
        <h3 className="font-bold">Error loading campaign dashboard</h3>
        <p>{(error as Error).message || "An unexpected error occurred."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">2000 Associate Pro Campaign</h1>
          <p className="text-muted-foreground">
            Conversion and referral performance dashboard.
          </p>
        </div>
        <Badge variant="outline">Campaign Active</Badge>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading campaign data...
        </div>
      )}

      {dashboard && (
        <>
          <AssociateProMetricsSection dashboard={dashboard} />
          <div className="grid gap-6 lg:grid-cols-2">
            <AssociateProConversionFunnel dashboard={dashboard} />
            <AssociateProFinancialOverview dashboard={dashboard} />
          </div>
        </>
      )}

      <AssociateProUpgradesTable data={upgrades} />

      {referral && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Top Performers</h2>
          <AssociateProTopPerformers data={referral} />
        </section>
      )}

      {referral && <AssociateProSourceAnalytics data={referral} />}

      <AssociateProRecruitmentTable
        data={recruitmentData?.data ?? []}
        count={recruitmentData?.count}
        page={recruitmentPage}
        limit={RECRUITMENT_LIMIT}
        onPageChange={setRecruitmentPage}
        searchQuery={recruitmentSearch}
        onSearchChange={(q) => {
          setRecruitmentSearch(q);
          setRecruitmentPage(1);
        }}
        status={recruitmentStatus}
        onStatusChange={(s) => {
          setRecruitmentStatus(s);
          setRecruitmentPage(1);
        }}
        isLoading={recruitmentLoading}
      />

      <AssociateProExportPanel upgrades={upgrades} tickets={tickets} />
    </div>
  );
}
