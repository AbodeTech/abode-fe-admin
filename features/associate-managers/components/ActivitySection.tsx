import { CheckCircle2, Clock, AlertOctagon } from "lucide-react";
import { StatCard } from "./StatCard";
import type {
  ManagerDashboard,
  ProGroup,
} from "../schemas/manager-dashboard.schema";

interface Props {
  data: ManagerDashboard["activity"];
  /** Switches the noun used in labels between "Associate Pros" and "Associates". */
  roster?: "associate-pro" | "associate";
  /** When provided, the activity cards become drill-down triggers. */
  onOpenGroup?: (group: ProGroup) => void;
}

export function ActivitySection({ data, roster = "associate-pro", onOpenGroup }: Props) {
  const {
    active_count,
    active_pct,
    recent_login_count,
    recent_sale_count,
    recent_recruit_count,
    inactive_count,
    inactive_pct,
    abandoned_count,
    abandoned_pct,
  } = data;
  const total = active_count + inactive_count + abandoned_count;
  const isAssociate = roster === "associate";
  const noun = isAssociate ? "Associates" : "Associate Pros";

  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-gray-900">Activity</h2>

      {/* Stacked bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm text-gray-600">
            {isAssociate ? "Associate" : "Pro"} activity distribution
          </p>
          <p className="text-sm font-medium text-gray-900">
            {total} {noun}
          </p>
        </div>
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="bg-[#00695C]"
            style={{ width: `${active_pct}%` }}
            title={`Active: ${active_count}`}
          />
          <div
            className="bg-amber-500"
            style={{ width: `${inactive_pct}%` }}
            title={`Inactive: ${inactive_count}`}
          />
          <div
            className="bg-[#AD1F2A]"
            style={{ width: `${abandoned_pct}%` }}
            title={`Abandoned: ${abandoned_count}`}
          />
        </div>
        <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-600">
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#00695C]" />
            Active ({active_pct.toFixed(0)}%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-amber-500" />
            Inactive ({inactive_pct.toFixed(0)}%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-[#AD1F2A]" />
            Abandoned ({abandoned_pct.toFixed(0)}%)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={CheckCircle2}
          iconColor="text-[#00695C]"
          iconBg="bg-[#E0F2F1]"
          label={`Active ${noun}`}
          value={active_count}
          hint={`${recent_login_count.toLocaleString()} logged in · ${recent_sale_count.toLocaleString()} sold · ${recent_recruit_count.toLocaleString()} recruited (last 30 days)`}
          onClick={onOpenGroup ? () => onOpenGroup("active") : undefined}
        />
        <StatCard
          icon={Clock}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
          label={`Inactive ${noun}`}
          value={inactive_count}
          hint="Last login, sale or recruit was 30-60 days ago"
          onClick={onOpenGroup ? () => onOpenGroup("inactive") : undefined}
        />
        <StatCard
          icon={AlertOctagon}
          iconColor="text-[#AD1F2A]"
          iconBg="bg-red-50"
          label={`Abandoned ${noun}`}
          value={abandoned_count}
          hint="No login, sale or recruit in over 60 days"
          onClick={onOpenGroup ? () => onOpenGroup("abandoned") : undefined}
        />
      </div>
    </section>
  );
}
