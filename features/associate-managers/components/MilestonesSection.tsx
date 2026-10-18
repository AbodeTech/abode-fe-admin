import { Sparkles, Award } from "lucide-react";
import { StatCard } from "./StatCard";
import type {
  ManagerDashboard,
  ProGroup,
} from "../schemas/manager-dashboard.schema";

interface Props {
  data: ManagerDashboard["milestones"];
  roster?: "associate-pro" | "associate";
  /** When provided, the milestone cards become drill-down triggers. */
  onOpenGroup?: (group: ProGroup) => void;
}

export function MilestonesSection({ data, roster = "associate-pro", onOpenGroup }: Props) {
  const isAssociate = roster === "associate";
  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-gray-900">Milestones</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          icon={Sparkles}
          iconColor="text-purple-600"
          label={isAssociate ? "New Associate First Sales" : "New Associate Pro First Sales"}
          value={data.early_sellers}
          hint="First sale within 3 months of upgrade (this period)"
          onClick={onOpenGroup ? () => onOpenGroup("selling_in_period") : undefined}
        />
        <StatCard
          icon={Award}
          iconColor="text-blue-600"
          label="First-Time Sellers"
          value={data.late_first_sellers}
          hint="First sale 3+ months after upgrade (this period)"
          onClick={onOpenGroup ? () => onOpenGroup("selling_in_period") : undefined}
        />
      </div>
    </section>
  );
}
