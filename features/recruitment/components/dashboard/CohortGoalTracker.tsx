'use client';

import { useMemo } from 'react';
import { Calendar, Target, TrendingUp, Zap } from 'lucide-react';

/**
 * Ported from Abode Academy's `components/admin/goal-tracker.tsx`, with one
 * adaptation: the original paces against a cohort's `event_date`, a field
 * DC-02 removed (the physical day is a session now, not a cohort fact). This
 * paces against `registration_closes` instead — the closest thing left on
 * the cohort to a deadline — and degrades to a plain progress bar when that
 * isn't set, rather than inventing a fake date.
 */

interface CohortGoalTrackerProps {
  total: number;
  goal: number;
  /** ISO date the registration window closes. Optional — pace math needs it. */
  deadline?: string | null;
  dailyAvg: number;
}

export function CohortGoalTracker({ total, goal, deadline, dailyAvg }: CohortGoalTrackerProps) {
  const pct = goal > 0 ? Math.min((total / goal) * 100, 100) : 0;
  const remaining = Math.max(goal - total, 0);

  const pace = useMemo(() => {
    if (!deadline) return null;
    const msLeft = new Date(deadline).getTime() - new Date().getTime();
    const daysLeft = Math.max(Math.ceil(msLeft / 86_400_000), 0);
    const weeks = Math.ceil(daysLeft / 7);
    const needed = daysLeft > 0 ? Math.ceil(remaining / daysLeft) : remaining;
    return { weeksLeft: weeks, dailyNeeded: needed, onTrack: dailyAvg >= needed };
  }, [deadline, remaining, dailyAvg]);

  const weeksLeft = pace?.weeksLeft ?? null;
  const dailyNeeded = pace?.dailyNeeded ?? null;
  const onTrack = pace?.onTrack ?? true;

  const statusColor = onTrack ? 'text-emerald-600' : 'text-amber-600';
  const statusBg = onTrack ? 'bg-emerald-50' : 'bg-amber-50';
  const statusText = onTrack ? 'On track' : 'Behind pace';

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E8713A]/10">
            <Target size={20} className="text-[#E8713A]" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Registration goal</h2>
            <p className="text-xs text-slate-500">
              {total.toLocaleString()} of {goal.toLocaleString()} registrations
            </p>
          </div>
        </div>
        {deadline ? (
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusBg} ${statusColor}`}>
            {statusText}
          </span>
        ) : null}
      </div>

      <div className="mb-2 h-3 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-linear-to-r from-[#E8713A] to-[#f59e0b] transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mb-6 flex justify-between text-xs text-slate-400">
        <span>{pct.toFixed(1)}% complete</span>
        <span>{remaining.toLocaleString()} to go</span>
      </div>

      {deadline && weeksLeft !== null && dailyNeeded !== null ? (
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-slate-400">
              <Calendar size={14} />
              <span className="text-xs font-medium">Weeks left</span>
            </div>
            <p className="mt-1.5 text-2xl font-bold text-slate-900">{weeksLeft}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-slate-400">
              <TrendingUp size={14} />
              <span className="text-xs font-medium">Current avg/day</span>
            </div>
            <p className="mt-1.5 text-2xl font-bold text-slate-900">{dailyAvg}</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-slate-400">
              <Zap size={14} />
              <span className="text-xs font-medium">Need/day</span>
            </div>
            <p className={`mt-1.5 text-2xl font-bold ${onTrack ? 'text-emerald-600' : 'text-amber-600'}`}>
              {dailyNeeded}
            </p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-slate-400">
          Set a registration close date on the Settings tab to see pace tracking here.
        </p>
      )}
    </div>
  );
}
