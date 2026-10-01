"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";

import {
  AdminDesktopTableWrap,
  AdminMobileCard,
  AdminMobileField,
  AdminMobileStack,
} from "@/components/shared/admin-responsive-table";
import { FilterSelect } from "@/components/shared/FilterSelect";
import { Pagination } from "@/components/shared/Pagination";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDebounce } from "@/hooks/use-debounce";
import { formatPercent } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

import { useCampaignDashboard } from "../hooks/use-campaign-dashboard";
import { useCampaignPurchases } from "../hooks/use-campaign-purchases";
import { DEFAULT_PURCHASES_LIMIT } from "../hooks/query-keys";
import type { Campaign, RewardType } from "../schemas/campaign.schema";
import type { CampaignPurchase } from "../schemas/purchase.schema";
import { formatDate } from "../utils/format-period";
import { formatCount, formatNairaWhole, formatSqm, rewardNoun } from "../utils/format-metrics";

const STATUS_STYLES: Record<string, string> = {
  active: "border-[#ABEFC6] bg-[#ECFDF3] text-[#067647]",
  overdue: "border-[#FEDF89] bg-[#FFFAEB] text-[#B54708]",
  completed: "border-[#B2DDFF] bg-[#EFF8FF] text-[#175CD3]",
  suspended: "border-[#FECDCA] bg-[#FEF3F2] text-[#B42318]",
  cancelled: "border-border bg-muted text-muted-foreground",
  closed: "border-border bg-muted text-muted-foreground",
};

const ASSET_TYPE_LABELS: Record<string, string> = {
  flex: "Flex",
  "full-ownership": "Full ownership",
  commercial: "Commercial",
};

function StatusPill({ purchase }: { purchase: CampaignPurchase }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      <span
        className={cn(
          "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium capitalize",
          STATUS_STYLES[purchase.status] ?? STATUS_STYLES.cancelled
        )}
      >
        {purchase.status}
      </span>
      {purchase.is_defaulted && purchase.status !== "overdue" ? (
        <span className="text-xs text-[#B54708]">defaulted</span>
      ) : null}
    </span>
  );
}

function RewardsCell({ purchase, rewardType }: { purchase: CampaignPurchase; rewardType: RewardType }) {
  const { buyer, referrer } = purchase.rewards;
  const total = buyer.count + referrer.count;
  if (total === 0) {
    return (
      <span className="text-sm text-muted-foreground" title="Below the threshold, or neither party was eligible">
        None
      </span>
    );
  }

  const summary = (
    <span className="text-left">
      <span className="block text-sm tabular-nums text-foreground">
        {formatCount(total)} {rewardNoun(rewardType, total)}
      </span>
      <span className="block text-xs text-muted-foreground">
        {formatCount(buyer.count)} buyer · {formatCount(referrer.count)} referrer
      </span>
    </span>
  );
  const ids = [...buyer.ticket_ids, ...referrer.ticket_ids];
  if (ids.length === 0) return summary;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="cursor-help rounded-sm focus-visible:outline-2">
          {summary}
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        {buyer.ticket_ids.length ? <p>Buyer: {buyer.ticket_ids.join(", ")}</p> : null}
        {referrer.ticket_ids.length ? <p>Referrer: {referrer.ticket_ids.join(", ")}</p> : null}
      </TooltipContent>
    </Tooltip>
  );
}

function PartyLink({ party }: { party: CampaignPurchase["buyer"] | null }) {
  if (!party) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="block min-w-0">
      <Link href={`/users/${party.id}`} className="block truncate font-medium text-foreground hover:underline">
        {party.name ?? "Unknown"}
      </Link>
      {party.email ? <span className="block truncate text-xs text-muted-foreground">{party.email}</span> : null}
    </span>
  );
}

function landLabel(purchase: CampaignPurchase) {
  return purchase.units > 1 && purchase.size_sqm != null
    ? `${formatSqm(purchase.size_sqm)} × ${purchase.units}`
    : null;
}

function paidShare(purchase: CampaignPurchase) {
  return purchase.asset_price > 0 ? purchase.amount_paid / purchase.asset_price : null;
}

function PurchasesSearch({ current }: { current: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(current);
  const [previous, setPrevious] = useState(current);
  if (current !== previous) {
    setPrevious(current);
    setValue(current);
  }
  const debounced = useDebounce(value, 400);

  useEffect(() => {
    if (debounced === (searchParams.get("q") ?? "")) return;
    const params = new URLSearchParams(searchParams.toString());
    if (debounced) params.set("q", debounced);
    else params.delete("q");
    params.set("page", "1");
    router.push(`?${params.toString()}`, { scroll: false });
  }, [debounced, router, searchParams]);

  return (
    <div className="relative w-full sm:w-72">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(event) => setValue(event.target.value)}
        className="pl-9"
        placeholder="Search buyer, referrer or asset"
        aria-label="Search purchases"
      />
    </div>
  );
}

const COLUMNS = [
  "Purchased",
  "Buyer",
  "Asset",
  "Land",
  "Price",
  "Paid",
  "Balance",
  "Status",
  "Rewards",
  "Referrer",
  "Next payment",
];

