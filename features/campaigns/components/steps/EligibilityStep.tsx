"use client";

import { useFormContext } from "react-hook-form";

import { Checkbox } from "@/components/ui/checkbox";
import { FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";

import { ELIGIBLE_ASSET_TYPES, ELIGIBLE_STATUSES, type CreateCampaignDto } from "../../schemas/create-campaign.schema";

function StatusChecklist({
  name,
  label,
}: {
  name: "buyer_eligible_statuses" | "referrer_eligible_statuses";
  label: string;
}) {
  const form = useFormContext<CreateCampaignDto>();

  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => {
        const value = field.value ?? [];
        const toggle = (status: string, checked: boolean) => {
          field.onChange(checked ? [...value, status] : value.filter((item) => item !== status));
        };
        return (
          <FormItem>
            <FormLabel>{label}</FormLabel>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {ELIGIBLE_STATUSES.map((status) => (
                <label key={status} className="flex items-center gap-2 text-sm capitalize">
                  <FormControl>
                    <Checkbox
                      checked={value.includes(status)}
                      onCheckedChange={(checked) => toggle(status, checked === true)}
                    />
                  </FormControl>
                  {status.replace("-", " ")}
                </label>
              ))}
            </div>
          </FormItem>
        );
      }}
    />
  );
}

export function EligibilityStep() {
  const form = useFormContext<CreateCampaignDto>();

  return (
    <div className="space-y-6 rounded-lg border p-4">
      <p className="text-sm text-muted-foreground">
        Leave a list empty to allow every status. Checked statuses are the only ones that earn.
      </p>
      <StatusChecklist name="buyer_eligible_statuses" label="Buyer eligible statuses" />
      <StatusChecklist name="referrer_eligible_statuses" label="Referrer eligible statuses" />
      <FormField
        control={form.control}
        name="eligible_asset_types"
        render={({ field }) => {
          const value = field.value ?? [];
          const toggle = (assetType: (typeof ELIGIBLE_ASSET_TYPES)[number], checked: boolean) => {
            field.onChange(checked ? [...value, assetType] : value.filter((item) => item !== assetType));
          };
          return (
            <FormItem>
              <FormLabel>Eligible asset types</FormLabel>
              <p className="text-sm text-muted-foreground">Leave empty so every product type qualifies.</p>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                {ELIGIBLE_ASSET_TYPES.map((assetType) => (
                  <label key={assetType} className="flex items-center gap-2 text-sm capitalize">
                    <FormControl>
                      <Checkbox
                        checked={value.includes(assetType)}
                        onCheckedChange={(checked) => toggle(assetType, checked === true)}
                      />
                    </FormControl>
                    {assetType.replace("-", " ")}
                  </label>
                ))}
              </div>
            </FormItem>
          );
        }}
      />
    </div>
  );
}
