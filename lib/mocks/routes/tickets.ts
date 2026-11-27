import { MockHttpError, type MockRoutes } from '../router';
import { body } from './util';
import { findPerson } from './people';
import { findAdmin } from './cs-managers';
import { mockCan, mockHoldsRecord, mockIsSuperAdmin, mockSessionAdmin } from './auth';

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
 * Also here: create, classify, merge, collaborators, participants, note edit
 * and delete, and the whole issues layer (/admin/issues/*: list, detail, create,
 * update, resolve, similar tickets, link and unlink). Issues live in this file
 * because a ticket's `issue`, the "blocked on an issue" chip and the queue stats
 * all read the same state.
 *
 * Who may do what, as the BE decides it: a "CS Manager" (`manage_all_tickets`, or
 * a CS manager record) classifies, categorises, assigns, merges, resolves, and
 * writes issues; status and subject are working the ticket, which anyone may do.
 * Reads are open. Per-ticket reach is NOT modelled: the list shows every ticket,
 * so a "mine" chip for a role login is empty unless they own a ticket they made.
 * Writes are attributed to the signed-in login, not the default super admin.
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
  /** The issue this ticket is linked to (issues below), if any. */
  issue?: string | null;
  attachments?: { url: string; filename?: string; mime?: string; size?: number }[];
  /** What the classifier last proposed, kept whether or not it was applied. */
  ai?: {
    suggested_category: string | null;
    suggested_type: 'enquiry' | 'fault' | 'request' | null;
    category_confidence: number;
    type_confidence: number;
    model: string;
    classified_at: string;
  } | null;
  createdAt: string;
  updatedAt: string;
};

type IssueStatus = 'investigating' | 'identified' | 'monitoring' | 'resolved';

