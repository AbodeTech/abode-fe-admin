import { cn } from "@/lib/utils";
import { formatNairaCompact } from "../lib/format";
import type { FinancialOfficerDashboard } from "../schemas/financial-officer.schema";

export function RecoveryStrip({ recovery }: { recovery: FinancialOfficerDashboard["recovery"] }) {
  const cells = [
    {
      label: "Plans in book",
      value: recovery.in_book.toLocaleString(),
      hint: `${recovery.due_soon} due within 30 days · ${recovery.overdue} overdue`,
    },
    { label: "Outstanding in book", value: formatNairaCompact(recovery.outstanding), hint: "balances still owed" },
    {
      label: "Recovered this month",
      value: formatNairaCompact(recovery.recovered),
      hint: "paid before any suspension",
      tone: "text-[#00695C]",
    },
    { label: "Cleared this month", value: recovery.cleared.toLocaleString(), hint: "paid off, left the book" },
    {
      label: "Suspended this month",
      value: recovery.suspended.toLocaleString(),
      hint: `${formatNairaCompact(recovery.unrecovered_on_suspension)} left unrecovered`,
      tone: recovery.suspended > 0 ? "text-[#AD1F2A]" : undefined,
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 rounded-xl border border-gray-200 bg-white divide-x divide-gray-100">
      {cells.map((c) => (
        <div key={c.label} className="px-5 py-4">
          <p className="text-xs text-gray-500">{c.label}</p>
          <p className={cn("mt-1 text-xl font-bold tabular-nums", c.tone)}>{c.value}</p>
          <p className="text-xs text-gray-500">{c.hint}</p>
        </div>
      ))}
    </div>
  );
}
