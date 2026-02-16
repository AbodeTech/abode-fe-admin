"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Plus } from "lucide-react"

import { EditUserProfileModal } from "../modals/EditUserProfileModal"
import { ChangeReferralStatusModal } from "../modals/ChangeReferralStatusModal"
import { EditUserWalletModal } from "../modals/EditUserWalletModal"

import { UserDetail } from "../../types/user.types"

interface UserEditActionsProps {
  user: UserDetail
}

export function UserEditActions({ user }: UserEditActionsProps) {
  const [activeModal, setActiveModal] = useState<"profile" | "refStatus" | "wallet" | null>(null)

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
          <DropdownMenuItem onSelect={() => setActiveModal("profile")}>
            Edit User Profile
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setActiveModal("refStatus")}>
            Edit Ref Status
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setActiveModal("wallet")}>
            Edit User Wallet Balance
          </DropdownMenuItem>
          {/* Add more items like TIN later if needed */}
        </DropdownMenuContent>
      </DropdownMenu>

      <EditUserProfileModal
        user={user}
        open={activeModal === "profile"}
        onOpenChange={(open) => !open && setActiveModal(null)}
      />

      <ChangeReferralStatusModal
        currentStatus={user.referral_status}
        open={activeModal === "refStatus"}
        onOpenChange={(open) => !open && setActiveModal(null)}
      />

      <EditUserWalletModal
        currentBalance={user.wallet?.balance?.toString() || "0"}
        open={activeModal === "wallet"}
        onOpenChange={(open) => !open && setActiveModal(null)}
      />
    </>
  )
}
