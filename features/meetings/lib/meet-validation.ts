/**
 * Audience eligibility — mirrors backend MEETING_AUDIENCE_MAP
 * (Meet Gate docs §3 / src/database/models/Meeting.ts).
 *
 * Used by verifyMeetingEmail + getUpcomingMeetings on the BE; keep this table
 * identical so admin copy and gating never drift.
 */
export type AudienceType = "all_associates" | "associate_pro_plus" | "associate_only";

export type ReferralStatus =
  | "user"
  | "associate"
  | "associate-pro"
  | "agency"
  | "founder"
  | "premium"
  | "management";

export const MEETING_AUDIENCE_MAP: Record<
  AudienceType,
  readonly ReferralStatus[]
> = {
  all_associates: [
    "associate",
    "associate-pro",
    "agency",
    "founder",
    "premium",
    "management",
  ],
  associate_pro_plus: ["associate-pro", "agency", "founder", "premium"],
  associate_only: ["associate"],
};

export const AUDIENCE_LABELS: Record<AudienceType, string> = {
  all_associates: "All Associates",
  associate_pro_plus: "Associate Pro+",
  associate_only: "Associate",
};

export function getAudienceLabel(audienceType: string): string {
  if (audienceType in AUDIENCE_LABELS) {
    return AUDIENCE_LABELS[audienceType as AudienceType];
  }
  return audienceType.replace(/_/g, " ");
}

export function isAudienceType(value: string): value is AudienceType {
  return (
    value === "all_associates" ||
    value === "associate_pro_plus" ||
    value === "associate_only"
  );
}

/** Narrow API audience_type to the form enum; fall back to all_associates. */
export function toAudienceType(value: string): AudienceType {
  if (
    value === "all_associates" ||
    value === "associate_pro_plus" ||
    value === "associate_only"
  ) {
    return value;
  }
  return "all_associates";
}

function formatEligibleStatuses(audienceType: AudienceType): string {
  return MEETING_AUDIENCE_MAP[audienceType].join(", ");
}

export const AUDIENCE_OPTIONS: {
  value: AudienceType;
  label: string;
  description: string;
}[] = [
  {
    value: "all_associates",
    label: "All associates",
    description: formatEligibleStatuses("all_associates"),
  },
  {
    value: "associate_pro_plus",
    label: "Associate Pro and above",
    description: formatEligibleStatuses("associate_pro_plus"),
  },
  {
    value: "associate_only",
    label: "Associate tier only",
    description: formatEligibleStatuses("associate_only"),
  },
];

export function isEligibleForAudience(
  audienceType: AudienceType,
  referralStatus: string | null | undefined
): boolean {
  if (!referralStatus) return false;
  const allowed = MEETING_AUDIENCE_MAP[audienceType];
  return allowed?.includes(referralStatus as ReferralStatus) ?? false;
}

export function getEligibleReferralStatuses(
  audienceType: AudienceType
): readonly ReferralStatus[] {
  return MEETING_AUDIENCE_MAP[audienceType];
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidGoogleMeetUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim());
    return parsed.hostname === "meet.google.com";
  } catch {
    return false;
  }
}

export function slugifyName(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base || "meeting";
}

export function generateMeetSlug(name: string): string {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `${slugifyName(name)}-${suffix}`;
}

export function buildShareUrl(slug: string): string {
  const base =
    process.env.NEXT_PUBLIC_FE_APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/join/${slug}`;
}

/** Prefer FE env base so Open/Copy hit abode-fe-v2, not a misconfigured BE share_url. */
export function resolveMeetingShareUrl(meeting: {
  slug: string;
  share_url?: string | null;
}): string {
  if (meeting.slug) return buildShareUrl(meeting.slug);
  return meeting.share_url ?? "";
}
