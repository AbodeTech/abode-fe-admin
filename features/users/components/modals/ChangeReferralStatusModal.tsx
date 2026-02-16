"use client"

import { useState } from "react"
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
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useModifyReferralStatus } from "../../hooks/use-user-mutations"
import { getErrorMessage } from "../../utils/error-message"

const formSchema = z.object({
  status: z.string().min(1, "Please select a referral status"),
})

type FormSchemaType = z.infer<typeof formSchema>

interface ChangeReferralStatusModalProps {
  currentStatus: string
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function ChangeReferralStatusModal({ currentStatus, trigger, open, onOpenChange }: ChangeReferralStatusModalProps) {
  const params = useParams<{ id: string }>()
  const userId = params.id
  const [internalOpen, setInternalOpen] = useState(false)
  const modifyStatus = useModifyReferralStatus()

  const isOpen = open !== undefined ? open : internalOpen
  const setIsOpen = onOpenChange || setInternalOpen

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      status: currentStatus || "",
    },
  })

  const onSubmit = async (data: FormSchemaType) => {
    try {
      await modifyStatus.mutateAsync({
        userId: userId,
        referral_status: data.status,
      })
      toast.success("Referral status updated successfully")
      setIsOpen(false)
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to update status"))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Referral Status</DialogTitle>
          <DialogDescription>
            Select the new referral status for this user.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Referral Status</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="associate">Associates</SelectItem>
                      <SelectItem value="associate-pro">Associate Pro</SelectItem>
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
                Update Status
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