type MockIssue = {
  _id: string;
  issue_ref: string;
  title: string;
  description: string | null;
  status: IssueStatus;
  owner: string | null;
  resolution_note: string | null;
  resolved_at: string | null;
  resolved_by: string | null;
  /** Survives every reopen. */
  first_resolved_at: string | null;
  reopened_at: string | null;
  reopen_count: number;
  created_by: string;
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

const ISSUE_PAYSTACK = '665fiss000000000000000e1';
const ISSUE_COMMISSION = '665fiss000000000000000e3';

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
    issue: ISSUE_PAYSTACK,
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
    issue: ISSUE_COMMISSION,
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

/**
 * Three issues in three states: one live and linked (blocking a ticket), one in
 * monitoring with nothing linked, and one resolved that a ticket still points at,
 * so the board, the blocked chip and a recurrence (re-linking reopens it) all have a case.
 */
const issues: MockIssue[] = [
  {
    _id: ISSUE_PAYSTACK,
    issue_ref: 'ISS-000001',
    title: 'Paystack settlements not posting to plans',
    description: 'Transfers settled on Paystack since Tuesday are not being matched to the customer plan. Finance is posting them by hand.',
    status: 'investigating',
    owner: '665fadmn00000000000000d2',
    resolution_note: null,
    resolved_at: null,
    resolved_by: null,
    first_resolved_at: null,
    reopened_at: null,
    reopen_count: 0,
    created_by: '665fadmn00000000000000d3',
    createdAt: daysAgo(3),
    updatedAt: hoursAgo(5),
  },
  {
    _id: '665fiss000000000000000e2',
    issue_ref: 'ISS-000002',
    title: 'OTP SMS delayed on one network',
    description: 'Verification codes to one carrier arrive minutes late. Provider has shipped a fix; watching for a week.',
    status: 'monitoring',
    owner: '665fadmn00000000000000d3',
    resolution_note: null,
    resolved_at: null,
    resolved_by: null,
    first_resolved_at: null,
    reopened_at: null,
    reopen_count: 0,
    created_by: '665fadmn00000000000000d3',
    createdAt: daysAgo(10),
    updatedAt: daysAgo(2),
  },
  {
    _id: ISSUE_COMMISSION,
    issue_ref: 'ISS-000003',
    title: 'Referral commission held past the cooling-off window',
    description: null,
    status: 'resolved',
    owner: '665fadmn00000000000000d3',
    resolution_note: 'Release job was skipping wallets without a bank account. Fixed and back-filled.',
    resolved_at: daysAgo(6),
    resolved_by: '665fadmn00000000000000d3',
    first_resolved_at: daysAgo(6),
    reopened_at: null,
    reopen_count: 0,
    created_by: '665fadmn00000000000000d2',
    createdAt: daysAgo(15),
    updatedAt: daysAgo(6),
  },
];

let idCounter = 0;
const nextId =(prefix: string) => `${prefix}${Date.now().toString(16)}${(++idCounter).toString(16).padStart(4, '0')}`;

const invalid = (message: string, code = 'VALIDATION_ERROR') => new MockHttpError(400, message, code);

/** `forbidNonWhitelisted`: anything outside the DTO is a 400. */
function rejectUnknown(dto: Record<string, unknown>, allowed: readonly string[], prefix = '') {
  const unknown = Object.keys(dto).find((key) => !allowed.includes(key));
  if (unknown) throw invalid(`property ${prefix}${unknown} should not exist`);
}

/** A CS Manager: reads and acts on every ticket, or holds the CS manager record. */
function requireRouting(what: string): void {
  if (!mockCan('manage_all_tickets') && !mockHoldsRecord('cs_manager')) {
    throw new MockHttpError(403, `Only a CS Manager can ${what}`, 'TICKET_FORBIDDEN');
  }
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

/** The signed-in login (writes are theirs), or the default super admin when nobody is signed in. */
type ActorRef = { _id: string; userName: string | null; email: string | null };

/**
 * Every login that has written something, so its id still resolves to a person after
 * someone else signs in. Without this a ticket resolved by one test login came back
 * as a bare id string under another, which no `.populate()` would ever send.
 */
const knownActors = new Map<string, ActorRef>();

function actor(): ActorRef {
  const admin = mockSessionAdmin();
  if (!admin) return AGENT;
  const ref = { _id: admin.id, userName: admin.userName, email: admin.email };
  knownActors.set(ref._id, ref);
  return ref;
}

/** `.populate()` on an admin ref: id, userName, email, role name. */
function adminRef(id: string | null) {
  if (!id) return null;
  if (id === AGENT._id) return AGENT;
  if (id === actor()._id) return actor();
  const seen = knownActors.get(id);
  if (seen) return seen;
  const admin = findAdmin(id);
  return admin ? { _id: admin._id, userName: admin.userName, email: admin.email, role: admin.role } : { _id: id };
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

const findIssue = (id: string | null | undefined) => issues.find((i) => i._id === id);

function issueRef(id: string | null | undefined) {
  const issue = findIssue(id);
  return issue ? { _id: issue._id, issue_ref: issue.issue_ref, title: issue.title, status: issue.status } : null;
}

function toTicket(ticket: MockTicket) {
  return {
    ...ticket,
    ai: ticket.ai ?? null,
    user_affected_source: 'human',
    sender: userRef(ticket.sender),
    user_affected: userRef(ticket.user_affected),
    assigned_admin: adminRef(ticket.assigned_admin),
    collaborators: ticket.collaborators.map(adminRef),
    resolved_by: adminRef(ticket.resolved_by),
    issue: issueRef(ticket.issue),
    attachments: ticket.attachments ?? [],
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

const isMine = (t: MockTicket) => {
  const me = actor()._id;
  return t.assigned_admin === me || t.collaborators.includes(me);
};

/** Unresolved, and linked to an issue that is not itself resolved. */
const isBlocked = (t: MockTicket) => t.status !== 'resolved' && !!t.issue && findIssue(t.issue)?.status !== 'resolved';

/** The chip predicates, as `support-ticket.repository.ts` builds them. */
const FILTERS: Record<string, (t: MockTicket) => boolean> = {
  all: () => true,
  mine: isMine,
  unassigned: (t) => !t.assigned_admin && t.status !== 'resolved',
  unlinked: (t) => !t.user_affected && t.status !== 'resolved',
  open: (t) => t.status === 'open',
  in_progress: (t) => t.status === 'in_progress',
  waiting_customer: (t) => t.status === 'waiting_customer',
  blocked_on_issue: isBlocked,
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

/* ------------------------------ issues ------------------------------ */

const ISSUE_STATUSES: readonly IssueStatus[] = ['investigating', 'identified', 'monitoring', 'resolved'];

const ticketsOf = (issueId: string) => tickets.filter((t) => t.issue === issueId && !t.merged_into);

function toIssue(issue: MockIssue) {
  return {
    ...issue,
    owner: adminRef(issue.owner),
    resolved_by: adminRef(issue.resolved_by),
    created_by: adminRef(issue.created_by),
    ticket_count: ticketsOf(issue._id).length,
  };
}

const toIssueTicketRow = (t: MockTicket) => ({
  _id: t._id,
  ticket_ref: t.ticket_ref,
  subject: t.subject,
  status: t.status,
  createdAt: t.createdAt,
  user_affected: userRef(t.user_affected),
});

function requireIssue(id: string): MockIssue {
  const issue = findIssue(id);
  if (!issue) throw new MockHttpError(404, 'Issue not found', 'ISSUE_NOT_FOUND');
  return issue;
}

/** A known admin: a fixture admin, the default super admin, or whoever is signed in. */
const isKnownAdmin = (id: string) => !!findAdmin(id) || id === AGENT._id || id === actor()._id;

/** Moving off resolved, by hand or because a new fault arrived on a closed incident. */
function reopenIssue(issue: MockIssue, now: string) {
  issue.status = 'investigating';
  issue.reopened_at = now;
  issue.reopen_count += 1;
  issue.resolved_at = null;
  issue.resolved_by = null;
  issue.resolution_note = null;
  issue.updatedAt = now;
}

/** Fault-type only, enforced. A resolved issue auto-reopens: a fresh fault on it is a recurrence. */
function linkTicketToIssue(issue: MockIssue, ticket: MockTicket) {
  if (ticket.type !== 'fault') {
    throw invalid('Only a fault-type ticket can be linked to an issue', 'ISSUE_LINK_FAULT_ONLY');
  }
  if (ticket.issue && ticket.issue !== issue._id) {
    throw new MockHttpError(409, 'That ticket is already linked to another issue', 'TICKET_ALREADY_LINKED');
  }
  const now = new Date().toISOString();
  ticket.issue = issue._id;
  ticket.updatedAt = now;
  if (issue.status === 'resolved') reopenIssue(issue, now);
  else issue.updatedAt = now;
}

/** First match wins, so the specific wordings sit above the generic ones. */
const CATEGORY_HINTS: Array<[RegExp, string]> = [
  [/otp|log ?in|password|sign ?in/, 'authentication'],
  [/commission|referral|downline/, 'referral_commission'],
  [/kyc|verif|bvn|\bnin\b|id card/, 'verification_kyc'],
  [/levy/, 'development_levy'],
  [/allocat|plot/, 'allocation'],
  [/letter|document|deed|certificate|contract|survey/, 'documents'],
  [/instal|receipt|transfer|paid|payment/, 'payment_process'],
  [/plan|balance|outstanding/, 'payment_plan'],
  [/profile|account|phone number|email address/, 'account_profile'],
];

const FAULT_HINT = /not |cannot|can't|won't|error|fail|still|wrong|missing|never|doesn't|didn't/;
const REQUEST_HINT = /please|change|update|correct|request|need to|should be/;

function requireNote(id: string): MockNote {
  const note = notes.find((n) => n._id === id && !n.is_deleted);
  if (!note) throw new MockHttpError(404, 'Note not found', 'NOTE_NOT_FOUND');
  return note;
}

/** Own notes only, unless super admin. */
function requireOwnNote(note: MockNote) {
  if (note.admin !== actor()._id && !mockIsSuperAdmin()) {
    throw new MockHttpError(403, 'You can only change your own notes', 'NOTE_NOT_YOURS');
  }
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
      blocked_on_issue: live.filter(isBlocked).length,
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

  // Open issues whose title shares a word with the subject, for an unlinked fault.
  'GET /admin/tickets/:id/suggest-issues': ({ params }) => {
    const ticket = requireTicket(params.id);
    if (ticket.type !== 'fault' || ticket.issue) return [];
    const words = new Set(ticket.subject.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 3));
    return issues
      .filter((issue) => issue.status !== 'resolved')
      .map((issue) => {
        const matched = issue.title.toLowerCase().split(/[^a-z]+/).filter((w) => words.has(w));
        return { issue: issueRef(issue._id)!, score: matched.length, matched_terms: matched };
      })
      .filter((suggestion) => suggestion.score > 0)
      .sort((a, b) => b.score - a.score);
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
    // Status and subject are working the ticket; the rest is routing, the CS Manager's.
    if (['category', 'type', 'assigned_admin_id', 'user_affected_id'].some((key) => dto[key] !== undefined)) {
      requireRouting('change a ticket\'s category, type, assignee or customer');
    }
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
      author_admin: actor()._id,
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
      admin: actor()._id,
      body: text,
      is_deleted: false,
      createdAt: now,
      updatedAt: now,
    });
    return ticketNotes(ticket._id);
  },

  'POST /admin/tickets/:id/resolve': ({ params, body: raw }) => {
    requireRouting('resolve a ticket');
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
    ticket.resolved_by = actor()._id;
    ticket.updatedAt = now;
    return toTicket(ticket);
  },

  /* ---------- ticket writes ---------- */

  'POST /admin/tickets': ({ body: raw }) => {
    const dto = body<Record<string, unknown>>(raw);
    rejectUnknown(dto, ['channel', 'subject', 'body', 'source_reference', 'sender_id', 'user_affected_id', 'category', 'attachments']);

    const channel = dto.channel as MockTicket['channel'];
    if (!['email', 'phone', 'whatsapp', 'in_person', 'other'].includes(channel)) {
      throw invalid('channel must be one of the following values: email, phone, whatsapp, in_person, other');
    }
    const subject = typeof dto.subject === 'string' ? dto.subject.trim() : '';
    if (!subject) throw invalid('subject should not be empty');
    if (subject.length > 200) throw invalid('subject must be shorter than or equal to 200 characters');
    for (const key of ['sender_id', 'user_affected_id'] as const) {
      if (dto[key] !== undefined && !findPerson(String(dto[key]))) throw invalid(`${key} must be a known user`);
    }
    if (dto.category !== undefined && !CATEGORIES.includes(String(dto.category))) {
      throw invalid(`category must be one of the following values: ${CATEGORIES.join(', ')}`);
    }
    if (dto.attachments !== undefined) {
      const files = dto.attachments;
      if (!Array.isArray(files) || files.some((f) => !f || typeof f.url !== 'string' || !f.url)) {
        throw invalid('each attachment needs a url');
      }
    }

    const now = new Date().toISOString();
    const created: MockTicket = {
      _id: nextId('665ftkt'),
      ticket_ref: `TKT-${String(100 + tickets.length + 1).padStart(6, '0')}`,
      channel,
      source_reference: typeof dto.source_reference === 'string' ? dto.source_reference : null,
      subject,
      body: typeof dto.body === 'string' ? dto.body : null,
      category: dto.category ? String(dto.category) : null,
      type: null,
      category_source: dto.category ? 'human' : null,
      type_source: null,
      status: 'open',
      sender: dto.sender_id ? String(dto.sender_id) : null,
      user_affected: dto.user_affected_id ? String(dto.user_affected_id) : null,
      assigned_admin: null,
      collaborators: [],
      participants: [],
      resolution: null,
      resolved_at: null,
      resolved_by: null,
      merged_into: null,
      issue: null,
      attachments: (dto.attachments as MockTicket['attachments']) ?? [],
      createdAt: now,
      updatedAt: now,
    };
    tickets.push(created);
    return toTicket(created);
  },

  // Proposes a category and type; never overwrites a value a human has set.
  'POST /admin/tickets/:id/classify': ({ params }) => {
    requireRouting('classify a ticket');
    const ticket = requireTicket(params.id);
    const text = `${ticket.subject} ${ticket.body ?? ''}`.toLowerCase();
    const category = CATEGORY_HINTS.find(([pattern]) => pattern.test(text))?.[1] ?? 'other';
    const type: NonNullable<MockTicket['type']> = FAULT_HINT.test(text) ? 'fault' : REQUEST_HINT.test(text) ? 'request' : 'enquiry';

    const now = new Date().toISOString();
    ticket.ai = {
      suggested_category: category,
      suggested_type: type,
      category_confidence: category === 'other' ? 0.4 : 0.86,
      type_confidence: 0.78,
      model: 'mock-classifier',
      classified_at: now,
    };
    if (ticket.category_source !== 'human') {
      ticket.category = category;
      ticket.category_source = 'ai';
    }
    if (ticket.type_source !== 'human') {
      ticket.type = type;
      ticket.type_source = 'ai';
    }
    ticket.updatedAt = now;
    return toTicket(ticket);
  },

  'PATCH /admin/tickets/notes/:id': ({ params, body: raw }) => {
    const note = requireNote(params.id);
    requireOwnNote(note);
    const dto = body<Record<string, unknown>>(raw);
    rejectUnknown(dto, ['body']);
    const text = typeof dto.body === 'string' ? dto.body : '';
    if (text.length < MIN_NOTE_LENGTH) throw invalid(`body must be longer than or equal to ${MIN_NOTE_LENGTH} characters`);
    note.body = text;
    note.updatedAt = new Date().toISOString();
    return { ...note, admin: adminRef(note.admin) };
  },

  // Soft delete, same ownership rule.
  'DELETE /admin/tickets/notes/:id': ({ params }) => {
    const note = requireNote(params.id);
    requireOwnNote(note);
    note.is_deleted = true;
    note.updatedAt = new Date().toISOString();
    return { message: 'Note deleted' };
  },

  // Everything moves to the winner; the loser drops out of every queue.
  'POST /admin/tickets/:id/merge-into/:winner_id': ({ params }) => {
    requireRouting('merge tickets');
    const loser = requireTicket(params.id);
    const winner = requireTicket(params.winner_id);
    if (loser._id === winner._id) throw invalid('A ticket cannot be merged into itself', 'TICKET_MERGE_SELF');
    if (loser.merged_into || winner.merged_into) {
      throw invalid('One of these tickets was already merged into another', 'TICKET_ALREADY_MERGED');
    }

    for (const message of messages) if (message.ticket === loser._id) message.ticket = winner._id;
    for (const note of notes) if (note.ticket === loser._id) note.ticket = winner._id;
    for (const person of loser.participants) {
      if (!winner.participants.some((p) => p.address === person.address)) winner.participants.push(person);
    }
    const now = new Date().toISOString();
    loser.merged_into = winner._id;
    loser.updatedAt = now;
    winner.updatedAt = now;
    return toTicket(winner);
  },

  // Idempotent, and refuses the current owner: they are already on it.
  'POST /admin/tickets/:id/collaborators': ({ params, body: raw }) => {
    const ticket = requireTicket(params.id);
    const dto = body<Record<string, unknown>>(raw);
    rejectUnknown(dto, ['admin_id']);
    const adminId = typeof dto.admin_id === 'string' ? dto.admin_id : '';
    if (!adminId) throw invalid('admin_id should not be empty');
    if (!isKnownAdmin(adminId)) throw new MockHttpError(404, 'Admin not found', 'ADMIN_NOT_FOUND');
    if (ticket.assigned_admin === adminId) {
      throw invalid('That admin owns the ticket and is already on it', 'COLLABORATOR_IS_OWNER');
    }
    if (!ticket.collaborators.includes(adminId)) ticket.collaborators.push(adminId);
    ticket.updatedAt = new Date().toISOString();
    return toTicket(ticket);
  },

  'DELETE /admin/tickets/:id/collaborators/:admin_id': ({ params }) => {
    const ticket = requireTicket(params.id);
    ticket.collaborators = ticket.collaborators.filter((id) => id !== params.admin_id);
    ticket.updatedAt = new Date().toISOString();
    return toTicket(ticket);
  },

  'POST /admin/tickets/:id/participants': ({ params, body: raw }) => {
    const ticket = requireTicket(params.id);
    const dto = body<Record<string, unknown>>(raw);
    rejectUnknown(dto, ['address', 'name']);
    const address = typeof dto.address === 'string' ? dto.address.toLowerCase().trim() : '';
    if (!EMAIL.test(address)) throw invalid('address must be an email');
    if (!ticket.participants.some((p) => p.address === address)) {
      ticket.participants.push({
        address,
        name: typeof dto.name === 'string' && dto.name.trim() ? dto.name.trim() : null,
        role: 'cc',
        added_via: 'manual',
        added_at: new Date().toISOString(),
      });
    }
    ticket.updatedAt = new Date().toISOString();
    return toDetail(ticket);
  },

  'DELETE /admin/tickets/:id/participants/:address': ({ params }) => {
    const ticket = requireTicket(params.id);
    const address = params.address.toLowerCase();
    if (!ticket.participants.some((p) => p.address === address)) {
      throw new MockHttpError(404, 'Participant not found', 'PARTICIPANT_NOT_FOUND');
    }
    ticket.participants = ticket.participants.filter((p) => p.address !== address);
    ticket.updatedAt = new Date().toISOString();
    return toDetail(ticket);
  },

  /* ---------- issues ---------- */

  'GET /admin/issues': ({ query }) => {
    const status = query.status ? String(query.status) : null;
    if (status && !ISSUE_STATUSES.includes(status as IssueStatus)) {
      throw invalid(`status must be one of the following values: ${ISSUE_STATUSES.join(', ')}`);
    }
    const search = String(query.search ?? '').trim().toLowerCase();
    const page = Math.max(1, Number(query.page ?? 1) || 1);
    const limit = Math.max(1, Number(query.limit ?? 20) || 20);

    const rows = issues
      .filter((issue) => !status || issue.status === status)
      .filter((issue) => !search || [issue.issue_ref, issue.title, issue.description ?? ''].some((f) => f.toLowerCase().includes(search)))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

    return { count: rows.length, results: rows.slice((page - 1) * limit, page * limit).map(toIssue) };
  },

  // Unlinked, unresolved tickets that match the text: raw material for a new issue.
  'GET /admin/issues/similar-tickets': ({ query }) => {
    const search = String(query.search ?? '').trim().toLowerCase();
    if (search.length < 3) throw invalid('search must be longer than or equal to 3 characters');
    return tickets
      .filter((t) => !t.merged_into && !t.issue && t.status !== 'resolved')
      .filter((t) => [t.ticket_ref, t.subject, t.body ?? ''].some((f) => f.toLowerCase().includes(search)))
      .map(toIssueTicketRow);
  },

  'GET /admin/issues/:id': ({ params }) => {
    const issue = requireIssue(params.id);
    const linked = ticketsOf(issue._id);
    return { issue: toIssue(issue), ticket_count: linked.length, tickets: linked.map(toIssueTicketRow) };
  },

  'POST /admin/issues': ({ body: raw }) => {
    requireRouting('open an issue');
    const dto = body<Record<string, unknown>>(raw);
    rejectUnknown(dto, ['title', 'description', 'owner_id', 'from_ticket_id']);

    const title = typeof dto.title === 'string' ? dto.title.trim() : '';
    if (!title) throw invalid('title should not be empty');
    if (title.length > 200) throw invalid('title must be shorter than or equal to 200 characters');
    if (dto.owner_id && !isKnownAdmin(String(dto.owner_id))) throw invalid('owner_id must be a known admin');
    // Promoting a ticket: check it before anything is created, so a refusal leaves no orphan issue.
    const from = dto.from_ticket_id ? requireTicket(String(dto.from_ticket_id)) : null;
    if (from && from.type !== 'fault') {
      throw invalid('Only a fault-type ticket can be linked to an issue', 'ISSUE_LINK_FAULT_ONLY');
    }

    const now = new Date().toISOString();
    const created: MockIssue = {
      _id: nextId('665fiss'),
      issue_ref: `ISS-${String(issues.length + 1).padStart(6, '0')}`,
      title,
      description: typeof dto.description === 'string' && dto.description.trim() ? dto.description.trim() : null,
      status: 'investigating',
      owner: dto.owner_id ? String(dto.owner_id) : null,
      resolution_note: null,
      resolved_at: null,
      resolved_by: null,
      first_resolved_at: null,
      reopened_at: null,
      reopen_count: 0,
      created_by: actor()._id,
      createdAt: now,
      updatedAt: now,
    };
    issues.push(created);
    if (from) linkTicketToIssue(created, from);
    return toIssue(created);
  },

  'PATCH /admin/issues/:id': ({ params, body: raw }) => {
    requireRouting('edit an issue');
    const issue = requireIssue(params.id);
    const dto = body<Record<string, unknown>>(raw);
    rejectUnknown(dto, ['title', 'description', 'status', 'owner_id']);

    if (dto.status !== undefined) {
      if (!ISSUE_STATUSES.includes(dto.status as IssueStatus)) {
        throw invalid(`status must be one of the following values: ${ISSUE_STATUSES.join(', ')}`);
      }
      if (dto.status === 'resolved') {
        throw invalid('Use the resolve endpoint to resolve an issue', 'USE_RESOLVE_ENDPOINT');
      }
    }
    if (dto.title !== undefined && (typeof dto.title !== 'string' || !dto.title.trim())) throw invalid('title should not be empty');
    if (dto.owner_id && !isKnownAdmin(String(dto.owner_id))) throw invalid('owner_id must be a known admin');

    const now = new Date().toISOString();
    if (dto.status !== undefined) {
      // Moving OFF resolved is recorded as a manual reopen.
      if (issue.status === 'resolved') reopenIssue(issue, now);
      issue.status = dto.status as IssueStatus;
    }
    if (typeof dto.title === 'string') issue.title = dto.title.trim();
    if (dto.description !== undefined) issue.description = (dto.description as string | null)?.toString().trim() || null;
    if (dto.owner_id !== undefined) issue.owner = dto.owner_id ? String(dto.owner_id) : null;
    issue.updatedAt = now;
    return toIssue(issue);
  },

  // Closes every linked ticket in one act, minus any excluded.
  'POST /admin/issues/:id/resolve': ({ params, body: raw }) => {
    requireRouting('resolve an issue');
    const issue = requireIssue(params.id);
    const dto = body<Record<string, unknown>>(raw);
    rejectUnknown(dto, ['resolution_note', 'exclude_ticket_ids', 'notify_users', 'confirm_customers_contacted']);

    const note = typeof dto.resolution_note === 'string' ? dto.resolution_note.trim() : '';
    if (!note) throw invalid('resolution_note should not be empty');
    if (issue.status === 'resolved') throw invalid('That issue is already resolved', 'ISSUE_ALREADY_RESOLVED');
    // Marked resolved in silence reads, to the customer, as being ignored.
    if (dto.notify_users === false && dto.confirm_customers_contacted !== true) {
      throw invalid('confirm_customers_contacted is required when notify_users is false', 'CUSTOMER_CONTACT_CONFIRMATION_REQUIRED');
    }

    const linked = ticketsOf(issue._id);
    const excluded = new Set<string>(Array.isArray(dto.exclude_ticket_ids) ? (dto.exclude_ticket_ids as string[]) : []);
    for (const id of excluded) {
      if (!linked.some((t) => t._id === id)) throw invalid('exclude_ticket_ids must all be linked to this issue');
    }

    const now = new Date().toISOString();
    const closing = linked.filter((t) => !excluded.has(t._id) && t.status !== 'resolved');
    for (const t of closing) {
      t.status = 'resolved';
      t.resolution = note;
      t.resolved_at = now;
      t.resolved_by = actor()._id;
      t.updatedAt = now;
    }
    issue.status = 'resolved';
    issue.resolution_note = note;
    issue.resolved_at = now;
    issue.resolved_by = actor()._id;
    issue.first_resolved_at = issue.first_resolved_at ?? now;
    issue.updatedAt = now;

    return {
      issue: toIssue(issue),
      tickets_resolved: closing.length,
      tickets_excluded: excluded.size,
      customers_affected: new Set(closing.map((t) => t.user_affected).filter(Boolean)).size,
    };
  },

  'POST /admin/issues/:id/tickets/:ticket_id': ({ params }) => {
    requireRouting('link a ticket to an issue');
    const issue = requireIssue(params.id);
    const ticket = requireTicket(params.ticket_id);
    linkTicketToIssue(issue, ticket);
    return toTicket(ticket);
  },

  // The issue id is not needed: a ticket has at most one.
  'DELETE /admin/issues/tickets/:ticket_id': ({ params }) => {
    requireRouting('unlink a ticket from an issue');
    const ticket = requireTicket(params.ticket_id);
    if (!ticket.issue) throw invalid('That ticket is not linked to an issue', 'TICKET_NOT_LINKED');
    ticket.issue = null;
    ticket.updatedAt = new Date().toISOString();
    return toTicket(ticket);
  },
};
