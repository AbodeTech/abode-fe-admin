"use client"

import { useEffect, useState } from "react"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"
import { useParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useReassignReferrer } from "../../hooks/use-user-mutations"
import { getErrorMessage } from "../../utils/error-message"
import { AdminReasonFields } from "./AdminReasonFields"
import { ReassignReferrerPayloadSchema } from "../../schemas/user-actions.schema"

type FormSchemaType = z.infer<typeof ReassignReferrerPayloadSchema>

interface ReassignReferrerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ReassignReferrerModal({ open, onOpenChange }: ReassignReferrerModalProps) {
  const params = useParams<{ id: string }>()
  const userId = params.id
  const reassign = useReassignReferrer()

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(ReassignReferrerPayloadSchema),
    defaultValues: {
      new_referrer_username: "",
      reason: "",
      notify_user: false,
    },
  })

  useEffect(() => {
    if (open) form.reset({ new_referrer_username: "", reason: "", notify_user: false })
  }, [open, form])

  const onSubmit = async (data: FormSchemaType) => {
    try {
      await reassign.mutateAsync({ userId, payload: data })
      toast.success("Referrer reassigned")
      onOpenChange(false)
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to reassign referrer"))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reassign referrer</DialogTitle>
          <DialogDescription>
            Point this user at a different referrer by username. The backend rejects cycles.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="new_referrer_username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New referrer username</FormLabel>
                  <FormControl>
                    <Input placeholder="username" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <AdminReasonFields reasonPlaceholder="Reason for reassigning this referrer…" />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Reassign
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
