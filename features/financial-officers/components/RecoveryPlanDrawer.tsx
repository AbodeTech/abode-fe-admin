"use client";

import { useState } from "react";
import { ArrowDownLeft, Ban, CalendarX, Loader2, Percent } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useRecoveryPlan } from "../hooks/use-financial-officer-dashboard";
import { useFinancialOfficers } from "../hooks/use-financial-officers";
import { useReassignRecoveryPlan } from "../hooks/use-financial-officer-mutations";
import {
  PRODUCT_LABELS,
  customerName,
  daysUntil,
  formatHours,
  formatNaira,
  formatShortDate,
} from "../lib/format";
import {
  adminMinInitials,
  adminMinName,
  type RecoveryPlanDetail,
} from "../schemas/financial-officer.schema";
import { RecoveryStatePill } from "./recovery-pills";

interface Props {
  planId: string | null;
  /** The assignment row the drawer was opened from; the latest when null. */
  assignmentId: string | null;
  /** Called after a reassign, with the new assignment the drawer should show. */
  onAssignmentChange: (assignmentId: string) => void;
  onOpenChange: (open: boolean) => void;
  canReassign: boolean;
}

const METHOD_LABELS: Record<RecoveryPlanDetail["payments"][number]["method"], string> = {
  transfer: "bank transfer",
  paystack: "Paystack",
  wallet: "wallet",
};

const inDays = (iso: string) => {
  const d = daysUntil(iso);
  return d <= 0 ? "today" : `in ${d} day${d === 1 ? "" : "s"}`;
};

function Countdown({ plan }: { plan: RecoveryPlanDetail }) {
  if (plan.state === "cleared" || plan.state === "suspended") return null;

  const lines: { icon: React.ElementType; text: React.ReactNode }[] = [];
  if (plan.state === "final_month") {
    lines.push({
      icon: CalendarX,
      text: (
        <>
          <b>Final month, {formatNaira(Math.max(0, plan.balance - plan.installment_amount))} behind.</b> Owes{" "}
          {formatNaira(plan.balance)} against a {formatNaira(plan.installment_amount)} installment; everything is due{" "}
          <b>{formatShortDate(plan.final_due_date)}</b> ({inDays(plan.final_due_date)}).
        </>
      ),
    });
  } else {
    lines.push({
      icon: CalendarX,
      text: (
        <>
          <b>{plan.days_past_due} days past the final due date</b> ({formatShortDate(plan.final_due_date)}) with{" "}
          {formatNaira(plan.balance)} still owed.
        </>
      ),
    });
  }
  if (plan.penalty_at) {
    lines.push({
      icon: Percent,
      text: (
        <>
          Default penalty on <b>{formatShortDate(plan.penalty_at)}</b> ({inDays(plan.penalty_at)}).
        </>
      ),
    });
  }
  if (plan.suspends_at) {
    lines.push({
      icon: Ban,
      text: (
        <>
          Suspension on <b>{formatShortDate(plan.suspends_at)}</b>{" "}
          ({inDays(plan.suspends_at)}) if not paid. Recovery stops counting then.
        </>
      ),
    });
  }

  const urgent = plan.state === "past_due";
  return (
    <div
      className={cn(
        "rounded-lg border px-4 py-3 space-y-2.5",
        urgent ? "border-red-200 bg-red-50 text-red-900" : "border-amber-200 bg-amber-50 text-amber-900"
      )}
    >
      {lines.map(({ icon: Icon, text }, i) => (
        <div key={i} className="flex items-start gap-2.5 text-sm">
          <Icon className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{text}</span>
        </div>
      ))}
    </div>
  );
}

function Reassign({
  plan,
  onAssignmentChange,
}: {
  plan: RecoveryPlanDetail;
  onAssignmentChange: (assignmentId: string) => void;
}) {
  const { data: officers = [] } = useFinancialOfficers();
  const reassign = useReassignRecoveryPlan();
  const currentId = plan.assignment.officer?.id ?? null;
  const [picked, setPicked] = useState<string>("");

  const options = officers.filter((o) => o.officer && o.officer.id !== currentId);

  const handleReassign = () => {
    if (!picked) return;
    reassign.mutate(
      { planId: plan.plan_id, officerId: picked },
      {
        onSuccess: (updated) => {
          toast.success(`Moved to ${adminMinName(updated.assignment.officer)}`);
          setPicked("");
          // The old assignment is closed now; show the new one.
          onAssignmentChange(updated.assignment_id);
        },
        onError: (err) => toast.error(err.message || "Failed to reassign plan"),
      }
    );
  };

  if (options.length === 0) return null;

  return (
    <div className="flex items-center gap-2 pt-2">
      <Select value={picked} onValueChange={setPicked}>
        <SelectTrigger className="h-8 text-xs flex-1 bg-white" aria-label="Move to officer">
          <SelectValue placeholder="Move to another officer…" />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.id} value={o.officer!.id}>
              {adminMinName(o.officer)} · {o.open_plans_count} open
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="sm" className="h-8 text-xs" onClick={handleReassign} disabled={!picked || reassign.isPending}>
        {reassign.isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
        Reassign
      </Button>
    </div>
  );
}

