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
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useEditUserWallet } from "../../hooks/use-user-mutations"
import { getErrorMessage } from "../../utils/error-message"

const formSchema = z.object({
  amount: z.string().min(1, "Please enter an amount"),
  reason: z.string().min(1, "Please enter a reason"),
})

type FormSchemaType = z.infer<typeof formSchema>

interface EditUserWalletModalProps {
  currentBalance: string
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function EditUserWalletModal({ currentBalance, trigger, open, onOpenChange }: EditUserWalletModalProps) {
  const params = useParams<{ id: string }>()
  const userId = params.id
  const [internalOpen, setInternalOpen] = useState(false)
  const editWallet = useEditUserWallet()

  const isOpen = open !== undefined ? open : internalOpen
  const setIsOpen = onOpenChange || setInternalOpen

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      amount: currentBalance,
      reason: "",
    },
  })

  const onSubmit = async (data: FormSchemaType) => {
    try {
      // Remove commas before sending
      const cleanAmount = data.amount.replace(/,/g, "")

      await editWallet.mutateAsync({
        id: userId,
        new_amount: cleanAmount,
        reason: data.reason
      })
      toast.success("Wallet balance updated successfully")
      setIsOpen(false)
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to update wallet balance"))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Wallet Balance</DialogTitle>
          <DialogDescription>
            Enter the new wallet balance and reason for the update.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter amount (e.g. 1000)"
                      {...field}
                      type="number"
                      step="0.01"
                    />
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
                    <Textarea
                      placeholder="Reason for updating..."
                      {...field}
                    />
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
                Update Balance
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
