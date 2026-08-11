"use client";

import { CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CsManagerPortfolio as CSManagerPortfolio } from "@/lib/gql/graphql";

interface Props {
  portfolio: CSManagerPortfolio;
}

/** Rolling counts across the roster — not tied to the current period. */
export function PortfolioHealthStrip({ portfolio }: Props) {
  const pctCompleted = portfolio.totalAssigned
    ? Math.round((portfolio.completedPayment / portfolio.totalAssigned) * 100)
    : 0;

  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h2 className="text-base font-semibold text-gray-900">
          Portfolio Health
        </h2>
        <span className="text-xs text-gray-500">
          Rolling roster counts — not tied to this period.
        </span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <HealthTile
          icon={CheckCircle2}
          iconClass="text-emerald-700 bg-emerald-50"
          label="Customers with completed payment"
          value={portfolio.completedPayment}
          foot={`of ${portfolio.totalAssigned} assigned · ${pctCompleted}%`}
        />
        <HealthTile
          icon={Clock}
          iconClass="text-[#00695C] bg-[#E0F2F1]"
          label="Customers within payment period"
          value={portfolio.withinPaymentPeriod}
          foot="active plans · normal pace"
        />
        <HealthTile
          icon={AlertTriangle}
          iconClass="text-[#AD1F2A] bg-red-50"
          label="Close to defaulting (≤1 month to go)"
          value={portfolio.closeToDefaulting}
          foot="urgent intervention · escalate"
        />
      </div>
    </section>
  );
}

function HealthTile({
  icon: Icon,
  iconClass,
  label,
  value,
  foot,
}: {
  icon: React.ElementType;
  iconClass: string;
  label: string;
  value: number;
  foot: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 flex items-center gap-3">
      <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center", iconClass)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-lg font-bold text-gray-900 tabular-nums leading-tight">
          {value.toLocaleString()}
        </p>
        <p className="text-xs text-gray-600 leading-tight">{label}</p>
        <p className="text-[11px] text-gray-400 mt-0.5">{foot}</p>
      </div>
    </div>
  );
}
