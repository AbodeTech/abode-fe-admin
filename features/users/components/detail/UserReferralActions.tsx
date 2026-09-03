"use client"

import { useState } from "react"
import { useRouter, useParams, useSearchParams } from "next/navigation"
import { useHasPermission } from "@/hooks/use-admin-permission"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreVertical, Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { Textarea } from "@/components/ui/textarea"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useDeleteUserReferral } from "../../hooks/use-user-mutations"
import { getErrorMessage } from "../../utils/error-message"
import { useSelectedClientStore } from "@/store/selected-client-store"
import { ADMIN_REASON_MIN } from "../../schemas/user-actions.schema"

interface UserReferralActionsProps {
  referralId: string
  referralName: string
}

export function UserReferralActions({ referralId, referralName }: UserReferralActionsProps) {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const searchParams = useSearchParams()
  const userId = params.id
  const canDeleteReferral = useHasPermission("reassign_referrer")
  const { setClient } = useSelectedClientStore()

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [reason, setReason] = useState("")
  const deleteReferral = useDeleteUserReferral()

  const handleViewAssets = () => {
    setClient(referralId, referralName)
    const p = new URLSearchParams(searchParams?.toString() || "")
    p.set("modal", "viewclientasset")
    router.push(p.toString() ? `?${p.toString()}` : "?")
  }

  const handleDelete = async () => {
    if (!userId || reason.length < ADMIN_REASON_MIN) return
    try {
      await deleteReferral.mutateAsync({
        userId,
        referralId,
        payload: { reason, notify_user: false },
      })
      toast.success("Referral deleted successfully")
      setIsDeleteOpen(false)
      setReason("")
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to delete referral"))
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleViewAssets}>View Assets</DropdownMenuItem>
          {canDeleteReferral && (
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={() => setIsDeleteOpen(true)}
            >
              Delete Referral
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Referral?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{referralName}</strong> from this user&apos;s
              referrals? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2">
            <Textarea
              placeholder={`Reason (min ${ADMIN_REASON_MIN} chars)…`}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => { setIsDeleteOpen(false); setReason("") }}
              disabled={deleteReferral.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleteReferral.isPending || reason.length < ADMIN_REASON_MIN}
            >
              {deleteReferral.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
