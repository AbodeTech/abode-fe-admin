import { Briefcase, CircleDollarSign, BarChart3 } from "lucide-react";
import { StatCard } from "./StatCard";
import type {
  ManagerDashboard,
  ProGroup,
} from "../schemas/manager-dashboard.schema";

interface Props {
  data: ManagerDashboard["sales_and_revenue"];
  /** Which tier of users the roster represents. Switches labels between
   * "Selling Pros" (manager dashboard) and "Selling Associates" (system view). */
  roster?: "associate-pro" | "associate";
  /** When provided, the Selling Pros card becomes a drill-down trigger. */
  onOpenGroup?: (group: ProGroup) => void;
}

const formatCurrency = (n: number) =>
  `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

const formatCurrencyShort = (n: number) => {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(1)}K`;
  return formatCurrency(n);
};

export function SalesRevenueSection({ data, roster = "associate-pro", onOpenGroup }: Props) {
  const {
    selling_pros,
    selling_pros_target,
    total_revenue,
    initial_sales_revenue,
    recurring_revenue,
    revenue_per_selling_pro,
  } = data;
  const isAssociate = roster === "associate";

  const sellingDisplay =
    selling_pros_target > 0
      ? `${selling_pros} / ${selling_pros_target}`
      : selling_pros.toLocaleString();

  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-gray-900">Sales & Revenue</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={Briefcase}
          iconColor="text-blue-600"
          label={isAssociate ? "Selling Associates" : "Selling Associate Pros"}
          value={sellingDisplay}
          hint={
            isAssociate
              ? "Associates who closed a new sale this period"
              : "Pros who closed a new sale this period"
          }
          onClick={onOpenGroup ? () => onOpenGroup("selling_in_period") : undefined}
        />
        <StatCard
          icon={CircleDollarSign}
          iconColor="text-green-600"
          label="Total Revenue from Associate Sales"
          value={formatCurrencyShort(total_revenue)}
          hint={`${formatCurrencyShort(initial_sales_revenue)} initial · ${formatCurrencyShort(recurring_revenue)} recurring`}
        />
        <StatCard
          icon={BarChart3}
          iconColor="text-orange-600"
          label={isAssociate ? "Revenue per Selling Associate" : "Revenue per Selling Pro"}
          value={formatCurrencyShort(revenue_per_selling_pro)}
          hint={formatCurrency(revenue_per_selling_pro)}
        />
      </div>
    </section>
  );
}
