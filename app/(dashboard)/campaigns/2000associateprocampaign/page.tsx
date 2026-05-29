"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { PageContentLoader } from "@/components/shared/page-content-loader";
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
const ALL_PROS_LIMIT = 10000;

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
  // Source B — all current Associate Pros (no campaign date window).
  // Feeds both the "Recent Pro Upgrades" table and the export panel so the
  // download stays in sync with post-CAMPAIGN_END additions on the BE.
  const { data: allProsData } = useAssociateRecruitmentAnalytics({
    page: 1,
    limit: ALL_PROS_LIMIT,
    hasReferral: true,
    referralStatus: "associate-pro",
  });
  const dashboard = data?.getCampaignDashboard;
  const referral = data?.getReferralAnalytics;
  const tickets = referral?.ticketHolders.tickets ?? [];
  const recruitmentRows = (recruitmentData?.data ?? []).filter(
    (item): item is NonNullable<typeof item> => item !== null
  );
  const allPros = allProsData?.data ?? [];

  if (error) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-[1600px] px-3 sm:px-4">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
          <h3 className="font-bold">Error loading campaign dashboard</h3>
          <p>{(error as Error).message || "An unexpected error occurred."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] space-y-6 px-3 pb-16 sm:px-4 sm:pb-20">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">2000 Associate Pro Campaign</h1>
          <p className="text-muted-foreground">
            Conversion and referral performance dashboard.
          </p>
        </div>
        <Badge variant="outline" className="shrink-0 self-start sm:self-auto">
          Campaign Active
        </Badge>
      </div>

      {isLoading && (
        <PageContentLoader className="min-h-[min(40vh,18rem)] py-10" label="Loading campaign data…" />
      )}

      {dashboard && (
        <>
          <AssociateProMetricsSection dashboard={dashboard} />
          <div className="grid min-w-0 gap-6 lg:grid-cols-2">
            <AssociateProConversionFunnel dashboard={dashboard} />
            <AssociateProFinancialOverview dashboard={dashboard} />
          </div>
        </>
      )}

      <AssociateProUpgradesTable data={allPros} />

      {referral && (
        <section>
          <h2 className="mb-4 text-lg font-semibold text-foreground">Top Performers</h2>
          <AssociateProTopPerformers data={referral} />
        </section>
      )}

      {referral && <AssociateProSourceAnalytics data={referral} />}

      <AssociateProRecruitmentTable
        data={recruitmentRows}
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

      <AssociateProExportPanel pros={allPros} tickets={tickets} />
    </div>
  );
}
