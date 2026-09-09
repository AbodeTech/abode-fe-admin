"use client";

import { useEffect, useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useUpdateUserTin } from "../../hooks/use-user-mutations";
import { getErrorMessage } from "../../utils/error-message";
import { AdminReasonFields } from "./AdminReasonFields";
import { SetUserTinPayloadSchema } from "../../schemas/user-actions.schema";

type FormSchemaType = z.infer<typeof SetUserTinPayloadSchema>;

interface EditUserTinModalProps {
  currentTin?: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EditUserTinModal({
  currentTin,
  trigger,
  open,
  onOpenChange,
}: EditUserTinModalProps) {
  const params = useParams<{ id: string }>();
  const userId = params.id;
  const [internalOpen, setInternalOpen] = useState(false);
  const updateTin = useUpdateUserTin();

  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(SetUserTinPayloadSchema),
    defaultValues: {
      tin: currentTin || "",
      reason: "",
      notify_user: false,
    },
  });

  useEffect(() => {
    if (!isOpen) return
    form.reset({
      tin: currentTin || "",
      reason: "",
      notify_user: false,
    })
  }, [isOpen, currentTin, form])

  const onSubmit = async (data: FormSchemaType) => {
    try {
      await updateTin.mutateAsync({
        userId,
        payload: { ...data, tin: data.tin.trim().toUpperCase() },
      });
      toast.success("TIN updated and approved");
      setIsOpen(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to update TIN"));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User TIN</DialogTitle>
          <DialogDescription>
            Set or correct this user&apos;s TIN (11 digits, or an N-prefixed tax id). It will be marked approved.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="tin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>TIN</FormLabel>
                  <FormControl>
                    <Input placeholder="12345678901" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <AdminReasonFields reasonPlaceholder="Reason for setting this TIN…" />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update TIN
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
