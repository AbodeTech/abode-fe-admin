"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";

import { useInvalidateReward } from "../hooks/use-invalidate-reward";
import { InvalidateRewardSchema, type InvalidateRewardDto } from "../schemas/invalidate-reward.schema";
import type { CampaignReward } from "../schemas/reward.schema";

export function InvalidateRewardDialog({
  reward,
  onClose,
}: {
  reward: CampaignReward;
  onClose: () => void;
}) {
  const form = useForm<InvalidateRewardDto>({
    resolver: zodResolver(InvalidateRewardSchema),
    defaultValues: { reason: "" },
  });
  const { mutateAsync: invalidate, isPending } = useInvalidateReward(reward.id);

  const onSubmit = async ({ reason }: InvalidateRewardDto) => {
    await invalidate({ reason });
    toast.success("Reward invalidated");
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invalidate this reward?</DialogTitle>
          <DialogDescription>
            Reward will be marked inactive. Ticket ID stays reserved (no re-issuance). Include a reason so
            support/audit can find this later.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason (min 20 chars)</FormLabel>
                  <FormControl>
                    <Textarea rows={4} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button variant="outline" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="destructive" type="submit" disabled={isPending}>
                Invalidate
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
