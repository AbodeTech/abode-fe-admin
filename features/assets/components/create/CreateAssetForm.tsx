"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
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
import {
  createAssetFormSchema,
  createAssetFormToPayload,
  type CreateAssetFormValues,
} from "../../schemas/create-asset.schema";
import { useCreateAsset } from "../../hooks/use-create-asset-v2";
import { useAssetFormStore } from "../../store/asset-form-store";
import { FormSection } from "./FormSection";
import { emptyProductPool, LandSetupSection } from "./LandSetupSection";
import { ReviewAndCreateSection } from "./ReviewAndCreateSection";
import { GalleryUploadField, SingleUploadField } from "./UploadFields";
import { NIGERIAN_STATES, stateLabel } from "../../lib/nigerian-states";

const DOCUMENT_SLOTS = [
  { key: "deed_of_assignment", label: "Deed of assignment" },
  { key: "survey", label: "Survey" },
  { key: "contract_of_sales", label: "Contract of sales" },
  { key: "estate_layout", label: "Estate layout" },
] as const;

export function CreateAssetForm() {
  const router = useRouter();
  const createAsset = useCreateAsset();

  const reset = useAssetFormStore((state) => state.reset);
  const isUploading = useAssetFormStore((state) => state.isUploading());

  // A half-filled asset reappearing from a previous visit would be worse than
  // losing it, so the surrounding UI state is cleared on mount and on the way
  // out.
  useEffect(() => {
    reset();
    return reset;
  }, [reset]);

  const form = useForm<CreateAssetFormValues>({
    resolver: zodResolver(createAssetFormSchema),
    defaultValues: {
      name: "",
      asset_location: "",
      description: "",
      google_map: "",
      amenities: [],
      landmark: [],
      hero_image: "",
      pictures: [],
      documents: {},
      visibility: "draft",
      total_land_sqm: undefined as unknown as number,
      product_pools: [emptyProductPool("flex")],
    },
  });

  function onSubmit(values: CreateAssetFormValues) {
    const parsed = createAssetFormSchema.parse(values);

    createAsset.mutate(createAssetFormToPayload(parsed), {
      onSuccess: (asset) => {
        toast.success(`${asset.name} created`, {
          description: "Complete roads, services, sizes, and prices when they're available.",
        });
        router.push(`/assets/${asset._id}`);
      },
      onError: (error) => toast.error(error.message || "Failed to create asset"),
    });
  }

  const submitting = createAsset.isPending;

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormSection
          id="details"
          title="Asset details"
          description="The place itself — what it's called, where it is, and what's on it."
        >
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Aviation City" {...field} />
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
                      <Input placeholder="Ibeju-Lekki, Lagos" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="state"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">State</FormLabel>
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select a state" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {NIGERIAN_STATES.map((state) => (
                          <SelectItem key={state} value={state}>
                            {stateLabel(state)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {/* Not just a filter: this is what the Deed of Assignment
                        reads to name the Governor it is submitted under. */}
                    <p className="text-[11px] text-gray-500">
                      Named on the Deed of Assignment. Left unset, the deed prints a blank there.
                    </p>
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
                    <FormDescription className="text-xs">
                      Press Enter after each one.
                    </FormDescription>
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
                    <FormDescription className="text-xs">
                      Press Enter after each one.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
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
                name="asset_purpose"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Purpose</FormLabel>
                    <FormControl>
                      <Input placeholder="Residential" {...field} value={field.value ?? ""} />
                    </FormControl>
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
                      <Input placeholder="https://maps.app.goo.gl/…" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </FormSection>

        <FormSection
          id="land-setup"
          title="Land setup"
          description="The estate's total physical size and its initial product pools."
        >
          <LandSetupSection />
        </FormSection>

        <FormSection
          id="availability"
          title="Availability"
          description="Who can see this asset."
        >
          <FormField
            control={form.control}
            name="visibility"
            render={({ field }) => (
              <FormItem className="sm:max-w-xs">
                <FormLabel className="text-xs">Visibility</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {VISIBILITIES.map((visibility) => (
                      // The backend refuses to create an estate as public (409 SQM_INVENTORY_NOT_ACTIVE):
                      // it has no unit capacity and no active sqm ledger yet, and this form sets neither.
                      // Public is chosen on the asset's page once it does.
                      <SelectItem key={visibility} value={visibility} disabled={visibility === "public"}>
                        {VISIBILITY_LABELS[visibility]}
                        {visibility === "public" ? " — after creation" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription className="text-xs">
                  Draft keeps it off the app entirely. A new estate can&apos;t be made Public until it has
                  unit capacity or its sqm inventory is active, so set Public from the asset&apos;s page
                  after creating it.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </FormSection>

        <FormSection
          id="media"
          title="Images and documents"
          description="Uploaded as you choose them, so submitting is one quick step."
          defaultOpen={false}
        >
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="hero_image"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <SingleUploadField
                      id="hero_image"
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
                      id="pictures"
                      label="Gallery"
                      value={field.value ?? []}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              {DOCUMENT_SLOTS.map((slot) => (
                <FormField
                  key={slot.key}
                  control={form.control}
                  name={`documents.${slot.key}` as const}
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <SingleUploadField
                          id={`documents.${slot.key}`}
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
        </FormSection>

        <FormSection
          id="review"
          title="Review and create"
          description="A last look before the asset and its land account are created."
        >
          <ReviewAndCreateSection />
        </FormSection>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t pt-4">
          {isUploading ? (
            <p className="text-sm text-muted-foreground">Waiting for uploads to finish…</p>
          ) : null}

          <Button type="button" variant="outline" onClick={() => router.push("/assets")}>
            Cancel
          </Button>

          {/* Submitting mid-upload would send a gallery missing half its images. */}
          <Button type="submit" disabled={submitting || isUploading}>
            {submitting ? (
              <>
                Creating <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              </>
            ) : (
              "Create asset"
            )}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
