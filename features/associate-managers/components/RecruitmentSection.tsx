import { UserPlus, TrendingUp, Users } from "lucide-react";
import { StatCard } from "./StatCard";
import type { ManagerMetrics } from "../mock-data";

interface Props {
  metrics: ManagerMetrics;
}

export function RecruitmentSection({ metrics }: Props) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-gray-900">Recruitment</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={UserPlus}
          iconColor="text-cyan-600"
          label="New Associates Recruited"
          value={metrics.recruitment.newAssociates.toLocaleString()}
          hint="New Associates registered this period"
        />
        <StatCard
          icon={TrendingUp}
          iconColor="text-[#00695C]"
          iconBg="bg-[#E0F2F1]"
          label="New Associate Pros Recruited"
          value={metrics.recruitment.newAssociatePros.toLocaleString()}
          hint="Associate Pro upgrades this period"
        />
        <StatCard
          icon={Users}
          iconColor="text-purple-600"
          label="Associate Pros via Associates"
          value={metrics.recruitment.associateProsViaAssociates.toLocaleString()}
          hint="Pros recruited by other Associates"
        />
      </div>
    </section>
  );
}
