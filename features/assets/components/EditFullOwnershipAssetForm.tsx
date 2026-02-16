"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { updateFlexAsset } from "@/lib/api/admin/assets.client";
import { uploadToCloudinary } from "@/lib/utils/upload";
import { toast } from "sonner";
import { Plus, X, Trash2 } from "lucide-react";
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
  } = useFieldArray({
    control: form.control,
    name: "asset_option",
  });

  const {
    fields: historyFields,
    append: appendHistory,
    remove: removeHistory,
  } = useFieldArray({
    control: form.control,
    name: "asset_history",
  });

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

      await updateFlexAsset({
        id: data.id,
        asset_name: data.asset_name,
        asset_location: data.asset_location,
        title: data.title,
        asset_type: data.asset_type,
        description: data.description,
        allocation_qualification: data.allocation_qualification,
        amenities: data.amenities.split(",").map((s) => s.trim()),
        asset_pictures: finalPictureUrls,
        deed_of_assignment: deedUrl,
        survey: surveyUrl,
        contract_of_sales: contractUrl,
        estate_layout: estateLayoutUrl,
        asset_history: assetHistoryRecord,
        asset_option: data.asset_option as any, // Cast to match API expectactions
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-4xl mx-auto py-10">

        {/* Reusing AssetBasicInfo */}
        <AssetBasicInfo form={form as any} />

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
                        <div className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded">
                          <span className="truncate max-w-[200px] text-blue-600 underline">
                            <a href={field.value} target="_blank" rel="noopener noreferrer">View Current</a>
                          </span>
                          <Button
                            type="button" variant="ghost" size="sm" className="h-6 w-6 p-0"
                            onClick={() => field.onChange(undefined)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
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
          {isSubmitting ? "Updating Asset..." : "Update Asset"}
        </Button>
      </form>
    </Form>
  );
}
