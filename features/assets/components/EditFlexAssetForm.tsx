"use client";

import { useEffect, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { updateFlexAsset } from "@/lib/api/admin/assets.client";
import { toast } from "sonner";
import { Plus, X, Trash2, FileText, ExternalLink } from "lucide-react";
import {
  updateFlexAssetSchema,
  UpdateFlexAssetFormValues,
  FlexPaymentPlan,
  CreateFlexAssetFormValues // Import for type compatibility with sub-components
} from "@/lib/schemas/assets";
import { useRouter } from "next/navigation";

// Sub-components
import { AssetBasicInfo } from "./form/AssetBasicInfo";
import { PaymentPlanGenerator } from "./form/PaymentPlanGenerator";
import { AssetOptionRow } from "./form/AssetOptionRow";
import { FileUpload } from "@/components/ui/FileUpload";

interface EditFlexAssetFormProps {
  initialData: UpdateFlexAssetFormValues;
}

export function EditFlexAssetForm({ initialData }: EditFlexAssetFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatorModal, setGeneratorModal] = useState<{
    open: boolean;
    optionIndex: number;
  }>({ open: false, optionIndex: -1 });
  const [customPercent, setCustomPercent] = useState(5);
  const [durationsInput, setDurationsInput] = useState("");

  const form = useForm<UpdateFlexAssetFormValues>({
    resolver: zodResolver(updateFlexAssetSchema) as any,
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

  // Auto-generate helper logic (copied from Create form)
  const openGeneratorModal = (optionIndex: number) => {
    setGeneratorModal({ open: true, optionIndex });
    setCustomPercent(5);
    setDurationsInput("");
  };

  const calculateGeneratedPlan = (
    basePlan: FlexPaymentPlan,
    newDurationMonths: number,
    percent: number
  ): FlexPaymentPlan => {
    const ANCHOR_DURATION = 36;
    const basePrice = basePlan.price;

    const yearDifference = (newDurationMonths - ANCHOR_DURATION) / 12;
    const priceAdjustmentPercent = yearDifference * percent;
    const newPrice = Math.round(basePrice * (1 + priceAdjustmentPercent / 100));
    const newMonthlyInstallment = Math.round(newPrice / newDurationMonths);
    const newInitialPayment = newMonthlyInstallment;

    return {
      description: "not needed",
      duration_months: newDurationMonths,
      initial_payment: newInitialPayment,
      monthly_installment: newMonthlyInstallment,
      price: newPrice,
      unit: 50,
    };
  };

  const generatePaymentPlans = () => {
    const { optionIndex } = generatorModal;
    if (optionIndex === -1) return;

    // Type casting because we know the structure is compatible for these fields
    const currentPlans = form.getValues(`asset_option.${optionIndex}.flex_payment_plans`) as FlexPaymentPlan[];
    const basePlan = currentPlans.find((plan) => plan.duration_months === 36);

    if (!basePlan) {
      toast.error("A 36-month payment plan is required as the base.");
      return;
    }

    const durationsString = durationsInput.trim();
    if (!durationsString) {
      toast.error("Please enter at least one duration");
      return;
    }

    const durations = durationsString
      .split(",")
      .map((d) => parseInt(d.trim()))
      .filter((d) => !isNaN(d) && d > 0);

    if (durations.length === 0) {
      toast.error("Please enter valid duration values");
      return;
    }

    const existingDurations = currentPlans.map((p) => p.duration_months);
    const duplicates = durations.filter((d) => existingDurations.includes(d));

    if (duplicates.length > 0) {
      toast.error(`Duration(s) ${duplicates.join(", ")} already exist`);
      return;
    }

    const newPlans = durations.map((duration) =>
      calculateGeneratedPlan(basePlan, duration, customPercent)
    );

    form.setValue(`asset_option.${optionIndex}.flex_payment_plans`, [...currentPlans, ...newPlans]);

    toast.success(`${newPlans.length} payment plan(s) generated successfully`);
    setGeneratorModal({ open: false, optionIndex: -1 });
  };

  const getPreviewData = () => {
    const { optionIndex } = generatorModal;
    if (optionIndex === -1) return [];

    const currentPlans = form.getValues(`asset_option.${optionIndex}.flex_payment_plans`) as FlexPaymentPlan[];
    const basePlan = currentPlans.find((plan) => plan.duration_months === 36);

    if (!basePlan) return [];

    const durationsString = durationsInput.trim();
    if (!durationsString) return [];

    const durations = durationsString
      .split(",")
      .map((d) => parseInt(d.trim()))
      .filter((d) => !isNaN(d) && d > 0);

    return durations.map((duration) => {
      const yearDifference = (duration - 36) / 12;
      const priceAdjustmentPercent = yearDifference * customPercent;
      const newPrice = Math.round(basePlan.price * (1 + priceAdjustmentPercent / 100));

      return {
        duration,
        price: newPrice,
        adjustmentPercent: priceAdjustmentPercent,
      };
    });
  };

  async function onSubmit(data: UpdateFlexAssetFormValues) {
    setIsSubmitting(true);
    try {
      await updateFlexAsset({
        id: data.id,
        asset_name: data.asset_name,
        asset_location: data.asset_location,
        title: data.title,
        description: data.description,
        asset_option: data.asset_option as any, // Cast to avoid minor type mismatches with input/output types
      });

      toast.success("Asset updated successfully");
      router.refresh(); // Refresh page data
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
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-4xl mx-auto py-10">

          {/* Reusing AssetBasicInfo - casting form to match expected type if mostly compatible */}
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
                    {/* List existing/staged files */}
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

            {/* Documents - handled individually for simplicity in replacement */}
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
                                <p className="text-xs font-medium truncate max-w-[180px]">
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

          {/* Asset Options - Reusing AssetOptionRow */}
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
                    flex_payment_plans: [],
                  })
                }
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Option
              </Button>
            </div>

            {optionFields.map((field, index) => (
              <AssetOptionRow
                key={field.id}
                index={index}
                control={form.control as unknown as any} // Casting to bypass strict type check on similar types
                remove={() => removeOption(index)}
                onOpenGenerator={() => openGeneratorModal(index)}
                watchPlans={form.watch(`asset_option.${index}.flex_payment_plans`) as FlexPaymentPlan[]}
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

      <PaymentPlanGenerator
        form={form as any} // Casting for reusable component
        open={generatorModal.open}
        onOpenChange={(open) => setGeneratorModal((prev) => ({ ...prev, open }))}
        optionIndex={generatorModal.optionIndex}
        customPercent={customPercent}
        setCustomPercent={setCustomPercent}
        durationsInput={durationsInput}
        setDurationsInput={setDurationsInput}
        onGenerate={generatePaymentPlans}
        previewData={generatorModal.open ? getPreviewData() : []}
      />
    </>
  );
}
