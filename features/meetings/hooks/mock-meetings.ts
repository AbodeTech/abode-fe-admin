import type { AudienceType } from "../lib/meet-validation";
import { buildShareUrl, generateMeetSlug } from "../lib/meet-validation";
import { parseLagosDatetimeLocal } from "../lib/meet-time";
import type { CreateMeetingFormValues } from "../schemas/meeting.schema";

export interface Meeting {
  _id: string;
  slug: string;
  name: string;
  google_meet_url: string;
  audience_type: AudienceType;
  starts_at: string;
  verification_lead_minutes: number;
  is_active: boolean;
  share_url: string;
  verification_count: number;
  created_at: string;
}

export interface MeetingVerification {
  _id: string;
  meeting_id: string;
  user_id?: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  referral_status: string | null;
  region: string | null;
  verified_at: string;
  source: "existing_user" | "new_signup";
}

export interface MeetingStats {
  audience_label: string;
  total_verified: number;
  audience_total: number;
  attendance_rate: number;
  new_signups: number;
  existing_users: number;
  regions_covered: number;
  peak_time: string | null;
  verifications_per_hour: number;
  first_verification: string | null;
  last_verification: string | null;
  timeline: { date: string; count: number }[];
  source_breakdown: { name: string; value: number }[];
  region_breakdown: { name: string; value: number }[];
  status_breakdown: { name: string; value: number }[];
}

export const USE_MOCK_MEETINGS =
  process.env.NEXT_PUBLIC_USE_MOCK_MEETINGS !== "false";

/** Demo slug for UI testing — see docs/MEETINGS.md */
export const DEMO_MEETING_SLUG = "demo-meeting";

const now = Date.now();
/** Starts in 25 min → verification window (30 min lead) is already open */
const demoStartsAt = new Date(now + 25 * 60 * 1000).toISOString();
const inTwoHours = new Date(now + 2 * 60 * 60 * 1000).toISOString();
const tomorrow = new Date(now + 24 * 60 * 60 * 1000).toISOString();
const yesterday = new Date(now - 24 * 60 * 60 * 1000).toISOString();

