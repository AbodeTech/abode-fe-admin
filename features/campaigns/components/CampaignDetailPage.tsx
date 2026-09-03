"use client";

import Link from "next/link";
import { useParams, usePathname, useSearchParams } from "next/navigation";

import { PageContentLoader } from "@/components/shared/page-content-loader";
import { cn } from "@/lib/utils";

import { useCampaignDetail } from "../hooks/use-campaign-detail";
import { PageShell } from "./CampaignLayout";
import { CampaignConfigTab } from "./CampaignConfigTab";
import { CampaignDetailHeader } from "./CampaignDetailHeader";
import { CampaignOverviewTab } from "./CampaignOverviewTab";
import { CampaignRewardsTab } from "./CampaignRewardsTab";

export default function CampaignDetailPage({ tab }: { tab?: "overview" | "rewards" | "config" }) {
  const params = useParams<{ id: string }>();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const campaignId = params.id;
  const { data: campaign, isLoading, error } = useCampaignDetail(campaignId);

  const configOpen = searchParams.get("tab") === "config";
  const activeTab = tab === "rewards" || pathname.endsWith("/rewards") ? "rewards" : configOpen ? "config" : "overview";

  if (isLoading) {
    return (
      <PageShell>
        <PageContentLoader label="Loading campaign…" />
      </PageShell>
    );
  }

  if (error) {
    return (
      <PageShell>
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
          <h3 className="font-bold">Error loading campaign</h3>
          <p>{error.message}</p>
        </div>
      </PageShell>
    );
  }

  if (!campaign) return null;

  const tabs = [
    { id: "overview" as const, label: "Overview", href: `/campaigns/${campaignId}` },
    { id: "rewards" as const, label: "Rewards", href: `/campaigns/${campaignId}/rewards` },
    { id: "config" as const, label: "Config", href: `/campaigns/${campaignId}?tab=config` },
  ];

  return (
    <PageShell>
      <CampaignDetailHeader campaign={campaign} />

      <nav className="-mb-px flex min-w-0 gap-1 overflow-x-auto border-b" aria-label="Campaign sections">
        {tabs.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            aria-current={activeTab === item.id ? "page" : undefined}
            className={cn(
              "flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm transition-colors",
              activeTab === item.id
                ? "border-foreground font-medium text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {activeTab === "overview" ? <CampaignOverviewTab campaignId={campaignId} /> : null}
      {activeTab === "rewards" ? <CampaignRewardsTab campaignId={campaignId} /> : null}
      {activeTab === "config" ? <CampaignConfigTab campaign={campaign} /> : null}
    </PageShell>
  );
}
