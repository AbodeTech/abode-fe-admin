"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/shared/Pagination";
import { useAdminPermissions } from "@/hooks/use-admin-permission";

import { useCampaignsList } from "../hooks/use-campaigns-list";
import { DEFAULT_CAMPAIGNS_LIMIT } from "../hooks/query-keys";
import type { CampaignStatus } from "../schemas/campaign.schema";
import { Header, ListSkeleton, PageShell } from "./CampaignLayout";
import { CampaignsListCard } from "./CampaignsListCard";
import { CampaignsListFilters } from "./CampaignsListFilters";

export default function CampaignsListPage() {
  const searchParams = useSearchParams();
  const status = (searchParams.get("status") as CampaignStatus | null) || null;
  const search = searchParams.get("search");
  const page = Number(searchParams.get("page")) || 1;
  const canManage = useAdminPermissions().has("manage_campaigns");

  const { data, isLoading, error } = useCampaignsList({ status, search, page });
  const rows = data?.data ?? [];
  const total = data?.meta?.total ?? 0;
  const empty = !isLoading && rows.length === 0;

  return (
    <PageShell>
      <Header title="Campaigns" subtitle="Unified hamper and ticket campaigns.">
        {canManage ? (
          <Button className="w-full sm:w-auto" asChild>
            <Link href="/campaigns/new">
              <Plus className="mr-2 h-4 w-4" />
              New Campaign
            </Link>
          </Button>
        ) : null}
      </Header>

      <CampaignsListFilters currentStatus={status} currentSearch={search ?? ""} />

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
          <h3 className="font-bold">Error loading campaigns</h3>
          <p>{error.message}</p>
        </div>
      ) : isLoading ? (
        <ListSkeleton />
      ) : empty ? (
        <div className="rounded-md border border-dashed p-8 text-center">
          <p className="font-medium">No campaigns yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {search || status
              ? "No campaigns match these filters."
              : "Create your first campaign to start issuing rewards."}
          </p>
          {canManage && !search && !status ? (
            <Button className="mt-4" asChild>
              <Link href="/campaigns/new">Create your first campaign</Link>
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-4">
          {rows.map((campaign) => (
            <CampaignsListCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}

      <Pagination count={total} currentIdx={page} limit={DEFAULT_CAMPAIGNS_LIMIT} />
    </PageShell>
  );
}
