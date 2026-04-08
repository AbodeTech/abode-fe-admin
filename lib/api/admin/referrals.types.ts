export interface UserReferralResponse {
  _id: string
  commission: number
  createdAt: string
  userReferralStatus: string
  email: string
  name: string
  phoneNumber: string
  status: string
}

export interface GetUserReferralsResponse {
  viewUserReferralsByAdmin: UserReferralResponse[]
}

export interface RemoveReferralByAdminInput {
  user_id: string
  referral_id: string
}
