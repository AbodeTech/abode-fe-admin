"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { PageContentLoader } from "@/components/shared/page-content-loader";

import { useCampaignsList } from "../hooks/use-campaigns-list";
import { findLegacyCampaignId } from "../utils/build-legacy-redirect";
import { PageShell } from "./CampaignLayout";

export function LegacyCampaignRedirect({ legacyName }: { legacyName: string }) {
  const router = useRouter();
  const { data, isLoading, error } = useCampaignsList({ page: 1, limit: 100 });

  useEffect(() => {
    const id = findLegacyCampaignId(data?.data, legacyName);
    if (id) router.replace(`/campaigns/${id}`);
  }, [data, legacyName, router]);

  if (error) {
    return (
      <PageShell>
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
          <h3 className="font-bold">Could not find the legacy campaign</h3>
          <p>{error.message}</p>
        </div>
      </PageShell>
    );
  }

  const missing = !isLoading && !findLegacyCampaignId(data?.data, legacyName);

  if (missing) {
    return (
      <PageShell>
        <div className="rounded-md border border-dashed p-8 text-center">
          <p className="font-medium">Legacy campaign not found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            No campaign named “{legacyName}” is seeded yet. Open Campaigns to pick one.
          </p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <PageContentLoader label="Redirecting to campaign…" />
    </PageShell>
  );
}
