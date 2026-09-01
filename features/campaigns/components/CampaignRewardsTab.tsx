"use client";

import { useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/shared/Pagination";
import { useAdminPermissions } from "@/hooks/use-admin-permission";

import { useCampaignRewards } from "../hooks/use-campaign-rewards";
import { useExportRewards } from "../hooks/use-export-rewards";
import { DEFAULT_REWARDS_LIMIT } from "../hooks/query-keys";
import type { RewardRole } from "../schemas/reward.schema";
import { RewardsTable } from "./RewardsTable";
import { RewardsTableFilters } from "./RewardsTableFilters";

export function CampaignRewardsTab({ campaignId }: { campaignId: string }) {
  const searchParams = useSearchParams();
  const role = (searchParams.get("role") as RewardRole | null) || null;
  const isActiveParam = searchParams.get("is_active");
  const is_active = isActiveParam === "true" ? true : isActiveParam === "false" ? false : null;
  const page = Number(searchParams.get("page")) || 1;
  const canExport = useAdminPermissions().has("export_campaigns");
  const { data, isLoading, error } = useCampaignRewards(campaignId, { role, is_active, page });
  const { mutateAsync: exportRewards, isPending: isExporting } = useExportRewards(campaignId);

  return (
    <div className="space-y-4">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <RewardsTableFilters />
        {canExport ? (
          <Button
            variant="outline"
            disabled={isExporting}
            onClick={async () => {
              try {
                await exportRewards({ role, is_active, page });
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Export failed");
              }
            }}
          >
            {isExporting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              "Export CSV"
            )}
          </Button>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
          <h3 className="font-bold">Error loading rewards</h3>
          <p>{error.message}</p>
        </div>
      ) : (
        <RewardsTable rewards={data?.data ?? []} isLoading={isLoading} />
      )}

      <Pagination count={data?.meta?.total ?? 0} currentIdx={page} limit={DEFAULT_REWARDS_LIMIT} />
    </div>
  );
}
