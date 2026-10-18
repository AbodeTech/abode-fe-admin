import { MockHttpError, type MockRoutes } from '../router';

/* ============================================================
 * Associate Pro Yearly Tracker mocks — /admin/associate-pro-tracker/*.
 *
 * Goals are held in a mutable map so PUT actually changes what GET returns and
 * the "goals not set" → "set goals" → progress-bars flow is exercisable end to
 * end. 2025 ships with goals; the current year deliberately does NOT, so the
 * empty-state prompt is what you land on.
 * ============================================================ */

const CURRENT_YEAR = new Date().getUTCFullYear();

type MockGoal = {
  year: number;
  associate_pro_target: number;
  revenue_target: number;
  notes: string | null;
  created_by: string;
  last_edited_by: string | null;
  created_at: string;
  updated_at: string;
};

const goals = new Map<number, MockGoal>([
  [
    2025,
    {
      year: 2025,
      associate_pro_target: 2000,
      revenue_target: 500_000_000,
      notes: 'Original 2000-pro push.',
      created_by: '665faaaa000000000000ad01',
      last_edited_by: null,
      created_at: '2025-01-08T09:00:00.000Z',
      updated_at: '2025-01-08T09:00:00.000Z',
    },
  ],
]);

const round2 = (value: number) => Math.round(value * 100) / 100;
const rate = (numerator: number, denominator: number) =>
  denominator > 0 ? round2((numerator / denominator) * 100) : 0;
const naira = (amount: number) => `₦${Math.round(amount).toLocaleString('en-NG')}`;

const DAY_MS = 86_400_000;

function yearPeriod(year: number) {
  const start = Date.UTC(year, 0, 1);
  const end = Date.UTC(year, 11, 31, 23, 59, 59, 999);
  const totalDays = Math.round((end - start) / DAY_MS);
  const elapsed =
    year < CURRENT_YEAR
      ? totalDays
      : year > CURRENT_YEAR
        ? 0
        : Math.max(1, Math.floor((Date.now() - start) / DAY_MS));

  return {
    year,
    start_date: new Date(start).toISOString(),
    end_date: new Date(end).toISOString(),
    days_elapsed: elapsed,
    days_remaining: Math.max(0, totalDays - elapsed),
    total_days: totalDays,
  };
}

/**
 * A deterministic daily series across the elapsed part of the year, sampled
 * weekly so a full year is ~52 points rather than 365 — enough to draw a
 * readable line without inventing daily noise.
 */
function series(year: number, daysElapsed: number, seed: number, scale: number) {
  const points: { date: string; value: number }[] = [];
  for (let day = 0; day < daysElapsed; day += 7) {
    const wave = Math.sin((day / 30 + seed) * 1.1) + 1.3;
    points.push({
      date: new Date(Date.UTC(year, 0, 1) + day * DAY_MS).toISOString().slice(0, 10),
      value: round2(wave * scale),
    });
  }

  const total = round2(points.reduce((sum, point) => sum + point.value, 0));
  const peak = points.reduce<{ date: string; value: number } | null>(
    (best, point) => (best === null || point.value > best.value ? point : best),
    null,
  );

  return {
    chart_data: points,
    total,
    // Over days the YEAR has run, not over the points sampled — matching the BE.
    average: daysElapsed > 0 ? round2(total / daysElapsed) : 0,
    peak,
  };
}

function dashboard(year: number) {
  const period = yearPeriod(year);
  const goal = goals.get(year) ?? null;

  const revenueSeries = series(year, period.days_elapsed, 0.4, 1_850_000);
  const fromUser = series(year, period.days_elapsed, 1.1, 3);
  const fromAssociate = series(year, period.days_elapsed, 2.3, 4);
  const signups = series(year, period.days_elapsed, 0.8, 18);

  const currentPros = Math.round(fromUser.total + fromAssociate.total);
  const revenue = revenueSeries.total;
  const newSignups = Math.round(signups.total);
  const newAssociates = Math.round(newSignups * 0.42);

  return {
    goals_set: !!goal,
    year_period: period,
    associate_pro_progress: {
      current_associate_pro: currentPros,
      target_associate_pro: goal?.associate_pro_target ?? null,
      progress_text: goal ? `${currentPros} of ${goal.associate_pro_target}` : null,
      percentage_complete: goal ? rate(currentPros, goal.associate_pro_target) : null,
    },
    revenue_metrics: {
      total_revenue: revenue,
      revenue_goal: goal?.revenue_target ?? null,
      revenue_remaining: goal ? round2(Math.max(0, goal.revenue_target - revenue)) : null,
      progress_text: goal ? `${naira(revenue)} of ${naira(goal.revenue_target)}` : null,
      percentage_complete: goal ? rate(revenue, goal.revenue_target) : null,
    },
    conversion_metrics: {
      user_to_associate_pro: funnel(newSignups, Math.round(fromUser.total)),
      associate_to_associate_pro: funnel(newAssociates, Math.round(fromAssociate.total)),
      total_associate_pro: currentPros,
      overall_conversion_rate: rate(currentPros, newSignups + newAssociates),
    },
    graphs: {
      revenue_graph: revenueSeries,
      conversion_graph: {
        user_to_associate_pro: fromUser,
        associate_to_associate_pro: fromAssociate,
        new_signups: signups,
      },
    },
  };
}

function funnel(total: number, converted: number) {
  return {
    total,
    converted,
    not_converted: Math.max(0, total - converted),
    conversion_rate: rate(converted, total),
  };
}

export const associateProTrackerRoutes: MockRoutes = {
  'GET /admin/associate-pro-tracker/dashboard': ({ query }) =>
    dashboard(Number(query.year) || CURRENT_YEAR),

  'GET /admin/associate-pro-tracker/years': () => ({
    // Years with goals, unioned with years that saw activity, plus this one.
    years: [...new Set([CURRENT_YEAR, CURRENT_YEAR - 1, ...goals.keys()])].sort((a, b) => b - a),
    current_year: CURRENT_YEAR,
  }),

  'GET /admin/associate-pro-tracker/goals/:year': ({ params }) => {
    const goal = goals.get(Number(params.year));
    // 404 for an unset year, as the BE does — the FE treats that as "no goal"
    // rather than an error, and mocking a null body would skip that path.
    if (!goal) {
      throw new MockHttpError(404, 'No goal set for that year', 'YEARLY_GOAL_NOT_FOUND');
    }
    return goal;
  },

  'PUT /admin/associate-pro-tracker/goals/:year': ({ params, body }) => {
    const year = Number(params.year);
    const dto = (body ?? {}) as Partial<MockGoal>;
    const existing = goals.get(year);
    const now = new Date().toISOString();

    const saved: MockGoal = {
      year,
      associate_pro_target: Number(dto.associate_pro_target ?? existing?.associate_pro_target ?? 0),
      revenue_target: Number(dto.revenue_target ?? existing?.revenue_target ?? 0),
      notes: dto.notes ?? existing?.notes ?? null,
      created_by: existing?.created_by ?? '665faaaa000000000000ad01',
      last_edited_by: existing ? '665faaaa000000000000ad01' : null,
      created_at: existing?.created_at ?? now,
      updated_at: now,
    };

    goals.set(year, saved);
    return saved;
  },
};
