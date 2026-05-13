import { Sparkles, Award } from "lucide-react";
import { StatCard } from "./StatCard";
import type { ManagerMetrics } from "../mock-data";

interface Props {
  metrics: ManagerMetrics;
}

export function MilestonesSection({ metrics }: Props) {
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-gray-900">Milestones</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          icon={Sparkles}
          iconColor="text-purple-600"
          label="New Associate Pro First Sales"
          value={metrics.milestones.newProFirstSales}
          hint="First sale within 3 months of upgrade"
        />
        <StatCard
          icon={Award}
          iconColor="text-blue-600"
          label="First-Time Sellers"
          value={metrics.milestones.firstTimeSellers}
          hint="Existing Pros making first sale after 3+ months"
        />
      </div>
    </section>
  );
}
