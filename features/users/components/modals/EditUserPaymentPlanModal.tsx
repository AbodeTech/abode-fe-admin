"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { editUserPaymentPlanByAdmin } from "@/lib/api/admin/user-assets.client";
import { EditUserPaymentPlanFormValues, editUserPaymentPlanSchema } from "@/lib/schemas/admin/user-assets.schema";
import { UserAsset } from "@/lib/api/admin/user-assets.types";
import { getErrorMessage } from "../../utils/error-message";

interface EditUserPaymentPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: UserAsset;
  userId: string;
}

export function EditUserPaymentPlanModal({ isOpen, onClose, asset, userId }: EditUserPaymentPlanModalProps) {
  const queryClient = useQueryClient();
  const pd = asset.payment_details;
  const doc = asset.document_plan;

  const {
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<EditUserPaymentPlanFormValues>({
    resolver: zodResolver(editUserPaymentPlanSchema),
  });

  const assetType = pd?.asset_type;

  useEffect(() => {
    if (isOpen && pd) {
      reset({
        userId: userId,
        uniqueAssetId: pd.unique_asset_id,
        amount_paid: pd.amount_paid,
        balance: pd.balance,
        asset_price: pd.asset_price,
        next_date_of_payment: pd.next_date_of_payment ? new Date(pd.next_date_of_payment) : new Date(),
        start_date: pd.start_date ? new Date(pd.start_date) : new Date(),
        no_of_units: pd.no_of_units,
        fullownerhsip_landprice: pd.fullownerhsip_landprice ?? undefined,
        fullownerhsip_documentprice: pd.fullownerhsip_documentprice ?? undefined,
        months_covered: pd.months_covered,
        month_subscription: pd.month_subscription,
        size: Number(pd.size),
        default_amount: pd.default_amount,
        amount_payable: pd.amount_payable,
        document_amount_paid: doc?.amount_paid ?? undefined,
        document_balance: doc?.balance ?? undefined,
      });
    }
  }, [isOpen, pd, doc, userId, reset]);

  const mutation = useMutation({
    mutationFn: editUserPaymentPlanByAdmin,
  });

  const onSubmit = async (data: EditUserPaymentPlanFormValues) => {
    const monthsRemaining = (data.month_subscription || 0) - (data.months_covered || 0);
    try {
      await mutation.mutateAsync({
        userId: data.userId,
        uniqueAssetId: data.uniqueAssetId,
        amount_paid: data.amount_paid,
        balance: data.balance,
        asset_price: data.fullownerhsip_landprice || data.asset_price,
        next_date_of_payment: data.next_date_of_payment,
        start_date: data.start_date,
        no_of_units: data.no_of_units,
        fullownerhsip_landprice: data.fullownerhsip_landprice ? data.fullownerhsip_landprice : null,
        fullownerhsip_documentprice: data.fullownerhsip_documentprice ? data.fullownerhsip_documentprice : null,
        months_covered: data.months_covered,
        month_remaining: monthsRemaining,
        month_subscription: data.month_subscription,
        size: data.size,
        default_amount: data.default_amount,
        amount_payable: data.amount_payable,
        document_amount_paid: data.document_amount_paid ? data.document_amount_paid : null,
        document_balance: data.document_balance ? data.document_balance : null,
      });
      toast.success("Payment plan updated successfully");
      queryClient.invalidateQueries({ queryKey: ["userAssets", userId] });
      onClose();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to update payment plan"));
    }
  };

  const formatNumber = (value: number | string | undefined) => {
    if (value === undefined || value === null) return "";
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const renderNumberInput = (name: keyof EditUserPaymentPlanFormValues, label: string) => (
    <div className="space-y-2" key={name}>
      <Label htmlFor={name}>{label}</Label>
      <Controller
        name={name}
        control={control}
        render={({ field }) => (
          <Input
            id={name}
            value={formatNumber(field.value as number | string | undefined)}
            onChange={(e) => {
              const raw = e.target.value.replace(/,/g, "");
              const num = Number(raw);
              field.onChange(isNaN(num) ? undefined : num);
            }}
          />
        )}
      />
      {errors[name] && <p className="text-red-500 text-sm">{errors[name]?.message}</p>}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Edit Payment Plan</DialogTitle>
          <DialogDescription>Edit the payment plan details for this asset</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-1">
              {renderNumberInput("amount_paid", "Amount Paid")}
              {renderNumberInput("balance", "Balance")}

              {assetType === "flex" && renderNumberInput("asset_price", "Asset Price")}

              <div className="space-y-2">
                <Label htmlFor="next_date_of_payment">Next Date of Payment</Label>
                <Controller
                  name="next_date_of_payment"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="date"
                      className="block"
                      value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                    />
                  )}
                />
                {errors.next_date_of_payment && <p className="text-red-500 text-sm">{errors.next_date_of_payment.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Controller
                  name="start_date"
                  control={control}
                  render={({ field }) => (
                    <Input
                      type="date"
                      className="block"
                      value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                      onChange={(e) => field.onChange(new Date(e.target.value))}
                    />
                  )}
                />
                {errors.start_date && <p className="text-red-500 text-sm">{errors.start_date.message}</p>}
              </div>

              {renderNumberInput("no_of_units", "Number of Units")}

              {assetType === "full-ownership" && (
                <>
                  {renderNumberInput("fullownerhsip_landprice", "Full Ownership Land Price")}
                  {renderNumberInput("fullownerhsip_documentprice", "Full Ownership Document Price")}
                  {renderNumberInput("document_amount_paid", "Document Amount Paid")}
                  {renderNumberInput("document_balance", "Document Balance")}
                </>
              )}

              {renderNumberInput("months_covered", "Months Covered")}
              {renderNumberInput("month_subscription", "Month Subscription")}
              {renderNumberInput("size", "Size")}
              {renderNumberInput("default_amount", "Default Amount")}
              {renderNumberInput("amount_payable", "Amount Payable")}
            </div>
          </ScrollArea>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={onClose} type="button">Cancel</Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Asset
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
