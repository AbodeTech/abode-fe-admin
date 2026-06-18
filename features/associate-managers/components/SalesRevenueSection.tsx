import { Briefcase, CircleDollarSign, BarChart3 } from "lucide-react";
import { StatCard } from "./StatCard";
import type { ManagerDashboardSalesRevenue } from "@/lib/gql/graphql";

interface Props {
  data: ManagerDashboardSalesRevenue;
  /** Which tier of users the roster represents. Switches labels between
   * "Selling Pros" (manager dashboard) and "Selling Associates" (system view). */
  roster?: "associate-pro" | "associate";
}

const formatCurrency = (n: number) =>
  `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

const formatCurrencyShort = (n: number) => {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(1)}K`;
  return formatCurrency(n);
};

export function SalesRevenueSection({ data, roster = "associate-pro" }: Props) {
  const {
    sellingPros,
    sellingProsTarget,
    totalRevenue,
    initialSalesRevenue,
    recurringRevenue,
    revenuePerSellingPro,
  } = data;
  const isAssociate = roster === "associate";

  const sellingDisplay =
    sellingProsTarget > 0
      ? `${sellingPros} / ${sellingProsTarget}`
      : sellingPros.toLocaleString();

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
        />
        <StatCard
          icon={CircleDollarSign}
          iconColor="text-green-600"
          label="Total Revenue from Associate Sales"
          value={formatCurrencyShort(totalRevenue)}
          hint={`${formatCurrencyShort(initialSalesRevenue)} initial · ${formatCurrencyShort(recurringRevenue)} recurring`}
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
