"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { createFullOwnershipAssetAction } from "@/lib/actions/assets";
import { uploadToCloudinary } from "@/lib/utils/upload";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { CreateFullOwnershipAssetInput } from "@/lib/api/admin/assets";
import {
  createFullOwnershipAssetSchema,
  CreateFullOwnershipAssetFormValues,
} from "@/lib/schemas/assets";

// Sub-components
import { AssetBasicInfo } from "./form/AssetBasicInfo";
import { AssetUploads } from "./form/AssetUploads";
import { FullOwnershipOptionRow } from "./form/FullOwnershipOptionRow";

export function CreateFullOwnershipAssetForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateFullOwnershipAssetFormValues>({
    resolver: zodResolver(createFullOwnershipAssetSchema) as any,
    defaultValues: {
      asset_name: "",
      asset_location: "",
      title: "",
      asset_type: "full-ownership",
      description: "",
      allocation_qualification: 0,
      amenities: "",
      new_asset: true,
      asset_pictures: [] as File[],
      asset_option: [
        {
          size: 0,
          unit: 0,
          price: 0,
          initial_payment: 0,
          monthly_installment: 0,
        },
      ],
    },
  });

  const {
    fields: optionFields,
    append: appendOption,
    remove: removeOption,
  } = useFieldArray({
    control: form.control,
    name: "asset_option",
  });

  async function onSubmit(data: CreateFullOwnershipAssetFormValues) {
    setIsSubmitting(true);
    try {
      // 1. Upload Images
      const uploadedPictures = await Promise.all(
        data.asset_pictures.map((file) => uploadToCloudinary(file, "assets"))
      );
      const pictureUrls = uploadedPictures.map((res) => res.secure_url);

      // 2. Upload Documents (if present)
      let deedUrl = "";
      if (data.deed_of_assignment) {
        const res = await uploadToCloudinary(data.deed_of_assignment, "documents");
        deedUrl = res.secure_url;
      }

      let surveyUrl = "";
      if (data.survey) {
        const res = await uploadToCloudinary(data.survey, "documents");
        surveyUrl = res.secure_url;
      }

      let contractUrl = "";
      if (data.contract_of_sales) {
        const res = await uploadToCloudinary(data.contract_of_sales, "documents");
        contractUrl = res.secure_url;
      }

      const payload: CreateFullOwnershipAssetInput = {
        asset_name: data.asset_name,
        asset_location: data.asset_location,
        title: data.title,
        asset_type: data.asset_type,
        description: data.description,
        allocation_qualification: data.allocation_qualification,
        amenities: data.amenities.split(",").map((s) => s.trim()),
        asset_pictures: pictureUrls,
        deed_of_assignment: deedUrl,
        survey: surveyUrl,
        contract_of_sales: contractUrl,
        estate_layout: data.estate_layout || "",
        asset_history: {},
        new_asset: data.new_asset,
        asset_option: data.asset_option as any, // Type assertion for optional fields
      };

      await createFullOwnershipAssetAction(payload);
      toast.success("Full Ownership Asset created successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create asset";
      toast.error(message);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-4xl mx-auto py-10">

        <AssetBasicInfo form={form} />

        <AssetUploads form={form} />

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
              control={form.control}
              remove={() => removeOption(index)}
            />
          ))}
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Creating Asset..." : "Create Full Ownership Asset"}
        </Button>
      </form>
    </Form>
  );
}
