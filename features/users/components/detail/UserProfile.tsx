"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { UserEditActions } from "./UserEditActions"

import { UserDetail } from "../../types/user.types"

interface UserProfileProps {
  user: UserDetail
}

const femaleAvatars = [
  "/adminPages/avatars/01.png",
  "/adminPages/avatars/03.png",
  "/adminPages/avatars/05.png",
]

const maleAvatars = [
  "/adminPages/avatars/02.png",
  "/adminPages/avatars/04.png",
]

const getRandomAvatar = (gender?: string | null) => {
  if (!gender) return null
  const isMale = gender.toLowerCase() === "male"
  const pool = isMale ? maleAvatars : femaleAvatars
  return pool[Math.floor(Math.random() * pool.length)]
}

export function UserProfile({ user }: UserProfileProps) {
  const avatar = getRandomAvatar(user.gender)
  return (
    <div className="mt-6 flex min-w-0 flex-col gap-4 font-noto_sans sm:flex-row sm:items-start sm:justify-between">
      <div className="flex min-w-0 items-center gap-3 sm:gap-x-2 lg:items-center">
        <Avatar className="h-16 w-16 shrink-0 sm:h-[76px] sm:w-[76px]">
          <AvatarImage src={avatar || undefined} />
          <AvatarFallback>
            {user.lastName?.charAt(0).toUpperCase()}
            {user.firstName?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 lg:mb-3">
          <h3 className="truncate text-base font-semibold text-[#101828] sm:text-lg lg:font-medium lg:text-2xl">
            {user.lastName} {user.firstName}
          </h3>
          <p className="mt-1 break-all text-xs text-[#8A8B9F] sm:text-sm">{user.email}</p>
        </div>
      </div>

      <div className="flex w-full min-w-0 shrink-0 flex-col gap-y-3 sm:w-auto sm:items-end">
        <UserEditActions user={user} />
      </div>
    </div>
  )
}
