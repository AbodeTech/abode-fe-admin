import { CheckCircle2, TrendingUp, UserPlus, Users } from "lucide-react";
import { StatCard } from "./StatCard";
import type { ManagerDashboardRecruitment } from "@/lib/gql/graphql";

interface Props {
  data: ManagerDashboardRecruitment;
}

export function RecruitmentSection({ data }: Props) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-gray-900">Recruitment</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={UserPlus}
          iconColor="text-cyan-600"
          label="New Sign-ups This Period"
          value={data.newSignupsInPeriod.toLocaleString()}
          hint="Assigned Pros who signed up during this period"
        />
        <StatCard
          icon={TrendingUp}
          iconColor="text-[#00695C]"
          iconBg="bg-[#E0F2F1]"
          label="New Associate Pro Upgrades"
          value={data.upgradesInPeriod.toLocaleString()}
          hint="Approved Associate Pro upgrades this period"
        />
        <StatCard
          icon={CheckCircle2}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
          label="Onboarded This Period"
          value={data.onboardedInPeriod.toLocaleString()}
          hint="Pros whose first call landed in Picked this period"
        />
        <StatCard
          icon={Users}
          iconColor="text-purple-600"
          label="Total Pros Assigned"
          value={data.totalAssigned.toLocaleString()}
          hint="Roster size for this manager"
        />
      </div>
    </section>
  );
}
