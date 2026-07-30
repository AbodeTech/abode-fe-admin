"use client";

import { useEffect } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { TagInput } from "@/components/shared/TagInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { TOPOGRAPHIES, VISIBILITIES, VISIBILITY_LABELS } from "../../schemas/asset.schema";
import type { AssetDetail } from "../../schemas/asset-detail.schema";
import {
  assetAvailabilityFormSchema,
  assetDetailsFormSchema,
  assetMediaFormSchema,
  assetToAvailabilityForm,
  assetToDetailsForm,
  assetToMediaForm,
  detailsFormToPayload,
  mediaFormToPayload,
  validateSalesCap,
  type AssetAvailabilityFormValues,
  type AssetDetailsFormValues,
  type AssetMediaFormValues,
} from "../../schemas/edit-asset.schema";
import { useUpdateAsset } from "../../hooks/use-asset-detail";
import { useAssetFormStore } from "../../store/asset-form-store";
import { GalleryUploadField, SingleUploadField } from "../create/UploadFields";

/* ============================================================
 * One hook per editable section.
 *
 * Written out concretely rather than behind a generic helper: RHF's resolver
 * types are invariant in the form values, so a generic wrapper needs casts at
 * every call site — which defeats the point of having the schema drive the
 * types at all.
 *
 * Each section owns its own slice of `UpdateAssetDto`, so a Save sends only
 * the fields that section shows. Derived fields (`sold`, `sold_units`,
 * `reserved_units`) appear nowhere — `forbidNonWhitelisted` makes sending one
 * a hard 400.
 * ============================================================ */

export type SectionForm<TValues extends Record<string, unknown>> = {
  form: UseFormReturn<TValues>;
  submit: () => void;
  isSaving: boolean;
};

/** Re-seed whenever editing opens, so a cancelled edit never lingers. */
function useReseedOnOpen(sectionId: string, seed: () => void) {
  const editing = useAssetFormStore((state) => state.editingSections[sectionId] ?? false);

  useEffect(() => {
    if (editing) seed();
    // `seed` closes over the asset, so this re-runs when the asset changes too.
  }, [editing, seed]);
}

/* -------------------- details -------------------- */

export function useAssetDetailsSection(
  asset: AssetDetail | undefined
): SectionForm<AssetDetailsFormValues> {
  const update = useUpdateAsset(asset?._id ?? "");
  const stopEditing = useAssetFormStore((state) => state.stopEditing);

  const form = useForm<AssetDetailsFormValues>({
    resolver: zodResolver(assetDetailsFormSchema),
    // The list fields are required arrays; seeding them here means the form is
    // valid before `useReseedOnOpen` fires rather than only after.
    defaultValues: { name: "", amenities: [], landmark: [] },
  });

  const { reset } = form;
  useReseedOnOpen("details", () => {
    if (asset) reset(assetToDetailsForm(asset));
  });

  const submit = form.handleSubmit((values) => {
    update.mutate(detailsFormToPayload(values), {
      onSuccess: () => {
        toast.success("Asset details saved");
        stopEditing("details");
      },
      onError: (error) => toast.error(error.message || "Couldn't save"),
    });
  });

  return { form, submit, isSaving: update.isPending };
}

export function AssetDetailsFields({ form }: { form: UseFormReturn<AssetDetailsFormValues> }) {
  return (
    <Form {...form}>
      <div className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="asset_location"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Location</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <FormField
            control={form.control}
            name="asset_purpose"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Purpose</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="topography"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Topography</FormLabel>
                <Select value={field.value ?? ""} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Not set" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TOPOGRAPHIES.map((topography) => (
                      <SelectItem key={topography} value={topography} className="capitalize">
                        {topography}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="google_map"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Google Maps link</FormLabel>
                <FormControl>
                  <Input {...field} value={field.value ?? ""} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <FormField
            control={form.control}
            name="amenities"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Amenities</FormLabel>
                <FormControl>
                  <TagInput
                    value={field.value ?? []}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    disabled={field.disabled}
                    placeholder="Perimeter fencing"
                  />
                </FormControl>
                <FormDescription className="text-xs">Press Enter after each one.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="landmark"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Landmarks</FormLabel>
                <FormControl>
                  <TagInput
                    value={field.value ?? []}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    disabled={field.disabled}
                    placeholder="Lekki Free Zone"
                  />
                </FormControl>
                <FormDescription className="text-xs">Press Enter after each one.</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Description</FormLabel>
              <FormControl>
                <Textarea rows={3} {...field} value={field.value ?? ""} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </Form>
  );
}

