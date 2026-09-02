import { z } from 'zod';

/** `GET /admin/users/:id` — AdminUserDetailService.core */
export const ReferrerChainEntrySchema = z.object({
  level: z.number(),
  id: z.string(),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  tier: z.string().nullable().optional(),
});

export const AdminUserCoreSchema = z.looseObject({
  id: z.string(),
  first_name: z.string().nullable().optional(),
  last_name: z.string().nullable().optional(),
  user_name: z.string().nullable().optional(),
  email: z.string().nullable().optional(),
  phone_number: z.string().nullable().optional(),
  profile_pic: z.string().nullable().optional(),
  verified: z.boolean().optional(),
  is_suspended: z.boolean().optional(),
  tier: z.string().nullable().optional(),
  country: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  lga: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  gender: z.string().nullable().optional(),
  education_level: z.string().nullable().optional(),
  experience_level: z.string().nullable().optional(),
  employment_status: z.string().nullable().optional(),
  occupation: z.string().nullable().optional(),
  date_of_birth: z.union([z.string(), z.null()]).optional(),
  marital_status: z.string().nullable().optional(),
  acquisition_source: z.string().nullable().optional(),
  tin_masked: z.string().nullable().optional(),
  created_at: z.union([z.string(), z.null()]).optional(),
  referrer_chain: z.array(ReferrerChainEntrySchema).optional(),
});

export type AdminUserCore = z.infer<typeof AdminUserCoreSchema>;
export type ReferrerChainEntry = z.infer<typeof ReferrerChainEntrySchema>;

/** `GET /admin/users/:id/stats` */
export const AdminUserStatsSchema = z.looseObject({
  subscriptions: z.number(),
  networth: z.number(),
  total_paid: z.number(),
  total_payable: z.number(),
  balance: z.number(),
  total_units: z.number(),
  next_payment: z.union([z.string(), z.null()]).optional(),
  unsigned_contracts: z.number(),
  wallet: z.object({
    balance: z.number(),
    available_balance: z.number(),
    currency: z.string(),
    is_active: z.boolean(),
  }),
});

export type AdminUserStats = z.infer<typeof AdminUserStatsSchema>;

/** `GET /admin/users/:id/kyc` — null when the user has no KYC doc */
export const AdminUserKycSchema = z
  .looseObject({
    id: z.string(),
    id_document: z.unknown().optional(),
    facial: z.unknown().optional(),
    tin: z
      .looseObject({
        value_masked: z.string().nullable().optional(),
        state: z.string().nullable().optional(),
      })
      .optional(),
    created_at: z.union([z.string(), z.null()]).optional(),
    updated_at: z.union([z.string(), z.null()]).optional(),
  })
  .nullable();

export type AdminUserKyc = z.infer<typeof AdminUserKycSchema>;

export const AdminUserBankAccountSchema = z.looseObject({
  id: z.string(),
  bank_name: z.string().nullable().optional(),
  bank_code: z.string().nullable().optional(),
  account_name: z.string().nullable().optional(),
  account_number_masked: z.string(),
  recipient_code_masked: z.string().nullable(),
  is_default: z.boolean().optional(),
  created_at: z.union([z.string(), z.null()]).optional(),
});

export const AdminUserBankDetailsSchema = z.array(AdminUserBankAccountSchema);
export type AdminUserBankAccount = z.infer<typeof AdminUserBankAccountSchema>;

/** Raw plan / transaction / referral rows — BE returns lean docs, not a DTO. */
export const AdminUserDetailRowSchema = z.record(z.string(), z.unknown());

export const AdminUserAssociateProSchema = z.looseObject({
  associate_pro: z
    .object({
      id: z.string(),
      first_name: z.string().nullable().optional(),
      last_name: z.string().nullable().optional(),
      email: z.string().nullable().optional(),
      phone_number: z.string().nullable().optional(),
      level: z.number(),
    })
    .nullable(),
  agency: z
    .object({
      _id: z.unknown().optional(),
      agency_name: z.string().nullable().optional(),
      agency_code: z.string().nullable().optional(),
    })
    .nullable(),
});

export type AdminUserAssociatePro = z.infer<typeof AdminUserAssociateProSchema>;

export const AdminUserCampaignStandingSchema = z.looseObject({
  campaign: z.looseObject({
    _id: z.unknown().optional(),
    name: z.string().nullable().optional(),
    title: z.string().nullable().optional(),
    status: z.string().nullable().optional(),
    start_date: z.unknown().optional(),
    end_date: z.unknown().optional(),
  }),
  buyer: z.object({ rewards: z.number(), total_sqm: z.number() }),
  referrer: z.object({ rewards: z.number(), total_sqm: z.number() }),
  rank: z.number().nullable(),
  total_paid: z.number(),
  total_payable: z.number(),
});

export const AdminUserCampaignStandingsSchema = z.array(AdminUserCampaignStandingSchema);
export type AdminUserCampaignStanding = z.infer<typeof AdminUserCampaignStandingSchema>;
