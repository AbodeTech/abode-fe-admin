"use client"

import { useEffect, useState } from "react"
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
  const [activeModal, setActiveModal] = useState<
    "profile" | "refStatus" | "wallet" | "commission" | "tin" | "clearTin" | null
  >(null)
  const currentUser = useAuthStore((state) => state.user)
  const permissions = currentUser?.permissions ?? []
  const isAdmin = currentUser?.role === "admin"
  const canEditUser = permissions.includes("edit_user")
  const canModifyRefStatus = permissions.includes("modify-referral-status")
  const searchParams = useSearchParams()
  const router = useRouter()

  if (!isAdmin || (!canEditUser && !canModifyRefStatus)) {
    return null
  }

  const setModalParam = (value: string | null) => {
    const params = new URLSearchParams(searchParams?.toString() || "")
    if (value) {
      params.set("modal", value)
    } else {
      params.delete("modal")
    }
    const next = params.toString()
    router.push(next ? `?${next}` : "?")
  }

  useEffect(() => {
    const modal = searchParams?.get("modal")
    if (!modal) {
      setActiveModal(null)
      return
    }
    switch (modal) {
      case "edituserprofile":
        setActiveModal("profile")
        break
      case "changeRef":
        setActiveModal("refStatus")
        break
      case "edituserbalance":
        setActiveModal("wallet")
        break
      case "editusercommissionbalance":
        setActiveModal("commission")
        break
      case "editusertin":
        setActiveModal("tin")
        break
      case "clearusertin":
        setActiveModal("clearTin")
        break
      default:
        setActiveModal(null)
        break
    }
  }, [searchParams])

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button className='bg-[#7F56D9] hover:bg-[#6941C6] text-white px-6 py-2.5 rounded-lg text-sm font-medium flex items-center gap-x-3'>
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
