"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
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
import { useEditUserAssetQuestion } from "../../hooks/use-user-plan-mutations";
import { AdminEditAssetQuestionPayloadSchema } from "../../schemas/user-plan-actions.schema";
import { getErrorMessage } from "../../utils/error-message";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import type { z } from "zod";

type EditAssetQuestionFormValues = z.infer<typeof AdminEditAssetQuestionPayloadSchema>;

interface EditUserAssetQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId: string;
  expectedUpdatedAt?: string;
  currentName: string;
  currentAddress: string;
  userId: string;
}

export function EditUserAssetQuestionModal({
  isOpen,
  onClose,
  planId,
  expectedUpdatedAt,
  currentName,
  currentAddress,
  userId,
}: EditUserAssetQuestionModalProps) {
  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors },
  } = useForm<EditAssetQuestionFormValues>({
    resolver: zodResolver(AdminEditAssetQuestionPayloadSchema),
    defaultValues: {
      name_of_property: currentName,
      address: currentAddress,
      reason: "",
      notify_user: false,
      expected_updated_at: expectedUpdatedAt,
    },
  });
  const notifyUser = useWatch({ control, name: "notify_user" });

  useEffect(() => {
    if (isOpen) {
      setValue("name_of_property", currentName);
      setValue("address", currentAddress);
    }
  }, [isOpen, currentName, currentAddress, setValue]);

  const mutation = useEditUserAssetQuestion();

  const onSubmit = async (data: EditAssetQuestionFormValues) => {
    try {
      await mutation.mutateAsync({
        userId,
        planId,
        payload: data,
      });
      toast.success("Asset Question updated successfully");
      onClose();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to update asset question"));
    }
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
              <Label htmlFor="name_of_property">Name</Label>
              <Input id="name_of_property" {...register("name_of_property")} placeholder="Enter owner name" />
              {errors.name_of_property && <p className="text-sm text-red-500">{errors.name_of_property.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason">Reason</Label>
              <Textarea id="reason" {...register("reason")} placeholder="Explain why this legal detail is changing" />
              <p className="text-xs text-muted-foreground">At least 20 characters; saved to the audit log.</p>
              {errors.reason && <p className="text-sm text-red-500">{errors.reason.message}</p>}
            </div>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={Boolean(notifyUser)}
                onCheckedChange={(checked) => setValue("notify_user", checked === true)}
              />
              Notify user by email
            </label>
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
