import { CheckCircle2, TrendingUp, UserPlus, Users, ClipboardList, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { contributorBreakdown, isPerProAttribution, sourceBreakdown, type AttributionMode } from "../lib/attribution";
import { StatCard } from "./StatCard";
import type {
  ManagerDashboard,
  ProGroup,
} from "../schemas/manager-dashboard.schema";

interface Props {
  data: ManagerDashboard["recruitment"];
  /** Which tier of users the roster represents. Switches labels and hides
   * irrelevant cards (e.g. associates aren't onboarded). */
  roster?: "associate-pro" | "associate";
  /** When provided, the cards become drill-down triggers. */
  onOpenGroup?: (group: ProGroup) => void;
  attributionMode?: AttributionMode;
}

export function RecruitmentSection({ data, roster = "associate-pro", onOpenGroup, attributionMode = "single" }: Props) {
  const isAssociate = roster === "associate";
  const perPro = isPerProAttribution(attributionMode);
  const newSignupsSegments = perPro
    ? contributorBreakdown(data.top_new_signups_contributors, data.others_new_signups_count)
    : sourceBreakdown(data.new_signups_by_source);
  const upgradesSegments = perPro
    ? contributorBreakdown(data.top_upgrades_contributors, data.others_upgrades_count)
    : sourceBreakdown(data.upgrades_by_source);
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-gray-900">Recruitment</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={UserPlus}
          iconColor="text-cyan-600"
          label="New Recruits This Period"
          value={data.new_signups_in_period.toLocaleString()}
          hint={
            isAssociate
              ? "Associates & Pros brought in by associates this period"
              : "Associates & Pros brought in by your team this period"
          }
          breakdown={newSignupsSegments}
        />
        <StatCard
          icon={TrendingUp}
          iconColor="text-[#00695C]"
          iconBg="bg-[#E0F2F1]"
          label="Recruits Promoted to Associate Pro"
          value={data.upgrades_in_period.toLocaleString()}
          hint="Recruits who upgraded to Associate Pro this period"
          breakdown={upgradesSegments}
        />
        {perPro && !isAssociate && (
          <ContributingProsCard
            recruiting={data.active_recruiting_pros_count}
            promoting={data.active_promoting_pros_count}
            totalAssigned={data.total_assigned}
          />
        )}
        {/* Associates aren't onboarded (onboarding is the associate-pro flow),
            so the metric is always 0 for that roster — hide rather than mislead. */}
        {!isAssociate && (
          <StatCard
            icon={CheckCircle2}
            iconColor="text-emerald-600"
            iconBg="bg-emerald-50"
            label="Onboarded This Period"
            value={data.onboarded_in_period.toLocaleString()}
            hint="Pros whose first call landed in Picked this period"
            onClick={onOpenGroup ? () => onOpenGroup("onboarded_in_period") : undefined}
            breakdown={[
              { label: "fresh", value: data.onboarded_fresh_in_period, color: "bg-emerald-500", display: data.onboarded_fresh_in_period.toLocaleString() },
              { label: "carryover", value: data.onboarded_carryover_in_period, color: "bg-gray-300", display: data.onboarded_carryover_in_period.toLocaleString() },
            ]}
          />
        )}
        {!isAssociate && (
          <StatCard
            icon={ClipboardList}
            iconColor="text-orange-600"
            iconBg="bg-orange-50"
            label="Onboarding Queue"
            value={data.onboarding_queue_count.toLocaleString()}
            hint="Pros recruited but not yet successfully onboarded"
            onClick={
              onOpenGroup ? () => onOpenGroup("recruited_not_onboarded") : undefined
            }
          />
        )}
        <StatCard
          icon={Users}
          iconColor="text-purple-600"
          label={isAssociate ? "Total Associates" : "Total Pros Assigned"}
          value={data.total_assigned.toLocaleString()}
          hint={isAssociate ? "All associate-tier users" : "Roster size for this manager"}
          onClick={onOpenGroup ? () => onOpenGroup("all") : undefined}
        />
      </div>
    </section>
  );
}

function ContributingProsCard({ recruiting, promoting, totalAssigned }: { recruiting: number; promoting: number; totalAssigned: number }) {
  return (
    <div className={cn("bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow")}>
      <div className="flex items-start justify-between mb-4"><div className="p-3 rounded-lg bg-indigo-50"><Activity className="w-6 h-6 text-indigo-600" /></div></div>
      <p className="text-sm text-gray-600 mb-3">Contributing Pros</p>
      <div className="space-y-3">
        <div><p className="text-2xl font-bold text-gray-900 tabular-nums">{recruiting.toLocaleString()}<span className="text-base font-normal text-gray-500"> / {totalAssigned.toLocaleString()}</span></p><p className="text-xs text-gray-500 mt-0.5">recruited someone this period</p></div>
        <div><p className="text-lg font-semibold text-gray-900 tabular-nums">{promoting.toLocaleString()}<span className="text-sm font-normal text-gray-500"> / {totalAssigned.toLocaleString()}</span></p><p className="text-xs text-gray-500 mt-0.5">drove a promotion this period</p></div>
      </div>
    </div>
  );
}
