"use client";

import { useState } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEditWalletCommission } from "../../hooks/use-user-mutations";
import { getErrorMessage } from "../../utils/error-message";

const formSchema = z.object({
  addToBalance: z.enum(["yes", "no"], {
    message: "Please choose an option",
  }),
});

type FormSchemaType = z.infer<typeof formSchema>;

interface EditUserCommissionBalanceModalProps {
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function EditUserCommissionBalanceModal({
  trigger,
  open,
  onOpenChange,
}: EditUserCommissionBalanceModalProps) {
  const params = useParams<{ id: string }>();
  const userId = params.id;
  const [internalOpen, setInternalOpen] = useState(false);
  const editCommission = useEditWalletCommission();

  const isOpen = open !== undefined ? open : internalOpen;
  const setIsOpen = onOpenChange || setInternalOpen;

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      addToBalance: "yes",
    },
  });

  const onSubmit = async (data: FormSchemaType) => {
    try {
      await editCommission.mutateAsync({
        id: userId,
        add_to_balance: data.addToBalance === "yes",
      });
      toast.success("Commission balance updated successfully");
      setIsOpen(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to update commission balance"));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User Commission Balance</DialogTitle>
          <DialogDescription>
            Choose whether this commission update should affect the wallet balance.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="addToBalance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Should this change affect wallet balance?</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select option" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="yes">Yes</SelectItem>
                      <SelectItem value="no">No</SelectItem>
                    </SelectContent>
                  </Select>
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
                Update Commission
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
