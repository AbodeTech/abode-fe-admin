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
import { Form } from "@/components/ui/form";
import { useClearUserTin } from "../../hooks/use-user-mutations";
import { getErrorMessage } from "../../utils/error-message";
import { AdminReasonFields } from "./AdminReasonFields";
import { AdminReasonSchema } from "../../schemas/user-actions.schema";

type FormSchemaType = z.infer<typeof AdminReasonSchema>;

interface ClearUserTinModalProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ClearUserTinModal({ trigger, open, onOpenChange }: ClearUserTinModalProps) {
  const params = useParams<{ id: string }>();
  const userId = params.id;
  const [internalOpen, setInternalOpen] = useState(false);
  const clearTin = useClearUserTin();

  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(AdminReasonSchema),
    defaultValues: {
      reason: "",
      notify_user: false,
    },
  });

  useEffect(() => {
    if (isOpen) form.reset({ reason: "", notify_user: false });
  }, [isOpen, form]);

  const onSubmit = async (data: FormSchemaType) => {
    try {
      await clearTin.mutateAsync({ userId, payload: data });
      toast.success("TIN cleared successfully");
      setIsOpen(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to clear TIN"));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Clear User TIN</DialogTitle>
          <DialogDescription>
            Clears the TIN and returns it to not started. Provide a reason for the audit log.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <AdminReasonFields reasonPlaceholder="Reason for clearing TIN…" />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="destructive" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Clear TIN
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
