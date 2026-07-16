import { CheckCircle2, TrendingUp, UserPlus, Users, ClipboardList, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatCard } from "./StatCard";
import { ProRosterGroup, type ManagerDashboardRecruitment } from "@/lib/gql/graphql";
import {
  contributorBreakdown,
  isPerProAttribution,
  sourceBreakdown,
  type AttributionMode,
} from "../lib/attribution";

interface Props {
  data: ManagerDashboardRecruitment;
  /** Which tier of users the roster represents. Switches labels and hides
   * irrelevant cards (e.g. associates aren't onboarded). */
  roster?: "associate-pro" | "associate";
  /** When provided, the cards become drill-down triggers. */
  onOpenGroup?: (group: ProRosterGroup) => void;
  /** Which attribution set to render:
   *   - "single" (default) → top-N contributors under each card
   *   - "combined" / "system" → source split (managed/unassigned/users/associate)
   * Aligns with the BE population matrix in the attribution spec. */
  attributionMode?: AttributionMode;
}

export function RecruitmentSection({
  data,
  roster = "associate-pro",
  onOpenGroup,
  attributionMode = "single",
}: Props) {
  const isAssociate = roster === "associate";
  const perPro = isPerProAttribution(attributionMode);

  // Build breakdowns for the two attribution-eligible cards. The BE populates
  // exactly one shape per view, so we pick based on attributionMode without
  // ever needing to guard the absent side.
  const newSignupsSegments = perPro
    ? contributorBreakdown(
        data.topNewSignupsContributors,
        data.othersNewSignupsCount
      )
    : sourceBreakdown(data.newSignupsBySource);

  const upgradesSegments = perPro
    ? contributorBreakdown(
        data.topUpgradesContributors,
        data.othersUpgradesCount
      )
    : sourceBreakdown(data.upgradesBySource);

  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-gray-900">Recruitment</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={UserPlus}
          iconColor="text-cyan-600"
          label="New Recruits This Period"
          value={data.newSignupsInPeriod.toLocaleString()}
          // Recruit tiers are now associate + associate-pro only (plain user-tier
          // sign-ups are excluded on the BE — see attribution spec §3.2).
          hint={
            isAssociate
              ? "Associates & Pros brought in by associates this period"
              : "Associates & Pros brought in by your team this period"
          }
          // No drawer: the recruiter-side count includes people who ended up on
          // other managers' rosters, but the drawer only lists this manager's
          // roster — would surface a misleading subset. Bar shows attribution.
          breakdown={newSignupsSegments}
        />
        <StatCard
          icon={TrendingUp}
          iconColor="text-[#00695C]"
          iconBg="bg-[#E0F2F1]"
          label="Recruits Promoted to Associate Pro"
          value={data.upgradesInPeriod.toLocaleString()}
          hint="Recruits who upgraded to Associate Pro this period"
          // No drawer — see New Recruits note.
          breakdown={upgradesSegments}
        />
        {perPro && !isAssociate && (
          <ContributingProsCard
            recruiting={data.activeRecruitingProsCount}
            promoting={data.activePromotingProsCount}
            totalAssigned={data.totalAssigned}
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
            value={data.onboardedInPeriod.toLocaleString()}
            hint="Pros whose first call landed in Picked this period"
            onClick={onOpenGroup ? () => onOpenGroup(ProRosterGroup.OnboardedInPeriod) : undefined}
            breakdown={[
              {
                label: "fresh",
                value: data.onboardedFreshInPeriod,
                color: "bg-emerald-500",
                display: data.onboardedFreshInPeriod.toLocaleString(),
              },
              {
                label: "carryover",
                value: data.onboardedCarryoverInPeriod,
                color: "bg-gray-300",
                display: data.onboardedCarryoverInPeriod.toLocaleString(),
              },
            ]}
          />
        )}
        {!isAssociate && (
          <StatCard
            icon={ClipboardList}
            iconColor="text-orange-600"
            iconBg="bg-orange-50"
            label="Onboarding Queue"
            value={data.onboardingQueueCount.toLocaleString()}
            hint="Pros recruited but not yet successfully onboarded"
            onClick={onOpenGroup ? () => onOpenGroup(ProRosterGroup.RecruitedNotOnboarded) : undefined}
          />
        )}
        <StatCard
          icon={Users}
          iconColor="text-purple-600"
          label={isAssociate ? "Total Associates" : "Total Pros Assigned"}
          value={data.totalAssigned.toLocaleString()}
          hint={isAssociate ? "All associate-tier users" : "Roster size for this manager"}
        />
      </div>
    </section>
  );
}

interface ContributingProsCardProps {
  recruiting: number;
  promoting: number;
  totalAssigned: number;
}

function ContributingProsCard({
  recruiting,
  promoting,
  totalAssigned,
}: ContributingProsCardProps) {
  return (
    <div className={cn(
      "bg-white rounded-xl p-6 border border-gray-200 hover:shadow-md transition-shadow"
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-lg bg-indigo-50">
          <Activity className="w-6 h-6 text-indigo-600" />
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-3">Contributing Pros</p>
      <div className="space-y-3">
        <div>
          <p className="text-2xl font-bold text-gray-900 tabular-nums">
            {recruiting.toLocaleString()}
            <span className="text-base font-normal text-gray-500"> / {totalAssigned.toLocaleString()}</span>
          </p>
          <p className="text-xs text-gray-500 mt-0.5">recruited someone this period</p>
        </div>
        <div>
          <p className="text-lg font-semibold text-gray-900 tabular-nums">
            {promoting.toLocaleString()}
            <span className="text-sm font-normal text-gray-500"> / {totalAssigned.toLocaleString()}</span>
          </p>
          <p className="text-xs text-gray-500 mt-0.5">drove a promotion this period</p>
        </div>
      </div>
    </div>
  );
}
