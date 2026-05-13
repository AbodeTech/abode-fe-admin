import { CheckCircle2, Clock, AlertOctagon } from "lucide-react";
import { StatCard } from "./StatCard";
import type { ManagerMetrics } from "../mock-data";

interface Props {
  metrics: ManagerMetrics;
}

export function ActivitySection({ metrics }: Props) {
  const { active, inactive, abandoned } = metrics.activity;
  const total = active + inactive + abandoned;
  const pct = (n: number) => (total > 0 ? (n / total) * 100 : 0);

  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-gray-900">Activity</h2>

      {/* Stacked bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-600">Pro activity distribution</p>
          <p className="text-sm font-medium text-gray-900">{total} Associate Pros</p>
        </div>
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="bg-[#00695C]"
            style={{ width: `${pct(active)}%` }}
            title={`Active: ${active}`}
          />
          <div
            className="bg-amber-500"
            style={{ width: `${pct(inactive)}%` }}
            title={`Inactive: ${inactive}`}
          />
          <div
            className="bg-[#AD1F2A]"
            style={{ width: `${pct(abandoned)}%` }}
            title={`Abandoned: ${abandoned}`}
          />
        </div>
        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-600">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#00695C]" />
            Active ({pct(active).toFixed(0)}%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Inactive ({pct(inactive).toFixed(0)}%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#AD1F2A]" />
            Abandoned ({pct(abandoned).toFixed(0)}%)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={CheckCircle2}
          iconColor="text-[#00695C]"
          iconBg="bg-[#E0F2F1]"
          label="Active Associate Pros"
          value={active}
          hint="Sale or recruitment in last 90 days"
        />
        <StatCard
          icon={Clock}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          label="Inactive Associate Pros"
          value={inactive}
          hint="No activity in last 90 days"
        />
        <StatCard
          icon={AlertOctagon}
          iconColor="text-[#AD1F2A]"
          iconBg="bg-red-50"
          label="Abandoned Associate Pros"
          value={abandoned}
          hint="No login in last 6 months"
        />
      </div>
    </section>
  );
}
