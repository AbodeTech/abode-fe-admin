import { MockHttpError, type MockRoutes } from '../router';
import { body } from './util';
import { findPerson } from './people';
import { findAdmin } from './cs-managers';

/* ============================================================
 * Support ticket mocks — the inbox: list (with chip counts), queue stats,
 * categories, detail, status/routing PATCH, reply, notes and resolve, plus
 * empty suggest-users / suggest-issues so the panels that ask render.
 *
 * Mirrors `support-ticket-admin.controller.ts` and the request DTOs in
 * `dto/support-ticket-requests.dto.ts` on abode-be-v2 staging. The two writes
 * whose rules the FE leans on are checked the way the BE checks them:
 *
 *  - reply: `ReplyAttachmentDto` field for field, and the limits in
 *    `attachments/ticket-attachment.service.ts` (5 files, 15MB each, 25MB in
 *    total, https on res.cloudinary.com). The files themselves still upload
 *    to Cloudinary for real — that happens outside the api client.
 *  - resolve: the summary may be absent, null or blank; blank stores as null.
 *
 * Any unknown body key is a 400, as `forbidNonWhitelisted` makes it.
 *
 * Fixtures: an open ticket whose messages carry files both ways, one with a
 * v1-era message (no `attachments` key) and a file that was never stored
 * (empty url), and two resolved tickets — with and without a summary.
 *
 * Unclaimed: create, classify, merge, collaborators, participants, note
 * edit/delete and /admin/issues/* — those controls 404 in mock mode.
 * ============================================================ */

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 3_600_000).toISOString();
const daysAgo = (days: number) => hoursAgo(days * 24);

/** The admin the mock login signs in as (auth.ts). Writes are authored by them. */
const AGENT = { _id: '665f1c0a9b2e4d0012a3b456', userName: 'ada.okafor', email: null };

const MB = 1024 * 1024;
const MAX_REPLY_ATTACHMENTS = 5;
const MAX_ATTACHMENT_BYTES = 15 * MB;
const MAX_REPLY_TOTAL_BYTES = 25 * MB;
const MIN_NOTE_LENGTH = 5;
const BREACH_AFTER_HOURS = 48;

const CATEGORIES = [
  'authentication',
  'payment_process',
  'payment_plan',
  'documents',
  'allocation',
  'development_levy',
  'verification_kyc',
  'referral_commission',
  'account_profile',
  'other',
];

type Status = 'open' | 'in_progress' | 'waiting_customer' | 'resolved';

type MockAttachment = {
  filename: string;
  mime: string;
  size: number;
  url: string;
  public_id: string;
  resource_type: string;
  format: string;
  cid: string | null;
  inline: boolean;
};

type MockParticipant = {
  address: string;
  name: string | null;
  role: 'customer' | 'cc';
  added_via: 'original' | 'inbound' | 'outbound' | 'manual';
  added_at: string;
};

type MockTicket = {
  _id: string;
  ticket_ref: string;
  channel: 'email' | 'phone' | 'whatsapp' | 'in_person' | 'other';
  source_reference: string | null;
  subject: string;
  body: string | null;
  category: string | null;
  type: 'enquiry' | 'fault' | 'request' | null;
  category_source: 'ai' | 'human' | null;
  type_source: 'ai' | 'human' | null;
  status: Status;
  /** Person ids (people.ts) and admin ids (cs-managers.ts, or AGENT). */
  sender: string | null;
  user_affected: string | null;
  assigned_admin: string | null;
  collaborators: string[];
  participants: MockParticipant[];
  resolution: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  merged_into: string | null;
  createdAt: string;
  updatedAt: string;
};

type MockMessage = {
  _id: string;
  ticket: string;
  direction: 'inbound' | 'outbound';
  channel: string;
  subject: string | null;
  body: string;
  from_address: string | null;
  cc_addresses?: string[];
  /** Absent on a message carried over from v1 — the schema must default it. */
  attachments?: MockAttachment[];
  author_admin: string | null;
  author_user: string | null;
  sent_at: string;
  match: { signal: string; conflict: boolean } | null;
  delivery: { status: 'pending' | 'sent' | 'failed'; error: string | null } | null;
  createdAt: string;
};

