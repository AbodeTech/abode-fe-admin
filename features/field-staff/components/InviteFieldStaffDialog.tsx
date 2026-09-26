"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { FIELD_STAFF_TYPE_LABELS, type FieldStaffType } from "../schemas/field-staff.schema";
import { InviteFormSchema, type InviteFormValues } from "../schemas/staff-form.schema";
import { useInviteFieldStaff } from "../hooks/use-field-staff-mutations";
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const emptyValues = (staffType: FieldStaffType): InviteFormValues => ({
  staff_type: staffType,
  first_name: "",
  last_name: "",
  email: "",
  phone_number: "",
  employee_reference: "",
});

const Optional = () => <span className="font-normal text-muted-foreground">(optional)</span>;

/** Invite a Site Manager or Surveyor. The role is fixed by the page it's opened from. */
export function InviteFieldStaffDialog({ staffType }: { staffType: FieldStaffType }) {
  const [open, setOpen] = useState(false);
  const roleLabel = FIELD_STAFF_TYPE_LABELS[staffType];
  const invite = useInviteFieldStaff();

  const form = useForm<InviteFormValues>({
    resolver: zodResolver(InviteFormSchema),
    defaultValues: emptyValues(staffType),
  });

  const onOpenChange = (next: boolean) => {
    if (invite.isPending) return;
    setOpen(next);
    if (!next) form.reset(emptyValues(staffType));
  };

  const onSubmit = (values: InviteFormValues) => {
    invite.mutate(
      {
        staff_type: values.staff_type,
        first_name: values.first_name.trim(),
        last_name: values.last_name.trim(),
        email: values.email.trim().toLowerCase(),
        ...(values.phone_number.trim() && { phone_number: values.phone_number.trim() }),
        ...(values.employee_reference.trim() && { employee_reference: values.employee_reference.trim() }),
      },
      {
        onSuccess: (created) => {
          toast.success(`Invitation sent to ${created.email}`, {
            description: "The one-time activation link expires in 72 hours.",
          });
          onOpenChange(false);
        },
        onError: (error) => toast.error(error.message),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-1.5 h-4 w-4" />
          Invite {roleLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Invite a {roleLabel}</DialogTitle>
          <DialogDescription>You can assign them to sites straight away, before they activate.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First name</FormLabel>
                    <FormControl>
                      <Input autoComplete="given-name" maxLength={60} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last name</FormLabel>
                    <FormControl>
                      <Input autoComplete="family-name" maxLength={60} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" autoComplete="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="phone_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Phone <Optional />
                    </FormLabel>
                    <FormControl>
                      <Input type="tel" autoComplete="tel" placeholder="08012345678" maxLength={32} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="employee_reference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Employee reference <Optional />
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="ABD-FS-0012" maxLength={40} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex gap-3 rounded-lg bg-muted/60 p-3 text-sm">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
              <ul className="space-y-1">
                <li>
                  They get an email with a <strong>one-time activation link</strong>, valid for 72 hours. No password is
                  sent — they create their own when they open it, and the link stops working once used.
                </li>
                <li>If it expires, resend the invitation from their page. The new link replaces the old one.</li>
                <li>
                  Their account opens the <strong>Abode Field app only</strong> — it can&apos;t sign in to this admin — and
                  shows only the sites you assign them.
                </li>
              </ul>
            </div>

            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={invite.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={invite.isPending}>
                {invite.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                Send invitation
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
