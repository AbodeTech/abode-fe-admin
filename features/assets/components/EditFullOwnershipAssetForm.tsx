"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { editFullOwnershipAsset } from "@/lib/api/admin/assets.client";
import { uploadToCloudinary } from "@/lib/utils/upload";
import { toast } from "sonner";
import { Plus, X, Trash2, FileText, ExternalLink, Loader2 } from "lucide-react";
import {
  updateFullOwnershipAssetSchema,
  UpdateFullOwnershipAssetFormValues,
} from "@/lib/schemas/assets";
import { useRouter } from "next/navigation";

// Sub-components
import { AssetBasicInfo } from "./form/AssetBasicInfo";
import { FullOwnershipOptionRow } from "./form/FullOwnershipOptionRow";
import { FileUpload } from "@/components/ui/FileUpload";

interface EditFullOwnershipAssetFormProps {
  initialData: UpdateFullOwnershipAssetFormValues;
}

export function EditFullOwnershipAssetForm({ initialData }: EditFullOwnershipAssetFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UpdateFullOwnershipAssetFormValues>({
    resolver: zodResolver(updateFullOwnershipAssetSchema) as any,
    defaultValues: initialData,
  });

  const {
    fields: optionFields,
    append: appendOption,
    remove: removeOption,
    replace: replaceOption,
  } = useFieldArray({
    control: form.control,
    name: "asset_option",
  });

  const {
    fields: historyFields,
    append: appendHistory,
    remove: removeHistory,
    replace: replaceHistory,
  } = useFieldArray({
    control: form.control,
    name: "asset_history",
  });

  useEffect(() => {
    form.reset({
      ...initialData,
      asset_pictures: initialData.asset_pictures || [],
      asset_option: initialData.asset_option || [],
      asset_history: initialData.asset_history || [],
    });
    replaceOption(initialData.asset_option || []);
    replaceHistory(initialData.asset_history || []);
  }, [form, initialData, replaceOption, replaceHistory]);

  async function onSubmit(data: UpdateFullOwnershipAssetFormValues) {
    setIsSubmitting(true);
    try {
      // 1. Upload Images (New Files only)
      const pictures = data.asset_pictures || [];
      const newFiles = pictures.filter((p): p is File => p instanceof File);
      const existingUrls = pictures.filter((p): p is string => typeof p === "string");

      const uploadedPictures = await Promise.all(
        newFiles.map((file) => uploadToCloudinary(file, "assets"))
      );
      const newPictureUrls = uploadedPictures.map((res) => res.secure_url);

      const finalPictureUrls = [...existingUrls, ...newPictureUrls];

      // 2. Upload Documents (if new files provided)
      let deedUrl = typeof data.deed_of_assignment === 'string' ? data.deed_of_assignment : "";
      if (data.deed_of_assignment instanceof File) {
        const res = await uploadToCloudinary(data.deed_of_assignment, "documents");
        deedUrl = res.secure_url;
      }

      let surveyUrl = typeof data.survey === 'string' ? data.survey : "";
      if (data.survey instanceof File) {
        const res = await uploadToCloudinary(data.survey, "documents");
        surveyUrl = res.secure_url;
      }

      let contractUrl = typeof data.contract_of_sales === 'string' ? data.contract_of_sales : "";
      if (data.contract_of_sales instanceof File) {
        const res = await uploadToCloudinary(data.contract_of_sales, "documents");
        contractUrl = res.secure_url;
      }

      let estateLayoutUrl = typeof data.estate_layout === 'string' ? data.estate_layout : "";
      if (data.estate_layout instanceof File) {
        const res = await uploadToCloudinary(data.estate_layout, "documents");
        estateLayoutUrl = res.secure_url;
      }

      // 3. Format Asset History
      const assetHistoryRecord: Record<string, any> = {};
      if (data.asset_history) {
        data.asset_history.forEach(item => {
          assetHistoryRecord[item.year.toString()] = item.value;
        });
      }

      const amenitiesList = data.amenities
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const assetPurposeValue = data.asset_purpose?.trim() || initialData.asset_purpose || "";
      const googleMapValue = data.google_map?.trim() || initialData.google_map || "";
      const landmarkValue = data.landmark?.trim() || initialData.landmark || "";
      const landmarkList = landmarkValue
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const mappedAssetOptions = data.asset_option.map((option) => ({
        size: option.size,
        unit: option.unit,
        price: (option.zero_months ?? 0) + (option.development_fee ?? 0),
        zero_months: option.zero_months ?? 0,
        three_months: option.three_months ?? 0,
        six_months: option.six_months ?? 0,
        seven_months: option.seven_months ?? 0,
        twelve_months: option.twelve_months ?? 0,
        initial_payment: option.initial_payment ?? 0,
        development_fee: option.development_fee ?? 0,
        five_months: option.five_months ?? null,
        five_months_initial_payment: option.five_months_initial_payment ?? null,
        seven_months_initial_payment: option.seven_months_initial_payment ?? null,
        one_month: option.one_month ?? null,
        one_month_initial_payment: option.one_month_initial_payment ?? null,
        monthly_installment: null,
      }));

      await editFullOwnershipAsset({
        assetId: data.id,
        asset_name: data.asset_name,
        asset_location: data.asset_location,
        description: data.description,
        asset_pictures: finalPictureUrls,
        amenities: amenitiesList,
        contract_of_sales: contractUrl,
        survey: surveyUrl,
        deed_of_assignment: deedUrl,
        estate_layout: estateLayoutUrl,
        new_asset: true,
        asset_type: data.asset_type,
        asset_purpose: assetPurposeValue,
        landmark: landmarkList,
        asset_history: assetHistoryRecord,
        google_map: googleMapValue,
        asset_option: mappedAssetOptions as any,
      });

      toast.success("Asset updated successfully");
      router.refresh();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to update asset";
      toast.error(message);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  // Helper to handle mixed file/string updates
  const handlePictureUpload = (newFiles: File[]) => {
    const current = form.getValues("asset_pictures") || [];
    // Append new files to existing array
    form.setValue("asset_pictures", [...current, ...newFiles]);
  };

  const removePicture = (index: number) => {
    const current = form.getValues("asset_pictures") || [];
    const updated = [...current];
    updated.splice(index, 1);
    form.setValue("asset_pictures", updated);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit, () => {
          toast.error("Please fix the validation errors and try again.");
        })}
        className="space-y-8 max-w-4xl mx-auto py-10"
      >

        {/* Reusing AssetBasicInfo */}
        <AssetBasicInfo form={form as any} />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="asset_purpose"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Asset Purpose</FormLabel>
                <FormControl>
                  <Input placeholder="Residential" {...field} />
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
                <FormLabel>Google Map Link</FormLabel>
                <FormControl>
                  <Input placeholder="https://maps.google.com/..." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="landmark"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Landmarks (comma separated)</FormLabel>
              <FormControl>
                <Input placeholder="School, Hospital, Mall" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Custom Uploads Section for Edit Mode */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Uploads</h3>

          {/* Asset Pictures */}
          <FormField
            control={form.control}
            name="asset_pictures"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Asset Pictures</FormLabel>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {field.value?.map((item, idx) => (
                      <div key={idx} className="relative group border rounded p-2">
                        {typeof item === 'string' ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item} alt={`Asset ${idx}`} className="w-full h-24 object-cover rounded" />
                        ) : (
                          <div className="w-full h-24 flex items-center justify-center bg-gray-100 text-xs text-center p-1">
                            {item.name}
                          </div>
                        )}
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removePicture(idx)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  <FormControl>
                    <FileUpload
                      onFilesChange={handlePictureUpload}
                      accept={{ "image/*": [".jpeg", ".jpg", ".png"] }}
                      maxFiles={10}
                      label="Add Pictures"
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Documents */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['deed_of_assignment', 'survey', 'contract_of_sales', 'estate_layout'].map((docName) => (
              <FormField
                key={docName}
                control={form.control}
                name={docName as any}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="capitalize">{docName.split('_').join(' ')}</FormLabel>
                    <div className="space-y-2">
                      {field.value && typeof field.value === 'string' && (
                        <div className="flex items-center justify-between gap-3 bg-muted/40 border rounded-lg px-3 py-2.5">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded bg-rose-50 border border-rose-100">
                              <FileText className="h-4 w-4 text-rose-500" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-medium truncate max-w-45">
                                {decodeURIComponent(field.value.split('/').pop()?.split('?')[0] || 'document.pdf')}
                              </p>
                              <p className="text-[10px] text-muted-foreground">PDF · Cloudinary</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              type="button" variant="ghost" size="icon" className="h-7 w-7"
                              asChild
                            >
                              <a href={field.value} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            </Button>
                            <Button
                              type="button" variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => field.onChange(undefined)}
                            >
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      )}
                      <FormControl>
                        <FileUpload
                          onFilesChange={(files) => field.onChange(files[0])}
                          maxFiles={1}
                          label={field.value ? "Replace Document" : "Upload Document"}
                        />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
          </div>
        </div>

        {/* Asset Options */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Asset Options</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendOption({
                  size: 0,
                  unit: 0,
                  price: 0,
                })
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Option
            </Button>
          </div>

          {optionFields.map((field, index) => (
            <FullOwnershipOptionRow
              key={field.id}
              index={index}
              control={form.control as any}
              remove={() => removeOption(index)}
            />
          ))}
        </div>

        {/* Asset History Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Asset History</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                appendHistory({
                  year: new Date().getFullYear(),
                  value: 0
                })
              }
            >
              <Plus className="h-4 w-4 mr-2" />
              Add History
            </Button>
          </div>

          {historyFields.map((field, index) => (
            <div key={field.id} className="flex gap-4 items-end border p-4 rounded bg-gray-50">
              <FormField
                control={form.control}
                name={`asset_history.${index}.year`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Year</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`asset_history.${index}.value`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Value</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="button" variant="ghost" size="icon" onClick={() => removeHistory(index)} className="text-red-500">
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          ))}
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Updating Asset...
            </span>
          ) : (
            "Update Asset"
          )}
        </Button>
      </form>
    </Form>
  );
}
