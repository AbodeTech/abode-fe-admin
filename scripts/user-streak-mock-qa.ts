/**
 * User streak (Streaks & Points card, D22) — mock API verification.
 * Run: npx tsx scripts/user-streak-mock-qa.ts
 *
 * Proves the contract's rules before the card is trusted: the summary shape,
 * "never fake a zero" for a customer with no streak-enabled plan, that an
 * adjustment needs a reason and a real change, that the best streak never
 * falls, and — the one the decisions are explicit about — that points never
 * move when a streak is adjusted.
 */
import { registerRoutes, dispatchMockRoute, MockHttpError } from '../lib/mocks/router';
import { userStreakRoutes } from '../lib/mocks/routes/user-streaks';

registerRoutes(userStreakRoutes);

async function call(method: string, path: string, body?: unknown) {
  return dispatchMockRoute({ method, path, query: {}, body });
}

type Result = { id: string; ok: boolean; error?: string };

async function run(id: string, fn: () => Promise<void>): Promise<Result> {
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

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function expectError(fn: () => Promise<unknown>, status: number, code: string) {
  try {
    await fn();
  } catch (e) {
    if (e instanceof MockHttpError && e.statusCode === status && e.code === code) return;
    throw new Error(`expected ${status} ${code}, got ${e instanceof MockHttpError ? `${e.statusCode} ${e.code}` : (e as Error).message}`);
  }
  throw new Error(`expected ${status} ${code}, but the call succeeded`);
}

const REASON = 'Bank transfer verified on time, approved late (ticket 4411)';

/** Find ids in each state without depending on the hash — the mock accepts any id. */
async function findUsers() {
  let withStreak = '';
  let withoutStreak = '';
  for (let i = 0; i < 40 && (!withStreak || !withoutStreak); i++) {
    const id = `user-${i}`;
    const s: any = await call('GET', `/admin/users/${id}/streak`);
    if (s.streak_enabled_plans > 0 && !withStreak) withStreak = id;
    if (s.streak_enabled_plans === 0 && !withoutStreak) withoutStreak = id;
  }
  return { withStreak, withoutStreak };
}

async function main() {
  const results: Result[] = [];
  const { withStreak, withoutStreak } = await findUsers();

  results.push(
    await run('STREAK-fixtures-cover-both-states', async () => {
      assert(withStreak && withoutStreak, `need a user with and without a streak-enabled plan (${withStreak}/${withoutStreak})`);
    })
  );

  results.push(
    await run('STREAK-summary-shape', async () => {
      const s: any = await call('GET', `/admin/users/${withStreak}/streak`);
      for (const key of ['current_streak', 'best_streak', 'points_balance', 'covered_through', 'streak_enabled_plans', 'last_adjustment']) {
        assert(key in s, `missing ${key}`);
      }
      assert(s.best_streak >= s.current_streak, 'best streak is never below the current streak');
      assert(s.current_month && /^\d{4}-\d{2}$/.test(s.current_month.month), 'current_month is YYYY-MM');
      assert(s.last_adjustment === null, 'nothing adjusted yet');
    })
  );

  results.push(
    await run('STREAK-no-enabled-plan-shows-no-streak', async () => {
      const s: any = await call('GET', `/admin/users/${withoutStreak}/streak`);
      assert(s.current_streak === 0 && s.current_month === null && s.streak_enabled_plans === 0, 'empty-state payload');
      assert(s.best_streak > 0 && s.points_balance > 0, 'a completed customer keeps their best streak and points');
      await expectError(() => call('POST', `/admin/users/${withoutStreak}/streak/adjust`, { current_streak: 3, reason: REASON }), 409, 'NO_ACTIVE_STREAK');
    })
  );

  results.push(
    await run('ADJUST-requires-a-valid-reason-and-streak', async () => {
      await expectError(() => call('POST', `/admin/users/${withStreak}/streak/adjust`, { current_streak: 5 }), 400, 'VALIDATION_FAILED');
      await expectError(() => call('POST', `/admin/users/${withStreak}/streak/adjust`, { current_streak: 5, reason: 'too short' }), 400, 'VALIDATION_FAILED');
      await expectError(() => call('POST', `/admin/users/${withStreak}/streak/adjust`, { current_streak: -1, reason: REASON }), 400, 'VALIDATION_FAILED');
      await expectError(() => call('POST', `/admin/users/${withStreak}/streak/adjust`, { current_streak: 2.5, reason: REASON }), 400, 'VALIDATION_FAILED');
      const s: any = await call('GET', `/admin/users/${withStreak}/streak`);
      assert(s.last_adjustment === null, 'a rejected adjustment must not leave a trace');
    })
  );

  results.push(
    await run('ADJUST-same-value-is-no-change', async () => {
      const s: any = await call('GET', `/admin/users/${withStreak}/streak`);
      await expectError(() => call('POST', `/admin/users/${withStreak}/streak/adjust`, { current_streak: s.current_streak, reason: REASON }), 409, 'NO_CHANGE');
    })
  );

  results.push(
    await run('ADJUST-changes-streak-never-points-and-audits', async () => {
      const before: any = await call('GET', `/admin/users/${withStreak}/streak`);
      const target = before.current_streak + 1;
      const out: any = await call('POST', `/admin/users/${withStreak}/streak/adjust`, { current_streak: target, reason: `  ${REASON}  ` });
      assert(out.before.current_streak === before.current_streak && out.after.current_streak === target, 'before/after');
      assert(out.before.points_balance === out.after.points_balance && out.after.points_balance === before.points_balance, 'points must not change');
      assert(out.audit_id.startsWith('adj_') && out.adjusted_by.name, 'audit reference and actor');

      const after: any = await call('GET', `/admin/users/${withStreak}/streak`);
      assert(after.current_streak === target && after.points_balance === before.points_balance, 'summary reflects the adjustment');
      assert(after.last_adjustment.reason === REASON && after.last_adjustment.by === out.adjusted_by.name, 'last adjustment is recorded, reason trimmed');
    })
  );

  results.push(
    await run('ADJUST-best-streak-rises-but-never-falls', async () => {
      const s: any = await call('GET', `/admin/users/${withStreak}/streak`);
      const above = s.best_streak + 3;
      const up: any = await call('POST', `/admin/users/${withStreak}/streak/adjust`, { current_streak: above, reason: REASON });
      assert(up.after.best_streak === above, 'best streak rises when an adjustment passes it');
      const down: any = await call('POST', `/admin/users/${withStreak}/streak/adjust`, { current_streak: 1, reason: REASON });
      assert(down.after.current_streak === 1 && down.after.best_streak === above, 'best streak never falls');
    })
  );

  const failed = results.filter((r) => !r.ok);
  console.log(`\nUser streak mock QA: ${results.length - failed.length}/${results.length} passed`);
  if (failed.length > 0) process.exit(1);
}

main();
