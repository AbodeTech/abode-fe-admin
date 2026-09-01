"use client";

import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useTransitionCampaign } from "../hooks/use-transition-campaign";
import type { Campaign, CampaignStatus } from "../schemas/campaign.schema";

const TRANSITION_COPY: Record<
  CampaignStatus,
  { title: string; description: string; buttonText: string; destructive?: boolean }
> = {
  active: {
    title: "Publish this campaign?",
    description:
      "Once published, the engine starts issuing rewards on eligible purchases. Rules become read-only (except description + target).",
    buttonText: "Publish",
  },
  paused: {
    title: "Pause this campaign?",
    description:
      "Reward issuance stops until you resume. Existing rewards are unaffected. Dashboard remains readable.",
    buttonText: "Pause",
  },
  completed: {
    title: "End this campaign?",
    description:
      "This is PERMANENT. No more rewards will be issued for this campaign, and it cannot be un-ended. Are you sure?",
    buttonText: "End Campaign",
    destructive: true,
  },
  draft: {
    title: "",
    description: "",
    buttonText: "",
  },
};

export function TransitionDialog({
  campaign,
  newStatus,
  onClose,
}: {
  campaign: Campaign;
  newStatus: CampaignStatus;
  onClose: () => void;
}) {
  const copy = TRANSITION_COPY[newStatus];
  const { mutateAsync: transition, isPending } = useTransitionCampaign(campaign.id);

  const handleConfirm = async () => {
    await transition({ status: newStatus });
    toast.success(`Campaign ${newStatus}`);
    onClose();
  };

  if (!copy.title) return null;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{copy.description}</p>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant={copy.destructive ? "destructive" : "default"}
            onClick={handleConfirm}
            disabled={isPending}
          >
            {copy.buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
