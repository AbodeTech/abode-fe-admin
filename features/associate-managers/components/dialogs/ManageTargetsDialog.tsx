"use client";

import { useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Target, CalendarDays, Clock } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { SetTargetForm } from "./SetTargetForm";
import {
  daysRemaining,
  formatPeriodLabel,
  getActiveTarget,
  getPastTargets,
  getUpcomingTargets,
  type AssociateManager,
  type ManagerMetrics,
  type ManagerTarget,
} from "../../mock-data";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  manager: AssociateManager;
  metrics: ManagerMetrics;
}

type FormState = { mode: "closed" } | { mode: "create" } | { mode: "edit"; target: ManagerTarget };

const hitPct = (actual: number, target: number) =>
  target > 0 ? Math.round((actual / target) * 100) : 0;

export function ManageTargetsDialog({ open, onOpenChange, manager, metrics }: Props) {
  const active = useMemo(() => getActiveTarget(manager.id), [manager.id]);
  const upcoming = useMemo(() => getUpcomingTargets(manager.id), [manager.id]);
  const past = useMemo(() => getPastTargets(manager.id, 3), [manager.id]);

  const [form, setForm] = useState<FormState>({ mode: "closed" });
  const [showAllHistory, setShowAllHistory] = useState(false);

  const handleSave = () => {
    // Design-only: would call mutation here. For now just close the form.
    setForm({ mode: "closed" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-[#00695C]" />
            Manage Targets — {manager.name}
          </DialogTitle>
          <DialogDescription>
            Set and review monthly or custom-range targets. The active target drives the
            dashboard&apos;s KPI benchmarks.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 py-2">
            {/* Active */}
            <section className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <span className="inline-block h-2 w-2 rounded-full bg-[#00695C]" />
                  Active target
                </h3>
              </div>

              {active ? (
                <ActiveTargetCard
                  target={active}
                  metrics={metrics}
                  onEdit={() => setForm({ mode: "edit", target: active })}
                />
              ) : (
                <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
                  No active target for this period. Create one below — it&apos;ll start driving
                  the dashboard immediately if today falls inside its range.
                </div>
              )}
            </section>

            {/* Upcoming */}
            {upcoming.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-600" />
                  Upcoming
                </h3>
                <div className="space-y-2">
                  {upcoming.map((t) => (
                    <UpcomingTargetRow
                      key={t.id}
                      target={t}
                      onEdit={() => setForm({ mode: "edit", target: t })}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* Past */}
            {past.length > 0 && (
              <section className="space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-gray-500" />
                    Past (last {past.length})
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAllHistory((v) => !v)}
                    className="text-xs text-[#00695C] hover:underline"
                  >
                    {showAllHistory ? "Show less" : "View all history →"}
                  </button>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
                  {(showAllHistory ? getPastTargets(manager.id) : past).map((t) => (
                    <PastTargetRow key={t.id} target={t} metrics={metrics} />
                  ))}
                </div>
              </section>
            )}

            {/* Set / Edit form */}
            {form.mode !== "closed" ? (
              <SetTargetForm
                existing={form.mode === "edit" ? form.target : null}
                onSave={handleSave}
                onCancel={() => setForm({ mode: "closed" })}
              />
            ) : (
              <Button
                variant="outline"
                className="w-full border-dashed"
                onClick={() => setForm({ mode: "create" })}
              >
                <Plus className="h-4 w-4 mr-2" />
                Set target for new period
              </Button>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Row components
// ---------------------------------------------------------------------------

function ActiveTargetCard({
  target,
  metrics,
  onEdit,
}: {
  target: ManagerTarget;
  metrics: ManagerMetrics;
  onEdit: () => void;
}) {
  const remaining = daysRemaining(target);
  return (
    <div className="rounded-lg border border-[#00695C]/30 bg-[#E0F2F1]/40 p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">{formatPeriodLabel(target)}</p>
          <p className="text-xs text-gray-600 mt-0.5">
            {remaining > 0
              ? `${remaining} day${remaining === 1 ? "" : "s"} remaining`
              : "Ends today"}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5 mr-1.5" />
          Edit
        </Button>
      </div>
      <div className="grid grid-cols-3 gap-3 text-sm">
        <KpiCell
          label="Ass. Pros Recruited"
          actual={metrics.recruitment.newAssociatePros}
          target={target.associateProsRecruited}
        />
        <KpiCell
          label="Selling Ass. Pros"
          actual={metrics.sales.sellingPros}
          target={target.sellingAssociatePros}
        />
        <KpiCell
          label="Performance Score"
          actual={metrics.performance.score}
          target={target.performanceScore}
          decimals={2}
        />
      </div>
    </div>
  );
}

function KpiCell({
  label,
  actual,
  target,
  decimals = 0,
}: {
  label: string;
  actual: number;
  target: number;
  decimals?: number;
}) {
  const pct = hitPct(actual, target);
  return (
    <div className="rounded-md bg-white border border-gray-200 px-3 py-2">
      <p className="text-xs text-gray-500 truncate">{label}</p>
      <p className="text-sm font-semibold text-gray-900 tabular-nums">
        {actual.toFixed(decimals)} <span className="text-gray-400 font-normal">/ {target.toFixed(decimals)}</span>
      </p>
      <p className="text-xs text-gray-500 tabular-nums">{pct}% achieved</p>
    </div>
  );
}

function UpcomingTargetRow({
  target,
  onEdit,
}: {
  target: ManagerTarget;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <Clock className="h-4 w-4 text-blue-600" />
        <div>
          <p className="text-sm font-medium text-gray-900">{formatPeriodLabel(target)}</p>
          <p className="text-xs text-gray-500">
            {target.associateProsRecruited} recruited · {target.sellingAssociatePros} selling ·{" "}
            {target.performanceScore.toFixed(2)} score
          </p>
        </div>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5 mr-1.5" />
          Edit
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-[#AD1F2A] hover:text-[#AD1F2A] hover:bg-red-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

function PastTargetRow({
  target,
  metrics,
}: {
  target: ManagerTarget;
  metrics: ManagerMetrics;
}) {
  // For past targets we don't have period-bounded actuals — design-time only.
  // Show snapshot of target values + "n/a achieved" until backend exposes per-period actuals.
  const recruitedPct = hitPct(metrics.recruitment.newAssociatePros, target.associateProsRecruited);
  const sellingPct = hitPct(metrics.sales.sellingPros, target.sellingAssociatePros);
  const scorePct = hitPct(metrics.performance.score, target.performanceScore);

  const overall = Math.round((recruitedPct + sellingPct + scorePct) / 3);

  return (
    <div className="flex items-center justify-between px-4 py-2.5 text-sm">
      <div className="flex items-center gap-3">
        <span className="text-gray-700 font-medium w-24">{formatPeriodLabel(target)}</span>
        <span className="text-gray-500 text-xs tabular-nums">
          {target.associateProsRecruited} / {target.sellingAssociatePros} /{" "}
          {target.performanceScore.toFixed(1)}
        </span>
      </div>
      <span
        className={cn(
          "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
          overall >= 100
            ? "bg-[#E0F2F1] text-[#00695C]"
            : overall >= 75
              ? "bg-amber-50 text-amber-700"
              : "bg-red-50 text-[#AD1F2A]"
        )}
      >
        {overall}% hit
      </span>
    </div>
  );
}
