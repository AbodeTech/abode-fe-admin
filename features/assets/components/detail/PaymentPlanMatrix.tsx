"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { formatNairaCompact } from "@/lib/utils/format";

import {
  planTenorLabel,
  type AssetSizePlanBreakdown,
  type AssetSizePlanGroup,
} from "../../schemas/asset-analytics.schema";

/**
 * `sold_value`, `sqm_sold` and `efficiency` come from the group itself — the
 * BE measures them against the size's capacity, so re-deriving them by summing
 * tenor rows would disagree with the API. The cash and lifecycle columns have
 * no group-level equivalent and are summed from the rows.
 */
function totalsFor(group: AssetSizePlanGroup) {
  const sum = (pick: (plan: AssetSizePlanBreakdown) => number) =>
    group.plans.reduce((total, plan) => total + pick(plan), 0);

  return {
    soldValue: group.sold_value,
    sqmSold: group.sqm_sold,
    efficiency: group.efficiency,
    received: sum((p) => p.money_received),
    balance: sum((p) => p.balance_owed),
    transactions: sum((p) => p.plan_count),
    defaults: sum((p) => p.defaulting.customers),
    defaultValue: sum((p) => p.defaulting.value),
    defaultOwed: sum((p) => p.defaulting.amount_owing),
    terminated: sum((p) => p.terminated.plans),
    terminatedValue: sum((p) => p.terminated.value),
    terminatedOwed: sum((p) => p.terminated.amount_owing),
  };
}

const HEAD =
  "whitespace-nowrap border-b px-2.5 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground first:text-left";
const CELL = "whitespace-nowrap px-2.5 py-2.5 text-right align-top tabular-nums";

/** A second, smaller line under a cell's main figure. Left out when there is nothing behind it. */
function Sub({ children }: { children: React.ReactNode }) {
  return <span className="block text-[10px] font-normal text-muted-foreground">{children}</span>;
}

/** "Default value" — the asset value in default, and what is still owed on it. */
function DefaultValueCell({ count, value, owed }: { count: number; value: number; owed: number }) {
  return (
    <>
      {formatNairaCompact(value)}
      {count > 0 ? <Sub>{formatNairaCompact(owed)} owed</Sub> : null}
    </>
  );
}

/** "Terminated" — how many plans, with their asset value and what is still owed. */
function TerminatedCell({ count, value, owed }: { count: number; value: number; owed: number }) {
  return (
    <>
      {count.toLocaleString()}
      {count > 0 ? (
        <Sub>
          {formatNairaCompact(value)} · {formatNairaCompact(owed)} owed
        </Sub>
      ) : null}
    </>
  );
}

function EfficiencyBar({ efficiency }: { efficiency: number }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {efficiency.toFixed(0)}%
      <i className="block h-1.25 w-10 overflow-hidden rounded-full bg-muted" aria-hidden>
        <i
          className="block h-full bg-emerald-500"
          style={{ width: `${Math.min(Math.max(efficiency, 0), 100)}%` }}
        />
      </i>
    </span>
  );
}

/**
 * Payment plan performance — one group row per plot size, opening to one row
 * per tenor (outright, 6 months, …), from `size_plan_breakdown` on
 * GET /admin/assets/:id/analytics.
 *
 * What each column means:
 *  - Sold value    the price of everything sold on that size / tenor.
 *  - Received      cash actually collected against it.
 *  - Balance       what is still to be paid.
 *  - Sqm sold      land those sales cover.
 *  - Transactions  number of plans.
 *  - Defaults / Default value   customers in default, and the asset value
 *                  tied up in their plans, with what they still owe beneath.
 *  - Terminated    plans that were terminated, with their asset value and
 *                  outstanding balance beneath.
 *
 * The design has ten columns and no separate ones for those three balances,
 * so they sit as a second line inside the Default value and Terminated cells
 * rather than widening the table.
 *  - Efficiency    the backend's collection measure for that row.
 *
 * Profit is deliberately not a column here. An earlier version split the
 * estate's total cost across these rows by share of revenue, which is an
 * estimate the backend never made. Real profit has its own tables below: by
 * product (`ProductProfitabilityComparison`) and by product, size and tenor
 * (`PlanProfitabilityTable`). The second is not merged into this table
 * because these rows follow the date range and cover every product at once,
 * while profit is always current and is per product.
 */
