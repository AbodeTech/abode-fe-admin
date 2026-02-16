"use client";

import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { createFlexAssetAction } from "@/lib/actions/assets";
import { uploadToCloudinary } from "@/lib/utils/upload";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { CreateFlexAssetInput } from "@/lib/api/admin/assets";
import {
  createFlexAssetSchema,
  CreateFlexAssetFormValues,
  FlexPaymentPlan
} from "@/lib/schemas/assets";

// Sub-components
import { AssetBasicInfo } from "./form/AssetBasicInfo";
import { AssetUploads } from "./form/AssetUploads";
import { PaymentPlanGenerator } from "./form/PaymentPlanGenerator";
import { AssetOptionRow } from "./form/AssetOptionRow";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


export function CreateFlexAssetForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatorModal, setGeneratorModal] = useState<{
    open: boolean;
    optionIndex: number;
  }>({ open: false, optionIndex: -1 });
  const [customPercent, setCustomPercent] = useState(5);
  const [durationsInput, setDurationsInput] = useState("");

  const form = useForm<CreateFlexAssetFormValues>({
    resolver: zodResolver(createFlexAssetSchema) as any,
    defaultValues: {
      asset_name: "",
      asset_location: "",
      title: "",
      asset_type: "flex",
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
          flex_payment_plans: [
            {
              description: "not needed",
              duration_months: 0,
              initial_payment: 0,
              monthly_installment: 0,
              price: 0,
              unit: 0,
            },
          ],
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

  // Auto-generate helpers
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
      unit: basePlan.unit ?? 50,
    };
  };

  const generatePaymentPlans = () => {
    const { optionIndex } = generatorModal;
    if (optionIndex === -1) return;

    const currentPlans = form.getValues(`asset_option.${optionIndex}.flex_payment_plans`);
    const basePlan = currentPlans.find((plan) => plan.duration_months === 36);

    if (!basePlan) {
      toast.error("A 36-month payment plan is required as the base. Please create one first.");
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

    const currentPlans = form.getValues(`asset_option.${optionIndex}.flex_payment_plans`);
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

  async function onSubmit(data: CreateFlexAssetFormValues) {
    setIsSubmitting(true);
    try {
      // 1. Upload Images
      const uploadedPictures = await Promise.all(
        data.asset_pictures.map((file) => uploadToCloudinary(file, "assets"))
      );
      const pictureUrls = uploadedPictures.map((res) => res.secure_url);

      // 2. Upload Documents (required/optional per schema)
      const deedRes = await uploadToCloudinary(data.deed_of_assignment, "documents");
      const surveyRes = await uploadToCloudinary(data.survey, "documents");
      const contractRes = await uploadToCloudinary(data.contract_of_sales, "documents");
      const estateRes = data.estate_layout
        ? await uploadToCloudinary(data.estate_layout, "documents")
        : null;

      const payload: CreateFlexAssetInput = {
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
          flex_payment_plans: opt.flex_payment_plans.map((plan) => ({
            ...plan,
            duration_months: Number(plan.duration_months),
            initial_payment: Number(plan.initial_payment),
            monthly_installment: Number(plan.monthly_installment),
            price: Number(plan.price),
            unit: Number(plan.unit),
          })),
        })),
      };

      await createFlexAssetAction(payload);
      toast.success("Asset created successfully");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to create asset";
      toast.error(message);
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-w-4xl mx-auto py-10">

          <AssetBasicInfo form={form} />

          <AssetUploads form={form} />

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
                control={form.control}
                remove={() => removeOption(index)}
                onOpenGenerator={() => openGeneratorModal(index)}
                watchPlans={form.watch(`asset_option.${index}.flex_payment_plans`)}
              />
            ))}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full">
            {isSubmitting ? "Creating Asset..." : "Create Asset"}
          </Button>
        </form>
      </Form>

      <PaymentPlanGenerator
        form={form}
        open={generatorModal.open}
        onOpenChange={(open) => setGeneratorModal(prev => ({ ...prev, open }))}
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
