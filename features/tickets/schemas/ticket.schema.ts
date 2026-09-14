import { z } from 'zod';

/* ============================================================
 * Support tickets — /admin/tickets/*, /admin/issues/*
 *
 * Ported from main's GraphQL design. Contract:
 * abode-be-v2/docs/SUPPORT-TICKETS-DESIGN.md §5–8, and
 * docs/TICKETS-REST-CONTRACT.md for what changed under the FE.
 *
 * The v2 controllers have no response DTOs — they return populated Mongoose
 * documents straight from the service. So the wire shape IS the model, and
 * every object here is `looseObject`: unknown keys pass through rather than
 * failing a parse when the BE adds a field. What is listed is what the
 * components actually read.
 * ============================================================ */

export const TICKET_CHANNELS = ['email', 'phone', 'whatsapp', 'in_person', 'other'] as const;
export const TicketChannelSchema = z.enum(TICKET_CHANNELS);
export type TicketChannel = z.infer<typeof TicketChannelSchema>;

export const TICKET_STATUSES = ['open', 'in_progress', 'waiting_customer', 'resolved'] as const;
export const TicketStatusSchema = z.enum(TICKET_STATUSES);
export type TicketStatus = z.infer<typeof TicketStatusSchema>;

/**
 * `fault` is what support calls an "issue". The wire value is left alone — a
 * rename would need a migration and a classifier re-prompt, and would collide
 * with the Issue entity these tickets group under. The translation happens once,
 * in lib/ticket-display.ts.
 */
export const TICKET_TYPES = ['enquiry', 'fault', 'request'] as const;
export const TicketTypeSchema = z.enum(TICKET_TYPES);
export type TicketType = z.infer<typeof TicketTypeSchema>;

/** Who put a value there — lets AI-set fields be spot-checked and measured. */
export const FIELD_SOURCES = ['ai', 'human'] as const;
export const FieldSourceSchema = z.enum(FIELD_SOURCES);
export type FieldSource = z.infer<typeof FieldSourceSchema>;

export const ISSUE_STATUSES = ['investigating', 'identified', 'monitoring', 'resolved'] as const;
export const IssueStatusSchema = z.enum(ISSUE_STATUSES);
export type IssueStatus = z.infer<typeof IssueStatusSchema>;

/** Queue chips. These narrow the list; the counts stay scope-wide. */
export const TICKET_FILTERS = [
  'all',
  /** Owned by me, or I was pulled in as a collaborator. */
  'mine',
  'unassigned',
  'unlinked',
  'open',
  'waiting_customer',
  'blocked_on_issue',
  'resolved',
] as const;
export const TicketFilterSchema = z.enum(TICKET_FILTERS);
export type TicketFilter = z.infer<typeof TicketFilterSchema>;

export const TICKET_SORTS = ['oldest_first', 'newest_first', 'recently_updated'] as const;
export const TicketSortSchema = z.enum(TICKET_SORTS);
export type TicketSort = z.infer<typeof TicketSortSchema>;

export const MESSAGE_DIRECTIONS = ['inbound', 'outbound'] as const;
export const MessageDirectionSchema = z.enum(MESSAGE_DIRECTIONS);

/* ---------------------------------------------------------- refs ---------- */

/** Populated admin ref. `role` is the role name, not an object, on these. */
export const AdminRefSchema = z.looseObject({
  _id: z.string(),
  userName: z.string().nullish(),
  email: z.string().nullish(),
  role: z.unknown().nullish(),
});
export type AdminRef = z.infer<typeof AdminRefSchema>;

export const UserRefSchema = z.looseObject({
  _id: z.string(),
  firstName: z.string().nullish(),
  lastName: z.string().nullish(),
  email: z.string().nullish(),
  phoneNumber: z.string().nullish(),
});
export type UserRef = z.infer<typeof UserRefSchema>;

export const IssueRefSchema = z.looseObject({
  _id: z.string(),
  issue_ref: z.string(),
  title: z.string(),
  status: IssueStatusSchema,
});

