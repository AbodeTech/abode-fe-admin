"use client";

import { useFormContext } from "react-hook-form";

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import type { CreateCampaignDto } from "../../schemas/create-campaign.schema";

function numberChange(value: string) {
  return value === "" ? Number.NaN : Number(value);
}

export function TriggerStep() {
  const form = useFormContext<CreateCampaignDto>();

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">
        MVP trigger is locked to asset purchases measured in sqm, using divisor mode.
      </p>
      <div className="grid gap-4 sm:grid-cols-3">
        <FormItem>
          <FormLabel>Event</FormLabel>
          <Input value="asset_purchase" disabled />
        </FormItem>
        <FormItem>
          <FormLabel>Unit</FormLabel>
          <Input value="sqm" disabled />
        </FormItem>
        <FormItem>
          <FormLabel>Mode</FormLabel>
          <Input value="divisor" disabled />
        </FormItem>
      </div>
      <FormField
        control={form.control}
        name="trigger_threshold"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Threshold (sqm)</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={1}
                value={Number.isNaN(field.value) ? "" : field.value}
                onChange={(event) => field.onChange(numberChange(event.target.value))}
              />
            </FormControl>
            <FormDescription>One reward is issued per this many square metres purchased.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
      <FormField
        control={form.control}
        name="rewards_per_threshold"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Rewards per threshold</FormLabel>
            <FormControl>
              <Input
                type="number"
                min={1}
                value={Number.isNaN(field.value) ? "" : field.value}
                onChange={(event) => field.onChange(numberChange(event.target.value))}
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