export function RecoveryPlanDrawer({ planId, assignmentId, onAssignmentChange, onOpenChange, canReassign }: Props) {
  const { data: plan, isLoading, error } = useRecoveryPlan(planId, assignmentId);

  return (
    <Sheet open={!!planId} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        {isLoading || !plan ? (
          <div className="flex h-full items-center justify-center text-sm text-gray-500">
            {/* Radix requires a title even while loading, for screen readers. */}
            <SheetTitle className="sr-only">Recovery plan</SheetTitle>
            {error ? (
              <span className="text-[#AD1F2A]">{error.message || "Couldn't load this plan."}</span>
            ) : (
              <Loader2 className="h-5 w-5 animate-spin" />
            )}
          </div>
        ) : (
          <>
            <SheetHeader className="border-b border-gray-200">
              <SheetTitle className="flex items-center gap-2">
                {customerName(plan.customer)}
                <RecoveryStatePill state={plan.state} />
              </SheetTitle>
              <SheetDescription>
                {plan.asset} · {PRODUCT_LABELS[plan.product]} · {plan.tenor_months} months
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 px-4 pb-8">
              <Countdown plan={plan} />

              <section className="space-y-2.5">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Plan</h3>
                <dl className="grid grid-cols-2 gap-x-5 gap-y-3 text-sm">
                  {[
                    ["Plan price", formatNaira(plan.plan_price)],
                    ["Paid to date", formatNaira(plan.amount_paid)],
                    ["Balance", formatNaira(plan.balance)],
                    ["Final due date", formatShortDate(plan.final_due_date)],
                    ["Started", formatShortDate(plan.start_date)],
                    ["Customer phone", plan.customer.phone ?? "—"],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <dt className="text-xs text-gray-500">{label}</dt>
                      <dd className="font-medium text-gray-900 tabular-nums">{value}</dd>
                    </div>
                  ))}
                </dl>
              </section>

              <section className="space-y-2.5">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">Assigned to</h3>
                <div className="rounded-lg border border-gray-200 px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="h-8 w-8 rounded-full bg-[#E0F2F1] text-[#00695C] flex items-center justify-center text-[11px] font-semibold shrink-0">
                      {adminMinInitials(plan.assignment.officer)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {adminMinName(plan.assignment.officer)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {plan.assignment.auto ? "Auto-assigned" : "Reassigned by a super admin"}{" "}
                        {formatShortDate(plan.assignment.assigned_at)}
                      </p>
                    </div>
                  </div>
                  {canReassign && plan.state !== "cleared" && plan.state !== "suspended" && (
                    <Reassign plan={plan} onAssignmentChange={onAssignmentChange} />
                  )}
                </div>
              </section>

              <section className="space-y-2.5">
                <h3 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Recovered since assigned · {formatNaira(plan.recovered_since_assigned)}
                </h3>
                {plan.payments.length === 0 ? (
                  <p className="text-sm text-gray-500">No payments since this plan entered the book.</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {plan.payments.map((pay) => (
                      <li key={pay.id} className="flex items-center gap-3 py-3">
                        <div className="h-8 w-8 rounded-full bg-[#E0F2F1] text-[#00695C] flex items-center justify-center shrink-0">
                          <ArrowDownLeft className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold tabular-nums">{formatNaira(pay.amount)}</p>
                          <p className="text-xs text-gray-500">
                            {formatShortDate(pay.paid_at)} · {METHOD_LABELS[pay.method]}
                            {pay.approved_by ? ` · approved by ${adminMinName(pay.approved_by)}` : " · automatic"}
                          </p>
                        </div>
                        {pay.approval_hours != null && (
                          <span
                            className={cn(
                              "text-xs tabular-nums",
                              pay.approval_hours > 24 ? "text-[#AD1F2A] font-medium" : "text-gray-500"
                            )}
                          >
                            {formatHours(pay.approval_hours)}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
                <p className="text-xs text-gray-500">
                  Every payment counts toward the assigned officer&apos;s recovery. Approval speed goes to
                  whoever approved it.
                </p>
              </section>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
