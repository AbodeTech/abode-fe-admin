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
import { useUserCore } from "../../hooks/use-user-detail"
import { useUsers } from "../../hooks/use-users"
import type { AdminUserRow } from "../../schemas/user.schema"
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
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null)
  const candidates = useUsers(
    { search: debouncedSearch, limit: 10 },
    open && debouncedSearch.length >= 2,
  )
  const selectedCore = useUserCore(open ? selectedUser?.id ?? "" : "")

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

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])

  useEffect(() => {
    form.setValue("new_referrer_username", selectedCore.data?.user_name ?? "", {
      shouldValidate: Boolean(selectedCore.data),
    })
  }, [form, selectedCore.data])

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setSearch("")
      setDebouncedSearch("")
      setSelectedUser(null)
    }
    onOpenChange(nextOpen)
  }

  const onSubmit = async (data: FormSchemaType) => {
    if (!selectedUser || !selectedCore.data?.user_name || selectedUser.id === userId) return
    try {
      await reassign.mutateAsync({ userId, payload: data })
      toast.success("Referrer reassigned")
      handleOpenChange(false)
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to reassign referrer"))
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Reassign referrer</DialogTitle>
          <DialogDescription>
            Search for the new referrer by name, email, or phone. The system checks for referral cycles.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="new_referrer_username"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New referrer</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Search by name, email, or phone"
                      value={search}
                      onChange={(event) => {
                        setSearch(event.target.value)
                        setSelectedUser(null)
                        field.onChange("")
                      }}
                    />
                  </FormControl>
                  {debouncedSearch.length >= 2 && search.trim() === debouncedSearch && !selectedUser && (
                    <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border p-1" role="listbox" aria-label="New referrer search results">
                      {candidates.isLoading || candidates.isFetching ? (
                        <p className="p-2 text-sm text-muted-foreground">Searching…</p>
                      ) : candidates.isError ? (
                        <p className="p-2 text-sm text-destructive">Could not search users. Try again.</p>
                      ) : candidates.data?.items.length ? (
                        candidates.data.items.map((candidate) => (
                          <button
                            key={candidate.id}
                            type="button"
                            role="option"
                            aria-selected={false}
                            className="w-full rounded px-2 py-2 text-left text-sm hover:bg-muted"
                            onClick={() => setSelectedUser(candidate)}
                          >
                            <span className="block font-medium">{candidate.first_name} {candidate.last_name}</span>
                            <span className="block text-muted-foreground">{candidate.email}</span>
                          </button>
                        ))
                      ) : (
                        <p className="p-2 text-sm text-muted-foreground">No users found.</p>
                      )}
                    </div>
                  )}
                  {selectedUser && (
                    <p className="text-sm">
                      Selected: <strong>{selectedUser.first_name} {selectedUser.last_name}</strong> ({selectedUser.email})
                    </p>
                  )}
                  {selectedUser?.id === userId && (
                    <p role="alert" className="text-sm text-destructive">A person cannot refer themselves.</p>
                  )}
                  {selectedUser && selectedCore.isError && (
                    <p role="alert" className="text-sm text-destructive">Could not load this person. Select them again.</p>
                  )}
                  {selectedUser && selectedCore.data && !selectedCore.data.user_name && (
                    <p role="alert" className="text-sm text-destructive">This person has no username and cannot be selected as a referrer.</p>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <AdminReasonFields reasonPlaceholder="Reason for reassigning this referrer…" />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting || !selectedUser || !selectedCore.data?.user_name || selectedUser.id === userId}>
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
