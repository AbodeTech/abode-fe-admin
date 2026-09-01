"use client";

import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ApiClientError } from "@/lib/api-client";

import { useUpdateCampaign } from "../hooks/use-update-campaign";
import type { Campaign } from "../schemas/campaign.schema";
import {
  LimitedCampaignEditSchema,
  type LimitedCampaignEditDto,
} from "../schemas/create-campaign.schema";
import { applyCampaignWriteError } from "../utils/campaign-write-error";
import { CheckpointEditorSubsection } from "./steps/CheckpointEditorSubsection";
import { LeaderboardMaskingField } from "./steps/LeaderboardMaskingField";

export function CampaignEditDialog({ campaign, onClose }: { campaign: Campaign; onClose: () => void }) {
  const form = useForm<LimitedCampaignEditDto>({
    resolver: zodResolver(LimitedCampaignEditSchema),
    defaultValues: {
      description: campaign.description ?? "",
      total_sqm_target: campaign.total_sqm_target ?? null,
      leaderboard_masking_enabled: campaign.leaderboard_masking_enabled ?? true,
      checkpoints: (campaign.checkpoints ?? []).map((checkpoint) => ({
        ...checkpoint,
        prize_media_url: checkpoint.prize_media_url ?? "",
      })),
    },
  });
  const { mutateAsync: update, isPending } = useUpdateCampaign(campaign.id);
  const checkpointsLocked = campaign.status !== "draft";

  const onSubmit = async (values: LimitedCampaignEditDto) => {
    try {
      await update({
        description: values.description,
        total_sqm_target: values.total_sqm_target,
        leaderboard_masking_enabled: values.leaderboard_masking_enabled,
      });
      toast.success("Campaign updated");
      onClose();
    } catch (error) {
      const kind = applyCampaignWriteError(error);
      if (kind === "locked") {
        toast.error(
          error instanceof ApiClientError
            ? error.message
            : "That field is locked after the campaign is published."
        );
        return;
      }
      toast.error(error instanceof Error ? error.message : "Could not update campaign");
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit campaign</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <FormProvider {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea rows={4} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="total_sqm_target"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sqm target</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        value={field.value ?? ""}
                        onChange={(event) =>
                          field.onChange(event.target.value === "" ? null : Number(event.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <LeaderboardMaskingField />

              {checkpointsLocked ? (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div>
                      <CheckpointEditorSubsection readOnly />
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    Locked after campaign is published — mid-campaign changes would retroactively reprice
                    already-earned progress.
                  </TooltipContent>
                </Tooltip>
              ) : (
                <CheckpointEditorSubsection />
              )}

              <DialogFooter>
                <Button variant="outline" type="button" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  Save
                </Button>
              </DialogFooter>
            </form>
          </FormProvider>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
