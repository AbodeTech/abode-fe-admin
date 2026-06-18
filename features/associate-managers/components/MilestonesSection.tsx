import { Sparkles, Award } from "lucide-react";
import { StatCard } from "./StatCard";
import type { ManagerDashboardMilestones } from "@/lib/gql/graphql";

interface Props {
  data: ManagerDashboardMilestones;
  roster?: "associate-pro" | "associate";
}

export function MilestonesSection({ data, roster = "associate-pro" }: Props) {
  const isAssociate = roster === "associate";
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-gray-900">Milestones</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          icon={Sparkles}
          iconColor="text-purple-600"
          label={isAssociate ? "New Associate First Sales" : "New Associate Pro First Sales"}
          value={data.earlySellers}
          hint="First sale within 3 months of upgrade (this period)"
        />
        <StatCard
          icon={Award}
          iconColor="text-blue-600"
          label="First-Time Sellers"
          value={data.lateFirstSellers}
          hint="First sale 3+ months after upgrade (this period)"
        />
      </div>
    </section>
  );
}
