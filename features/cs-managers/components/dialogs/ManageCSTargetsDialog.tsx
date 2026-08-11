"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Pencil,
  Target,
  CalendarDays,
  Clock,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SetCSManagerTargetForm } from "./SetCSManagerTargetForm";
import { useCSManagerTargets } from "../../hooks/use-cs-manager-targets";
import type { CsManagerTargetType } from "@/lib/gql/graphql";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  managerId: string | null;
  managerName: string;
}

type FormState =
  | { mode: "closed" }
  | { mode: "create" }
  | { mode: "edit"; target: CsManagerTargetType };

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const formatPeriodLabel = (t: CsManagerTargetType) =>
  `${MONTHS[t.month - 1]} ${t.year}`;

const daysRemainingThisMonth = () => {
  const now = new Date();
  const endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );
  const ms = endOfMonth.getTime() - now.getTime();
  return Math.max(0, Math.ceil(ms / (1000 * 60 * 60 * 24)));
};

type Bucket = "active" | "upcoming" | "past";

const bucketOf = (t: CsManagerTargetType): Bucket => {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  if (t.year === currentYear && t.month === currentMonth) return "active";
  if (t.year > currentYear || (t.year === currentYear && t.month > currentMonth))
    return "upcoming";
  return "past";
};

export function ManageCSTargetsDialog({
  open,
  onOpenChange,
  managerId,
  managerName,
}: Props) {
  const { data: targets, isLoading } = useCSManagerTargets(managerId);
  const [form, setForm] = useState<FormState>({ mode: "closed" });
  const [showAllHistory, setShowAllHistory] = useState(false);

  const { active, upcoming, past } = useMemo(() => {
    const all = targets ?? [];
    return {
      active: all.find((t) => bucketOf(t) === "active") ?? null,
      upcoming: all
        .filter((t) => bucketOf(t) === "upcoming")
        .sort((a, b) => a.year - b.year || a.month - b.month),
      past: all
        .filter((t) => bucketOf(t) === "past")
        .sort((a, b) => b.year - a.year || b.month - a.month),
    };
  }, [targets]);

  const handleSaved = () => setForm({ mode: "closed" });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-[#00695C]" />
            Manage Targets — {managerName}
          </DialogTitle>
          <DialogDescription>
            Set and review monthly targets for allocated, onboarded, and
            deeds delivered. The current month&apos;s target drives the
            dashboard&apos;s KPI benchmarks.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-6 py-2">
            {isLoading ? (
              <div className="flex items-center justify-center py-10 text-sm text-gray-500">
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Loading targets...
              </div>
            ) : (
              <>
                <section className="space-y-2">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <span className="inline-block h-2 w-2 rounded-full bg-[#00695C]" />
                    Active target
                  </h3>
                  {active ? (
                    <ActiveTargetCard
                      target={active}
                      onEdit={() => setForm({ mode: "edit", target: active })}
                    />
                  ) : (
                    <div className="rounded-lg border border-dashed border-amber-300 bg-amber-50 p-4 text-sm text-amber-800">
                      No target set for the current month. Create one below —
                      it&apos;ll start driving the dashboard immediately.
                    </div>
                  )}
                </section>

                {upcoming.length > 0 && (
                  <section className="space-y-2">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      Upcoming
                    </h3>
                    <div className="space-y-2">
                      {upcoming.map((t) => (
                        <UpcomingTargetRow
                          key={t._id}
                          target={t}
                          onEdit={() => setForm({ mode: "edit", target: t })}
                        />
                      ))}
                    </div>
                  </section>
                )}

                {past.length > 0 && (
                  <section className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-gray-500" />
                        Past (last {Math.min(past.length, 3)})
                      </h3>
                      {past.length > 3 && (
                        <button
                          type="button"
                          onClick={() => setShowAllHistory((v) => !v)}
                          className="text-xs text-[#00695C] hover:underline"
                        >
                          {showAllHistory
                            ? "Show less"
                            : `View all ${past.length} →`}
                        </button>
                      )}
                    </div>
                    <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
                      {(showAllHistory ? past : past.slice(0, 3)).map((t) => (
                        <PastTargetRow key={t._id} target={t} />
                      ))}
                    </div>
                  </section>
                )}

                {form.mode !== "closed" ? (
                  <SetCSManagerTargetForm
                    managerId={managerId}
                    existing={form.mode === "edit" ? form.target : null}
                    onSaved={handleSaved}
                    onCancel={() => setForm({ mode: "closed" })}
                  />
                ) : (
                  <Button
                    variant="outline"
                    className="w-full border-dashed"
                    onClick={() => setForm({ mode: "create" })}
                    disabled={!managerId}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Set target for new month
                  </Button>
                )}
              </>
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
  onEdit,
}: {
  target: CsManagerTargetType;
  onEdit: () => void;
}) {
  const remaining = daysRemainingThisMonth();
  return (
    <div className="rounded-lg border border-[#00695C]/30 bg-[#E0F2F1]/40 p-4">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <p className="text-sm font-semibold text-gray-900">
            {formatPeriodLabel(target)}
          </p>
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <TargetCell
          label="Customers Allocated"
          value={target.customers_allocated_target}
        />
        <TargetCell
          label="Customers Onboarded"
          value={target.customers_onboarded_target}
        />
        <TargetCell
          label="Deeds Delivered"
          value={target.deeds_delivered_target}
        />
        <TargetCell
          label="Peer Rating"
          value={target.performance_score_target}
        />
      </div>
    </div>
  );
}

function TargetCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-white border border-gray-200 px-3 py-2">
      <p className="text-xs text-gray-500 truncate">{label}</p>
      <p className="text-sm font-semibold text-gray-900 tabular-nums">
        {value.toLocaleString()}
      </p>
    </div>
  );
}

function UpcomingTargetRow({
  target,
  onEdit,
}: {
  target: CsManagerTargetType;
  onEdit: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <Clock className="h-4 w-4 text-blue-600" />
        <div>
          <p className="text-sm font-medium text-gray-900">
            {formatPeriodLabel(target)}
          </p>
          <p className="text-xs text-gray-500">
            {target.customers_allocated_target} allocated ·{" "}
            {target.customers_onboarded_target} onboarded ·{" "}
            {target.deeds_delivered_target} deeds
          </p>
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={onEdit}>
        <Pencil className="h-3.5 w-3.5 mr-1.5" />
        Edit
      </Button>
      {/* Delete is hidden until BE exposes a deleteCSManagerTarget mutation. */}
    </div>
  );
}

function PastTargetRow({ target }: { target: CsManagerTargetType }) {
  // Per-period historical actuals aren't exposed by BE yet — target only.
  return (
    <div className="flex items-center justify-between px-4 py-2.5 text-sm">
      <div className="flex items-center gap-3">
        <span className="text-gray-700 font-medium w-24">
          {formatPeriodLabel(target)}
        </span>
        <span className="text-gray-500 text-xs tabular-nums">
          {target.customers_allocated_target} /{" "}
          {target.customers_onboarded_target} /{" "}
          {target.deeds_delivered_target}
        </span>
      </div>
      <span className="text-xs text-gray-400">target</span>
    </div>
  );
}