export const TicketAttachmentSchema = z.looseObject({
  url: z.string(),
  filename: z.string().nullish(),
  mime: z.string().nullish(),
  size: z.number().nullish(),
});

/**
 * What the classifier proposed, kept whether or not it was applied.
 *
 * v2 splits the single GraphQL `confidence` into `category_confidence` and
 * `type_confidence` — the model is asked two questions and was never equally
 * sure of both, so one number was always a lie about one of them.
 */
export const TicketAiSchema = z.looseObject({
  suggested_category: z.string().nullish(),
  suggested_type: TicketTypeSchema.nullish(),
  category_confidence: z.number().nullish(),
  type_confidence: z.number().nullish(),
  sender_is_affected: z.boolean().nullish(),
  affected_hints: z
    .array(z.looseObject({ value: z.string(), kind: z.string(), note: z.string().nullish() }))
    .nullish(),
  model: z.string().nullish(),
  classified_at: z.string().nullish(),
  /** Set when classification failed. Ticket creation never depends on it. */
  error: z.string().nullish(),
});

/* -------------------------------------------------------- tickets --------- */

export const TicketSchema = z.looseObject({
  _id: z.string(),
  ticket_ref: z.string(),
  channel: TicketChannelSchema,
  source_reference: z.string().nullish(),
  subject: z.string(),
  body: z.string().nullish(),
  category: z.string().nullish(),
  type: TicketTypeSchema.nullish(),
  category_source: FieldSourceSchema.nullish(),
  type_source: FieldSourceSchema.nullish(),
  user_affected_source: FieldSourceSchema.nullish(),
  ai: TicketAiSchema.nullish(),
  status: TicketStatusSchema,
  sender: UserRefSchema.nullish(),
  user_affected: UserRefSchema.nullish(),
  assigned_admin: AdminRefSchema.nullish(),
  collaborators: z.array(AdminRefSchema).default([]),
  issue: IssueRefSchema.nullish(),
  resolution: z.string().nullish(),
  resolved_at: z.string().nullish(),
  resolved_by: AdminRefSchema.nullish(),
  attachments: z.array(TicketAttachmentSchema).default([]),
  /** Set when merged into another ticket; drops out of every queue. */
  merged_into: z.string().nullish(),
  related_ticket: z.string().nullish(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Ticket = z.infer<typeof TicketSchema>;

export const TicketNoteSchema = z.looseObject({
  _id: z.string(),
  admin: AdminRefSchema.nullish(),
  body: z.string(),
  is_deleted: z.boolean().nullish(),
  createdAt: z.string(),
  updatedAt: z.string().nullish(),
});
export type TicketNote = z.infer<typeof TicketNoteSchema>;

export const TicketMessageSchema = z.looseObject({
  _id: z.string(),
  direction: MessageDirectionSchema,
  channel: TicketChannelSchema.nullish(),
  subject: z.string().nullish(),
  body: z.string().nullish(),
  from_address: z.string().nullish(),
  sent_at: z.string().nullish(),
  author_admin: AdminRefSchema.nullish(),
  author_user: UserRefSchema.nullish(),
  match: z.looseObject({ signal: z.string(), conflict: z.boolean().nullish() }).nullish(),
  delivery: z.looseObject({ status: z.string(), error: z.string().nullish() }).nullish(),
  createdAt: z.string().nullish(),
});
export type TicketMessage = z.infer<typeof TicketMessageSchema>;

export const DuplicateCandidateSchema = z.looseObject({
  _id: z.string(),
  ticket_ref: z.string(),
  subject: z.string(),
  status: TicketStatusSchema,
  createdAt: z.string(),
});

/** GET /admin/tickets/:id */
export const TicketDetailSchema = z.looseObject({
  ticket: TicketSchema,
  notes: z.array(TicketNoteSchema).default([]),
  /** The conversation, oldest first. A ticket opened before threading has one. */
  messages: z.array(TicketMessageSchema).default([]),
  /** Recent tickets from the same address — merge candidates, not the thread. */
  duplicates: z.array(DuplicateCandidateSchema).default([]),
  /** The customer's CS Manager. Context only — never the assignee. */
  cs_manager: AdminRefSchema.nullish(),
});
export type TicketDetail = z.infer<typeof TicketDetailSchema>;

/** Book-wide per chip, unaffected by the active chip. */
export const TicketFilterCountsSchema = z.looseObject({
  all: z.number(),
  mine: z.number(),
  unassigned: z.number(),
  unlinked: z.number(),
  open: z.number(),
  waiting_customer: z.number(),
  blocked_on_issue: z.number(),
  resolved: z.number(),
});
export type TicketFilterCounts = z.infer<typeof TicketFilterCountsSchema>;

/** GET /admin/tickets — rows and the eight chip counts in one response. */
export const TicketListSchema = z.looseObject({
  count: z.number(),
  results: z.array(TicketSchema),
  filter_counts: TicketFilterCountsSchema,
});
export type TicketList = z.infer<typeof TicketListSchema>;

/** GET /admin/tickets/stats */
export const TicketQueueStatsSchema = z.looseObject({
  open: z.number(),
  in_progress: z.number(),
  waiting_customer: z.number(),
  blocked_on_issue: z.number(),
  /** Unresolved and older than the breach window — the ones going wrong. */
  breaching: z.number(),
  resolved_last_7_days: z.number(),
  oldest_open_hours: z.number().nullish(),
});
export type TicketQueueStats = z.infer<typeof TicketQueueStatsSchema>;

export const TicketUserSuggestionSchema = z.looseObject({
  user: UserRefSchema,
  reason: z.string(),
  confidence: z.union([z.string(), z.number()]).nullish(),
});
export type TicketUserSuggestion = z.infer<typeof TicketUserSuggestionSchema>;

export const TicketIssueSuggestionSchema = z.looseObject({
  issue: IssueRefSchema,
  score: z.number().nullish(),
  matchedTerms: z.array(z.string()).nullish(),
  matched_terms: z.array(z.string()).nullish(),
});
export type TicketIssueSuggestion = z.infer<typeof TicketIssueSuggestionSchema>;

/* --------------------------------------------------------- issues --------- */

export const IssueSchema = z.looseObject({
  _id: z.string(),
  issue_ref: z.string(),
  title: z.string(),
  description: z.string().nullish(),
  status: IssueStatusSchema,
  owner: AdminRefSchema.nullish(),
  resolution_note: z.string().nullish(),
  resolved_at: z.string().nullish(),
  resolved_by: AdminRefSchema.nullish(),
  /** Survives every reopen, so "we thought we had this on 3 Aug" stays true. */
  first_resolved_at: z.string().nullish(),
  reopened_at: z.string().nullish(),
  reopen_count: z.number().nullish(),
  ticket_count: z.number().nullish(),
  created_by: AdminRefSchema.nullish(),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type Issue = z.infer<typeof IssueSchema>;

export const IssueTicketRowSchema = z.looseObject({
  _id: z.string(),
  ticket_ref: z.string(),
  subject: z.string(),
  status: TicketStatusSchema,
  createdAt: z.string(),
  user_affected: UserRefSchema.nullish(),
});
export type IssueTicketRow = z.infer<typeof IssueTicketRowSchema>;

export const IssueListSchema = z.looseObject({
  count: z.number(),
  results: z.array(IssueSchema),
});

/** GET /admin/issues/:id */
export const IssueDetailSchema = z.looseObject({
  issue: IssueSchema,
  ticket_count: z.number().default(0),
  tickets: z.array(IssueTicketRowSchema).default([]),
});
export type IssueDetail = z.infer<typeof IssueDetailSchema>;

export const ResolveIssueResultSchema = z.looseObject({
  issue: IssueSchema,
  tickets_resolved: z.number().nullish(),
  tickets_excluded: z.number().nullish(),
  customers_affected: z.number().nullish(),
});
