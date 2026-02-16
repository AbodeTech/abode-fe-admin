"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserEditActions } from "./UserEditActions"

import { UserDetail } from "../../types/user.types"

interface UserProfileProps {
  user: UserDetail
}

// Helper to get random avatar (placeholder logic)
const getRandomAvatar = (userId: string) => {
  const num = (userId.charCodeAt(0) % 5) + 1
  return `/avatars/0${num}.png`
}

export function UserProfile({ user }: UserProfileProps) {
  return (
    <div className='mt-6 font-noto_sans flex justify-between items-center'>
      <div className="flex gap-x-2 lg:items-center">
        <Avatar className="h-[76px] w-[76px]">
          <AvatarImage src={user.profile_pic || getRandomAvatar(user._id || "a")} />
          <AvatarFallback>
            {user.lastName?.charAt(0).toUpperCase()}
            {user.firstName?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="lg:mb-3">
          <h3 className="text-[#101828] font-semibold text-xs lg:font-medium lg:text-2xl lg:min-w-fit">
            {user.lastName} {user.firstName}
          </h3>
          <p className="text-[0.5rem] lg:text-sm text-[#8A8B9F] mt-1">{user.email}</p>
        </div>
      </div>

      <div className='flex flex-col gap-y-3'>
        <UserEditActions user={user} />
      </div>
    </div>
  )
}
