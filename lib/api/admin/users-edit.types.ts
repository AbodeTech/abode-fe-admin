export interface EditUserProfileInput {
  id: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
}

export interface EditUserWalletInput {
  id: string
  new_amount: string
  reason: string
}

export interface ModifyReferralStatusInput {
  userId: string
  referral_status: string
}
