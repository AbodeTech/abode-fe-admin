"use client";

import { useEffect, useRef } from "react";
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
import { NumberInput } from "./NumberInput";
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
 * The Asset details panel's edit form: three field groups (details,
 * availability, images and documents), each with its own form and Zod
 * schema, edited together and saved by `useAssetEditSection` below.
 *
 * Derived fields (`sold`, `sold_units`, `reserved_units`) appear nowhere:
 * `forbidNonWhitelisted` makes sending one a hard 400.
 * ============================================================ */

/**
 * Re-seed whenever editing opens, so a cancelled edit never lingers.
 *
 * `seed` is a fresh closure every render (the caller does not memoise it) —
 * depending on it directly used to re-run this effect
 * on every single render, and since `seed()` calls `form.reset()`, which
 * itself triggers a re-render of every `FormField` reading this form's state,
 * that re-render produced a new `seed` closure and fired the effect again:
 * an infinite loop (confirmed live — "Maximum update depth exceeded" the
 * moment an Overview edit panel opened). A ref sidesteps it:
 * always the latest `seed`, but never itself a reason for the effect to
 * re-run — only an actual `editing` transition does that now.
 */
function useReseedOnOpen(sectionId: string, seed: () => void) {
  const editing = useAssetFormStore((state) => state.editingSections[sectionId] ?? false);
  const seedRef = useRef(seed);
  // Refs can't be written during render — update it in its own effect (runs
  // after every render, commits before the effect below ever needs it) so
  // `seedRef.current` is always the latest closure without itself being a
  // reason for that effect to re-run.
  useEffect(() => {
    seedRef.current = seed;
  });

  useEffect(() => {
    if (editing) seedRef.current();
  }, [editing]);
}

/* -------------------- details -------------------- */

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
                <NumberInput field={field} min={1} />
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
  { key: "brochure", label: "Brochure" },
] as const;

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

/* -------------------- one panel, one save -------------------- */

/**
 * The asset-detail design has a single "Asset details" panel with one Edit
 * button, so the three field groups above are edited together here and saved
 * as ONE `PATCH /admin/assets/:id` — the endpoint takes any subset of asset
 * fields, so details, sales cap/visibility and images/documents can travel
 * in the same request. Each group keeps its own form (and its own Zod
 * schema), which is why saving validates all three before anything is sent.
 */
export function useAssetEditSection(asset: AssetDetail | undefined) {
  const update = useUpdateAsset(asset?._id ?? "");
  const stopEditing = useAssetFormStore((state) => state.stopEditing);

  const details = useForm<AssetDetailsFormValues>({
    resolver: zodResolver(assetDetailsFormSchema),
    defaultValues: { name: "", amenities: [], landmark: [] },
  });
  const availability = useForm<AssetAvailabilityFormValues>({
    resolver: zodResolver(assetAvailabilityFormSchema),
    defaultValues: { sales_cap: 1, visibility: "draft" },
  });
  const media = useForm<AssetMediaFormValues>({
    resolver: zodResolver(assetMediaFormSchema),
    defaultValues: { hero_image: "", pictures: [], documents: {} },
  });

  useReseedOnOpen("details", () => {
    if (!asset) return;
    details.reset(assetToDetailsForm(asset));
    availability.reset(assetToAvailabilityForm(asset));
    media.reset(assetToMediaForm(asset));
  });

  // Nested so the request is only built once every group has passed its own
  // schema — and from the resolver's parsed output, not raw input values.
  const submit = () => {
    if (!asset) return;
    void details.handleSubmit((detailValues) =>
      availability.handleSubmit((availabilityValues) => {
        // The backend doesn't check this, and a cap below what's already
        // committed would leave `available_units` negative everywhere.
        const capError = validateSalesCap(availabilityValues.sales_cap, asset);
        if (capError) {
          availability.setError("sales_cap", { message: capError });
          return;
        }
        return media.handleSubmit((mediaValues) => {
          update.mutate(
            { ...detailsFormToPayload(detailValues), ...availabilityValues, ...mediaFormToPayload(mediaValues) },
            {
              onSuccess: () => {
                toast.success("Asset details saved");
                stopEditing("details");
              },
              onError: (error) => toast.error(error.message || "Couldn't save"),
            }
          );
        })();
      })()
    )();
  };

  return { details, availability, media, submit, isSaving: update.isPending };
}

function EditGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3 border-t pt-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h3>
      {children}
    </div>
  );
}

export function AssetEditFields({
  section,
  asset,
}: {
  section: ReturnType<typeof useAssetEditSection>;
  asset: AssetDetail;
}) {
  return (
    <div className="space-y-5">
      <AssetDetailsFields form={section.details} />
      <EditGroup title="Visibility and sales cap">
        <AssetAvailabilityFields form={section.availability} asset={asset} />
      </EditGroup>
      <EditGroup title="Images and documents">
        <AssetMediaFields form={section.media} />
      </EditGroup>
    </div>
  );
}
