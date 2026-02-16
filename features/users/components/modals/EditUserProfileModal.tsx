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
import { useEditUserProfile } from "../../hooks/use-user-mutations"
import { getErrorMessage } from "../../utils/error-message"

const formSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email").min(1, "Email is required"),
  phoneNumber: z.string().min(1, "Phone number is required"),
})

type FormSchemaType = z.infer<typeof formSchema>

interface EditUserProfileModalProps {
  user: {
    firstName: string
    lastName: string
    email: string
    phoneNumber: string
  }
  trigger?: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export function EditUserProfileModal({ user, trigger, open, onOpenChange }: EditUserProfileModalProps) {
  const params = useParams<{ id: string }>()
  const userId = params.id
  const [internalOpen, setInternalOpen] = useState(false)
  const editProfile = useEditUserProfile()

  // Handle controllable state
  const isOpen = open !== undefined ? open : internalOpen
  const setIsOpen = onOpenChange || setInternalOpen

  const form = useForm<FormSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      email: user.email || "",
      phoneNumber: user.phoneNumber || "",
    },
  })

  const onSubmit = async (data: FormSchemaType) => {
    try {
      await editProfile.mutateAsync({
        id: userId,
        ...data,
      })
      toast.success("Profile updated successfully")
      setIsOpen(false)
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to update profile"))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User Profile</DialogTitle>
          <DialogDescription>
            Update the user&apos;s personal information here. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Doe" {...field} />
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
                    <Input placeholder="john.doe@example.com" type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input placeholder="+234..." {...field} />
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
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
