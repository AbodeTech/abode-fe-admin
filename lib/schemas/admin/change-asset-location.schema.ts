import { z } from "zod";

export const changeAssetLocationSchema = z
  .object({
    newAssetId: z.string().min(1, "Pick a destination asset."),
    newAssetType: z.enum(["flex", "full-ownership"]),
    newSize: z.coerce.number({ message: "Size is required." }).positive("Size must be positive."),
    newNoOfUnits: z.coerce.number({ message: "Units required." }).int().positive("Units must be positive."),
    newMonthSubscription: z.coerce.number({ message: "Months required." }).int().nonnegative(),

    newAssetPrice: z.coerce.number({ message: "Price required." }).nonnegative(),
    newAmountPaid: z.coerce.number({ message: "Amount paid required." }).nonnegative(),
    newMonthlyInstallment: z.coerce.number({ message: "Monthly installment required." }).nonnegative(),
    newDurationMonths: z.coerce.number().int().nonnegative().optional(),

    newDocumentPrice: z.coerce.number().nonnegative().optional(),
    newDocumentAmountPaid: z.coerce.number().nonnegative().optional(),
    newDocumentMonthlyInstallment: z.coerce.number().nonnegative().optional(),

    name_of_property: z.string().min(1, "Name on document required."),
    mode_of_communication: z.string().min(1, "Mode of communication required."),
    source_of_funds: z.string().min(1, "Source of funds required."),
    desired_landuse: z.string().min(1, "Desired land use required."),
    address: z.string().optional(),

    reason: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.newAssetType === "flex" && !data.newDurationMonths) {
      ctx.addIssue({
        path: ["newDurationMonths"],
        code: z.ZodIssueCode.custom,
        message: "Pick a duration for the flex plan.",
      });
    }
    if (data.newAmountPaid > data.newAssetPrice) {
      ctx.addIssue({
        path: ["newAmountPaid"],
        code: z.ZodIssueCode.custom,
        message: "Amount paid can't exceed the asset price.",
      });
    }
    if (
      data.newAssetType === "full-ownership" &&
      data.newDocumentPrice !== undefined &&
      data.newDocumentAmountPaid !== undefined &&
      data.newDocumentAmountPaid > data.newDocumentPrice
    ) {
      ctx.addIssue({
        path: ["newDocumentAmountPaid"],
        code: z.ZodIssueCode.custom,
        message: "Document amount paid can't exceed document price.",
      });
    }
  });

export type ChangeAssetLocationFormValues = z.infer<typeof changeAssetLocationSchema>;
