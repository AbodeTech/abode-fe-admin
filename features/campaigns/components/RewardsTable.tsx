"use client";

import { useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminPermissions } from "@/hooks/use-admin-permission";
import { cn } from "@/lib/utils";

import type { CampaignReward } from "../schemas/reward.schema";
import { formatDate } from "../utils/format-period";
import { personName } from "../utils/format-metrics";
import { DownloadTicketPdfButton } from "./DownloadTicketPdfButton";
import { InvalidateRewardDialog } from "./InvalidateRewardDialog";

export function RewardsTable({ rewards, isLoading }: { rewards: CampaignReward[]; isLoading?: boolean }) {
  const canManage = useAdminPermissions().has("manage_campaigns");
  const [invalidating, setInvalidating] = useState<CampaignReward | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (!rewards.length) {
    return (
      <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
        No rewards issued yet
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Recipient</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Bought by</TableHead>
            <TableHead>Ticket ID</TableHead>
            <TableHead>Asset</TableHead>
            <TableHead>Sqm</TableHead>
            <TableHead>Issued</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rewards.map((reward) => (
            <TableRow key={reward.id} className={cn(!reward.is_active && "opacity-50")}>
              <TableCell className={cn("max-w-56", !reward.is_active && "line-through")}>
                {reward.recipient ? (
                  <>
                    <Link
                      href={`/users/${reward.recipient.id}`}
                      className="block truncate font-medium text-foreground hover:underline"
                    >
                      {personName(reward.recipient.first_name, reward.recipient.last_name)}
                    </Link>
                    {reward.recipient.email ? (
                      <span className="block truncate text-xs text-muted-foreground">{reward.recipient.email}</span>
                    ) : null}
                  </>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell className="capitalize">{reward.role}</TableCell>
              <TableCell className="max-w-48">
                {/* A referrer's reward was earned on someone else's purchase — name them. */}
                {reward.role === "referrer" && reward.source_buyer ? (
                  <Link
                    href={`/users/${reward.source_buyer.id}`}
                    className="block truncate text-foreground hover:underline"
                  >
                    {personName(reward.source_buyer.first_name, reward.source_buyer.last_name)}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">{reward.role === "buyer" ? "Self" : "—"}</span>
                )}
              </TableCell>
              <TableCell>
                <code className="text-xs">{reward.ticket_id ?? "—"}</code>
                {reward.batch_size != null && reward.batch_size > 1 && reward.reward_index_in_batch != null ? (
                  <span className="block text-xs text-muted-foreground">
                    {reward.reward_index_in_batch + 1} of {reward.batch_size} from one purchase
                  </span>
                ) : null}
              </TableCell>
              <TableCell>{reward.asset_name}</TableCell>
              <TableCell>{reward.sqm_purchased.toLocaleString()}</TableCell>
              <TableCell>{formatDate(reward.created_at)}</TableCell>
              <TableCell>
                {reward.is_active ? (
                  <span className="text-xs font-medium text-[#067647]">Active</span>
                ) : (
                  <span className="inline-flex items-center rounded-full border border-[#FECDCA] bg-[#FEF3F2AB] px-2 py-0.5 text-xs font-medium text-[#B42318]">
                    invalidated
                  </span>
                )}
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
                  {reward.ticket_id && reward.is_active ? (
                    <DownloadTicketPdfButton rewardId={reward.id} />
                  ) : reward.reward_type === "hamper" ? (
                    <Button variant="ghost" size="sm" disabled title="PDF not applicable for hampers">
                      PDF not applicable for hampers
                    </Button>
                  ) : null}
                  {reward.is_active && canManage ? (
                    <Button variant="ghost" size="sm" onClick={() => setInvalidating(reward)}>
                      Invalidate
                    </Button>
                  ) : null}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {invalidating ? (
        <InvalidateRewardDialog reward={invalidating} onClose={() => setInvalidating(null)} />
      ) : null}
    </>
  );
}
