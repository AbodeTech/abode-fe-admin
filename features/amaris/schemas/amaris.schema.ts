import { z } from 'zod';

/* ============================================================
 * Amaris — the assistant's admin query log, GET /admin/amaris/*.
 *
 * Read-only by design (BE decision AA-18): the log is an audit trail, not an
 * editable resource. Two endpoints — the paginated list and the counts strip.
 *
 * Shapes are transcribed from the repository's own interfaces
 * (`AmarisQueryRow`, `AmarisQueryCounts`), which promise every key always
 * present so the surface never renders `undefined`.
 *
 * Named Amaris here because that is the backend module's name; the feature
 * was called "Ilé Assistant" on the v1 admin — same product, one name now.
 * ============================================================ */

export const AMARIS_AUDIENCES = ['customer', 'associate'] as const;
export const AmarisAudienceSchema = z.enum(AMARIS_AUDIENCES);
export type AmarisAudience = z.infer<typeof AmarisAudienceSchema>;

export const AMARIS_AUDIENCE_LABELS: Record<AmarisAudience, string> = {
  customer: 'Customer',
  associate: 'Associate',
};

export const AMARIS_CHANNELS = ['web', 'whatsapp'] as const;
export const AmarisChannelSchema = z.enum(AMARIS_CHANNELS);
export type AmarisChannel = z.infer<typeof AmarisChannelSchema>;

export const AMARIS_CHANNEL_LABELS: Record<AmarisChannel, string> = {
  web: 'Web',
  whatsapp: 'WhatsApp',
};

/**
 * One logged question. `answered` is the repository's derived value — the
 * inverse of the `[NO_ANSWER]` sentinel — so `answered: false` rows are the
 * handbook-gap backlog: questions the source material couldn't cover.
 *
 * The row is already flattened server-side (user resolved to name fields);
 * `audience`/`channel` are typed as their enums but kept tolerant via
 * `catch` so one legacy row can't take down the whole log.
 */
export const AmarisQueryRowSchema = z.looseObject({
  id: z.string(),
  email: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  phone: z.string().nullable(),
  channel: AmarisChannelSchema.catch('web'),
  audience: AmarisAudienceSchema.catch('customer'),
  question: z.string(),
  answer: z.string().nullable(),
  answered: z.boolean(),
  createdAt: z.string(),
});

export type AmarisQueryRow = z.infer<typeof AmarisQueryRowSchema>;

/**
 * GET /admin/amaris/queries — a bare array inside the envelope.
 *
 * ⛔ ticket 26 — the service returns `{count, data}`, but the global envelope
 * interceptor lifts any inner `data` key and DROPS the rest, so `count` never
 * reaches the wire (verified live 2026-08-18). Until the BE returns the
 * standard paged shape (`data` + `meta`), the total is unknowable here and
 * pagination runs on a full-page heuristic — no invented totals.
 */
export const AmarisQueryListSchema = z.array(AmarisQueryRowSchema);

export type AmarisQueryList = z.infer<typeof AmarisQueryListSchema>;

/** GET /admin/amaris/queries/counts — every key always present. */
export const AmarisCountsSchema = z.looseObject({
  customer: z.number(),
  associate: z.number(),
  answered: z.number(),
  noAnswer: z.number(),
  web: z.number(),
  whatsapp: z.number(),
  total: z.number(),
});

export type AmarisCounts = z.infer<typeof AmarisCountsSchema>;

/* -------------------- helpers -------------------- */

export function askerName(row: AmarisQueryRow): string {
  return `${row.lastName ?? ''} ${row.firstName ?? ''}`.trim() || row.email || row.phone || 'Unknown';
}

export function askerInitials(row: AmarisQueryRow): string {
  const initials = `${row.lastName?.[0] ?? ''}${row.firstName?.[0] ?? ''}`.toUpperCase();
  return initials || (row.email[0] ?? row.phone?.[0] ?? '?').toUpperCase();
}
