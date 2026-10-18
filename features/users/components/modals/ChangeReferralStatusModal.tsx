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
import { AdminReasonFields } from "./AdminReasonFields"
import { ADMIN_REFERRAL_TIERS, ChangeTierPayloadSchema } from "../../schemas/user-actions.schema"

type FormSchemaType = z.infer<typeof ChangeTierPayloadSchema>

const TIER_LABELS: Record<(typeof ADMIN_REFERRAL_TIERS)[number], string> = {
  guest: "Guest",
  user: "User",
  associate: "Associate",
  "associate-pro": "Associate Pro",
  founder: "Founder",
  management: "Management",
  premium: "Premium",
}

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
    resolver: zodResolver(ChangeTierPayloadSchema),
    defaultValues: {
      new_tier: ADMIN_REFERRAL_TIERS.includes(currentStatus as (typeof ADMIN_REFERRAL_TIERS)[number])
        ? (currentStatus as FormSchemaType["new_tier"])
        : "user",
      reason: "",
      notify_user: false,
    },
  })

  useEffect(() => {
    if (!isOpen) return
    form.reset({
      new_tier: ADMIN_REFERRAL_TIERS.includes(currentStatus as (typeof ADMIN_REFERRAL_TIERS)[number])
        ? (currentStatus as FormSchemaType["new_tier"])
        : "user",
      reason: "",
      notify_user: false,
    })
  }, [isOpen, currentStatus, form])

  const onSubmit = async (data: FormSchemaType) => {
    try {
      await modifyStatus.mutateAsync({ userId, payload: data })
      toast.success("Tier updated successfully")
      setIsOpen(false)
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to update tier"))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change tier</DialogTitle>
          <DialogDescription>
            Updates the user&apos;s referral tier without rerating existing plans.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="new_tier"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tier</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select tier" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ADMIN_REFERRAL_TIERS.map((tier) => (
                        <SelectItem key={tier} value={tier}>
                          {TIER_LABELS[tier]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <AdminReasonFields reasonPlaceholder="Reason for this tier change…" />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update tier
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