/* -------------------- availability -------------------- */

export function useAssetAvailabilitySection(
  asset: AssetDetail | undefined
): SectionForm<AssetAvailabilityFormValues> {
  const update = useUpdateAsset(asset?._id ?? "");
  const stopEditing = useAssetFormStore((state) => state.stopEditing);

  const form = useForm<AssetAvailabilityFormValues>({
    resolver: zodResolver(assetAvailabilityFormSchema),
    defaultValues: { sales_cap: 1, visibility: "draft" },
  });

  const { reset } = form;
  useReseedOnOpen("availability", () => {
    if (asset) reset(assetToAvailabilityForm(asset));
  });

  const submit = form.handleSubmit((values) => {
    if (!asset) return;

    // The backend doesn't check this, and a cap below what's already committed
    // would leave `available_units` negative on every screen that shows it.
    const capError = validateSalesCap(values.sales_cap, asset);
    if (capError) {
      form.setError("sales_cap", { message: capError });
      return;
    }

    update.mutate(values, {
      onSuccess: () => {
        toast.success("Availability saved");
        stopEditing("availability");
      },
      onError: (error) => toast.error(error.message || "Couldn't save"),
    });
  });

  return { form, submit, isSaving: update.isPending };
}

export function AssetAvailabilityFields({
  form,
  asset,
}: {
  form: UseFormReturn<AssetAvailabilityFormValues>;
  asset: AssetDetail;
}) {
  const committed = asset.sold_units + asset.reserved_units;

  return (
    <Form {...form}>
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField
          control={form.control}
          name="sales_cap"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Sales cap</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  value={field.value ?? ""}
                  onChange={(e) =>
                    field.onChange(e.target.value === "" ? undefined : e.target.valueAsNumber)
                  }
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              <FormDescription className="text-xs">
                {committed > 0
                  ? `Can't go below ${committed.toLocaleString()} — that many are already sold or reserved.`
                  : "Total units across every offer."}
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="visibility"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-xs">Visibility</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {VISIBILITIES.map((visibility) => (
                    <SelectItem key={visibility} value={visibility}>
                      {VISIBILITY_LABELS[visibility]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </Form>
  );
}

/* -------------------- media -------------------- */

const DOCUMENT_SLOTS = [
  { key: "deed_of_assignment", label: "Deed of assignment" },
  { key: "survey", label: "Survey" },
  { key: "contract_of_sales", label: "Contract of sales" },
  { key: "estate_layout", label: "Estate layout" },
] as const;

export function useAssetMediaSection(
  asset: AssetDetail | undefined
): SectionForm<AssetMediaFormValues> {
  const update = useUpdateAsset(asset?._id ?? "");
  const stopEditing = useAssetFormStore((state) => state.stopEditing);

  const form = useForm<AssetMediaFormValues>({
    resolver: zodResolver(assetMediaFormSchema),
    defaultValues: { hero_image: "", pictures: [], documents: {} },
  });

  const { reset } = form;
  useReseedOnOpen("media", () => {
    if (asset) reset(assetToMediaForm(asset));
  });

  const submit = form.handleSubmit((values) => {
    update.mutate(mediaFormToPayload(values), {
      onSuccess: () => {
        toast.success("Images and documents saved");
        stopEditing("media");
      },
      onError: (error) => toast.error(error.message || "Couldn't save"),
    });
  });

  return { form, submit, isSaving: update.isPending };
}

export function AssetMediaFields({ form }: { form: UseFormReturn<AssetMediaFormValues> }) {
  return (
    <Form {...form}>
      <div className="space-y-4">
        <FormField
          control={form.control}
          name="hero_image"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <SingleUploadField
                  id="edit.hero_image"
                  label="Hero image"
                  value={field.value || undefined}
                  onChange={(url) => field.onChange(url ?? "")}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="pictures"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <GalleryUploadField
                  id="edit.pictures"
                  label="Gallery"
                  value={field.value ?? []}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 border-t pt-4 sm:grid-cols-2">
          {DOCUMENT_SLOTS.map((slot) => (
            <FormField
              key={slot.key}
              control={form.control}
              name={`documents.${slot.key}` as const}
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <SingleUploadField
                      id={`edit.documents.${slot.key}`}
                      label={slot.label}
                      accept="image/*,application/pdf"
                      value={field.value || undefined}
                      onChange={(url) => field.onChange(url ?? "")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}
        </div>
      </div>
    </Form>
  );
}
