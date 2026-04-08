"use client"

import { fetchGraphql } from "@/lib/graphql-client"
import { GetUserReferralsResponse } from "./referrals.types"

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

// Remove User Referral (legacy parity)
export const removeReferralByAdmin = async (userId: string, referralId: string) => {
  const response = await fetchGraphql<{ removeReferralByAdmin: string }>(
    `
      mutation RemoveReferralByAdmin($referralUpdateInput: ReferralUpdateInput!) {
        removeReferralByAdmin(referralUpdateInput: $referralUpdateInput)
      }
    `,
    {
      referralUpdateInput: {
        user_id: userId,
        referral_id: referralId,
      },
    }
  )

  return response.removeReferralByAdmin
}

export const addUserReferralByAdmin = async (userId: string, referralEmail: string) => {
  const response = await fetchGraphql<{ addReferralByAdmin: string }>(
    `
      mutation AddReferralByAdmin($addReferralUpdateInput: AddReferralUpdateInput!) {
        addReferralByAdmin(addReferralUpdateInput: $addReferralUpdateInput)
      }
    `,
    {
      addReferralUpdateInput: {
        user_id: userId,
        referral_email: referralEmail,
      },
    }
  )

  return response.addReferralByAdmin
}
