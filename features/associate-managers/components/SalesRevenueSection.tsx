import { Briefcase, CircleDollarSign, BarChart3 } from "lucide-react";
import { StatCard } from "./StatCard";
import { ProRosterGroup, type ManagerDashboardSalesRevenue } from "@/lib/gql/graphql";
import {
  contributorBreakdown,
  formatCurrencyShort,
  isPerProAttribution,
  sourceBreakdown,
  type AttributionMode,
} from "../lib/attribution";

interface Props {
  data: ManagerDashboardSalesRevenue;
  /** Which tier of users the roster represents. Switches labels between
   * "Selling Pros" (manager dashboard) and "Selling Associates" (system view). */
  roster?: "associate-pro" | "associate";
  /** When provided, the Selling Pros card becomes a drill-down trigger. */
  onOpenGroup?: (group: ProRosterGroup) => void;
  /** Which attribution set to render. See RecruitmentSection for the rules. */
  attributionMode?: AttributionMode;
}

const formatCurrency = (n: number) =>
  `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

export function SalesRevenueSection({
  data,
  roster = "associate-pro",
  onOpenGroup,
  attributionMode = "single",
}: Props) {
  const {
    sellingPros,
    sellingProsTarget,
    totalRevenue,
    initialSalesRevenue,
    recurringRevenue,
    revenuePerSellingPro,
  } = data;
  const isAssociate = roster === "associate";
  const perPro = isPerProAttribution(attributionMode);

  const sellingDisplay =
    sellingProsTarget > 0
      ? `${sellingPros} / ${sellingProsTarget}`
      : sellingPros.toLocaleString();

  // Selling Pros card — only breakdown in combined/system view (source split).
  // The BE doesn't ship a per-pro sales-count contributor list — attribution
  // for one manager's team lives on the revenue card via topSellingContributors,
  // and duplicating it here would just re-render the same list against a
  // different total. Leave the Selling Pros card as a clean count.
  const sellingBreakdown = perPro
    ? undefined
    : sourceBreakdown(data.salesCountBySource);

  // Total Revenue card — carries the attribution story on the manager view.
  const revenueBreakdown = perPro
    ? contributorBreakdown(data.topSellingContributors, data.othersSellingRevenue, {
        getValue: (c) => c.amount ?? 0,
        formatValue: formatCurrencyShort,
      })
    : sourceBreakdown(data.revenueBySource, { formatValue: formatCurrencyShort });

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
          onClick={onOpenGroup ? () => onOpenGroup(ProRosterGroup.SellingInPeriod) : undefined}
          breakdown={sellingBreakdown}
        />
        <StatCard
          icon={CircleDollarSign}
          iconColor="text-green-600"
          label="Total Revenue from Associate Sales"
          value={formatCurrencyShort(totalRevenue)}
          hint={`${formatCurrencyShort(initialSalesRevenue)} initial · ${formatCurrencyShort(recurringRevenue)} recurring`}
          breakdown={revenueBreakdown}
        />
        <StatCard
          icon={BarChart3}
          iconColor="text-orange-600"
          label={isAssociate ? "Revenue per Selling Associate" : "Revenue per Selling Pro"}
          value={formatCurrencyShort(revenuePerSellingPro)}
          hint={formatCurrency(revenuePerSellingPro)}
        />
      </div>
    </section>
  );
}