type MockNote = {
  _id: string;
  ticket: string;
  admin: string;
  body: string;
  is_deleted: boolean;
  createdAt: string;
  updatedAt: string;
};

const cloudinaryFile = (
  ref: string,
  filename: string,
  mime: string,
  size: number,
  resourceType = 'image'
): MockAttachment => {
  const format = filename.split('.').pop() ?? '';
  const publicId = `support-tickets/${ref}/${filename.replace(/\.[^.]+$/, '')}`;
  return {
    filename,
    mime,
    size,
    url: `https://res.cloudinary.com/demo/${resourceType}/upload/v1/${publicId}.${format}`,
    public_id: publicId,
    resource_type: resourceType,
    format,
    cid: null,
    inline: false,
  };
};

const tickets: MockTicket[] = [
  {
    _id: '665ftkt000000000000000a1',
    ticket_ref: 'TKT-000101',
    channel: 'email',
    source_reference: 'john.okafor@example.com',
    subject: 'Payment made but plan still shows outstanding',
    body: 'I paid my October instalment on Monday but the app still says it is due. Receipt attached.',
    category: 'payment_process',
    type: 'fault',
    category_source: 'ai',
    type_source: 'ai',
    status: 'in_progress',
    sender: '665fcccc00000000000000c1',
    user_affected: '665fcccc00000000000000c1',
    assigned_admin: AGENT._id,
    collaborators: ['665fadmn00000000000000d2'],
    participants: [
      { address: 'john.okafor@example.com', name: 'John Okafor', role: 'customer', added_via: 'original', added_at: daysAgo(3) },
    ],
    resolution: null,
    resolved_at: null,
    resolved_by: null,
    merged_into: null,
    createdAt: daysAgo(3),
    updatedAt: hoursAgo(5),
  },
  {
    _id: '665ftkt000000000000000a2',
    ticket_ref: 'TKT-000102',
    channel: 'email',
    source_reference: 'uche.eze@example.com',
    subject: 'Name misspelled on allocation letter',
    body: 'My allocation letter says "Uche Ezeh". It should be "Uche Eze".',
    category: 'documents',
    type: 'request',
    category_source: 'human',
    type_source: 'ai',
    status: 'waiting_customer',
    sender: '665fcccc00000000000000c2',
    user_affected: '665fcccc00000000000000c2',
    assigned_admin: '665fadmn00000000000000d3',
    collaborators: [],
    participants: [
      { address: 'uche.eze@example.com', name: 'Uche Eze', role: 'customer', added_via: 'original', added_at: daysAgo(9) },
    ],
    resolution: null,
    resolved_at: null,
    resolved_by: null,
    merged_into: null,
    createdAt: daysAgo(9),
    updatedAt: daysAgo(2),
  },
  {
    _id: '665ftkt000000000000000a3',
    ticket_ref: 'TKT-000103',
    channel: 'phone',
    source_reference: '+2348033333333',
    subject: 'Could not log in after changing phone',
    body: 'Called in: new phone, OTP not arriving. Walked her through updating the number.',
    category: 'authentication',
    type: 'enquiry',
    category_source: 'human',
    type_source: 'human',
    status: 'resolved',
    sender: '665fcccc00000000000000c3',
    user_affected: '665fcccc00000000000000c3',
    assigned_admin: '665fadmn00000000000000d2',
    collaborators: [],
    participants: [],
    // Resolved without a summary — the context panel still says who and when.
    resolution: null,
    resolved_at: daysAgo(1),
    resolved_by: '665fadmn00000000000000d2',
    merged_into: null,
    createdAt: daysAgo(2),
    updatedAt: daysAgo(1),
  },
  {
    _id: '665ftkt000000000000000a4',
    ticket_ref: 'TKT-000104',
    channel: 'email',
    source_reference: 'john.okafor@example.com',
    subject: 'Referral commission not credited',
    body: 'My downline bought a plot two weeks ago and I have not seen the commission.',
    category: 'referral_commission',
    type: 'fault',
    category_source: 'ai',
    type_source: 'ai',
    status: 'resolved',
    sender: '665fcccc00000000000000c1',
    user_affected: '665fcccc00000000000000c1',
    assigned_admin: '665fadmn00000000000000d3',
    collaborators: [],
    participants: [
      { address: 'john.okafor@example.com', name: 'John Okafor', role: 'customer', added_via: 'original', added_at: daysAgo(14) },
    ],
    resolution: 'Commission was held for the 14-day cooling-off window; released and credited to his wallet.',
    resolved_at: daysAgo(6),
    resolved_by: '665fadmn00000000000000d3',
    merged_into: null,
    createdAt: daysAgo(14),
    updatedAt: daysAgo(6),
  },
];

