"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { editUserAssetQuestion } from "@/lib/api/admin/user-assets.client";
import { EditUserAssetQuestionFormValues, editUserAssetQuestionSchema } from "@/lib/schemas/admin/user-assets.schema";
import { getErrorMessage } from "../../utils/error-message";

interface EditUserAssetQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  uniqueAssetId: string;
  currentName: string;
  currentAddress: string;
  userId: string;
}

export function EditUserAssetQuestionModal({
  isOpen,
  onClose,
  uniqueAssetId,
  currentName,
  currentAddress,
  userId,
}: EditUserAssetQuestionModalProps) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<EditUserAssetQuestionFormValues>({
    resolver: zodResolver(editUserAssetQuestionSchema),
    defaultValues: {
      name: currentName,
      address: currentAddress,
    },
  });

  useEffect(() => {
    if (isOpen) {
      setValue("name", currentName);
      setValue("address", currentAddress);
    }
  }, [isOpen, currentName, currentAddress, setValue]);

  const mutation = useMutation({
    mutationFn: editUserAssetQuestion,
    onSuccess: () => {
      toast.success("Asset Question updated successfully");
      queryClient.invalidateQueries({ queryKey: ["userAssets", userId] });
      onClose();
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to update asset question"));
    },
  });

  const onSubmit = (data: EditUserAssetQuestionFormValues) => {
    mutation.mutate({
      unique_asset_id: uniqueAssetId,
      name_of_property: data.name,
      address: data.address,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Asset Question</DialogTitle>
          <DialogDescription>Update the asset owner name and address</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register("name")} placeholder="Enter owner name" />
              {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" {...register("address")} placeholder="Enter owner address" />
              {errors.address && <p className="text-sm text-red-500">{errors.address.message}</p>}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
