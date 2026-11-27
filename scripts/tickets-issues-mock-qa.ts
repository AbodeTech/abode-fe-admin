/**
 * Support tickets and issues — mock API verification.
 * Run: npx tsx scripts/tickets-issues-mock-qa.ts
 *
 * The Issues page showed "no route registered for GET /admin/issues" to Support, and
 * ticket create / classify / merge / collaborators / participants / note edit and delete
 * all 404'd. This parses every route with the SAME Zod schemas the screens use and checks
 * the BE rules the hooks document:
 *
 *   - issues link fault-type tickets only; a resolved issue AUTO-REOPENS on a new link
 *   - resolving with notify_users=false needs confirm_customers_contacted
 *   - classify never overwrites a value a human set
 *   - own notes only, unless super admin
 *   - a CS Manager (manage_all_tickets or the CS record) routes, merges, resolves and
 *     writes issues; anyone else may still work a ticket (status, notes, collaborators)
 *
 * Roles: cs_manager holds the CS record; moderator holds view_ticket_pages but neither.
 */
import { z } from 'zod';

import {
  IssueDetailSchema,
  IssueListSchema,
  IssueSchema,
  IssueTicketRowSchema,
  ResolveIssueResultSchema,
  TicketDetailSchema,
  TicketIssueSuggestionSchema,
  TicketListSchema,
  TicketNoteSchema,
  TicketQueueStatsSchema,
  TicketSchema,
} from '../features/tickets/schemas/ticket.schema';
import { registerRoutes, dispatchMockRoute, MockHttpError } from '../lib/mocks/router';
import { authRoutes } from '../lib/mocks/routes/auth';
import { ticketRoutes } from '../lib/mocks/routes/tickets';

registerRoutes(authRoutes);
registerRoutes(ticketRoutes);

const call = (method: string, path: string, query: Record<string, unknown> = {}, body?: unknown) =>
  dispatchMockRoute({ method, path, query, body });
const signIn = (email: string) => call('POST', '/auth/admin/login', {}, { email, password: 'password123' });

type Result = { id: string; ok: boolean };

