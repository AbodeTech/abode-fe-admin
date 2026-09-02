"use client";

import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { addUserFullOwnershipAssetByAdmin, getAllWebsiteAssets } from "@/lib/api/admin/user-assets.client";
import { AddFullOwnershipAssetFormInput, AddFullOwnershipAssetFormValues, addFullOwnershipAssetSchema } from "@/lib/schemas/admin/user-assets.schema";
import { getErrorMessage } from "../../utils/error-message";
import { userKeys } from "../../hooks/query-keys";

interface AddFullOwnershipAssetModalProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AddFullOwnershipAssetModal({ userId, isOpen, onClose }: AddFullOwnershipAssetModalProps) {
  const queryClient = useQueryClient();

  const { data: allAssets, isLoading: isLoadingAssets } = useQuery({
    queryKey: ["allWebsiteAssets"],
    queryFn: getAllWebsiteAssets,
    enabled: isOpen,
  });

  const fullOwnershipAssets = allAssets?.filter((asset) => asset.asset_type === "full-ownership" && asset.new_asset) || [];

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AddFullOwnershipAssetFormInput, unknown, AddFullOwnershipAssetFormValues>({
    resolver: zodResolver(addFullOwnershipAssetSchema),
    defaultValues: {
      commissionAmount: "0",
      sendContractOfSales: "no",
      sendReceiptEmail: "no",
      shouldCommissionBeCharged: "no"
    },
  });

  const mutation = useMutation({
    mutationFn: addUserFullOwnershipAssetByAdmin,
  });

  const formatNumber = (value: string) => {
    const number = value.replace(/[^\d.]/g, "");
    const parts = number.split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  };

