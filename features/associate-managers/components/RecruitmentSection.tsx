import { CheckCircle2, TrendingUp, UserPlus, Users } from "lucide-react";
import { StatCard } from "./StatCard";
import type { ManagerDashboardRecruitment } from "@/lib/gql/graphql";

interface Props {
  data: ManagerDashboardRecruitment;
  /** Which tier of users the roster represents. Switches labels and hides
   * irrelevant cards (e.g. associates aren't onboarded). */
  roster?: "associate-pro" | "associate";
}

export function RecruitmentSection({ data, roster = "associate-pro" }: Props) {
  const isAssociate = roster === "associate";
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-gray-900">Recruitment</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
        />
        <StatCard
          icon={TrendingUp}
          iconColor="text-[#00695C]"
          iconBg="bg-[#E0F2F1]"
          label="Recruits Promoted to Associate Pro"
          value={data.upgradesInPeriod.toLocaleString()}
          hint="Recruits who upgraded to Associate Pro this period"
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