const messages: MockMessage[] = [
  {
    _id: '665ftmsg00000000000000b1',
    ticket: '665ftkt000000000000000a1',
    direction: 'inbound',
    channel: 'email',
    subject: 'Payment made but plan still shows outstanding',
    body: 'I paid my October instalment on Monday but the app still says it is due. Receipt attached.',
    from_address: 'john.okafor@example.com',
    cc_addresses: [],
    attachments: [cloudinaryFile('TKT-000101', 'transfer-receipt.png', 'image/png', 284_112)],
    author_admin: null,
    author_user: '665fcccc00000000000000c1',
    sent_at: daysAgo(3),
    match: { signal: 'original', conflict: false },
    delivery: null,
    createdAt: daysAgo(3),
  },
  {
    _id: '665ftmsg00000000000000b2',
    ticket: '665ftkt000000000000000a1',
    direction: 'outbound',
    channel: 'email',
    subject: 'Re: Payment made but plan still shows outstanding [TKT-000101]',
    body: 'Thanks John. We have the receipt and are matching it to your plan. Our statement of account is attached so you can check the dates.',
    from_address: null,
    cc_addresses: [],
    attachments: [
      cloudinaryFile('outbound/665ftkt000000000000000a1', 'statement-of-account.pdf', 'application/pdf', 1_204_331),
    ],
    author_admin: AGENT._id,
    author_user: null,
    sent_at: daysAgo(2),
    match: null,
    delivery: { status: 'sent', error: null },
    createdAt: daysAgo(2),
  },
  {
    _id: '665ftmsg00000000000000b3',
    ticket: '665ftkt000000000000000a1',
    direction: 'inbound',
    channel: 'email',
    subject: 'Re: Payment made but plan still shows outstanding [TKT-000101]',
    body: 'The dates look right. When will it update?',
    from_address: 'john.okafor@example.com',
    cc_addresses: [],
    attachments: [],
    author_admin: null,
    author_user: '665fcccc00000000000000c1',
    sent_at: hoursAgo(5),
    match: { signal: 'headers', conflict: false },
    delivery: null,
    createdAt: hoursAgo(5),
  },
  {
    // Carried over from v1, before files were kept: no `attachments` key at all.
    _id: '665ftmsg00000000000000b4',
    ticket: '665ftkt000000000000000a2',
    direction: 'inbound',
    channel: 'email',
    subject: 'Name misspelled on allocation letter',
    body: 'My allocation letter says "Uche Ezeh". It should be "Uche Eze".',
    from_address: 'uche.eze@example.com',
    author_admin: null,
    author_user: '665fcccc00000000000000c2',
    sent_at: daysAgo(9),
    match: { signal: 'original', conflict: false },
    delivery: null,
    createdAt: daysAgo(9),
  },
  {
    _id: '665ftmsg00000000000000b5',
    ticket: '665ftkt000000000000000a2',
    direction: 'inbound',
    channel: 'email',
    subject: 'Re: Name misspelled on allocation letter [TKT-000102]',
    body: 'Here is my ID card so you can see the spelling.',
    from_address: 'uche.eze@example.com',
    cc_addresses: [],
    // Ingestion skipped the upload (Cloudinary down), so there is no url.
    attachments: [{ ...cloudinaryFile('TKT-000102', 'national-id.jpg', 'image/jpeg', 512_004), url: '' }],
    author_admin: null,
    author_user: '665fcccc00000000000000c2',
    sent_at: daysAgo(4),
    match: { signal: 'subject_tag', conflict: false },
    delivery: null,
    createdAt: daysAgo(4),
  },
  {
    _id: '665ftmsg00000000000000b6',
    ticket: '665ftkt000000000000000a2',
    direction: 'outbound',
    channel: 'email',
    subject: 'Re: Name misspelled on allocation letter [TKT-000102]',
    body: 'The ID did not come through on our side. Could you send it again?',
    from_address: null,
    cc_addresses: [],
    attachments: [],
    author_admin: '665fadmn00000000000000d3',
    author_user: null,
    sent_at: daysAgo(2),
    match: null,
    delivery: { status: 'sent', error: null },
    createdAt: daysAgo(2),
  },
];

