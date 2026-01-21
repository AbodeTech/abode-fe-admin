"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UseFormReturn } from "react-hook-form";
import { CreateFlexAssetFormValues, FlexPaymentPlan } from "@/lib/schemas/assets";

interface PaymentPlanGeneratorProps {
  form: UseFormReturn<CreateFlexAssetFormValues>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  optionIndex: number;
  customPercent: number;
  setCustomPercent: (val: number) => void;
  durationsInput: string;
  setDurationsInput: (val: string) => void;
  onGenerate: () => void;
  previewData: {
    duration: number;
    price: number;
    adjustmentPercent: number;
  }[];
}

export function PaymentPlanGenerator({
  form,
  open,
  onOpenChange,
  optionIndex,
  customPercent,
  setCustomPercent,
  durationsInput,
  setDurationsInput,
  onGenerate,
  previewData,
}: PaymentPlanGeneratorProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Generate Payment Plans from 36-Month Base</DialogTitle>
          <DialogDescription>
            All plans are calculated from your 36-month plan. Enter durations and customize the
            annual percentage adjustment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Base plan info */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm font-medium text-blue-900 mb-1">Base Plan (36 months)</p>
            {optionIndex !== -1 &&
              (() => {
                const plans = form.watch(
                  `asset_option.${optionIndex}.flex_payment_plans`
                );
                const basePlan = plans?.find((p) => p.duration_months === 36);
                return basePlan ? (
                  <p className="text-sm text-blue-700">
                    Price: ₦{basePlan.price.toLocaleString()} | Monthly: ₦
                    {basePlan.monthly_installment.toLocaleString()}
                  </p>
                ) : (
                  <p className="text-sm text-red-600">
                    ⚠️ No 36-month plan found. Please create one first.
                  </p>
                );
              })()}
          </div>

          {/* Custom Percentage */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Annual Percentage Adjustment (%)</label>
            <Input
              type="number"
              min="0"
              max="100"
              step="0.5"
              value={customPercent}
              onChange={(e) => setCustomPercent(parseFloat(e.target.value) || 0)}
              placeholder="e.g., 5, 8, 12"
            />
            <p className="text-xs text-gray-500">
              Price adjusts by this percentage per year from the 36-month base. Default: 5%
            </p>
          </div>

          {/* Durations Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Enter durations (in months, separate with commas)
            </label>
            <Input
              placeholder="e.g., 12, 24, 48, 60"
              value={durationsInput}
              onChange={(e) => setDurationsInput(e.target.value)}
            />
            <p className="text-xs text-gray-500">Enter multiple durations separated by commas</p>
          </div>

          {/* Preview */}
          {previewData.length > 0 && (
            <div className="space-y-2 p-4 bg-gray-50 rounded-md">
              <h4 className="text-sm font-medium mb-2">Preview:</h4>
              <div className="space-y-1">
                {previewData.map((preview, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className="text-green-600">✓</span>
                      <span>{preview.duration} months</span>
                    </span>
                    <span className="font-medium">
                      ₦{preview.price.toLocaleString()}
                      {preview.adjustmentPercent !== 0 && (
                        <span
                          className={`ml-2 text-xs ${preview.adjustmentPercent > 0 ? "text-red-600" : "text-green-600"
                            }`}
                        >
                          ({preview.adjustmentPercent > 0 ? "+" : ""}
                          {preview.adjustmentPercent.toFixed(1)}%)
                        </span>
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={onGenerate}>
            Generate Plans
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
