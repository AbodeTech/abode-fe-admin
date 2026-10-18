import { Briefcase, CircleDollarSign, BarChart3, FileSignature } from "lucide-react";
import { contributorBreakdown, isPerProAttribution, sourceBreakdown, type AttributionMode } from "../lib/attribution";
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
  attributionMode?: AttributionMode;
}

const formatCurrency = (n: number) =>
  `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

const formatCurrencyShort = (n: number) => {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(1)}K`;
  return formatCurrency(n);
};

export function SalesRevenueSection({ data, roster = "associate-pro", onOpenGroup, attributionMode = "single" }: Props) {
  const {
    selling_pros,
    selling_pros_target,
    total_revenue,
    initial_sales_revenue,
    recurring_revenue,
    revenue_per_selling_pro,
    contract_size,
  } = data;
  const isAssociate = roster === "associate";
  const perPro = isPerProAttribution(attributionMode);
  const sellingBreakdown = perPro ? undefined : sourceBreakdown(data.sales_count_by_source);
  const revenueBreakdown = perPro
    ? contributorBreakdown(data.top_selling_contributors, data.others_selling_revenue, { getValue: (c) => c.amount ?? 0, formatValue: formatCurrencyShort })
    : sourceBreakdown(data.revenue_by_source, { formatValue: formatCurrencyShort });

  const sellingDisplay =
    selling_pros_target > 0
      ? `${selling_pros} / ${selling_pros_target}`
      : selling_pros.toLocaleString();

  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-gray-900">Sales & Revenue</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
          breakdown={sellingBreakdown}
        />
        <StatCard
          icon={FileSignature}
          iconColor="text-purple-600"
          label="Contract Size"
          value={formatCurrencyShort(contract_size)}
          hint={`${formatCurrency(contract_size)} in land price on plans opened this period`}
        />
        <StatCard
          icon={CircleDollarSign}
          iconColor="text-green-600"
          label="Total Revenue from Associate Sales"
          value={formatCurrencyShort(total_revenue)}
          hint={`${formatCurrencyShort(initial_sales_revenue)} initial · ${formatCurrencyShort(recurring_revenue)} recurring`}
          breakdown={revenueBreakdown}
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