const notes: MockNote[] = [
  {
    _id: '665ftnot00000000000000c1',
    ticket: '665ftkt000000000000000a1',
    admin: '665fadmn00000000000000d2',
    body: 'Paystack shows the transfer settled Tuesday. Waiting on finance to post it.',
    is_deleted: false,
    createdAt: daysAgo(1),
    updatedAt: daysAgo(1),
  },
];

let idCounter = 0;
const nextId = (prefix: string) => `${prefix}${Date.now().toString(16)}${(++idCounter).toString(16).padStart(4, '0')}`;

const invalid = (message: string, code = 'VALIDATION_ERROR') => new MockHttpError(400, message, code);

/** `forbidNonWhitelisted`: anything outside the DTO is a 400. */
function rejectUnknown(dto: Record<string, unknown>, allowed: readonly string[], prefix = '') {
  const unknown = Object.keys(dto).find((key) => !allowed.includes(key));
  if (unknown) throw invalid(`property ${prefix}${unknown} should not exist`);
}

function requireTicket(idOrRef: string): MockTicket {
  const needle = idOrRef.toUpperCase();
  const ticket = tickets.find((t) => t._id === idOrRef || t.ticket_ref === needle);
  if (!ticket) throw new MockHttpError(404, 'Ticket not found', 'TICKET_NOT_FOUND');
  return ticket;
}

function assertFresh(ticket: MockTicket, expected: unknown) {
  if (typeof expected === 'string' && expected !== ticket.updatedAt) {
    throw invalid(
      'This ticket has been modified since you loaded it — refresh and try again',
      'TICKET_STALE_STATE'
    );
  }
}

/** `.populate()` on an admin ref: id, userName, email, role name. */
function adminRef(id: string | null) {
  if (!id) return null;
  if (id === AGENT._id) return AGENT;
  const admin = findAdmin(id);
  return admin ? { _id: admin._id, userName: admin.userName, email: admin.email, role: admin.role } : id;
}

function userRef(id: string | null) {
  if (!id) return null;
  const person = findPerson(id);
  return person
    ? {
        _id: person._id,
        firstName: person.firstName,
        lastName: person.lastName,
        email: person.email,
        phoneNumber: person.phoneNumber,
      }
    : id;
}

function toTicket(ticket: MockTicket) {
  return {
    ...ticket,
    ai: null,
    user_affected_source: 'human',
    sender: userRef(ticket.sender),
    user_affected: userRef(ticket.user_affected),
    assigned_admin: adminRef(ticket.assigned_admin),
    collaborators: ticket.collaborators.map(adminRef),
    resolved_by: adminRef(ticket.resolved_by),
    issue: null,
    attachments: [],
    related_ticket: null,
  };
}

