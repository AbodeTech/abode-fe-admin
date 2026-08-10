/** Abode meetings run on West Africa Time (UTC+1, no DST). */
export const MEET_TIMEZONE = "Africa/Lagos";

export const DEFAULT_VERIFICATION_LEAD_MINUTES = 30;

const LAGOS_FORMAT: Intl.DateTimeFormatOptions = {
  timeZone: MEET_TIMEZONE,
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
};

const LAGOS_FORMAT_SHORT: Intl.DateTimeFormatOptions = {
  timeZone: MEET_TIMEZONE,
  weekday: "short",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
};

/** Parse `datetime-local` value (YYYY-MM-DDTHH:mm) as Lagos wall clock → UTC Date. */
export function parseLagosDatetimeLocal(value: string): Date {
  const match = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) {
    return new Date(value);
  }

  const [, year, month, day, hour, minute] = match.map(Number);
  return new Date(Date.UTC(year, month - 1, day, hour - 1, minute, 0, 0));
}

export function formatLagosTime(iso: string | Date, short = false): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  return date.toLocaleString("en-NG", short ? LAGOS_FORMAT_SHORT : LAGOS_FORMAT);
}

export function formatLagosPeakTime(iso: string | Date): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  return date.toLocaleString("en-NG", {
    timeZone: MEET_TIMEZONE,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function getVerificationOpensAt(
  startsAt: string | Date,
  leadMinutes = DEFAULT_VERIFICATION_LEAD_MINUTES
): Date {
  const start = typeof startsAt === "string" ? new Date(startsAt) : startsAt;
  return new Date(start.getTime() - leadMinutes * 60_000);
}

export function canVerifyNow(
  startsAt: string | Date,
  leadMinutes = DEFAULT_VERIFICATION_LEAD_MINUTES,
  now = Date.now()
): boolean {
  return now >= getVerificationOpensAt(startsAt, leadMinutes).getTime();
}

export function toDatetimeLocalValue(iso: string | Date): string {
  const date = typeof iso === "string" ? new Date(iso) : iso;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: MEET_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";

  return `${get("year")}-${get("month")}-${get("day")}T${get("hour")}:${get("minute")}`;
}
