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
import { getErrorMessage } from "../../utils/error-message";
import { AdminReasonFields } from "./AdminReasonFields";
import { AdminReasonSchema, type AdminReasonInput } from "../../schemas/user-actions.schema";

type FormSchemaType = z.infer<typeof AdminReasonSchema>;

interface ReasonActionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  successMessage: string;
  destructive?: boolean;
  onSubmit: (userId: string, payload: AdminReasonInput & { expires_at?: string }) => Promise<unknown>;
  includeExpiresAt?: boolean;
}

export function ReasonActionModal({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  successMessage,
  destructive,
  onSubmit,
  includeExpiresAt,
}: ReasonActionModalProps) {
  const params = useParams<{ id: string }>();
  const userId = params.id;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const schema = includeExpiresAt
    ? AdminReasonSchema.extend({ expires_at: z.string().optional() })
    : AdminReasonSchema;

  const form = useForm<FormSchemaType & { expires_at?: string }>({
    resolver: zodResolver(schema),
    defaultValues: { reason: "", notify_user: false, expires_at: "" },
  });

  useEffect(() => {
    if (open) form.reset({ reason: "", notify_user: false, expires_at: "" });
  }, [open, form]);

  const handleSubmit = async (data: FormSchemaType & { expires_at?: string }) => {
    if (!userId) return;
    setIsSubmitting(true);
    try {
      const payload: AdminReasonInput & { expires_at?: string } = {
        reason: data.reason,
        notify_user: data.notify_user,
      };
      if (includeExpiresAt && data.expires_at) {
        payload.expires_at = new Date(data.expires_at).toISOString();
      }
      await onSubmit(userId, payload);
      toast.success(successMessage);
      onOpenChange(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Unable to complete this action"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {includeExpiresAt && (
              <FormField
                control={form.control}
                name="expires_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Auto-unsuspend at (optional)</FormLabel>
                    <FormControl>
                      <Input type="datetime-local" {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <AdminReasonFields />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" variant={destructive ? "destructive" : "default"} disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {confirmLabel}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
