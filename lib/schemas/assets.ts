"use client";

import * as z from "zod";

export const paymentPlanSchema = z.object({
  description: z.string().default("not needed"),
  duration_months: z.coerce.number().min(1, "Duration must be at least 1 month"),
  initial_payment: z.coerce.number().min(0, "Initial payment must be valid"),
  monthly_installment: z.coerce.number().min(0, "Monthly installment must be valid"),
  price: z.coerce.number().min(0, "Price must be valid"),
  unit: z.coerce.number().min(1, "Units must be at least 1"),
});

export const assetOptionSchema = z.object({
  size: z.coerce.number().min(1, "Size is required"),
  flex_payment_plans: z.array(paymentPlanSchema),
});

export const createFlexAssetSchema = z.object({
  asset_name: z.string().min(1, "Name is required"),
  asset_location: z.string().min(1, "Location is required"),
  title: z.string().min(1, "Title is required"),
  asset_type: z.string().default("flex"),
  description: z.string().min(1, "Description is required"),
  allocation_qualification: z.coerce.number().min(0),
  amenities: z.string().min(1, "Amenities are required (comma separated)"),
  estate_layout: z.string().optional(),
  asset_pictures: z.array(z.instanceof(File)).min(1, "At least one picture is required"),
  deed_of_assignment: z.instanceof(File).optional(),
  survey: z.instanceof(File).optional(),
  contract_of_sales: z.instanceof(File).optional(),
  asset_option: z.array(assetOptionSchema).min(1, "At least one asset option is required"),
  new_asset: z.boolean().default(true),
});

export type CreateFlexAssetFormValues = z.infer<typeof createFlexAssetSchema>;
export type FlexPaymentPlan = z.infer<typeof paymentPlanSchema>;

export const fullOwnershipAssetOptionSchema = z.object({
  size: z.coerce.number().min(1, "Size is required"),
  unit: z.coerce.number().min(1, "Units must be at least 1"),
  price: z.coerce.number().min(0, "Price must be valid"),
  zero_months: z.coerce.number().optional(),
  three_months: z.coerce.number().optional(),
  six_months: z.coerce.number().optional(),
  twelve_months: z.coerce.number().optional(),
  development_fee: z.coerce.number().optional(),
  initial_payment: z.coerce.number().optional(),
  monthly_installment: z.coerce.number().optional(),
  // Add other fields as needed based on FullOwnershipAssetOptionInput
  // five_months, seven_months, one_month etc if required by UI
  one_month: z.coerce.number().optional(),
  one_month_initial_payment: z.coerce.number().optional(),
  five_months: z.coerce.number().optional(),
  five_months_initial_payment: z.coerce.number().optional(),
  seven_months: z.coerce.number().optional(),
  seven_months_initial_payment: z.coerce.number().optional(),
});

export const createFullOwnershipAssetSchema = z.object({
  asset_name: z.string().min(1, "Name is required"),
  asset_location: z.string().min(1, "Location is required"),
  title: z.string().min(1, "Title is required"),
  asset_type: z.string().default("full-ownership"),
  description: z.string().min(1, "Description is required"),
  allocation_qualification: z.coerce.number().min(0),
  amenities: z.string().min(1, "Amenities are required (comma separated)"),
  estate_layout: z.string().optional(),
  asset_pictures: z.array(z.instanceof(File)).min(1, "At least one picture is required"),
  deed_of_assignment: z.instanceof(File).optional(),
  survey: z.instanceof(File).optional(),
  contract_of_sales: z.instanceof(File).optional(),
  asset_option: z.array(fullOwnershipAssetOptionSchema).min(1, "At least one asset option is required"),
  new_asset: z.boolean().default(true),
});

export type CreateFullOwnershipAssetFormValues = z.infer<typeof createFullOwnershipAssetSchema>;