export function CampaignPurchasesTab({ campaign }: { campaign: Pick<Campaign, "id" | "reward_type"> }) {
  const searchParams = useSearchParams();
  const search = searchParams.get("q") ?? "";
  const assetId = searchParams.get("asset_id");
  const page = Number(searchParams.get("page")) || 1;

  const { data, isLoading, isFetching, error } = useCampaignPurchases(campaign.id, {
    search,
    asset_id: assetId,
    page,
  });
  // Already cached by the Overview tab — the asset filter reads its breakdown.
  const { data: dashboard } = useCampaignDashboard(campaign.id);
  const assetOptions = (dashboard?.assets ?? []).map((asset) => ({
    label: asset.asset_name ?? "Unnamed asset",
    value: asset.asset_id,
  }));

  const rows = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <PurchasesSearch current={search} />
          <FilterSelect data={assetOptions} queryKey="asset_id" placeholder="All assets" />
        </div>
        <p className="text-sm text-muted-foreground">
          {isLoading ? "Loading purchases…" : `${formatCount(total)} ${total === 1 ? "purchase" : "purchases"}`}
          {" · every purchase in the campaign window, rewarded or not"}
        </p>
      </div>

      {error ? (
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
          <h3 className="font-bold">Error loading purchases</h3>
          <p>{error.message}</p>
        </div>
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          {search || assetId ? "No purchases match these filters." : "No purchases in the campaign window yet."}
        </div>
      ) : (
        <div className={cn("transition-opacity", isFetching && "opacity-60")}>
          <AdminMobileStack>
            {rows.map((purchase) => (
              <AdminMobileCard
                key={purchase.plan_id}
                title={purchase.buyer.name ?? "Unknown buyer"}
                subtitle={purchase.buyer.email ?? undefined}
              >
                <AdminMobileField label="Asset" value={purchase.asset_name ?? "—"} />
                <AdminMobileField label="Land" value={formatSqm(purchase.total_sqm)} />
                <AdminMobileField label="Price" value={formatNairaWhole(purchase.asset_price)} />
                <AdminMobileField label="Paid" value={formatNairaWhole(purchase.amount_paid)} />
                <AdminMobileField label="Balance" value={formatNairaWhole(purchase.balance)} />
                <AdminMobileField label="Status" value={<StatusPill purchase={purchase} />} />
                <AdminMobileField
                  label="Rewards"
                  value={<RewardsCell purchase={purchase} rewardType={campaign.reward_type} />}
                />
                <AdminMobileField label="Referrer" value={purchase.referrer?.name ?? "—"} />
                <AdminMobileField label="Purchased" value={formatDate(purchase.purchased_at)} />
              </AdminMobileCard>
            ))}
          </AdminMobileStack>

          <AdminDesktopTableWrap>
            <div className="min-w-0 overflow-x-auto">
              <Table className="min-w-[1200px]">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    {COLUMNS.map((column) => (
                      <TableHead
                        key={column}
                        className={cn(
                          "whitespace-nowrap",
                          ["Land", "Price", "Paid", "Balance"].includes(column) && "text-right"
                        )}
                      >
                        {column}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((purchase) => (
                    <TableRow key={purchase.plan_id}>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDate(purchase.purchased_at)}
                      </TableCell>
                      <TableCell className="max-w-56">
                        <PartyLink party={purchase.buyer} />
                      </TableCell>
                      <TableCell className="max-w-52">
                        <Link
                          href={`/assets/${purchase.asset_id}`}
                          className="block truncate text-foreground hover:underline"
                        >
                          {purchase.asset_name ?? "Unnamed asset"}
                        </Link>
                        <span className="text-xs text-muted-foreground">
                          {ASSET_TYPE_LABELS[purchase.asset_type] ?? purchase.asset_type}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="block whitespace-nowrap tabular-nums">{formatSqm(purchase.total_sqm)}</span>
                        {landLabel(purchase) ? (
                          <span className="block text-xs text-muted-foreground">{landLabel(purchase)}</span>
                        ) : null}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right tabular-nums">
                        {formatNairaWhole(purchase.asset_price)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="block whitespace-nowrap tabular-nums">
                          {formatNairaWhole(purchase.amount_paid)}
                        </span>
                        {paidShare(purchase) != null ? (
                          <span className="block text-xs text-muted-foreground">
                            {formatPercent(paidShare(purchase), 0)}
                          </span>
                        ) : null}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-right tabular-nums">
                        {formatNairaWhole(purchase.balance)}
                      </TableCell>
                      <TableCell>
                        <StatusPill purchase={purchase} />
                      </TableCell>
                      <TableCell>
                        <RewardsCell purchase={purchase} rewardType={campaign.reward_type} />
                      </TableCell>
                      <TableCell className="max-w-48">
                        <PartyLink party={purchase.referrer} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {formatDate(purchase.next_payment_date)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </AdminDesktopTableWrap>
        </div>
      )}

      <Pagination count={total} currentIdx={page} limit={DEFAULT_PURCHASES_LIMIT} />
    </div>
  );
}
