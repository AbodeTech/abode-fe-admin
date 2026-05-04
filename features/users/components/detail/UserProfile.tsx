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
    <div className='mt-6 font-noto_sans flex justify-between items-center'>
      <div className="flex gap-x-2 lg:items-center">
        <Avatar className="h-[76px] w-[76px]">
          <AvatarImage src={avatar || undefined} />
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
