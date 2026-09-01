"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAdminPermissions } from "@/hooks/use-admin-permission";

import type { Campaign, CampaignStatus } from "../schemas/campaign.schema";
import { campaignStatusClassName } from "../utils/status-color";
import { CampaignEditDialog } from "@/features/campaigns/components/CampaignEditDialog";
import { TransitionDialog } from "@/features/campaigns/components/TransitionDialog";

export function CampaignDetailHeader({ campaign }: { campaign: Campaign }) {
  const canManage = useAdminPermissions().has("manage_campaigns");
  const [nextStatus, setNextStatus] = useState<CampaignStatus | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const actions: { label: string; status: CampaignStatus }[] = [];
  if (campaign.status === "draft") actions.push({ label: "Publish", status: "active" });
  if (campaign.status === "active") actions.push({ label: "Pause", status: "paused" });
  if (campaign.status === "paused") actions.push({ label: "Resume", status: "active" });
  if (campaign.status !== "completed") actions.push({ label: "End Campaign", status: "completed" });

  const showEdit = canManage && campaign.status !== "completed";
  const editHref = campaign.status === "draft" ? `/campaigns/new?draft=${campaign.id}` : null;

  return (
    <div className="space-y-2">
      <Link
        href="/campaigns"
        className="inline-flex items-center text-sm text-muted-foreground transition-colors hover:text-primary"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to campaigns
      </Link>

      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <h1 className="text-2xl font-bold tracking-tight wrap-break-word">{campaign.name}</h1>
          <span className={campaignStatusClassName(campaign.status)}>{campaign.status}</span>
        </div>
        {canManage ? (
          <div className="flex flex-wrap gap-2">
            {showEdit && editHref ? (
              <Button variant="outline" asChild>
                <Link href={editHref}>Edit</Link>
              </Button>
            ) : null}
            {showEdit && !editHref ? (
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                Edit
              </Button>
            ) : null}
            {actions.length ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button>
                    Transition
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {actions.map((action) => (
                    <DropdownMenuItem
                      key={action.label}
                      onSelect={() => setNextStatus(action.status)}
                      className={action.status === "completed" ? "text-destructive" : undefined}
                    >
                      {action.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        ) : null}
      </div>

      {nextStatus ? (
        <TransitionDialog campaign={campaign} newStatus={nextStatus} onClose={() => setNextStatus(null)} />
      ) : null}
      {editOpen ? <CampaignEditDialog campaign={campaign} onClose={() => setEditOpen(false)} /> : null}
    </div>
  );
}
