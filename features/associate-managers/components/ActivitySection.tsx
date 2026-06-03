import { CheckCircle2, Clock, AlertOctagon } from "lucide-react";
import { StatCard } from "./StatCard";
import type { ManagerDashboardActivity } from "@/lib/gql/graphql";

interface Props {
  data: ManagerDashboardActivity;
}

export function ActivitySection({ data }: Props) {
  const { activeCount, activePct, inactiveCount, inactivePct, abandonedCount, abandonedPct } =
    data;
  const total = activeCount + inactiveCount + abandonedCount;

  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-gray-900">Activity</h2>

      {/* Stacked bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-600">Pro activity distribution</p>
          <p className="text-sm font-medium text-gray-900">
            {total} Associate Pros
          </p>
        </div>
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="bg-[#00695C]"
            style={{ width: `${activePct}%` }}
            title={`Active: ${activeCount}`}
          />
          <div
            className="bg-amber-500"
            style={{ width: `${inactivePct}%` }}
            title={`Inactive: ${inactiveCount}`}
          />
          <div
            className="bg-[#AD1F2A]"
            style={{ width: `${abandonedPct}%` }}
            title={`Abandoned: ${abandonedCount}`}
          />
        </div>
        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-600">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#00695C]" />
            Active ({activePct.toFixed(0)}%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Inactive ({inactivePct.toFixed(0)}%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#AD1F2A]" />
            Abandoned ({abandonedPct.toFixed(0)}%)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={CheckCircle2}
          iconColor="text-[#00695C]"
          iconBg="bg-[#E0F2F1]"
          label="Active Associate Pros"
          value={activeCount}
          hint="Sale, recruitment, or login in last 90 days"
        />
        <StatCard
          icon={Clock}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          label="Inactive Associate Pros"
          value={inactiveCount}
          hint="No activity in last 90 days"
        />
        <StatCard
          icon={AlertOctagon}
          iconColor="text-[#AD1F2A]"
          iconBg="bg-red-50"
          label="Abandoned Associate Pros"
          value={abandonedCount}
          hint="No login in last 6 months"
        />
      </div>
    </section>
  );
}
