"use client";

import { AlertCircle, Inbox, MapPin, Target, Users } from "lucide-react";

import type { PerformanceSummary } from "../schemas/performance.schema";
import type { RosterRow } from "../hooks/use-field-roster";
import { formatPeriod, monthEnded } from "../lib/format";
import { ScoreTile } from "./MetricTiles";

/** "6 days remaining" for the current month; plain words for past and future ones. */
export function periodNote(year: number, month: number): string {
  const now = new Date();
  if (monthEnded(year, month, now)) return "month closed";
  if (year > now.getFullYear() || (year === now.getFullYear() && month > now.getMonth() + 1)) return "not started yet";
  const end = new Date(year, month, 0);
  const days = Math.max(0, end.getDate() - now.getDate());
  return days === 0 ? "ends today" : `${days} day${days === 1 ? "" : "s"} remaining`;
}

export function PeriodPill({ year, month }: { year: number; month: number }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-[#E0F2F1] px-3 py-1.5 text-xs font-medium text-[#00695C]">
      <Target className="h-3.5 w-3.5" />
      {formatPeriod(year, month)}
      <span className="text-[#00695C]/70">· {periodNote(year, month)}</span>
    </div>
  );
}

function PlainTile({
  icon: Icon,
  iconColor,
  iconBg,
  label,
  value,
  hint,
  hintTone,
}: {
  icon: React.ElementType;
  iconColor: string;
  iconBg: string;
  label: string;
  value: number;
  hint: string;
  hintTone?: "red";
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5">
      <div className={`mb-3 inline-flex rounded-lg p-2.5 ${iconBg}`}>
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <p className="mb-2 text-sm text-gray-600">{label}</p>
      <p className="mb-3 text-2xl font-bold tabular-nums text-gray-900">{value}</p>
      <p className={hintTone === "red" ? "text-xs text-[#AD1F2A]" : "text-xs text-gray-500"}>{hint}</p>
    </div>
  );
}

/** The combined view: the team's month at a glance. */
export function TeamSnapshot({
  rows,
  summary,
  year,
  month,
}: {
  rows: RosterRow[];
  summary: PerformanceSummary;
  year: number;
  month: number;
}) {
  const { totals } = summary;
  const sites = rows.reduce(
    (n, r) => n + (r.month ? r.month.scorecards.length + r.month.sites_without_targets.length : 0),
    0
  );
  const invited = rows.filter((r) => r.staff.status === "invited").length;

  return (
    <div className="space-y-5 rounded-xl border border-gray-200 bg-white p-5">
      <PeriodPill year={year} month={month} />

      {totals.not_comparable > 0 && (
        <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          {totals.not_comparable} of {totals.with_targets} scores use weights that don&apos;t total 100%, so they
          aren&apos;t comparable.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ScoreTile
          score={totals.with_targets ? totals.average_score : null}
          note={`Average of ${totals.with_targets} ${totals.with_targets === 1 ? "person" : "people"} with targets`}
        />
        <PlainTile
          icon={Users}
          iconColor="text-[#00695C]"
          iconBg="bg-[#E0F2F1]"
          label="People"
          value={rows.length}
          hint={invited ? `${invited} still to activate` : `${totals.workers} active`}
        />
        <PlainTile
          icon={MapPin}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
          label="Sites covered"
          value={sites}
          hint={totals.sites_without_targets ? `${totals.sites_without_targets} without targets` : "All have targets"}
          hintTone={totals.sites_without_targets ? "red" : undefined}
        />
        <PlainTile
          icon={Inbox}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          label="Awaiting review"
          value={totals.pending_reviews}
          hint="Work sent in, not yet verified"
        />
      </div>
    </div>
  );
}
