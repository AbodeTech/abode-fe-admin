"use client"

import { fetchGraphql } from "@/lib/graphql-client"
import { EditUserProfileInput, EditUserWalletInput, ModifyReferralStatusInput } from "./users-edit.types"

// Edit User Profile
export const editUserDetailsByAdmin = async (payload: EditUserProfileInput) => {
  const response = await fetchGraphql<{ editUserDetailsByAdmin: string }>(
    `
      mutation EditUserDetailsByAdmin($userDetailsInput: UserDetailsInput!) {
        editUserDetailsByAdmin(userDetailsInput: $userDetailsInput)
      }
    `,
    {
      userDetailsInput: payload,
    }
  )
  return response.editUserDetailsByAdmin
}

// Edit User Wallet Balance
export const editUserWalletDetailsByAdmin = async (payload: EditUserWalletInput) => {
  const response = await fetchGraphql<{ editUserWalletDetailsByAdmin: string }>(
    `
      mutation EditUserWalletDetailsByAdmin($adminWalletInput: AdminWalletInput!) {
        editUserWalletDetailsByAdmin(adminWalletInput: $adminWalletInput)
      }
    `,
    {
      adminWalletInput: payload,
    }
  )
  return response.editUserWalletDetailsByAdmin
}

// Change User Referral Status
export const modifyUserReferralStatus = async (payload: ModifyReferralStatusInput) => {
  const response = await fetchGraphql<{ modifyUserReferralStatus: string }>(
    `
      mutation ModifyUserReferralStatus($modifyReferralInput: ModifyReferralInput!) {
        modifyUserReferralStatus(modifyReferralInput: $modifyReferralInput)
      }
    `,
    {
      modifyReferralInput: payload,
    }
  )
  return response.modifyUserReferralStatus
}
