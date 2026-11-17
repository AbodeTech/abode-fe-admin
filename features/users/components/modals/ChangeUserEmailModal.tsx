"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { AlertTriangle, Loader2 } from "lucide-react";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useChangeUserEmail } from "../../hooks/use-user-mutations";
import { getErrorMessage } from "../../utils/error-message";
import {
  ADMIN_REASON_MIN,
  ChangeUserEmailPayloadSchema,
  type ChangeUserEmailPayload,
} from "../../schemas/user-actions.schema";

interface ChangeUserEmailModalProps {
  currentEmail?: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function ChangeUserEmailModal({
  currentEmail,
  trigger,
  open,
  onOpenChange,
}: ChangeUserEmailModalProps) {
  const params = useParams<{ id: string }>();
  const userId = params.id;
  const [internalOpen, setInternalOpen] = useState(false);
  const changeEmail = useChangeUserEmail();

  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

  const form = useForm<ChangeUserEmailPayload>({
    resolver: zodResolver(ChangeUserEmailPayloadSchema),
    defaultValues: { email: "", reason: "" },
  });

  useEffect(() => {
    if (isOpen) form.reset({ email: "", reason: "" });
  }, [isOpen, form]);

  const onSubmit = async (data: ChangeUserEmailPayload) => {
    if (currentEmail && data.email === currentEmail.trim().toLowerCase()) {
      form.setError("email", { message: "That is already this user's email" });
      return;
    }
    try {
      await changeEmail.mutateAsync({ userId, payload: data });
      toast.success("Login email changed. Both addresses have been emailed.");
      setIsOpen(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to change the email"));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Change Login Email</DialogTitle>
          <DialogDescription>
            The user signs in, resets their password and receives every email at the new address.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            Only do this once you have confirmed the request came from the account owner. Both the
            old and the new address are told about the change.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormItem>
              <FormLabel>Current email</FormLabel>
              <Input value={currentEmail ?? ""} disabled readOnly />
            </FormItem>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New email</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="off" placeholder="name@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason</FormLabel>
                  <FormControl>
                    <Textarea placeholder="How the owner asked for this, and how you checked it…" {...field} />
                  </FormControl>
                  <FormDescription>
                    At least {ADMIN_REASON_MIN} characters. This is stored on the audit log.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Change Email
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
