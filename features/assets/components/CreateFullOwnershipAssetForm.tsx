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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
      deed_of_assignment: undefined,
      survey: undefined,
      contract_of_sales: undefined,
      estate_layout: undefined,
      asset_history: [{ year: new Date().getFullYear(), value: 0 }],
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

  const {
    fields: historyFields,
    append: appendHistory,
    remove: removeHistory,
  } = useFieldArray({
    control: form.control,
    name: "asset_history",
  });

  async function onSubmit(data: CreateFullOwnershipAssetFormValues) {
    setIsSubmitting(true);
    try {
      // 1. Upload Images
      const uploadedPictures = await Promise.all(
        data.asset_pictures.map((file) => uploadToCloudinary(file, "assets"))
      );
      const pictureUrls = uploadedPictures.map((res) => res.secure_url);

      // 2. Upload Documents (required)
      const deedRes = await uploadToCloudinary(data.deed_of_assignment, "documents");
      const surveyRes = await uploadToCloudinary(data.survey, "documents");
      const contractRes = await uploadToCloudinary(data.contract_of_sales, "documents");
      const estateRes = data.estate_layout
        ? await uploadToCloudinary(data.estate_layout, "documents")
        : null;

      const payload: CreateFullOwnershipAssetInput = {
        asset_name: data.asset_name,
        asset_location: data.asset_location,
        title: data.title,
        asset_type: data.asset_type,
        description: data.description,
        allocation_qualification: data.allocation_qualification,
        amenities: data.amenities.split(",").map((s) => s.trim()).filter(Boolean),
        asset_pictures: pictureUrls,
        deed_of_assignment: deedRes.secure_url,
        survey: surveyRes.secure_url,
        contract_of_sales: contractRes.secure_url,
        estate_layout: estateRes?.secure_url || "",
        asset_history: Object.fromEntries(
          (data.asset_history || []).map((h) => [String(h.year), Number(h.value)])
        ),
        new_asset: data.new_asset,
        asset_option: data.asset_option.map((opt) => ({
          ...opt,
          size: Number(opt.size),
          unit: Number(opt.unit),
          price: Number(opt.price),
          zero_months: opt.zero_months ? Number(opt.zero_months) : undefined,
          three_months: opt.three_months ? Number(opt.three_months) : undefined,
          six_months: opt.six_months ? Number(opt.six_months) : undefined,
          twelve_months: opt.twelve_months ? Number(opt.twelve_months) : undefined,
          development_fee: opt.development_fee ? Number(opt.development_fee) : undefined,
          initial_payment: opt.initial_payment ? Number(opt.initial_payment) : undefined,
          monthly_installment: opt.monthly_installment ? Number(opt.monthly_installment) : undefined,
          one_month: opt.one_month ? Number(opt.one_month) : undefined,
          one_month_initial_payment: opt.one_month_initial_payment ? Number(opt.one_month_initial_payment) : undefined,
          five_months: opt.five_months ? Number(opt.five_months) : undefined,
          five_months_initial_payment: opt.five_months_initial_payment ? Number(opt.five_months_initial_payment) : undefined,
          seven_months: opt.seven_months ? Number(opt.seven_months) : undefined,
          seven_months_initial_payment: opt.seven_months_initial_payment ? Number(opt.seven_months_initial_payment) : undefined,
        })),
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

        {/* Asset History */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Asset History</h3>
            <Button type="button" variant="outline" size="sm" onClick={() => appendHistory({ year: new Date().getFullYear(), value: 0 })}>
              Add Year
            </Button>
          </div>
          <div className="space-y-3">
            {historyFields.map((field, index) => (
              <div key={field.id} className="grid grid-cols-2 gap-3 items-end">
                <div className="space-y-1">
                  <Label>Year</Label>
                  <Input
                    type="number"
                    {...form.register(`asset_history.${index}.year` as const, { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Value (₦)</Label>
                  <Input
                    type="number"
                    {...form.register(`asset_history.${index}.value` as const, { valueAsNumber: true })}
                  />
                </div>
                <div className="col-span-2 flex justify-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeHistory(index)}
                    disabled={historyFields.length <= 1}
                  >
                    Remove
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? "Creating Asset..." : "Create Full Ownership Asset"}
        </Button>
      </form>
    </Form>
  );
}