async function run(id: string, fn: () => Promise<void>): Promise<Result> {
  try {
    await fn();
    console.log(`PASS ${id}`);
    return { id, ok: true };
  } catch (e) {
    console.log(`FAIL ${id}: ${e instanceof MockHttpError ? `${e.statusCode} ${e.code ?? ''} ${e.message}` : (e as Error).message}`);
    return { id, ok: false };
  }
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function expectError(fn: () => Promise<unknown>, status: number, code?: string) {
  try {
    await fn();
  } catch (e) {
    if (e instanceof MockHttpError && e.statusCode === status && (!code || e.code === code)) return;
    throw new Error(`expected ${status} ${code ?? ''}, got ${e instanceof MockHttpError ? `${e.statusCode} ${e.code}` : (e as Error).message}`);
  }
  throw new Error(`expected ${status} ${code ?? ''}, but the call succeeded`);
}

const ISS_PAYSTACK = '665fiss000000000000000e1';
const ISS_OTP = '665fiss000000000000000e2';
const ISS_COMMISSION = '665fiss000000000000000e3';
const TKT_PAYMENT = '665ftkt000000000000000a1'; // fault, linked to ISS_PAYSTACK, in progress
const TKT_LETTER = '665ftkt000000000000000a2'; // request, category set by a human, owner d3
const OWNER_D3 = '665fadmn00000000000000d3';
const OTHER_D2 = '665fadmn00000000000000d2';

const issueList = async (query: Record<string, unknown> = {}) => IssueListSchema.parse(await call('GET', '/admin/issues', query));
const issueDetail = async (id: string) => IssueDetailSchema.parse(await call('GET', `/admin/issues/${id}`));
const ticket = async (id: string) => TicketDetailSchema.parse(await call('GET', `/admin/tickets/${id}`));
const newTicket = async (subject: string, extra: Record<string, unknown> = {}) =>
  TicketSchema.parse(await call('POST', '/admin/tickets', {}, { channel: 'phone', subject, ...extra }));

async function main() {
  const results: Result[] = [];
  const add = async (id: string, fn: () => Promise<void>) => results.push(await run(id, fn));

  /* ---------------- Support (CS Manager) ---------------- */
  await signIn('as-cs_manager@abode.ng');
  const me = (await call('GET', '/auth/admin/me')) as { id: string };

  await add('CS-issues-list-the-reported-failure', async () => {
    const all = await issueList();
    assert(all.count === 3 && all.results.length === 3, 'three issues');
    assert(all.results.every((i) => i.ticket_count !== undefined), 'each carries its ticket count');
    const live = await issueList({ status: 'investigating' });
    assert(live.count === 1 && live.results[0]._id === ISS_PAYSTACK, 'status filter');
    assert((await issueList({ search: 'otp' })).count === 1, 'search');
    assert((await issueList({ page: 2, limit: 2 })).results.length === 1, 'paging');
    await expectError(() => call('GET', '/admin/issues', { status: 'wat' }), 400);
  });

  await add('CS-issue-detail-and-the-ticket-side-of-the-link', async () => {
    const d = await issueDetail(ISS_PAYSTACK);
    assert(d.ticket_count === 1 && d.tickets[0]._id === TKT_PAYMENT && d.tickets[0].user_affected, 'linked ticket with its customer');
    assert(IssueSchema.parse(d.issue).owner?._id === OTHER_D2, 'owner is populated');
    const t = await ticket(TKT_PAYMENT);
    assert(t.ticket.issue?.issue_ref === 'ISS-000001' && t.ticket.issue.status === 'investigating', 'the ticket shows its issue');
    await expectError(() => call('GET', '/admin/issues/000000000000000000000000'), 404, 'ISSUE_NOT_FOUND');
  });

  await add('CS-blocked-chip-and-stats-follow-issues', async () => {
    const stats = TicketQueueStatsSchema.parse(await call('GET', '/admin/tickets/stats'));
    assert(stats.blocked_on_issue === 1, 'one ticket is blocked');
    const list = TicketListSchema.parse(await call('GET', '/admin/tickets', { filter: 'blocked_on_issue' }));
    assert(list.count === 1 && list.results[0]._id === TKT_PAYMENT && list.filter_counts.blocked_on_issue === 1, 'the chip lists it');
    // Linked to a RESOLVED issue is not blocked: the ticket under ISS_COMMISSION is itself resolved, and stays out.
    assert(list.results.every((t) => t.issue?.status !== 'resolved'), 'resolved issues block nothing');
  });

  await add('CS-similar-tickets', async () => {
    const rows = z.array(IssueTicketRowSchema).parse(await call('GET', '/admin/issues/similar-tickets', { search: 'allocation' }));
    assert(rows.length === 1 && rows[0]._id === TKT_LETTER, 'unlinked, unresolved, matching');
    assert((z.array(IssueTicketRowSchema).parse(await call('GET', '/admin/issues/similar-tickets', { search: 'payment' }))).every((r) => r._id !== TKT_PAYMENT), 'a linked ticket is not offered');
    await expectError(() => call('GET', '/admin/issues/similar-tickets', { search: 'ab' }), 400);
  });

  let fault = '';
  await add('CS-create-and-classify-a-ticket', async () => {
    await expectError(() => call('POST', '/admin/tickets', {}, { channel: 'carrier-pigeon', subject: 'x' }), 400);
    await expectError(() => call('POST', '/admin/tickets', {}, { channel: 'phone', subject: ' ' }), 400);
    await expectError(() => call('POST', '/admin/tickets', {}, { channel: 'phone', subject: 'x', sender_id: 'nobody' }), 400);
    await expectError(() => call('POST', '/admin/tickets', {}, { channel: 'phone', subject: 'x', priority: 'high' }), 400);
    const created = await newTicket('Paystack money not posting after payment', { category: undefined });
    fault = created._id;
    assert(created.status === 'open' && created.ticket_ref === 'TKT-000105' && !created.type, 'opens unclassified');

    const classified = TicketSchema.parse(await call('POST', `/admin/tickets/${fault}/classify`));
    assert(classified.type === 'fault' && classified.category === 'payment_process' && classified.type_source === 'ai', 'classified as a payment fault');
    assert(classified.ai?.suggested_type === 'fault', 'and remembers what it proposed');
  });

  await add('CS-classify-never-overwrites-a-human', async () => {
    const before = (await ticket(TKT_LETTER)).ticket;
    assert(before.category_source === 'human', 'fixture: a human set the category');
    const after = TicketSchema.parse(await call('POST', `/admin/tickets/${TKT_LETTER}/classify`));
    assert(after.category === before.category && after.category_source === 'human', 'the human category survives');
  });

  await add('CS-suggest-issues-for-an-unlinked-fault', async () => {
    const s = z.array(TicketIssueSuggestionSchema).parse(await call('GET', `/admin/tickets/${fault}/suggest-issues`));
    assert(s.length === 1 && s[0].issue._id === ISS_PAYSTACK && (s[0].score ?? 0) >= 2, 'matches the Paystack issue');
    assert(((await call('GET', `/admin/tickets/${TKT_LETTER}/suggest-issues`)) as unknown[]).length === 0, 'none for a non-fault');
  });

  await add('CS-promote-a-ticket-to-an-issue', async () => {
    const before = (await issueList()).count;
    await expectError(() => call('POST', '/admin/issues', {}, { title: 'From a request', from_ticket_id: TKT_LETTER }), 400, 'ISSUE_LINK_FAULT_ONLY');
    assert((await issueList()).count === before, 'a refused promotion leaves no orphan issue');
    await expectError(() => call('POST', '/admin/issues', {}, { title: ' ' }), 400);
    await expectError(() => call('POST', '/admin/issues', {}, { title: 'x', severity: 'high' }), 400);

    const created = IssueSchema.parse(await call('POST', '/admin/issues', {}, { title: 'Payments not posting', description: ' Investigating ', from_ticket_id: fault }));
    assert(created.status === 'investigating' && created.ticket_count === 1 && created.description === 'Investigating', 'created and linked');
    assert(created.created_by?._id === me.id, 'authored by the signed-in login, not the default super admin');
    assert((await ticket(fault)).ticket.issue?._id === created._id, 'the ticket points back');
  });

  await add('CS-link-unlink-and-the-one-issue-rule', async () => {
    await expectError(() => call('POST', `/admin/issues/${ISS_OTP}/tickets/${fault}`), 409, 'TICKET_ALREADY_LINKED');
    await expectError(() => call('POST', `/admin/issues/${ISS_OTP}/tickets/${TKT_LETTER}`), 400, 'ISSUE_LINK_FAULT_ONLY');
    const unlinked = TicketSchema.parse(await call('DELETE', `/admin/issues/tickets/${fault}`));
    assert(!unlinked.issue, 'unlinked');
    await expectError(() => call('DELETE', `/admin/issues/tickets/${fault}`), 400, 'TICKET_NOT_LINKED');
    await call('POST', `/admin/issues/${ISS_OTP}/tickets/${fault}`);
    assert((await ticket(fault)).ticket.issue?._id === ISS_OTP, 'relinked elsewhere');
    await call('DELETE', `/admin/issues/tickets/${fault}`);
  });

  await add('CS-a-new-fault-reopens-a-resolved-issue', async () => {
    const before = IssueSchema.parse((await issueDetail(ISS_COMMISSION)).issue);
    assert(before.status === 'resolved' && before.reopen_count === 0 && before.first_resolved_at, 'fixture: resolved');
    await call('POST', `/admin/issues/${ISS_COMMISSION}/tickets/${fault}`);
    const after = IssueSchema.parse((await issueDetail(ISS_COMMISSION)).issue);
    assert(after.status === 'investigating' && after.reopen_count === 1 && after.reopened_at && !after.resolved_at, 'a recurrence reopens it');
    assert(after.first_resolved_at === before.first_resolved_at, 'first_resolved_at survives the reopen');
    await call('DELETE', `/admin/issues/tickets/${fault}`);
  });

  await add('CS-issue-edit-rules', async () => {
    await expectError(() => call('PATCH', `/admin/issues/${ISS_OTP}`, {}, { status: 'resolved' }), 400, 'USE_RESOLVE_ENDPOINT');
    await expectError(() => call('PATCH', `/admin/issues/${ISS_OTP}`, {}, { status: 'closed' }), 400);
    await expectError(() => call('PATCH', `/admin/issues/${ISS_OTP}`, {}, { title: ' ' }), 400);
    await expectError(() => call('PATCH', `/admin/issues/${ISS_OTP}`, {}, { colour: 'red' }), 400);
    const edited = IssueSchema.parse(await call('PATCH', `/admin/issues/${ISS_OTP}`, {}, { status: 'identified', owner_id: null, description: null }));
    assert(edited.status === 'identified' && !edited.owner && !edited.description, 'status, owner cleared, description cleared');
  });

  await add('CS-resolve-closes-the-linked-tickets', async () => {
    await expectError(() => call('POST', `/admin/issues/${ISS_PAYSTACK}/resolve`, {}, { resolution_note: ' ' }), 400);
    await expectError(() => call('POST', `/admin/issues/${ISS_PAYSTACK}/resolve`, {}, { resolution_note: 'Fixed', notify_users: false }), 400, 'CUSTOMER_CONTACT_CONFIRMATION_REQUIRED');
    await expectError(() => call('POST', `/admin/issues/${ISS_PAYSTACK}/resolve`, {}, { resolution_note: 'Fixed', exclude_ticket_ids: [TKT_LETTER] }), 400);
    const result = ResolveIssueResultSchema.parse(
      await call('POST', `/admin/issues/${ISS_PAYSTACK}/resolve`, {}, { resolution_note: 'Matching job restored', notify_users: false, confirm_customers_contacted: true }),
    );
    assert(result.tickets_resolved === 1 && result.tickets_excluded === 0 && result.customers_affected === 1, 'one ticket, one customer');
    const t = (await ticket(TKT_PAYMENT)).ticket;
    assert(t.status === 'resolved' && t.resolution === 'Matching job restored' && t.resolved_by?._id === me.id, 'the ticket closed with the note, by the signed-in login');
    await expectError(() => call('POST', `/admin/issues/${ISS_PAYSTACK}/resolve`, {}, { resolution_note: 'Again' }), 400, 'ISSUE_ALREADY_RESOLVED');
    assert((TicketQueueStatsSchema.parse(await call('GET', '/admin/tickets/stats'))).blocked_on_issue === 0, 'nothing is blocked any more');
  });

  await add('CS-resolve-can-exclude-a-ticket', async () => {
    const a = await newTicket('Receipts missing from plan', { category: 'payment_plan' });
    const b = await newTicket('Plan balance still wrong', { category: 'payment_plan' });
    for (const t of [a, b]) await call('PATCH', `/admin/tickets/${t._id}`, {}, { type: 'fault' });
    const issue = IssueSchema.parse(await call('POST', '/admin/issues', {}, { title: 'Plan balances', from_ticket_id: a._id }));
    await call('POST', `/admin/issues/${issue._id}/tickets/${b._id}`);
    const out = ResolveIssueResultSchema.parse(await call('POST', `/admin/issues/${issue._id}/resolve`, {}, { resolution_note: 'Balances rebuilt', exclude_ticket_ids: [b._id] }));
    assert(out.tickets_resolved === 1 && out.tickets_excluded === 1, 'one closed, one kept');
    assert((await ticket(b._id)).ticket.status === 'open', 'the excluded ticket stays open');
  });

  await add('CS-notes-own-only-soft-delete', async () => {
    const notes = z.array(TicketNoteSchema).parse(await call('POST', `/admin/tickets/${TKT_LETTER}/notes`, {}, { body: 'Called her back, waiting on the ID card.' }));
    const mine = notes.find((n) => n.admin?._id === me.id)!;
    assert(mine, 'attributed to the signed-in login');
    assert(TicketNoteSchema.parse(await call('PATCH', `/admin/tickets/notes/${mine._id}`, {}, { body: 'Called her back; ID card received.' })).body.includes('received'), 'own note edits');
    await expectError(() => call('PATCH', `/admin/tickets/notes/${mine._id}`, {}, { body: 'x' }), 400);

    const theirs = (await ticket('665ftkt000000000000000a1')).notes.find((n) => n.admin?._id === OTHER_D2)!;
    await expectError(() => call('PATCH', `/admin/tickets/notes/${theirs._id}`, {}, { body: 'Overwritten by someone else' }), 403, 'NOTE_NOT_YOURS');
    await expectError(() => call('DELETE', `/admin/tickets/notes/${theirs._id}`), 403, 'NOTE_NOT_YOURS');

    await call('DELETE', `/admin/tickets/notes/${mine._id}`);
    assert(!(await ticket(TKT_LETTER)).notes.some((n) => n._id === mine._id), 'a deleted note is gone from the detail');
    await expectError(() => call('PATCH', `/admin/tickets/notes/${mine._id}`, {}, { body: 'Too late for this one' }), 404, 'NOTE_NOT_FOUND');
  });

  await add('CS-merge', async () => {
    const loser = await newTicket('Duplicate: letter spelling');
    await expectError(() => call('POST', `/admin/tickets/${loser._id}/merge-into/${loser._id}`), 400, 'TICKET_MERGE_SELF');
    const winner = TicketSchema.parse(await call('POST', `/admin/tickets/${loser._id}/merge-into/${TKT_LETTER}`));
    assert(winner._id === TKT_LETTER, 'answers with the winner');
    assert(!TicketListSchema.parse(await call('GET', '/admin/tickets', {})).results.some((t) => t._id === loser._id), 'the loser drops out of the queue');
    await expectError(() => call('POST', `/admin/tickets/${loser._id}/merge-into/${TKT_LETTER}`), 400, 'TICKET_ALREADY_MERGED');
  });

  await add('CS-collaborators', async () => {
    await expectError(() => call('POST', `/admin/tickets/${TKT_LETTER}/collaborators`, {}, { admin_id: OWNER_D3 }), 400, 'COLLABORATOR_IS_OWNER');
    await expectError(() => call('POST', `/admin/tickets/${TKT_LETTER}/collaborators`, {}, { admin_id: 'nobody' }), 404, 'ADMIN_NOT_FOUND');
    await call('POST', `/admin/tickets/${TKT_LETTER}/collaborators`, {}, { admin_id: OTHER_D2 });
    const again = TicketSchema.parse(await call('POST', `/admin/tickets/${TKT_LETTER}/collaborators`, {}, { admin_id: OTHER_D2 }));
    assert(again.collaborators.length === 1, 'idempotent');
    assert(TicketSchema.parse(await call('DELETE', `/admin/tickets/${TKT_LETTER}/collaborators/${OTHER_D2}`)).collaborators.length === 0, 'removed');
  });

  await add('CS-participants', async () => {
    await expectError(() => call('POST', `/admin/tickets/${TKT_LETTER}/participants`, {}, { address: 'not-an-email' }), 400);
    const added = TicketDetailSchema.parse(await call('POST', `/admin/tickets/${TKT_LETTER}/participants`, {}, { address: 'Spouse@Example.com', name: 'Mrs Eze' }));
    const p = added.ticket.participants.find((x) => x.address === 'spouse@example.com');
    assert(p && p.role === 'cc' && p.added_via === 'manual', 'added as a manual cc, lower-cased');
    const removed = TicketDetailSchema.parse(await call('DELETE', `/admin/tickets/${TKT_LETTER}/participants/${encodeURIComponent('spouse@example.com')}`));
    assert(!removed.ticket.participants.some((x) => x.address === 'spouse@example.com'), 'removed');
    await expectError(() => call('DELETE', `/admin/tickets/${TKT_LETTER}/participants/spouse%40example.com`), 404, 'PARTICIPANT_NOT_FOUND');
  });

  /* ---------------- moderator: view_ticket_pages, not a CS Manager ---------------- */
  await signIn('as-moderator@abode.ng');

  await add('MODERATOR-reads-and-works-but-does-not-route', async () => {
    assert((await issueList()).count >= 3, 'issues are readable');
    assert(IssueDetailSchema.parse(await call('GET', `/admin/issues/${ISS_OTP}`)), 'and so is one issue');
    const t = await newTicket('Walk-in: cannot see my plan');
    assert(TicketSchema.parse(await call('PATCH', `/admin/tickets/${t._id}`, {}, { status: 'in_progress', subject: 'Walk-in: plan not showing' })).status === 'in_progress', 'status and subject are working the ticket');
    assert(Array.isArray(await call('POST', `/admin/tickets/${t._id}/notes`, {}, { body: 'Checked the plan, it exists.' })), 'notes');
    assert(TicketSchema.parse(await call('POST', `/admin/tickets/${t._id}/collaborators`, {}, { admin_id: OTHER_D2 })).collaborators.length === 1, 'collaborators');

    await expectError(() => call('PATCH', `/admin/tickets/${t._id}`, {}, { category: 'documents' }), 403, 'TICKET_FORBIDDEN');
    await expectError(() => call('PATCH', `/admin/tickets/${t._id}`, {}, { assigned_admin_id: OWNER_D3 }), 403, 'TICKET_FORBIDDEN');
    await expectError(() => call('POST', `/admin/tickets/${t._id}/classify`), 403, 'TICKET_FORBIDDEN');
    await expectError(() => call('POST', `/admin/tickets/${t._id}/resolve`, {}, { resolution: 'x' }), 403, 'TICKET_FORBIDDEN');
    await expectError(() => call('POST', `/admin/tickets/${t._id}/merge-into/${TKT_LETTER}`), 403, 'TICKET_FORBIDDEN');
    await expectError(() => call('POST', '/admin/issues', {}, { title: 'Not mine to open' }), 403, 'TICKET_FORBIDDEN');
    await expectError(() => call('PATCH', `/admin/issues/${ISS_OTP}`, {}, { status: 'monitoring' }), 403, 'TICKET_FORBIDDEN');
    await expectError(() => call('POST', `/admin/issues/${ISS_OTP}/resolve`, {}, { resolution_note: 'x' }), 403, 'TICKET_FORBIDDEN');
    await expectError(() => call('POST', `/admin/issues/${ISS_OTP}/tickets/${t._id}`), 403, 'TICKET_FORBIDDEN');
  });

  /* ---------------- Super admin ---------------- */
  await signIn('ada@abode.ng');

  await add('ADMIN-routes-and-may-edit-anyones-note', async () => {
    const t = await newTicket('Walk-in: wants a statement');
    assert(TicketSchema.parse(await call('PATCH', `/admin/tickets/${t._id}`, {}, { category: 'documents', assigned_admin_id: OWNER_D3 })).category === 'documents', 'routing');
    const theirs = (await ticket('665ftkt000000000000000a1')).notes.find((n) => n.admin?._id === OTHER_D2)!;
    assert(TicketNoteSchema.parse(await call('PATCH', `/admin/tickets/notes/${theirs._id}`, {}, { body: 'Edited by the super admin' })).body.startsWith('Edited'), 'a super admin may edit others\' notes');
  });

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length}/${results.length} passed`);
  if (failed.length) process.exitCode = 1;
}

void main();
