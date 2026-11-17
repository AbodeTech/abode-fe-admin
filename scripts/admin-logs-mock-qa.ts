/**
 * Admin logs on abode-be-v2 (GET /admin/audit-logs) — mock API verification.
 * Run: npx tsx scripts/admin-logs-mock-qa.ts
 *
 * Proves the page's contract before it is trusted: the stored-document shape
 * parses (camelCase + snake_case mix), system rows read as "System", rows
 * without actor_type count as admin rows, the two real filters narrow the list,
 * pagination totals hold, and a non-id admin filter is never sent (the
 * backend casts it straight to ObjectId and 500s).
 */
import { z } from 'zod';
import { registerRoutes, dispatchMockRoute, MockHttpError } from '../lib/mocks/router';
import { adminLogRoutes } from '../lib/mocks/routes/admin-logs';
import { ADMINS } from '../lib/mocks/routes/cs-managers';
import {
  ADMIN_LOG_ACTIONS,
  AdminLogRowSchema,
  adminLogActor,
  formatAdminLogAction,
  normalizeAdminLog,
} from '../features/admin-logs/schemas/admin-log.schema';
import { buildAdminLogParams, isObjectId } from '../features/admin-logs/hooks/use-admin-logs';

registerRoutes(adminLogRoutes);

const Page = z.object({
  data: z.array(AdminLogRowSchema),
  meta: z.object({ total: z.number(), page: z.number(), limit: z.number(), totalPages: z.number() }),
});

async function list(query: Record<string, unknown>) {
  return Page.parse(await dispatchMockRoute({ method: 'GET', path: '/admin/audit-logs', query, body: undefined }));
}

type Result = { id: string; ok: boolean; error?: string };

async function run(id: string, fn: () => Promise<void> | void): Promise<Result> {
  try {
    await fn();
    console.log(`PASS ${id}`);
    return { id, ok: true };
  } catch (e) {
    const msg = e instanceof MockHttpError ? `${e.statusCode} ${e.code ?? ''} ${e.message}` : (e as Error).message;
    console.log(`FAIL ${id}: ${msg}`);
    return { id, ok: false, error: msg };
  }
}

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

async function main() {
  const results: Result[] = [];

  results.push(await run('stored-document shape parses and normalises', async () => {
    const page = await list({ page: 1, limit: 25 });
    assert(page.data.length === 25, `expected 25 rows, got ${page.data.length}`);
    const log = normalizeAdminLog(page.data[0]);
    assert(log.id && log.timestamp && log.action, 'core fields missing');
  }));

  results.push(await run('newest first', async () => {
    const { data } = await list({ page: 1, limit: 64 });
    for (let i = 1; i < data.length; i += 1) {
      assert(data[i - 1].timestamp >= data[i].timestamp, `row ${i} is newer than row ${i - 1}`);
    }
  }));

  results.push(await run('system rows read as "System" and carry no admin', async () => {
    const { data } = await list({ page: 1, limit: 64 });
    const system = data.map(normalizeAdminLog).filter((l) => l.isSystem);
    assert(system.length > 0, 'fixture has no system rows');
    for (const log of system) {
      assert(adminLogActor(log) === 'System', `actor was ${adminLogActor(log)}`);
      assert(log.adminId === null, 'system row has an adminId');
    }
  }));

  results.push(await run('rows without actor_type count as admin rows', async () => {
    const { data } = await list({ page: 1, limit: 64 });
    const legacy = data.filter((r) => r.actor_type === undefined && r.adminEmail);
    assert(legacy.length > 0, 'fixture has no legacy rows');
    for (const row of legacy) {
      const log = normalizeAdminLog(row);
      assert(!log.isSystem, 'legacy row treated as system');
      assert(adminLogActor(log) === row.adminEmail, 'legacy row lost its admin email');
    }
  }));

  results.push(await run('oldState (camel) and new_state (snake) both survive', async () => {
    const { data } = await list({ action: 'update-payment-plan', limit: 5 });
    const log = normalizeAdminLog(data[0]);
    assert(log.oldState?.next_date_of_payment === '2026-11-01', 'oldState missing');
    assert(log.newState?.next_date_of_payment === '2026-11-15', 'newState missing');
  }));

  results.push(await run('adminId filter narrows to that admin only', async () => {
    const target = ADMINS[1]._id;
    const page = await list({ adminId: target, limit: 100 });
    assert(page.meta.total > 0, 'no rows for admin');
    assert(page.data.every((r) => r.adminId === target), 'row from another admin leaked in');
  }));

  results.push(await run('action filter narrows to that action only', async () => {
    const page = await list({ action: 'suspend-user', limit: 100 });
    assert(page.meta.total > 0, 'no suspend-user rows');
    assert(page.data.every((r) => r.action === 'suspend-user'), 'other action leaked in');
  }));

  results.push(await run('pagination totals add up across pages', async () => {
    const first = await list({ page: 1, limit: 25 });
    let seen = 0;
    for (let p = 1; p <= first.meta.totalPages; p += 1) seen += (await list({ page: p, limit: 25 })).data.length;
    assert(seen === first.meta.total, `pages held ${seen}, total says ${first.meta.total}`);
  }));

  results.push(await run('mock admin ids are real ObjectIds (picker → filter works)', () => {
    for (const a of ADMINS) assert(isObjectId(a._id), `${a._id} is not a 24-hex id`);
  }));

  results.push(await run('a non-id admin filter is never sent', () => {
    assert(buildAdminLogParams({ adminId: 'someone@abodeflex.com' }).adminId === undefined, 'email was sent');
    assert(buildAdminLogParams({ adminId: '665fadmn00000000000000d1' }).adminId === undefined, 'non-hex id was sent');
    assert(buildAdminLogParams({ adminId: ADMINS[0]._id }).adminId === ADMINS[0]._id, 'valid id dropped');
  }));

  results.push(await run('action list matches the backend list (190, unique, no v1 typos)', () => {
    assert(ADMIN_LOG_ACTIONS.length === 190, `expected 190, got ${ADMIN_LOG_ACTIONS.length}`);
    assert(new Set(ADMIN_LOG_ACTIONS).size === 190, 'duplicates in action list');
    assert(!(ADMIN_LOG_ACTIONS as readonly string[]).includes('add-refferal'), 'v1 typo present');
  }));

  results.push(await run('action labels read as words', () => {
    assert(formatAdminLogAction('update-payment-plan') === 'Update payment plan', 'bad label');
  }));

  const passed = results.filter((r) => r.ok).length;
  console.log(`\n${passed}/${results.length} passed`);
  if (passed !== results.length) process.exit(1);
}

void main();
