"use client";

import { useFieldArray, Control } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, Plus, Zap, X } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CreateFlexAssetFormValues, FlexPaymentPlan } from "@/lib/schemas/assets";

interface AssetOptionRowProps {
  index: number;
  control: Control<CreateFlexAssetFormValues>;
  remove: () => void;
  onOpenGenerator: () => void;
  watchPlans: FlexPaymentPlan[];
}

export function AssetOptionRow({
  index,
  control,
  remove,
  onOpenGenerator,
  watchPlans,
}: AssetOptionRowProps) {
  const { fields, append, remove: removePlan } = useFieldArray({
    control,
    name: `asset_option.${index}.flex_payment_plans`,
  });

  return (
    <div className="border p-4 rounded-lg bg-gray-50 space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium text-sm">Option {index + 1}</h4>
        <Button type="button" variant="ghost" size="sm" onClick={remove} className="text-red-500">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <FormField
        control={control}
        name={`asset_option.${index}.size`}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Size (sqm)</FormLabel>
            <FormControl>
              <Input type="number" {...field} className="bg-white" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="space-y-3 pl-4 border-l-2 border-gray-200">
        <div className="flex justify-between items-center">
          <h5 className="text-sm font-medium">Payment Plans</h5>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() =>
                append({
                  description: "not needed",
                  duration_months: 0,
                  initial_payment: 0,
                  monthly_installment: 0,
                  price: 0,
                  unit: 0,
                })
              }
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Plan
            </Button>
            {watchPlans?.length > 0 && (
              <Button
                type="button"
                variant="default"
                size="sm"
                className="bg-orange-500 hover:bg-orange-600"
                onClick={onOpenGenerator}
              >
                <Zap className="h-4 w-4 mr-1" />
                Auto-Generate
              </Button>
            )}
          </div>
        </div>

        {fields.map((planField, planIndex) => (
          <div
            key={planField.id}
            className="grid grid-cols-2 md:grid-cols-3 gap-3 p-3 bg-white rounded border"
          >
            <FormField
              control={control}
              name={`asset_option.${index}.flex_payment_plans.${planIndex}.price`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Price</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} className="h-8 text-xs" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`asset_option.${index}.flex_payment_plans.${planIndex}.duration_months`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Months</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} className="h-8 text-xs" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`asset_option.${index}.flex_payment_plans.${planIndex}.initial_payment`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Initial</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} className="h-8 text-xs" />
                  </FormControl>
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name={`asset_option.${index}.flex_payment_plans.${planIndex}.monthly_installment`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Monthly</FormLabel>
                  <FormControl>
                    <Input type="number" {...field} className="h-8 text-xs" />
                  </FormControl>
                </FormItem>
              )}
            />
            <div className="flex items-end gap-2">
              <FormField
                control={control}
                name={`asset_option.${index}.flex_payment_plans.${planIndex}.unit`}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="text-xs">Units</FormLabel>
                    <FormControl>
                      <Input type="number" {...field} className="h-8 text-xs" />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removePlan(planIndex)}
                className="h-8 w-8 text-red-500"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
