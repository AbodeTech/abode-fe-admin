import { executeRaw } from "@/lib/graphql-client";
import type { AudienceType } from "../lib/meet-validation";
import type {
  Meeting,
  MeetingDetail,
  MeetingListFilter,
  MeetingStats,
  MeetingVerification,
  VerificationsPage,
} from "../types";

const MEETING_FIELDS = `
  _id
  slug
  name
  google_meet_url
  audience_type
  starts_at
  verification_lead_minutes
  is_active
  share_url
  verification_count
  created_at
  updated_at
`;

const GET_MEETINGS = `
  query GetMeetings($page: Int, $limit: Int, $filter: MeetingListFilterInput) {
    getMeetings(page: $page, limit: $limit, filter: $filter) {
      count
      page
      limit
      results {
        ${MEETING_FIELDS}
      }
    }
  }
`;

const GET_MEETING_BY_ID = `
  query GetMeetingById($id: ID!) {
    getMeetingById(id: $id) {
      ${MEETING_FIELDS}
      stats {
        total_verifications
        by_referral_status {
          referral_status
          count
        }
      }
    }
  }
`;

const GET_MEETING_VERIFICATIONS = `
  query GetMeetingVerifications($meetingId: ID!, $page: Int, $limit: Int) {
    getMeetingVerifications(meetingId: $meetingId, page: $page, limit: $limit) {
      count
      page
      limit
      results {
        _id
        meeting
        user
        email
        first_name
        last_name
        phone
        referral_status
        region
        verified_at
        source
      }
    }
  }
`;

const CREATE_MEETING = `
  mutation CreateMeeting($input: CreateMeetingInput!) {
    createMeeting(input: $input) {
      ${MEETING_FIELDS}
    }
  }
`;

const UPDATE_MEETING = `
  mutation UpdateMeeting($id: ID!, $input: UpdateMeetingInput!) {
    updateMeeting(id: $id, input: $input) {
      ${MEETING_FIELDS}
    }
  }
`;

const TOGGLE_MEETING_ACTIVE = `
  mutation ToggleMeetingActive($id: ID!, $isActive: Boolean!) {
    toggleMeetingActive(id: $id, isActive: $isActive) {
      ${MEETING_FIELDS}
    }
  }
`;

type ApiVerification = {
  _id: string;
  meeting: string;
  user?: string | null;
  email: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  referral_status?: string | null;
  region?: string | null;
  verified_at: string;
  source: string;
};

function mapVerification(row: ApiVerification): MeetingVerification {
  return {
    _id: row._id,
    meeting_id: row.meeting,
    user_id: row.user ?? null,
    email: row.email,
    first_name: row.first_name ?? null,
    last_name: row.last_name ?? null,
    phone: row.phone ?? null,
    referral_status: row.referral_status ?? null,
    region: row.region ?? null,
    verified_at: row.verified_at,
    source: row.source,
  };
}

export async function fetchMeetings(
  page = 1,
  limit = 100,
  filter?: MeetingListFilter
): Promise<Meeting[]> {
  const data = await executeRaw<{
    getMeetings: {
      count: number;
      page: number;
      limit: number;
      results: Meeting[];
    };
  }>(GET_MEETINGS, { page, limit, filter });

  return data.getMeetings.results;
}

export async function fetchMeetingById(id: string): Promise<MeetingDetail> {
  const data = await executeRaw<{ getMeetingById: MeetingDetail | null }>(
    GET_MEETING_BY_ID,
    { id }
  );

  if (!data.getMeetingById) {
    throw new Error("Meeting not found.");
  }
  return data.getMeetingById;
}

export async function fetchMeetingStats(id: string): Promise<MeetingStats> {
  const detail = await fetchMeetingById(id);
  return detail.stats;
}

export async function fetchMeetingVerifications(
  meetingId: string,
  page = 1,
  limit = 25
): Promise<VerificationsPage> {
  const data = await executeRaw<{
    getMeetingVerifications: {
      count: number;
      page: number;
      limit: number;
      results: ApiVerification[];
    };
  }>(GET_MEETING_VERIFICATIONS, { meetingId, page, limit });

  const payload = data.getMeetingVerifications;
  return {
    verifications: payload.results.map(mapVerification),
    total: payload.count,
    page: payload.page,
    limit: payload.limit,
  };
}

export async function createMeeting(input: {
  name: string;
  google_meet_url: string;
  audience_type: AudienceType | string;
  starts_at: string;
  verification_lead_minutes?: number;
}): Promise<Meeting> {
  const data = await executeRaw<{ createMeeting: Meeting }>(CREATE_MEETING, {
    input,
  });
  return data.createMeeting;
}

export async function updateMeeting(
  id: string,
  input: {
    name?: string;
    google_meet_url?: string;
    audience_type?: AudienceType | string;
    starts_at?: string;
    verification_lead_minutes?: number;
  }
): Promise<Meeting> {
  const data = await executeRaw<{ updateMeeting: Meeting }>(UPDATE_MEETING, {
    id,
    input,
  });
  return data.updateMeeting;
}

export async function toggleMeetingActive(
  id: string,
  isActive: boolean
): Promise<Meeting> {
  const data = await executeRaw<{ toggleMeetingActive: Meeting }>(
    TOGGLE_MEETING_ACTIVE,
    { id, isActive }
  );
  return data.toggleMeetingActive;
}
