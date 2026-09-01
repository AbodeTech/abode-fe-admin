"use client";

import { useFormContext } from "react-hook-form";

import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import type { CreateCampaignDto } from "../../schemas/create-campaign.schema";

export function TargetStep() {
  const form = useFormContext<CreateCampaignDto>();

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <FormField
        control={form.control}
        name="total_sqm_target"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Total sqm target (optional)</FormLabel>
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
            <FormDescription>Leave blank if this campaign has no sales target. Progress bars hide until a target is set.</FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  );
}