function toDetail(ticket: MockTicket) {
  return {
    ticket: toTicket(ticket),
    notes: ticketNotes(ticket._id),
    messages: messages
      .filter((m) => m.ticket === ticket._id)
      .sort((a, b) => a.sent_at.localeCompare(b.sent_at))
      .map((m) => ({
        ...m,
        author_admin: adminRef(m.author_admin),
        author_user: userRef(m.author_user),
      })),
    duplicates: [],
    cs_manager: null,
  };
}

function ticketNotes(ticketId: string) {
  return notes
    .filter((n) => n.ticket === ticketId && !n.is_deleted)
    .map((n) => ({ ...n, admin: adminRef(n.admin) }));
}

const isMine = (t: MockTicket) => t.assigned_admin === AGENT._id || t.collaborators.includes(AGENT._id);

/** The chip predicates, as `support-ticket.repository.ts` builds them. No issues here, so none is blocked. */
const FILTERS: Record<string, (t: MockTicket) => boolean> = {
  all: () => true,
  mine: isMine,
  unassigned: (t) => !t.assigned_admin && t.status !== 'resolved',
  unlinked: (t) => !t.user_affected && t.status !== 'resolved',
  open: (t) => t.status === 'open',
  waiting_customer: (t) => t.status === 'waiting_customer',
  blocked_on_issue: () => false,
  resolved: (t) => t.status === 'resolved',
};

/** Validates one `ReplyAttachmentDto`, then the service's Cloudinary-only rule. */
function readReplyAttachment(raw: unknown, index: number): MockAttachment {
  const prefix = `attachments.${index}.`;
  if (!raw || typeof raw !== 'object') throw invalid(`nested property attachments.${index} must be an object`);
  const dto = raw as Record<string, unknown>;
  rejectUnknown(dto, ['url', 'filename', 'mime', 'size', 'public_id', 'resource_type', 'format'], prefix);

  const text = (key: string, min: number, max: number) => {
    const value = dto[key];
    if (typeof value !== 'string') throw invalid(`${prefix}${key} must be a string`);
    if (value.length < min) throw invalid(`${prefix}${key} must be longer than or equal to ${min} characters`);
    if (value.length > max) throw invalid(`${prefix}${key} must be shorter than or equal to ${max} characters`);
    return value;
  };
  const url = text('url', 1, 2_000);
  const filename = text('filename', 1, 200);
  const mime = text('mime', 0, 150);
  const publicId = text('public_id', 1, 500);
  const resourceType = text('resource_type', 0, 30);
  const format = text('format', 0, 30);
  const size = dto.size;
  if (typeof size !== 'number' || !Number.isInteger(size)) throw invalid(`${prefix}size must be an integer number`);
  if (size < 0) throw invalid(`${prefix}size must not be less than 0`);

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw invalid(`${prefix}url must be a URL address`);
  }
  if (parsed.protocol !== 'https:') throw invalid(`${prefix}url must be a URL address`);
  if (parsed.hostname !== 'res.cloudinary.com') {
    throw invalid('reply attachments must be uploaded to our Cloudinary account first');
  }
  if (size > MAX_ATTACHMENT_BYTES) throw invalid(`${filename} is larger than 15MB`);

  return {
    filename,
    mime: mime || 'application/octet-stream',
    size,
    url,
    public_id: publicId,
    resource_type: resourceType || 'raw',
    format: format || (filename.split('.').pop() ?? ''),
    cid: null,
    inline: false,
  };
}

