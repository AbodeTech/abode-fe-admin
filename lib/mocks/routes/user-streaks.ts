import { MockHttpError, type MockRoutes } from '../router';
import { body } from './util';

/* ============================================================
 * Streaks & Points on the user-details Summary (D22) — the two admin routes in
 * docs/FLEX-2.0-ENDPOINTS.pdf §3.2. Any user id is accepted: state is derived
 * from the id, then mutated by adjustments.
 *
 * Mirrors abode-be-v2 `staging` (StreakAdminController / StreakService, 8 Oct 2026):
 *  - the summary reports 0 for current AND best streak when no plan is
 *    streak-enabled (the real service does; the UI hides Best streak then);
 *  - adjust takes a 10–500 character reason and an optional `points_change`
 *    (±100,000, never taking the balance below zero — 409 POINTS_BELOW_ZERO);
 *  - 409 NO_CHANGE only when the streak is unchanged AND no points change was sent;
 *  - best_streak rises if the new streak passes it, and never falls.
 * Points change only when `points_change` is sent.
 * ============================================================ */

type StreakState = {
  current_streak: number;
  best_streak: number;
  points_balance: number;
  qualified: boolean;
  covered_through: string | null;
  streak_enabled_plans: number;
  last_adjustment: { at: string; by: string; reason: string } | null;
};

const states: Record<string, StreakState> = {};
const audits: { audit_id: string; user_id: string; before: unknown; after: unknown; reason: string }[] = [];

const MOCK_ADMIN = { id: 'u_1', name: 'Nicholas' };

function stateFor(userId: string): StreakState {
  if (states[userId]) return states[userId];
  const hash = [...userId].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const enabled = hash % 4 === 0 ? 0 : (hash % 3) + 1;
  const current = enabled ? (hash % 11) + 1 : 0;
  // A customer with no streak-enabled plan (e.g. fully paid) keeps their best streak and points.
  const best = enabled ? current + (hash % 5) : (hash % 6) + 1;
  states[userId] = {
    current_streak: current,
    best_streak: best,
    points_balance: best * 100,
    qualified: enabled > 0 && hash % 2 === 0,
    covered_through: enabled && hash % 3 === 0 ? '2026-12' : null,
    streak_enabled_plans: enabled,
    last_adjustment: null,
  };
  return states[userId];
}

const snapshot = (state: StreakState) => ({
  current_streak: state.current_streak,
  best_streak: state.best_streak,
  points_balance: state.points_balance,
});

export const userStreakRoutes: MockRoutes = {
  'GET /admin/users/:id/streak': ({ params }) => {
    const state = stateFor(params.id);
    if (state.streak_enabled_plans === 0) {
      return {
        current_streak: 0,
        best_streak: 0,
        points_balance: state.points_balance,
        current_month: null,
        covered_through: null,
        streak_enabled_plans: 0,
        last_adjustment: state.last_adjustment,
      };
    }
    return {
      ...snapshot(state),
      current_month:
        state.streak_enabled_plans > 0
          ? { month: '2026-10', qualified: state.qualified, awarded_at: state.qualified ? '2026-10-03T11:20:00.000Z' : null }
          : null,
      covered_through: state.covered_through,
      streak_enabled_plans: state.streak_enabled_plans,
      last_adjustment: state.last_adjustment,
    };
  },

  'POST /admin/users/:id/streak/adjust': ({ params, body: raw }) => {
    const dto = body<{ current_streak?: unknown; reason?: unknown; points_change?: unknown }>(raw);
    const reason = typeof dto.reason === 'string' ? dto.reason.trim() : '';
    const pointsChange = dto.points_change === undefined ? 0 : dto.points_change;

    if (typeof dto.current_streak !== 'number' || !Number.isInteger(dto.current_streak) || dto.current_streak < 0) {
      throw new MockHttpError(400, 'current_streak must be a whole number, 0 or more', 'VALIDATION_FAILED');
    }
    if (reason.length < 10 || reason.length > 500) {
      throw new MockHttpError(400, 'reason must be between 10 and 500 characters', 'VALIDATION_FAILED');
    }
    if (typeof pointsChange !== 'number' || !Number.isInteger(pointsChange) || Math.abs(pointsChange) > 100_000) {
      throw new MockHttpError(400, 'points_change must be a whole number between -100000 and 100000', 'VALIDATION_FAILED');
    }

    const state = stateFor(params.id);
    if (dto.current_streak === state.current_streak && pointsChange === 0) {
      throw new MockHttpError(409, 'The streak already has this value', 'NO_CHANGE');
    }
    if (state.points_balance + pointsChange < 0) {
      throw new MockHttpError(409, `This would take the points balance below zero (it is ${state.points_balance})`, 'POINTS_BELOW_ZERO');
    }

    const before = snapshot(state);
    state.current_streak = dto.current_streak;
    // The best streak never falls, and rises if the adjustment passes it.
    state.best_streak = Math.max(state.best_streak, dto.current_streak);
    state.points_balance += pointsChange;
    const adjustedAt = new Date().toISOString();
    state.last_adjustment = { at: adjustedAt, by: MOCK_ADMIN.name, reason };

    const after = snapshot(state);
    const audit_id = `adj_${(audits.length + 1).toString(16).padStart(8, '0')}`;
    audits.push({ audit_id, user_id: params.id, before, after, reason });

    return { before, after, points_change: pointsChange, audit_id, adjusted_at: adjustedAt, adjusted_by: MOCK_ADMIN };
  },
};
