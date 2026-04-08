import { z } from "zod";

export const addFlexAssetSchema = z
  .object({
    asset: z.string().min(1, "Asset is required"),
    assetSize: z.string().min(1, "Asset size is required"),
    amount: z.string().min(1, "Amount is required"),
    unit: z.string().min(1, "Unit is required").regex(/^\d+$/, "Unit should not contain letters"),
    purchasePrice: z.string().min(1, "Purchase price is required"),
    date: z.coerce.date(),
    monthlyPrice: z.string().min(1, "Monthly price is required"),
    commissionPayment: z.enum(["yes", "no"]),
    commissionAmount: z.string().min(1, "Commission amount is required"),
    owner_name: z.string().min(1, "Owner name is required"),
    owner_address: z.string().min(1, "Owner address is required"),
    sendContractOfSales: z.enum(["yes", "no"]),
    sendReceiptEmail: z.enum(["yes", "no"]),
  })
  .refine(
    (data) => {
      if (data.commissionPayment === "no" && data.commissionAmount !== "0") {
        return false;
      }
      if (
        data.commissionPayment === "yes" &&
        Number.parseFloat(data.commissionAmount.replace(/,/g, "")) <= 0
      ) {
        return false;
      }
      return true;
    },
    {
      message: "Commission amount should be 0 if commission is not paid out or greater than 0 if paid out",
      path: ["commissionAmount"],
    }
  );

export const addFullOwnershipAssetSchema = z
  .object({
    asset: z.string().min(1, "Asset is required"),
    amount: z
      .string()
      .min(1, "Amount is required")
      .regex(/^\d{1,3}(,\d{3})*$/, "Amount must be a valid number format (e.g., 500,000)")
      .transform((val) => Number(val.replace(/,/g, "")))
      .refine((val) => val > 0, { message: "Amount must be greater than 0" }),
    purchasePrice: z
      .string()
      .min(1, "Purchase price is required")
      .regex(/^\d{1,3}(,\d{3})*$/, "Purchase price must be a valid number format (e.g., 500,000)")
      .transform((val) => Number(val.replace(/,/g, "")))
      .refine((val) => val > 0, { message: "Purchase price must be greater than 0" }),
    unit: z
      .string()
      .min(1, "Unit is required")
      .regex(/^\d{1,3}(,\d{3})*$/, "Unit must be a valid number format")
      .transform((val) => Number(val.replace(/,/g, ""))),
    date: z.coerce.date(),
    months: z.string().min(1, "Select a payment period"),
    size: z.string().min(1, "Size is required"),
    docAmount: z
      .string()
      .min(1, "Development amount is required")
      .regex(/^\d{1,3}(,\d{3})*$/, "Development amount must be a valid number format")
      .transform((val) => Number(val.replace(/,/g, ""))),
    developmentPrice: z
      .string()
      .min(1, "Development price is required")
      .regex(/^\d{1,3}(,\d{3})*$/, "Development price must be a valid number format")
      .transform((val) => Number(val.replace(/,/g, ""))),
    shouldCommissionBeCharged: z.enum(["yes", "no"]),
    commissionAmount: z
      .string()
      .min(1, "Commission amount is required")
      .regex(/^\d{1,3}(,\d{3})*$/, "Commission amount must be a valid number format")
      .transform((val) => Number(val.replace(/,/g, ""))),
    owner_name: z.string().min(1, "Owner name is required"),
    owner_address: z.string().min(1, "Owner address is required"),
    sendContractOfSales: z.enum(["yes", "no"]),
    sendReceiptEmail: z.enum(["yes", "no"]),
  })
  .refine(
    (data) => {
      if (data.shouldCommissionBeCharged === "yes" && data.commissionAmount <= 0) {
        return false;
      }
      return true;
    },
    {
      message: "Commission Amount should be greater than 0 if commission is to be charged",
      path: ["commissionAmount"],
    }
  );

export type AddFlexAssetFormValues = z.infer<typeof addFlexAssetSchema>;
export type AddFullOwnershipAssetFormValues = z.output<typeof addFullOwnershipAssetSchema>;
export type AddFullOwnershipAssetFormInput = z.input<typeof addFullOwnershipAssetSchema>;

export const editUserAssetQuestionSchema = z.object({
  name: z.string().min(1, "Name is required"),
  address: z.string().min(1, "Address is required"),
});

export type EditUserAssetQuestionFormValues = z.infer<typeof editUserAssetQuestionSchema>;

export const editUserPaymentPlanSchema = z.object({
  userId: z.string(),
  uniqueAssetId: z.string(),
  amount_paid: z.number().nonnegative(),
  balance: z.number().nonnegative(),
  asset_price: z.number().positive(),
  next_date_of_payment: z.date(),
  start_date: z.date(),
  no_of_units: z.number().int().positive(),
  fullownerhsip_landprice: z.number().nonnegative().optional(),
  fullownerhsip_documentprice: z.number().nonnegative().optional(),
  months_covered: z.number().int().nonnegative(),
  month_subscription: z.number().int().positive(),
  size: z.number().nonnegative(),
  default_amount: z.number().nonnegative(),
  amount_payable: z.number().nonnegative(),
  document_amount_paid: z.number().nonnegative().optional(),
  document_balance: z.number().nonnegative().optional(),
});

export type EditUserPaymentPlanFormValues = z.infer<typeof editUserPaymentPlanSchema>;
