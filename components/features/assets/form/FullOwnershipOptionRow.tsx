"use client";

import { useState } from "react";
import { Control } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2 } from "lucide-react";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CreateFullOwnershipAssetFormValues } from "@/lib/schemas/assets";

interface FullOwnershipOptionRowProps {
  index: number;
  control: Control<CreateFullOwnershipAssetFormValues>;
  remove: () => void;
}

export function FullOwnershipOptionRow({
  index,
  control,
  remove,
}: FullOwnershipOptionRowProps) {
  const [promoPlans, setPromoPlans] = useState({
    oneMonth: false,
    fiveMonths: false,
    sevenMonths: false,
  });

  const togglePromo = (plan: keyof typeof promoPlans) => {
    setPromoPlans((prev) => ({ ...prev, [plan]: !prev[plan] }));
  };

  return (
    <div className="border p-4 rounded-lg bg-gray-50 space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-medium text-sm">Option {index + 1}</h4>
        <Button type="button" variant="ghost" size="sm" onClick={remove} className="text-red-500">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
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
        <FormField
          control={control}
          name={`asset_option.${index}.unit`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Total Units (Stock)</FormLabel>
              <FormControl>
                <Input type="number" {...field} className="bg-white" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={control}
          name={`asset_option.${index}.price`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Base Price (₦)</FormLabel>
              <FormControl>
                <Input type="number" {...field} className="bg-white" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={control}
          name={`asset_option.${index}.development_fee`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Development Fee (₦)</FormLabel>
              <FormControl>
                <Input type="number" {...field} className="bg-white" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="space-y-3 pl-4 border-l-2 border-gray-200">
        <h5 className="text-sm font-medium">Payment Durations (Prices in ₦)</h5>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <FormField
            control={control}
            name={`asset_option.${index}.zero_months`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Outright (0 Months)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} className="bg-white text-sm" placeholder="Price" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`asset_option.${index}.three_months`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">3 Months</FormLabel>
                <FormControl>
                  <Input type="number" {...field} className="bg-white text-sm" placeholder="Price" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`asset_option.${index}.six_months`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">6 Months</FormLabel>
                <FormControl>
                  <Input type="number" {...field} className="bg-white text-sm" placeholder="Price" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`asset_option.${index}.twelve_months`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">12 Months</FormLabel>
                <FormControl>
                  <Input type="number" {...field} className="bg-white text-sm" placeholder="Price" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Promo Plans Section */}
        <div className="pt-4 border-t border-dashed space-y-3">
          <h5 className="text-sm font-medium text-orange-600">Promo Plans</h5>

          {/* Toggles */}
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`promo-1-${index}`}
                checked={promoPlans.oneMonth}
                onChange={() => togglePromo("oneMonth")}
                className="rounded border-gray-300"
              />
              <label htmlFor={`promo-1-${index}`} className="cursor-pointer select-none">1 Month</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`promo-5-${index}`}
                checked={promoPlans.fiveMonths}
                onChange={() => togglePromo("fiveMonths")}
                className="rounded border-gray-300"
              />
              <label htmlFor={`promo-5-${index}`} className="cursor-pointer select-none">5 Months</label>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id={`promo-7-${index}`}
                checked={promoPlans.sevenMonths}
                onChange={() => togglePromo("sevenMonths")}
                className="rounded border-gray-300"
              />
              <label htmlFor={`promo-7-${index}`} className="cursor-pointer select-none">7 Months</label>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {/* 1 Month Fields */}
            {promoPlans.oneMonth && (
              <div className="space-y-1 p-2 bg-orange-50 rounded border border-orange-100">
                <FormField
                  control={control}
                  name={`asset_option.${index}.one_month`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">1 Month Price</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} className="bg-white text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`asset_option.${index}.one_month_initial_payment`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">1 Month Initial</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} className="bg-white text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* 5 Months Fields */}
            {promoPlans.fiveMonths && (
              <div className="space-y-1 p-2 bg-orange-50 rounded border border-orange-100">
                <FormField
                  control={control}
                  name={`asset_option.${index}.five_months`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">5 Months Price</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} className="bg-white text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`asset_option.${index}.five_months_initial_payment`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">5 Months Initial</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} className="bg-white text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* 7 Months Fields */}
            {promoPlans.sevenMonths && (
              <div className="space-y-1 p-2 bg-orange-50 rounded border border-orange-100">
                <FormField
                  control={control}
                  name={`asset_option.${index}.seven_months`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">7 Months Price</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} className="bg-white text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name={`asset_option.${index}.seven_months_initial_payment`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs">7 Months Initial</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} className="bg-white text-sm" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-2 border-t">
          <FormField
            control={control}
            name={`asset_option.${index}.initial_payment`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">General Initial Payment</FormLabel>
                <FormControl>
                  <Input type="number" {...field} className="bg-white text-sm" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name={`asset_option.${index}.monthly_installment`}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">General Monthly Installment</FormLabel>
                <FormControl>
                  <Input type="number" {...field} className="bg-white text-sm" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}
