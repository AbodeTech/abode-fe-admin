import { z } from 'zod';

/* ============================================================
 * WhatsApp inbox — GET /admin/whatsapp/*. Read-only.
 *
 * The message log read as conversations: one row per number, then one
 * number's transcript. Shapes are transcribed from `AdminWhatsappService`
 * and `WhatsappMessageLogRepository` (`WhatsappContactRow` + the identity
 * block). Field names match v1's GraphQL types one-for-one; what moved is
 * the total, which is now the envelope's `meta.total` instead of `count`.
 *
 * Phone numbers are Meta's form — E.164 digits with no plus. `e164` is the
 * plus-prefixed form the identity lookup matched against.
 * ============================================================ */

export const WHATSAPP_DIRECTIONS = ['inbound', 'outbound'] as const;
export const WhatsappDirectionSchema = z.enum(WHATSAPP_DIRECTIONS);
export type WhatsappDirection = z.infer<typeof WhatsappDirectionSchema>;

/**
 * Inbound: received → processed | failed | rate_limited | skipped | rejected.
 * Outbound: sent → delivered → read, or undelivered — Meta accepted the send
 * and then dropped it. Kept a plain string on the row so a status the BE adds
 * later renders as text instead of failing the whole transcript.
 */
export const WHATSAPP_LOG_STATUSES = [
  'received',
  'processed',
  'failed',
  'rate_limited',
  'skipped',
  'rejected',
  'sent',
  'delivered',
  'read',
  'undelivered',
] as const;
export type WhatsappLogStatus = (typeof WHATSAPP_LOG_STATUSES)[number];

/**
 * Who a number belongs to, attached best-effort server-side. A number that
 * matched no account (or whose lookup failed) comes back with every name
 * field null — the transcript stays readable with an unnamed contact.
 */
export const WhatsappContactIdentitySchema = z.looseObject({
  phoneNumber: z.string(),
  e164: z.string().nullable(),
  userId: z.string().nullable(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  email: z.string().nullable(),
  referralStatus: z.string().nullable(),
  isSuspended: z.boolean(),
  optedOut: z.boolean(),
});

export type WhatsappContactIdentity = z.infer<typeof WhatsappContactIdentitySchema>;

/**
 * GET /admin/whatsapp/contacts — one row per number, newest conversation
 * first. `failedCount` counts failed, rate-limited and undelivered messages,
 * which is also what `unresolved=true` filters on.
 */
export const WhatsappContactSchema = WhatsappContactIdentitySchema.extend({
  firstMessageAt: z.string().nullable(),
  lastMessageAt: z.string().nullable(),
  messageCount: z.number(),
  inboundCount: z.number(),
  outboundCount: z.number(),
  failedCount: z.number(),
  lastMessagePreview: z.string().nullable(),
  lastMessageDirection: WhatsappDirectionSchema.catch('inbound'),
  lastMessageStatus: z.string().nullable(),
  conversationStep: z.string().nullable(),
});

export type WhatsappContact = z.infer<typeof WhatsappContactSchema>;

/**
 * The webhook's whitelisted slice of Meta's message object. Only `media_id`
 * and `media_mime_type` matter here — the backend deliberately stores ids,
 * never the file — so an inbound photo can be named but not shown.
 */
export const WhatsappMessagePayloadSchema = z.looseObject({
  media_id: z.string().optional(),
  media_mime_type: z.string().optional(),
});

export type WhatsappMessagePayload = z.infer<typeof WhatsappMessagePayloadSchema>;

export const WhatsappMessageSchema = z.looseObject({
  id: z.string(),
  messageId: z.string().nullable(),
  direction: WhatsappDirectionSchema.catch('inbound'),
  messageType: z.string().nullable(),
  text: z.string(),
  preview: z.string().nullable(),
  templateName: z.string().nullable(),
  conversationStep: z.string().nullable(),
  status: z.string(),
  error: z.string().nullable(),
  /**
   * Meta's numeric reason on an undelivered message — 131026 (unreachable),
   * 131047 (outside the 24-hour window), 131049 (pacing). New on v2.
   */
  errorCode: z.number().nullable().optional(),
  durationMs: z.number().nullable(),
  /** Mixed on the BE — anything that isn't an object is treated as absent. */
  payload: WhatsappMessagePayloadSchema.nullable().catch(null),
  createdAt: z.string(),
});

export type WhatsappMessage = z.infer<typeof WhatsappMessageSchema>;

/**
 * GET /admin/whatsapp/conversations/:phone — the service returns no inner
 * `data` key, so the whole object is the envelope's `data` (with `meta`
 * copied up beside it as well). Paged newest-first, returned oldest-first:
 * page 1 is the end of the transcript.
 */
export const WhatsappConversationSchema = z.looseObject({
  messages: z.array(WhatsappMessageSchema),
  contact: WhatsappContactIdentitySchema,
  meta: z.looseObject({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  }),
});

export type WhatsappConversation = z.infer<typeof WhatsappConversationSchema>;
