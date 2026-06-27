import { CheckCircle2, TrendingUp, UserPlus, Users, ClipboardList } from "lucide-react";
import { StatCard } from "./StatCard";
import { ProRosterGroup, type ManagerDashboardRecruitment } from "@/lib/gql/graphql";

interface Props {
  data: ManagerDashboardRecruitment;
  /** Which tier of users the roster represents. Switches labels and hides
   * irrelevant cards (e.g. associates aren't onboarded). */
  roster?: "associate-pro" | "associate";
  /** When provided, the cards become drill-down triggers. */
  onOpenGroup?: (group: ProRosterGroup) => void;
}

export function RecruitmentSection({ data, roster = "associate-pro", onOpenGroup }: Props) {
  const isAssociate = roster === "associate";
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-gray-900">Recruitment</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          icon={UserPlus}
          iconColor="text-cyan-600"
          label="New Recruits This Period"
          value={data.newSignupsInPeriod.toLocaleString()}
          hint={
            isAssociate
              ? "People associates brought in this period (all tiers)"
              : "People your pros brought in this period (all tiers)"
          }
          onClick={onOpenGroup ? () => onOpenGroup(ProRosterGroup.RecruitedInPeriod) : undefined}
        />
        <StatCard
          icon={TrendingUp}
          iconColor="text-[#00695C]"
          iconBg="bg-[#E0F2F1]"
          label="Recruits Promoted to Associate Pro"
          value={data.upgradesInPeriod.toLocaleString()}
          hint="Recruits who upgraded to Associate Pro this period"
          onClick={onOpenGroup ? () => onOpenGroup(ProRosterGroup.UpgradedInPeriod) : undefined}
        />
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
