"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

import { assetName } from "../schemas/field-staff.schema";
import type { FieldMetricKey } from "../schemas/scorecard.schema";
import type { SubmissionStatus } from "../schemas/submission.schema";
import { useFieldSubmissions } from "../hooks/use-field-submissions";
import { formatDate, formatPeriod, formatQuantity } from "../lib/format";
import { workAmount } from "../lib/payload";
import { SubmissionReviewDialog } from "./SubmissionReviewDialog";
import { SubmissionStatusBadge } from "./SubmissionStatusBadge";

const LIMIT = 100;

const TABS: { key: "verified" | "waiting" | "all"; label: string; status?: SubmissionStatus }[] = [
  { key: "verified", label: "Verified", status: "verified" },
  { key: "waiting", label: "Waiting", status: "submitted" },
  { key: "all", label: "All" },
];

export type SourceRecordsTarget = {
  staffId: string;
  staffName: string;
  /** One site, or undefined for all of the person's sites. */
  assetId?: string;
  siteLabel: string;
  year: number;
  month: number;
  /** One target, or undefined for everything behind the score. */
  metric?: { key: FieldMetricKey; label: string };
};

/**
 * The submissions behind a number on the performance page — filtered by the
 * same person, site, target and month the number was built from. Verified is
 * what the actual counts; Waiting is the pending amount; All adds rejected,
 * withdrawn and reversed work. Each row opens the full review dialog.
 */
export function SourceRecordsSheet({
  target,
  onOpenChange,
}: {
  target: SourceRecordsTarget | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("verified");
  const [reviewing, setReviewing] = useState<string | null>(null);
  const status = TABS.find((t) => t.key === tab)?.status;

  const list = useFieldSubmissions(
    {
      field_staff_id: target?.staffId,
      asset_id: target?.assetId,
      metric_key: target?.metric?.key,
      year: target?.year,
      month: target?.month,
      status,
      limit: LIMIT,
    },
    { enabled: !!target }
  );
  const rows = (list.data?.items ?? []).filter((s) => s.status !== "draft");
  const total = list.data?.meta.total ?? rows.length;

  // A running total only makes sense for one target, in one unit.
  const sum = target?.metric && tab !== "all" ? rows.reduce((n, s) => n + s.quantity, 0) : null;
  const unit = rows[0]?.unit ?? null;

  return (
    <>
    <Sheet
      open={!!target}
      onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) setTab("verified");
      }}
    >
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-lg">
        {target && (
          <>
            <SheetHeader className="border-b p-5 pr-12">
              <SheetTitle>{target.metric ? target.metric.label : "Everything behind the score"}</SheetTitle>
              <SheetDescription>
                {target.staffName} · {target.siteLabel} · {formatPeriod(target.year, target.month)}
              </SheetDescription>
              <div className="mt-2 flex w-fit gap-1 rounded-lg bg-muted p-1" role="tablist">
                {TABS.map((t) => (
                  <button
                    key={t.key}
                    type="button"
                    role="tab"
                    aria-selected={tab === t.key}
                    onClick={() => setTab(t.key)}
                    className={cn(
                      "rounded-md px-3 py-1 text-sm",
                      tab === t.key ? "bg-white font-semibold shadow-sm" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </SheetHeader>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {list.isLoading ? (
                <div className="flex justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : list.error ? (
                <p className="p-5 text-sm text-[#AD1F2A]">{list.error.message}</p>
              ) : rows.length === 0 ? (
                <p className="p-5 text-sm text-muted-foreground">
                  {tab === "verified"
                    ? "No verified work behind this yet."
                    : tab === "waiting"
                      ? "Nothing waiting for review."
                      : "Nothing recorded."}
                </p>
              ) : (
                <ul className="divide-y">
                  {rows.map((sub) => {
                    const amount = workAmount(sub);
                    return (
                      <li key={sub.id}>
                        <button
                          type="button"
                          onClick={() => setReviewing(sub.id)}
                          className="flex w-full items-start justify-between gap-3 px-5 py-3 text-left hover:bg-muted/40"
                        >
                          <div className="min-w-0">
                            <p className="text-sm font-medium">{sub.summary}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(sub.work_date)}
                              {!target.assetId && ` · ${assetName(sub.asset)}`}
                              {!target.metric && ` · ${sub.metric_label}`}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-end gap-1">
                            <SubmissionStatusBadge status={sub.status} />
                            <span className="text-xs tabular-nums text-muted-foreground">
                              {formatQuantity(amount.value, amount.unit)}
                              {!sub.counts_towards_target && " · doesn't score"}
                            </span>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {rows.length > 0 && (
              <div className="border-t bg-muted/30 px-5 py-3 text-sm">
                {sum !== null ? (
                  <p>
                    {tab === "verified" ? "Verified" : "Waiting"} total{" "}
                    <span className="font-semibold tabular-nums">{formatQuantity(sum, unit)}</span>
                    <span className="text-muted-foreground"> from {rows.length} record{rows.length === 1 ? "" : "s"}</span>
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    {rows.length} record{rows.length === 1 ? "" : "s"}
                  </p>
                )}
                {total > rows.length && (
                  <p className="text-xs text-muted-foreground">Showing the latest {rows.length} of {total}.</p>
                )}
              </div>
            )}
          </>
        )}
      </SheetContent>
    </Sheet>
    <SubmissionReviewDialog submissionId={reviewing} onOpenChange={(open) => !open && setReviewing(null)} />
    </>
  );
}