const seedMeetings: Meeting[] = [
  {
    _id: "mock-meeting-1",
    slug: DEMO_MEETING_SLUG,
    name: "Associate Town Hall — Q2",
    google_meet_url: "https://meet.google.com/abc-defg-hij",
    audience_type: "all_associates",
    starts_at: demoStartsAt,
    verification_lead_minutes: 30,
    is_active: true,
    share_url: buildShareUrl(DEMO_MEETING_SLUG),
    verification_count: 3,
    created_at: yesterday,
  },
  {
    _id: "mock-meeting-2",
    slug: "associate-pro-sync-x7k2m1",
    name: "Associate Pro Strategy Sync",
    google_meet_url: "https://meet.google.com/xyz-uvwx-rst",
    audience_type: "associate_pro_plus",
    starts_at: tomorrow,
    verification_lead_minutes: 30,
    is_active: true,
    share_url: buildShareUrl("associate-pro-sync-x7k2m1"),
    verification_count: 0,
    created_at: yesterday,
  },
  {
    _id: "mock-meeting-3",
    slug: "training-session-p4q8n0",
    name: "Sales Training — Module 3",
    google_meet_url: "https://meet.google.com/lmn-opqr-stu",
    audience_type: "associate_only",
    starts_at: yesterday,
    verification_lead_minutes: 30,
    is_active: false,
    share_url: buildShareUrl("training-session-p4q8n0"),
    verification_count: 12,
    created_at: new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

const seedVerifications: MeetingVerification[] = [
  {
    _id: "mock-ver-1",
    meeting_id: "mock-meeting-1",
    email: "test@abodeflex.ng",
    first_name: "Demo",
    last_name: "Associate",
    phone: "+234 801 234 5678",
    referral_status: "associate-pro",
    region: "Lagos",
    verified_at: new Date(now - 15 * 60 * 1000).toISOString(),
    source: "existing_user",
  },
  {
    _id: "mock-ver-2",
    meeting_id: "mock-meeting-1",
    email: "chioma.ade@example.com",
    first_name: "Chioma",
    last_name: "Adeyemi",
    phone: "+234 802 345 6789",
    referral_status: "associate",
    region: "Abuja",
    verified_at: new Date(now - 10 * 60 * 1000).toISOString(),
    source: "existing_user",
  },
  {
    _id: "mock-ver-3",
    meeting_id: "mock-meeting-1",
    email: "new.joiner@example.com",
    first_name: "Tunde",
    last_name: "Bakare",
    phone: "+234 803 456 7890",
    referral_status: "associate-pro",
    region: "Port Harcourt",
    verified_at: new Date(now - 5 * 60 * 1000).toISOString(),
    source: "new_signup",
  },
];

let meetingsStore: Meeting[] = [...seedMeetings];
let verificationsStore: MeetingVerification[] = [...seedVerifications];

function fakeDelay(ms = 300) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function countVerifications(meetingId: string) {
  return verificationsStore.filter((v) => v.meeting_id === meetingId).length;
}

function buildStats(meeting: Meeting): MeetingStats {
  const verifications = verificationsStore
    .filter((v) => v.meeting_id === meeting._id)
    .sort((a, b) => a.verified_at.localeCompare(b.verified_at));

  const total = verifications.length;
  const newSignups = verifications.filter((v) => v.source === "new_signup").length;
  const existing = total - newSignups;
  const audienceTotal = 150;
  const regions = new Set(verifications.map((v) => v.region).filter(Boolean));

  const regionCounts: Record<string, number> = {};
  const statusCounts: Record<string, number> = {};
  for (const v of verifications) {
    const region = v.region ?? "Unknown";
    regionCounts[region] = (regionCounts[region] ?? 0) + 1;
    const status = v.referral_status ?? "Unknown";
    statusCounts[status] = (statusCounts[status] ?? 0) + 1;
  }

  const toBreakdown = (counts: Record<string, number>) =>
    Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

  const timeline =
    total > 0
      ? verifications.map((v) => ({
          date: v.verified_at,
          count: 1,
        }))
      : [];

  return {
    audience_label: meeting.audience_type.replace(/_/g, " "),
    total_verified: total,
    audience_total: audienceTotal,
    attendance_rate: audienceTotal > 0 ? Math.round((total / audienceTotal) * 100) : 0,
    new_signups: newSignups,
    existing_users: existing,
    regions_covered: regions.size,
    peak_time: verifications.length > 0 ? "Today, 2:30 PM" : null,
    verifications_per_hour: total > 0 ? 4.5 : 0,
    first_verification: verifications[0]?.verified_at ?? null,
    last_verification: verifications[verifications.length - 1]?.verified_at ?? null,
    timeline,
    source_breakdown: [
      { name: "Existing users", value: existing },
      { name: "New via gate", value: newSignups },
    ].filter((r) => r.value > 0),
    region_breakdown: toBreakdown(regionCounts),
    status_breakdown: toBreakdown(statusCounts),
  };
}

export const mockMeetingsApi = {
  async listMeetings(): Promise<Meeting[]> {
    await fakeDelay();
    return meetingsStore
      .map((m) => ({ ...m, verification_count: countVerifications(m._id) }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  },

  async getMeeting(id: string): Promise<Meeting | null> {
    await fakeDelay();
    const meeting = meetingsStore.find((m) => m._id === id);
    if (!meeting) return null;
    return { ...meeting, verification_count: countVerifications(id) };
  },

  async getMeetingBySlug(slug: string): Promise<Meeting | null> {
    await fakeDelay();
    const meeting = meetingsStore.find((m) => m.slug === slug);
    if (!meeting) return null;
    return { ...meeting, verification_count: countVerifications(meeting._id) };
  },

  async createMeeting(input: CreateMeetingFormValues): Promise<Meeting> {
    await fakeDelay();
    const slug = generateMeetSlug(input.name);
    const meeting: Meeting = {
      _id: `mock-meeting-${Date.now()}`,
      slug,
      name: input.name,
      google_meet_url: input.google_meet_url,
      audience_type: input.audience_type,
      starts_at: parseLagosDatetimeLocal(input.starts_at).toISOString(),
      verification_lead_minutes: input.verification_lead_minutes ?? 30,
      is_active: true,
      share_url: buildShareUrl(slug),
      verification_count: 0,
      created_at: new Date().toISOString(),
    };
    meetingsStore = [meeting, ...meetingsStore];
    return meeting;
  },

  async updateMeeting(
    id: string,
    input: Partial<CreateMeetingFormValues>
  ): Promise<Meeting | null> {
    await fakeDelay();
    const idx = meetingsStore.findIndex((m) => m._id === id);
    if (idx === -1) return null;

    const current = meetingsStore[idx];
    const updated: Meeting = {
      ...current,
      name: input.name ?? current.name,
      google_meet_url: input.google_meet_url ?? current.google_meet_url,
      audience_type: input.audience_type ?? current.audience_type,
      starts_at: input.starts_at
        ? parseLagosDatetimeLocal(input.starts_at).toISOString()
        : current.starts_at,
      verification_lead_minutes:
        input.verification_lead_minutes ?? current.verification_lead_minutes,
    };
    meetingsStore[idx] = updated;
    return { ...updated, verification_count: countVerifications(id) };
  },

  async toggleActive(id: string, is_active: boolean): Promise<Meeting | null> {
    await fakeDelay();
    const idx = meetingsStore.findIndex((m) => m._id === id);
    if (idx === -1) return null;
    meetingsStore[idx] = { ...meetingsStore[idx], is_active };
    return {
      ...meetingsStore[idx],
      verification_count: countVerifications(id),
    };
  },

  async getStats(id: string): Promise<MeetingStats | null> {
    await fakeDelay();
    const meeting = meetingsStore.find((m) => m._id === id);
    if (!meeting) return null;
    return buildStats(meeting);
  },

  async getVerifications(
    meetingId: string,
    page = 1,
    limit = 25
  ): Promise<{ verifications: MeetingVerification[]; total: number; page: number; limit: number }> {
    await fakeDelay();
    const all = verificationsStore
      .filter((v) => v.meeting_id === meetingId)
      .sort((a, b) => b.verified_at.localeCompare(a.verified_at));
    const start = (page - 1) * limit;
    return {
      verifications: all.slice(start, start + limit),
      total: all.length,
      page,
      limit,
    };
  },

  /** Used by fe-v2 mock verify flow */
  async verifyEmail(
    slug: string,
    email: string
  ): Promise<{
    success: boolean;
    redirect_url?: string;
    signup_url?: string;
    registrant_name?: string;
    error?: string;
    too_early?: boolean;
    verification_opens_at?: string;
  }> {
    await fakeDelay();
    const meeting = meetingsStore.find((m) => m.slug === slug);
    if (!meeting) return { success: false, error: "Meeting not found." };
    if (!meeting.is_active) return { success: false, error: "This session is no longer active." };

    const { canVerifyNow, getVerificationOpensAt } = await import("../lib/meet-time");
    if (!canVerifyNow(meeting.starts_at, meeting.verification_lead_minutes)) {
      const opensAt = getVerificationOpensAt(meeting.starts_at, meeting.verification_lead_minutes);
      return {
        success: false,
        error: "Verification is not open yet.",
        too_early: true,
        verification_opens_at: opensAt.toISOString(),
      };
    }

    const normalized = email.trim().toLowerCase();
    const mockValidEmails = ["test@abodeflex.ng", "chioma.ade@example.com", "demo@abodeflex.ng"];

    if (!mockValidEmails.includes(normalized)) {
      const base =
        process.env.NEXT_PUBLIC_APP_URL ??
        process.env.NEXT_PUBLIC_FE_APP_URL ??
        "http://localhost:3000";
      return {
        success: false,
        signup_url: `${base.replace(/\/$/, "")}/become-an-associate?meet=${encodeURIComponent(slug)}`,
      };
    }

    const verification: MeetingVerification = {
      _id: `mock-ver-${Date.now()}`,
      meeting_id: meeting._id,
      email: normalized,
      first_name: "Demo",
      last_name: "User",
      phone: "+234 800 000 0000",
      referral_status: "associate-pro",
      region: "Lagos",
      verified_at: new Date().toISOString(),
      source: "existing_user",
    };

    const existingIdx = verificationsStore.findIndex(
      (v) => v.meeting_id === meeting._id && v.email === normalized
    );
    if (existingIdx >= 0) {
      verificationsStore[existingIdx] = {
        ...verificationsStore[existingIdx],
        verified_at: verification.verified_at,
      };
    } else {
      verificationsStore = [verification, ...verificationsStore];
    }

    return {
      success: true,
      redirect_url: meeting.google_meet_url,
      registrant_name: "Demo User",
    };
  },

  async getUpcomingMeetings(): Promise<Meeting[]> {
    await fakeDelay();
    return meetingsStore
      .filter((m) => m.is_active)
      .sort((a, b) => a.starts_at.localeCompare(b.starts_at))
      .slice(0, 3);
  },
};

/** Reset store for tests */
export function resetMockMeetingsStore() {
  meetingsStore = [...seedMeetings];
  verificationsStore = [...seedVerifications];
}
