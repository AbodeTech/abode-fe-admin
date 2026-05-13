import { Briefcase, CircleDollarSign, BarChart3 } from "lucide-react";
import { StatCard } from "./StatCard";
import type { ManagerMetrics } from "../mock-data";

interface Props {
  metrics: ManagerMetrics;
}

const formatCurrency = (n: number) =>
  `₦${n.toLocaleString("en-NG", { maximumFractionDigits: 0 })}`;

const formatCurrencyShort = (n: number) => {
  if (n >= 1_000_000_000) return `₦${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `₦${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `₦${(n / 1_000).toFixed(1)}K`;
  return formatCurrency(n);
};

export function SalesRevenueSection({ metrics }: Props) {
  const { sellingPros, totalPros, totalRevenue, revenuePerSellingPro } = metrics.sales;

  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-gray-900">Sales & Revenue</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard
          icon={Briefcase}
          iconColor="text-blue-600"
          label="Selling Associate Pros"
          value={`${sellingPros} / ${totalPros}`}
          hint="Pros who made at least one sale this period"
        />
        <StatCard
          icon={CircleDollarSign}
          iconColor="text-green-600"
          label="Total Revenue from Associate Sales"
          value={formatCurrencyShort(totalRevenue)}
          hint={formatCurrency(totalRevenue)}
        />
        <StatCard
          icon={BarChart3}
          iconColor="text-orange-600"
          label="Revenue per Selling Pro"
          value={formatCurrencyShort(revenuePerSellingPro)}
          hint={formatCurrency(revenuePerSellingPro)}
        />
      </div>
    </section>
  );
}
