"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"

import { EditUserProfileModal } from "../modals/EditUserProfileModal"
import { ChangeReferralStatusModal } from "../modals/ChangeReferralStatusModal"
import { EditUserWalletModal } from "../modals/EditUserWalletModal"
import { EditUserCommissionBalanceModal } from "../modals/EditUserCommissionBalanceModal"
import { EditUserTinModal } from "../modals/EditUserTinModal"
import { ClearUserTinModal } from "../modals/ClearUserTinModal"
import { ReassignReferrerModal } from "../modals/ReassignReferrerModal"

import { UserDetail } from "../../types/user.types"
import { useHasPermission } from "@/hooks/use-admin-permission"

type ModalKey = "profile" | "refStatus" | "wallet" | "commission" | "tin" | "clearTin" | "reassignReferrer" | null

interface UserEditActionsProps {
  user: UserDetail
}

export function UserEditActions({ user }: UserEditActionsProps) {
  const canEditUser = useHasPermission("edit_user")
  const canEditProfile = useHasPermission("edit_user_profile")
  const canModifyTier = useHasPermission("modify_tier")
  const canAdjustWallet = useHasPermission("adjust_wallet")
  const canEditTin = useHasPermission("edit_user_tin")
  const canReassignReferrer = useHasPermission("reassign_referrer")

  const searchParams = useSearchParams()
  const router = useRouter()

  const modalParam = searchParams?.get("modal")

  const activeModal = useMemo<ModalKey>(() => {
    if (!modalParam) return null
    switch (modalParam) {
      case "edituserprofile":
        return "profile"
      case "changeRef":
        return "refStatus"
      case "edituserbalance":
        return "wallet"
      case "editusercommissionbalance":
        return "commission"
      case "editusertin":
        return "tin"
      case "clearusertin":
        return "clearTin"
      case "reassignreferrer":
        return "reassignReferrer"
      default:
        return null
    }
  }, [modalParam])

  const setModalParam = (value: string | null) => {
    const params = new URLSearchParams(searchParams?.toString() || "")
    if (value) {
      params.set("modal", value)
    } else {
      params.delete("modal")
    }
    const next = params.toString()
    router.push(next ? `?${next}` : "?", { scroll: false })
  }

  const hasAny =
    canEditUser || canEditProfile || canModifyTier || canAdjustWallet || canEditTin || canReassignReferrer

  if (!hasAny) return null

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="flex w-full items-center gap-x-3 rounded-lg bg-[#7F56D9] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#6941C6] sm:w-auto">
            Edit Profile
            <Plus className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[220px]">
          {(canEditUser || canEditProfile) && (
            <DropdownMenuItem onSelect={() => setModalParam("edituserprofile")}>
              Edit User Profile
            </DropdownMenuItem>
          )}
          {(canEditUser || canModifyTier) && (
            <DropdownMenuItem onSelect={() => setModalParam("changeRef")}>
              Edit Ref Status / Tier
            </DropdownMenuItem>
          )}
          {(canEditUser || canAdjustWallet) && (
            <DropdownMenuItem onSelect={() => setModalParam("edituserbalance")}>
              Adjust Wallet Balance
            </DropdownMenuItem>
          )}
          {canEditUser && (
            <DropdownMenuItem onSelect={() => setModalParam("editusercommissionbalance")}>
              Edit Commission Balance
            </DropdownMenuItem>
          )}
          {(canEditUser || canEditTin) && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setModalParam("editusertin")}>
                Edit User TIN
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setModalParam("clearusertin")}
                className="text-red-600 focus:text-red-600"
              >
                Clear User TIN
              </DropdownMenuItem>
            </>
          )}
          {(canEditUser || canReassignReferrer) && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => setModalParam("reassignreferrer")}>
                Reassign Referrer
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <EditUserProfileModal
        user={user}
        open={activeModal === "profile"}
        onOpenChange={(open) => {
          if (!open) setModalParam(null)
        }}
      />

      <ChangeReferralStatusModal
        currentStatus={user.referral_status}
        open={activeModal === "refStatus"}
        onOpenChange={(open) => {
          if (!open) setModalParam(null)
        }}
      />

      <EditUserWalletModal
        currentBalance={user.wallet?.balance?.toString() || "0"}
        open={activeModal === "wallet"}
        onOpenChange={(open) => {
          if (!open) setModalParam(null)
        }}
      />

      <EditUserCommissionBalanceModal
        open={activeModal === "commission"}
        onOpenChange={(open) => {
          if (!open) setModalParam(null)
        }}
      />

      <EditUserTinModal
        currentTin={user.kyc?.tin?.startsWith("****") ? "" : user.kyc?.tin || ""}
        open={activeModal === "tin"}
        onOpenChange={(open) => {
          if (!open) setModalParam(null)
        }}
      />

      <ClearUserTinModal
        open={activeModal === "clearTin"}
        onOpenChange={(open) => {
          if (!open) setModalParam(null)
        }}
      />

      <ReassignReferrerModal
        open={activeModal === "reassignReferrer"}
        onOpenChange={(open) => {
          if (!open) setModalParam(null)
        }}
      />
    </>
  )
}
