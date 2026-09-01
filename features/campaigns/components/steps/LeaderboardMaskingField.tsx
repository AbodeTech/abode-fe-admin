"use client";

import { useFormContext } from "react-hook-form";

import { Checkbox } from "@/components/ui/checkbox";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";

export function LeaderboardMaskingField({ name = "leaderboard_masking_enabled" }: { name?: "leaderboard_masking_enabled" }) {
  const form = useFormContext<{ leaderboard_masking_enabled: boolean }>();

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="flex items-center gap-2 space-y-0">
          <FormControl>
            <Checkbox checked={field.value ?? true} onCheckedChange={(checked) => field.onChange(checked === true)} />
          </FormControl>
          <FormLabel className="font-normal">
            Mask associate names on the public leaderboard (recommended)
          </FormLabel>
        </FormItem>
      )}
    />
  );
}