export const ticketRoutes: MockRoutes = {
  'GET /admin/tickets': ({ query }) => {
    const page = Math.max(1, Number(query.page ?? 1) || 1);
    const limit = Math.max(1, Number(query.limit ?? 25) || 25);
    const search = String(query.search ?? '').trim().toLowerCase();
    const live = tickets.filter((t) => !t.merged_into);

    const rows = live
      .filter(FILTERS[String(query.filter ?? 'all')] ?? FILTERS.all)
      .filter((t) => !query.channel || t.channel === query.channel)
      .filter((t) => !query.category || t.category === query.category)
      .filter((t) => !query.type || t.type === query.type)
      .filter((t) => !query.assigned_admin_id || t.assigned_admin === query.assigned_admin_id)
      .filter(
        (t) =>
          !search ||
          [t.ticket_ref, t.subject, t.body ?? '', t.source_reference ?? ''].some((field) =>
            field.toLowerCase().includes(search)
          )
      )
      .sort((a, b) =>
        query.sort === 'newest_first'
          ? b.createdAt.localeCompare(a.createdAt)
          : query.sort === 'recently_updated'
            ? b.updatedAt.localeCompare(a.updatedAt)
            : a.createdAt.localeCompare(b.createdAt)
      );

    const filterCounts = Object.fromEntries(
      Object.entries(FILTERS).map(([key, predicate]) => [key, live.filter(predicate).length])
    );

    return {
      count: rows.length,
      results: rows.slice((page - 1) * limit, page * limit).map(toTicket),
      filter_counts: filterCounts,
    };
  },

  'GET /admin/tickets/stats': () => {
    const live = tickets.filter((t) => !t.merged_into);
    const unresolved = live.filter((t) => t.status !== 'resolved');
    const ageHours = (t: MockTicket) => (Date.now() - new Date(t.createdAt).getTime()) / 3_600_000;
    const weekAgo = Date.now() - 7 * 86_400_000;
    return {
      open: live.filter((t) => t.status === 'open').length,
      in_progress: live.filter((t) => t.status === 'in_progress').length,
      waiting_customer: live.filter((t) => t.status === 'waiting_customer').length,
      blocked_on_issue: 0,
      breaching: unresolved.filter((t) => ageHours(t) > BREACH_AFTER_HOURS).length,
      resolved_last_7_days: live.filter(
        (t) => t.status === 'resolved' && t.resolved_at && new Date(t.resolved_at).getTime() >= weekAgo
      ).length,
      oldest_open_hours: unresolved.length ? Math.round(Math.max(...unresolved.map(ageHours))) : null,
    };
  },

  'GET /admin/tickets/categories': () => CATEGORIES,

  'GET /admin/tickets/:id': ({ params }) => toDetail(requireTicket(params.id)),

  'GET /admin/tickets/:id/suggest-users': ({ params }) => {
    requireTicket(params.id);
    return [];
  },

  'GET /admin/tickets/:id/suggest-issues': ({ params }) => {
    requireTicket(params.id);
    return [];
  },

  'PATCH /admin/tickets/:id': ({ params, body: raw }) => {
    const ticket = requireTicket(params.id);
    const dto = body<Record<string, unknown>>(raw);
    rejectUnknown(dto, [
      'subject',
      'status',
      'category',
      'type',
      'assigned_admin_id',
      'user_affected_id',
      'expected_updated_at',
    ]);
    assertFresh(ticket, dto.expected_updated_at);
    if (dto.status === 'resolved') {
      throw invalid('Use the resolve endpoint to resolve a ticket', 'USE_RESOLVE_ENDPOINT');
    }

    if (typeof dto.subject === 'string') ticket.subject = dto.subject;
    if (typeof dto.status === 'string') ticket.status = dto.status as Status;
    if (dto.category !== undefined) {
      ticket.category = (dto.category as string | null) || null;
      ticket.category_source = 'human';
    }
    if (dto.type !== undefined) {
      ticket.type = (dto.type as MockTicket['type']) || null;
      ticket.type_source = 'human';
    }
    if (dto.assigned_admin_id !== undefined) ticket.assigned_admin = (dto.assigned_admin_id as string | null) || null;
    if (dto.user_affected_id !== undefined) ticket.user_affected = (dto.user_affected_id as string | null) || null;
    ticket.updatedAt = new Date().toISOString();
    return toTicket(ticket);
  },

  'POST /admin/tickets/:id/reply': ({ params, body: raw }) => {
    const ticket = requireTicket(params.id);
    const dto = body<Record<string, unknown>>(raw);
    rejectUnknown(dto, ['body', 'cc', 'attachments']);

    const text = typeof dto.body === 'string' ? dto.body.trim() : '';
    if (!text) throw invalid('a reply cannot be empty');
    if (ticket.merged_into) {
      throw invalid('This ticket was merged into another — reply on that one', 'REPLY_ON_MERGED_TICKET');
    }
    if (ticket.channel !== 'email') {
      throw invalid(
        'Replies can only be sent by email. Log the response as a note instead.',
        'REPLY_CHANNEL_UNSUPPORTED'
      );
    }

    if (dto.cc !== undefined && !Array.isArray(dto.cc)) throw invalid('cc must be an array');
    const cc = ((dto.cc as unknown[] | undefined) ?? []).map((address) => String(address).toLowerCase().trim());
    if (cc.some((address) => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address))) {
      throw invalid('each value in cc must be an email');
    }

    if (dto.attachments !== undefined && !Array.isArray(dto.attachments)) {
      throw invalid('attachments must be an array');
    }
    const incoming = (dto.attachments as unknown[] | undefined) ?? [];
    if (incoming.length > MAX_REPLY_ATTACHMENTS) {
      throw invalid(`attachments must contain no more than ${MAX_REPLY_ATTACHMENTS} elements`);
    }
    const attachments = incoming.map(readReplyAttachment);
    if (attachments.reduce((sum, file) => sum + file.size, 0) > MAX_REPLY_TOTAL_BYTES) {
      throw invalid('reply attachments cannot exceed 25MB in total');
    }

    const now = new Date().toISOString();
    messages.push({
      _id: nextId('665ftmsg'),
      ticket: ticket._id,
      direction: 'outbound',
      channel: 'email',
      subject: `Re: ${ticket.subject} [${ticket.ticket_ref}]`,
      body: text,
      from_address: null,
      cc_addresses: cc,
      attachments,
      author_admin: AGENT._id,
      author_user: null,
      sent_at: now,
      match: null,
      delivery: { status: 'sent', error: null },
      createdAt: now,
    });

    for (const address of cc) {
      if (ticket.participants.some((person) => person.address === address)) continue;
      ticket.participants.push({ address, name: null, role: 'cc', added_via: 'outbound', added_at: now });
    }
    if (ticket.status !== 'resolved') ticket.status = 'waiting_customer';
    ticket.updatedAt = now;
    return toDetail(ticket);
  },

  'POST /admin/tickets/:id/notes': ({ params, body: raw }) => {
    const ticket = requireTicket(params.id);
    const dto = body<Record<string, unknown>>(raw);
    rejectUnknown(dto, ['body']);
    const text = typeof dto.body === 'string' ? dto.body : '';
    if (text.length < MIN_NOTE_LENGTH) {
      throw invalid(`body must be longer than or equal to ${MIN_NOTE_LENGTH} characters`);
    }
    const now = new Date().toISOString();
    notes.push({
      _id: nextId('665ftnot'),
      ticket: ticket._id,
      admin: AGENT._id,
      body: text,
      is_deleted: false,
      createdAt: now,
      updatedAt: now,
    });
    return ticketNotes(ticket._id);
  },

  'POST /admin/tickets/:id/resolve': ({ params, body: raw }) => {
    const ticket = requireTicket(params.id);
    const dto = body<Record<string, unknown>>(raw);
    rejectUnknown(dto, ['resolution', 'notify_user', 'expected_updated_at']);
    // `@IsOptional()` lets null and absent through; anything else must be a string.
    if (dto.resolution != null && typeof dto.resolution !== 'string') {
      throw invalid('resolution must be a string');
    }
    assertFresh(ticket, dto.expected_updated_at);
    if (ticket.status === 'resolved') {
      throw invalid('That ticket is already resolved', 'TICKET_ALREADY_RESOLVED');
    }

    const now = new Date().toISOString();
    ticket.status = 'resolved';
    ticket.resolution = (dto.resolution as string | null | undefined)?.trim() || null;
    ticket.resolved_at = now;
    ticket.resolved_by = AGENT._id;
    ticket.updatedAt = now;
    return toTicket(ticket);
  },
};
