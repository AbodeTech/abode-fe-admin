"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
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

import { UserDetail } from "../../types/user.types"
import { useAuthStore } from "@/store/auth-store"

interface UserEditActionsProps {
  user: UserDetail
}

export function UserEditActions({ user }: UserEditActionsProps) {
  const currentUser = useAuthStore((state) => state.user)
  const permissions = currentUser?.permissions ?? []
  const isAdmin = currentUser?.role === "admin"
  const canEditUser = permissions.includes("edit_user")
  const canModifyRefStatus = permissions.includes("modify-referral-status")
  const searchParams = useSearchParams()
  const router = useRouter()

  const modalParam = searchParams?.get("modal")

  const activeModal = useMemo<
    "profile" | "refStatus" | "wallet" | "commission" | "tin" | "clearTin" | null
  >(() => {
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

  if (!isAdmin || (!canEditUser && !canModifyRefStatus)) {
    return null
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className="flex w-full items-center gap-x-3 rounded-lg bg-[#7F56D9] px-6 py-2.5 text-sm font-medium text-white hover:bg-[#6941C6] sm:w-auto">
            Edit Profile
            <Plus className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[200px]">
          {canEditUser && (
            <DropdownMenuItem onSelect={() => setModalParam("edituserprofile")}>
              Edit User Profile
            </DropdownMenuItem>
          )}
          {canModifyRefStatus && (
            <DropdownMenuItem onSelect={() => setModalParam("changeRef")}>
              Edit Ref Status
            </DropdownMenuItem>
          )}
          {canEditUser && (
            <>
              <DropdownMenuItem onSelect={() => setModalParam("edituserbalance")}>
                Edit User Wallet Balance
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setModalParam("editusercommissionbalance")}>
                Edit User Commission Balance
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setModalParam("editusertin")}>
                Edit User TIN
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setModalParam("clearusertin")} className="text-red-600 focus:text-red-600">
                Clear User TIN
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
        currentTin={user.kyc?.tin || ""}
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
    </>
  )
}
