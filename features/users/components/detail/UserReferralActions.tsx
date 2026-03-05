"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useParams } from "next/navigation"
import { useAuthStore } from "@/store/auth-store"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { MoreVertical, Loader2, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { deleteUserReferral } from "@/lib/api/admin/referrals.client"
import revalidate from "@/lib/serverActions/admin/revalidate"
import { getErrorMessage } from "../../utils/error-message"

interface UserReferralActionsProps {
  referralId: string
  referralName: string
}

export function UserReferralActions({ referralId, referralName }: UserReferralActionsProps) {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const userId = params.id
  const user = useAuthStore((state) => state.user)
  const canDeleteReferral = user?.role === "admin" || (user?.permissions ?? []).includes("remove-referral")

  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleViewAssets = () => {
    router.push(`/users/${referralId}`)
  }

  const handleDelete = async () => {
    if (!userId) return
    setIsDeleting(true)
    try {
      await deleteUserReferral(userId, referralId)
      toast.success("Referral deleted successfully")
      setIsDeleteOpen(false)
      revalidate(userId) // Revalidate parent user page
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to delete referral"))
    } finally {
      setIsDeleting(false)
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
          <DropdownMenuItem onClick={handleViewAssets}>
            View Assets
          </DropdownMenuItem>
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
              Are you sure you want to delete <strong>{referralName}</strong> from this user&apos;s referrals? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