  const onSubmit = async (data: AddFullOwnershipAssetFormValues) => {
    try {
      await mutation.mutateAsync({
        doc_amount: data.docAmount,
        number_of_units: data.unit,
        assetId: data.asset,
        amount: data.amount,
        land_price: data.purchasePrice,
        start_date: data.date,
        months: data.months,
        development: true,
        development_price: data.developmentPrice,
        userId: userId,
        pay_commision: data.shouldCommissionBeCharged === "yes",
        commission_amount: data.commissionAmount,
        size: Number(data.size),
        name_of_property: data.owner_name,
        address: data.owner_address,
        send_contract_agreement: data.sendContractOfSales === "yes",
        send_receipt_email: data.sendReceiptEmail === "yes",
      });
      toast.success("Asset added successfully");
      queryClient.invalidateQueries({ queryKey: userKeys.details() });
      onClose();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Something went wrong, please try again"));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Full Ownership Asset</DialogTitle>
          <DialogDescription>Enter the details of the new full ownership asset for the user</DialogDescription>
        </DialogHeader>

        {isLoadingAssets ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : fullOwnershipAssets.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground">
            No full ownership assets available to add.
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <ScrollArea className="h-[60vh] pr-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1">
                <div className="space-y-2">
                  <Label htmlFor="asset">Select Asset</Label>
                  <Controller
                    name="asset"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an asset" />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px]">
                          {fullOwnershipAssets.map((item) => (
                            <SelectItem key={item._id} value={item._id}>
                              {item.asset_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.asset && <p className="text-sm text-red-500">{errors.asset.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="size">Asset Size</Label>
                  <Controller
                    name="size"
                    control={control}
                    render={({ field }) => <Input {...field} placeholder="Enter asset size" />}
                  />
                  {errors.size && <p className="text-sm text-red-500">{errors.size.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount Paid</Label>
                  <Controller
                    name="amount"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        value={field.value !== undefined ? formatNumber(field.value.toString()) : ''}
                        placeholder="Enter amount"
                        onChange={(e) => field.onChange(formatNumber(e.target.value))}
                      />
                    )}
                  />
                  {errors.amount && <p className="text-sm text-red-500">{errors.amount.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="purchasePrice">Land Purchase Price</Label>
                  <Controller
                    name="purchasePrice"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        value={field.value !== undefined ? formatNumber(field.value.toString()) : ''}
                        placeholder="Enter purchase price"
                        onChange={(e) => field.onChange(formatNumber(e.target.value))}
                      />
                    )}
                  />
                  {errors.purchasePrice && <p className="text-sm text-red-500">{errors.purchasePrice.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Controller
                    name="unit"
                    control={control}
                    render={({ field }) => <Input {...field} type="number" placeholder="Enter unit" value={field.value ? field.value : ''} onChange={field.onChange} />}
                  />
                  {errors.unit && <p className="text-sm text-red-500">{errors.unit.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date">Date of Asset Purchase</Label>
                  <Controller
                    name="date"
                    control={control}
                    render={({ field }) => (
                      <Input
                        type="date"
                        className="block"
                        value={field.value ? new Date(field.value as string | number | Date).toISOString().split('T')[0] : ''}
                        onChange={(e) => field.onChange(new Date(e.target.value))}
                      />
                    )}
                  />
                  {errors.date && <p className="text-sm text-red-500">{errors.date.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="months">Payment Plan</Label>
                  <Controller
                    name="months"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select payment plan" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="zero_months">0 Months</SelectItem>
                          <SelectItem value="one_month">1 Month</SelectItem>
                          <SelectItem value="three_months">3 Months</SelectItem>
                          <SelectItem value="six_months">6 Months</SelectItem>
                          <SelectItem value="five_months">5 Months</SelectItem>
                          <SelectItem value="twelve_months">12 Months</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.months && <p className="text-sm text-red-500">{errors.months.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="docAmount">Development Amount Paid</Label>
                  <Controller
                    name="docAmount"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        value={field.value !== undefined ? formatNumber(field.value.toString()) : ''}
                        placeholder="Enter amount"
                        onChange={(e) => field.onChange(formatNumber(e.target.value))}
                      />
                    )}
                  />
                  {errors.docAmount && <p className="text-sm text-red-500">{errors.docAmount.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="developmentPrice">Development Price</Label>
                  <Controller
                    name="developmentPrice"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        value={field.value !== undefined ? formatNumber(field.value.toString()) : ''}
                        placeholder="Enter price"
                        onChange={(e) => field.onChange(formatNumber(e.target.value))}
                      />
                    )}
                  />
                  {errors.developmentPrice && <p className="text-sm text-red-500">{errors.developmentPrice.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="shouldCommissionBeCharged">Charge Commission?</Label>
                  <Controller
                    name="shouldCommissionBeCharged"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select yes or no" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.shouldCommissionBeCharged && <p className="text-sm text-red-500">{errors.shouldCommissionBeCharged.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="commissionAmount">Commission Amount</Label>
                  <Controller
                    name="commissionAmount"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        value={field.value !== undefined ? formatNumber(field.value.toString()) : ''}
                        placeholder="Enter commission amount"
                        onChange={(e) => field.onChange(formatNumber(e.target.value))}
                      />
                    )}
                  />
                  {errors.commissionAmount && <p className="text-sm text-red-500">{errors.commissionAmount.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sendContractOfSales">Send Contract of Sales</Label>
                  <Controller
                    name="sendContractOfSales"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Send contract?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.sendContractOfSales && <p className="text-sm text-red-500">{errors.sendContractOfSales.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sendReceiptEmail">Send Receipt Email</Label>
                  <Controller
                    name="sendReceiptEmail"
                    control={control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Send receipt?" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {errors.sendReceiptEmail && <p className="text-sm text-red-500">{errors.sendReceiptEmail.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="owner_name">Owner Name</Label>
                  <Controller
                    name="owner_name"
                    control={control}
                    render={({ field }) => <Input {...field} placeholder="Enter owner name" />}
                  />
                  {errors.owner_name && <p className="text-sm text-red-500">{errors.owner_name.message}</p>}
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="owner_address">Owner Address</Label>
                  <Controller
                    name="owner_address"
                    control={control}
                    render={({ field }) => (
                      <Textarea {...field} placeholder="Enter owner address" className="min-h-[80px]" />
                    )}
                  />
                  {errors.owner_address && <p className="text-sm text-red-500">{errors.owner_address.message}</p>}
                </div>
              </div>
            </ScrollArea>
            <DialogFooter className="mt-4">
              <Button variant="outline" onClick={onClose} type="button">
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding Asset...
                  </>
                ) : (
                  "Add Asset"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
