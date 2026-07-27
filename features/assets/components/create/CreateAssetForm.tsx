"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { FormProvider, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

import {
  OFFER_TYPES,
  OFFER_TYPE_LABELS,
  TOPOGRAPHIES,
  VISIBILITIES,
  VISIBILITY_LABELS,
} from "../../schemas/asset.schema";
import {
  createAssetFormSchema,
  createAssetFormToPayload,
  type CreateAssetFormValues,
} from "../../schemas/create-asset.schema";
import { useCreateAsset } from "../../hooks/use-create-asset-v2";
import { useAssetFormStore } from "../../store/asset-form-store";
import { FormSection } from "./FormSection";
import { OfferSection, emptySize } from "./OfferSection";
import { PlanGeneratorDialog } from "./PlanGeneratorDialog";
import { GalleryUploadField, SingleUploadField } from "./UploadFields";

const DOCUMENT_SLOTS = [
  { key: "deed_of_assignment", label: "Deed of assignment" },
  { key: "survey", label: "Survey" },
  { key: "contract_of_sales", label: "Contract of sales" },
  { key: "estate_layout", label: "Estate layout" },
] as const;

const emptyOffer = (offerType: (typeof OFFER_TYPES)[number]) => ({
  offer_type: offerType,
  is_active: true,
  allocation_qualification_pct: undefined as unknown as number,
  payment_type: undefined,
  sizes: [emptySize()],
});

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
      sales_cap: undefined as unknown as number,
      visibility: "draft",
      offers: [emptyOffer("flex")],
    },
  });

  const offers = useFieldArray({ control: form.control, name: "offers" });

  // `useWatch` rather than `form.watch()` — the latter returns a fresh function
  // each render, which makes React Compiler skip memoising this component.
  const watchedOffers = useWatch({ control: form.control, name: "offers" });
  const usedOfferTypes = watchedOffers?.map((offer) => offer?.offer_type) ?? [];
  const availableOfferTypes = OFFER_TYPES.filter((type) => !usedOfferTypes.includes(type));

  function onSubmit(values: CreateAssetFormValues) {
    const parsed = createAssetFormSchema.parse(values);

    createAsset.mutate(createAssetFormToPayload(parsed), {
      onSuccess: (asset) => {
        toast.success(`${asset.name} created`);
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
          id="availability"
          title="Availability"
          description="How many units can be sold, and who can see this asset."
        >
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
                    Total units available across every offer. Selling stops when it&apos;s reached.
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
                  <FormDescription className="text-xs">
                    Draft keeps it off the app entirely.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
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

        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="font-medium">Offers</h2>
              <p className="text-sm text-muted-foreground">
                An asset needs at least one. It can sell flex, full ownership, or both.
              </p>
            </div>

            {availableOfferTypes.length > 0 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button" variant="outline" size="sm">
                    <Plus className="mr-1 h-3.5 w-3.5" />
                    Add offer
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {availableOfferTypes.map((offerType) => (
                    <DropdownMenuItem
                      key={offerType}
                      onClick={() => offers.append(emptyOffer(offerType))}
                    >
                      {OFFER_TYPE_LABELS[offerType]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>

          {offers.fields.map((offer, offerIndex) => (
            <OfferSection
              key={offer.id}
              offerIndex={offerIndex}
              canRemove={offers.fields.length > 1}
              onRemove={() => offers.remove(offerIndex)}
            />
          ))}

          {form.formState.errors.offers?.message ? (
            <p className="text-sm text-destructive">{form.formState.errors.offers.message}</p>
          ) : null}
        </div>

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

      <PlanGeneratorDialog />
    </FormProvider>
  );
}