export function PaymentPlanMatrix({ data }: { data: AssetSizePlanGroup[] }) {
  const [collapsed, setCollapsed] = useState<number[]>([]);

  // Collapsed-by-exception, so a size added to the data later starts open
  // rather than silently hidden.
  const isOpen = (size: number) => !collapsed.includes(size);
  const toggle = (size: number) =>
    setCollapsed((prev) => (prev.includes(size) ? prev.filter((s) => s !== size) : [...prev, size]));

  if (data.length === 0) {
    return (
      <section className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
        No plan performance for this asset.
      </section>
    );
  }

  return (
    <section className="overflow-hidden rounded-lg border">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-muted/40">
              <th className={HEAD}>Plan / Size</th>
              <th className={HEAD}>Sold value</th>
              <th className={HEAD}>Received</th>
              <th className={HEAD}>Balance</th>
              <th className={HEAD}>Sqm sold</th>
              <th className={HEAD}>Transactions</th>
              <th className={HEAD}>Defaults</th>
              <th className={HEAD}>Default value</th>
              <th className={HEAD}>Terminated</th>
              <th className={HEAD}>Efficiency</th>
            </tr>
          </thead>
          <tbody>
            {data.map((group) => {
              const open = isOpen(group.size);
              const totals = totalsFor(group);
              const Chevron = open ? ChevronDown : ChevronRight;

              return (
                <Fragment key={group.size}>
                  <tr className="border-b bg-muted/40 font-semibold">
                    <td className="whitespace-nowrap px-2.5 py-2.5 text-left">
                      <button
                        type="button"
                        onClick={() => toggle(group.size)}
                        aria-expanded={open}
                        className="flex items-center gap-1.5"
                      >
                        <Chevron className="h-4 w-4" aria-hidden />
                        {group.size.toLocaleString()} sqm
                      </button>
                    </td>
                    <td className={CELL}>{formatNairaCompact(totals.soldValue)}</td>
                    <td className={CELL}>{formatNairaCompact(totals.received)}</td>
                    <td className={CELL}>{formatNairaCompact(totals.balance)}</td>
                    <td className={CELL}>{totals.sqmSold.toLocaleString()}</td>
                    <td className={CELL}>{totals.transactions.toLocaleString()}</td>
                    <td className={cn(CELL, totals.defaults > 0 && "text-rose-600")}>{totals.defaults.toLocaleString()}</td>
                    <td className={cn(CELL, totals.defaults > 0 && "text-rose-600")}>
                      <DefaultValueCell count={totals.defaults} value={totals.defaultValue} owed={totals.defaultOwed} />
                    </td>
                    <td className={cn(CELL, totals.terminated > 0 && "text-amber-600")}>
                      <TerminatedCell
                        count={totals.terminated}
                        value={totals.terminatedValue}
                        owed={totals.terminatedOwed}
                      />
                    </td>
                    <td className={CELL}>
                      <EfficiencyBar efficiency={totals.efficiency} />
                    </td>
                  </tr>

                  {open
                    ? group.plans.map((plan) => (
                        <tr
                          key={`${group.size}-${plan.month_subscription}`}
                          className="border-b last:border-b-0 hover:bg-muted/40"
                        >
                          <td className="whitespace-nowrap py-2.5 pl-9 pr-2.5 text-left text-muted-foreground">
                            {planTenorLabel(plan.month_subscription)}
                          </td>
                          <td className={CELL}>{formatNairaCompact(plan.sold_value)}</td>
                          <td className={CELL}>{formatNairaCompact(plan.money_received)}</td>
                          <td className={CELL}>{formatNairaCompact(plan.balance_owed)}</td>
                          <td className={CELL}>{plan.sqm_sold.toLocaleString()}</td>
                          <td className={CELL}>{plan.plan_count.toLocaleString()}</td>
                          <td className={cn(CELL, plan.defaulting.customers > 0 && "font-semibold text-rose-600")}>
                            {plan.defaulting.customers.toLocaleString()}
                          </td>
                          <td className={CELL}>
                            <DefaultValueCell
                              count={plan.defaulting.customers}
                              value={plan.defaulting.value}
                              owed={plan.defaulting.amount_owing}
                            />
                          </td>
                          <td className={CELL}>
                            <TerminatedCell
                              count={plan.terminated.plans}
                              value={plan.terminated.value}
                              owed={plan.terminated.amount_owing}
                            />
                          </td>
                          <td className={CELL}>{plan.efficiency.toFixed(0)}%</td>
                        </tr>
                      ))
                    : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
