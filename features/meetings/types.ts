import type { AudienceType } from "./lib/meet-validation";

export interface Meeting {
  _id: string;
  slug: string;
  name: string;
  google_meet_url: string;
  /** GraphQL enum; treat as string at the boundary, narrow with isAudienceType when needed. */
  audience_type: AudienceType | string;
  starts_at: string;
  verification_lead_minutes: number;
  is_active: boolean;
  share_url: string;
  verification_count: number;
  created_at: string;
  updated_at?: string | null;
}

/** Live schema: getMeetingById → MeetingDetail */
export interface MeetingDetail extends Meeting {
  stats: MeetingStats;
}

export interface MeetingStatsByReferralStatus {
  referral_status: string | null;
  count: number;
}

/** Live schema MeetingStats (embedded on MeetingDetail) */
export interface MeetingStats {
  total_verifications: number;
  by_referral_status: MeetingStatsByReferralStatus[];
}

export interface MeetingVerification {
  _id: string;
  meeting_id: string;
  user_id?: string | null;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  referral_status: string | null;
  region: string | null;
  verified_at: string;
  source: "existing_user" | "new_signup" | string;
}

export interface VerificationsPage {
  verifications: MeetingVerification[];
  total: number;
  page: number;
  limit: number;
}

export interface MeetingListFilter {
  audience_type?: AudienceType;
  is_active?: boolean;
  searchQuery?: string;
}
