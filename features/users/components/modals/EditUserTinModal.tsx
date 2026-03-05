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
import { Input } from "@/components/ui/input";
import { useUpdateUserTin } from "../../hooks/use-user-mutations";
import { getErrorMessage } from "../../utils/error-message";

const formSchema = z.object({
  tin: z.string().trim().min(1, "TIN is required"),
});

type FormSchemaType = z.infer<typeof formSchema>;

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
    resolver: zodResolver(formSchema),
    defaultValues: {
      tin: currentTin || "",
    },
  });

  const onSubmit = async (data: FormSchemaType) => {
    try {
      await updateTin.mutateAsync({
        userId,
        tin: data.tin.trim(),
      });
      toast.success("TIN updated successfully");
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
          <DialogDescription>Update this user&apos;s tax identification number.</DialogDescription>
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
                    <Input placeholder="Enter TIN" {...field} />
                  </FormControl>
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
                Update TIN
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
