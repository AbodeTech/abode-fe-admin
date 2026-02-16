"use client"

import { fetchGraphql } from "@/lib/graphql-client"
import { GetUserReferralsResponse, UserReferralResponse } from "./referrals.types"

// Fetch User Referrals
export const getUserReferrals = async (userId: string) => {
  const response = await fetchGraphql<GetUserReferralsResponse>(
    `
      query ViewUserReferralsByAdmin($viewUserReferralsByAdminId: ID!) {
        viewUserReferralsByAdmin(id: $viewUserReferralsByAdminId) {
          _id
          commission
          createdAt
          userReferralStatus
          email
          name
          phoneNumber
          status
        }
      }
    `,
    {
      viewUserReferralsByAdminId: userId,
    }
  )

  return response.viewUserReferralsByAdmin
}

// Delete User Referral
export const deleteUserReferral = async (userId: string, referralId: string) => {
  const response = await fetchGraphql<{ deleteUserReferral: boolean }>(
    `
      mutation DeleteUserReferral($user_id: String!, $referral_id: String!) {
        deleteUserReferral(user_id: $user_id, referral_id: $referral_id)
      }
    `,
    {
      user_id: userId,
      referral_id: referralId,
    }
  )

  return response.deleteUserReferral
}
