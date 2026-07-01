export type AudienceType = "all_associates" | "associate_pro_plus" | "associate_only";

export const AUDIENCE_OPTIONS: { value: AudienceType; label: string }[] = [
  { value: "all_associates", label: "All associates (associate + associate-pro and above)" },
  { value: "associate_pro_plus", label: "Associate Pro and above (realtor dashboard users)" },
  { value: "associate_only", label: "Associate tier only" },
];

export const AUDIENCE_LABELS: Record<AudienceType, string> = {
  all_associates: "All Associates",
  associate_pro_plus: "Associate Pro+",
  associate_only: "Associate",
};

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
