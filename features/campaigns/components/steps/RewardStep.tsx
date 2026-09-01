"use client";

import { useFormContext } from "react-hook-form";

import { Checkbox } from "@/components/ui/checkbox";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

import type { CreateCampaignDto } from "../../schemas/create-campaign.schema";
import { CheckpointEditorSubsection } from "./CheckpointEditorSubsection";
import { LeaderboardMaskingField } from "./LeaderboardMaskingField";

export function RewardStep() {
  const form = useFormContext<CreateCampaignDto>();
  const rewardType = form.watch("reward_type");

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <FormField
        control={form.control}
        name="reward_type"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Reward type</FormLabel>
            <FormControl>
              <RadioGroup
                value={field.value}
                onValueChange={field.onChange}
                className="flex flex-wrap gap-4"
              >
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="ticket" />
                  Ticket
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <RadioGroupItem value="hamper" />
                  Hamper
                </label>
              </RadioGroup>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="recipient_buyer"
        render={({ field }) => (
          <FormItem className="flex items-center gap-2 space-y-0">
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} />
            </FormControl>
            <FormLabel className="font-normal">Issue to buyer</FormLabel>
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="recipient_referrer"
        render={({ field }) => (
          <FormItem className="flex items-center gap-2 space-y-0">
            <FormControl>
              <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} />
            </FormControl>
            <FormLabel className="font-normal">Issue to referrer</FormLabel>
            <FormMessage />
          </FormItem>
        )}
      />

      {rewardType === "ticket" ? (
        <FormField
          control={form.control}
          name="ticket_id_prefix"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Ticket ID prefix</FormLabel>
              <FormControl>
                <Input {...field} maxLength={4} placeholder="PLOT" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : null}

      <LeaderboardMaskingField />
      <CheckpointEditorSubsection />
    </div>
  );
}
