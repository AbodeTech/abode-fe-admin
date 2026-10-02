"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAdminPermissions } from "@/hooks/use-admin-permission";
import { cn } from "@/lib/utils";
import { formatNairaCompact } from "@/lib/utils/format";

import { useFieldSubmissions } from "../../hooks/use-field-operations";
import type { SubmissionStatus } from "../../schemas/field-operations.schema";
import { DetailPanel } from "./DetailPanel";
import { FieldSubmissionSheet, SubmissionStatusPill } from "./FieldSubmissionSheet";

const LIMIT = 10;

/** The review queue first; drafts and withdrawn work are the worker's own business and sit under All. */
const FILTERS: { value: SubmissionStatus | "all"; label: string }[] = [
  { value: "submitted", label: "Awaiting review" },
  { value: "verified", label: "Verified" },
  { value: "rejected", label: "Rejected" },
  { value: "reversed", label: "Reversed" },
  { value: "all", label: "All" },
];

const HEAD =
  "whitespace-nowrap border-b px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground";
const CELL = "px-3 py-2.5 align-top";

const day = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "—";

/**
 * Field work recorded on this estate, and the place it is reviewed. Workers
 * record fencing, clearing, pegging and boundary work in their own app;
 * nothing counts until an admin verifies it here.
 */
export function FieldSubmissionsPanel({ assetId }: { assetId: string }) {
  const permissions = useAdminPermissions();
  const canView = permissions.has("view_field_submissions");
  const canVerify = permissions.has("verify_field_submissions");

  const [status, setStatus] = useState<SubmissionStatus | "all">("submitted");
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<string | null>(null);

  const { data, isLoading, error } = useFieldSubmissions(
    assetId,
    { status: status === "all" ? undefined : status, page, limit: LIMIT },
    { enabled: canView }
  );

  const rows = data?.items ?? [];
  const total = data?.meta.total ?? rows.length;
  const totalPages = data?.meta.totalPages ?? 1;

  return (
    <DetailPanel title="Field work" description="Recorded by field workers. Only verified work counts." flush>
      {!canView ? (
        <p className="p-4 text-sm text-muted-foreground">
          Reviewing field work needs the view_field_submissions permission.
        </p>
      ) : (
        <>
          <div className="flex flex-wrap gap-2 border-b px-4 py-3">
            {FILTERS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={status === option.value}
                onClick={() => {
                  setStatus(option.value);
                  setPage(1);
                }}
                className={cn(
                  "rounded-full border px-3 py-1 text-xs",
                  status === option.value ? "border-foreground bg-foreground text-background" : "bg-background hover:bg-muted"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          {error ? (
            <p className="p-4 text-sm text-rose-600">Couldn&apos;t load field work: {error.message}</p>
          ) : isLoading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-9 w-full" />
            </div>
          ) : rows.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              {status === "submitted" ? "Nothing is waiting for review." : "No field work here."}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="bg-muted/40">
                    <th className={HEAD}>Work date</th>
                    <th className={HEAD}>Work</th>
                    <th className={HEAD}>Worker</th>
                    <th className={cn(HEAD, "text-right")}>Spent</th>
                    <th className={HEAD}>Status</th>
                    <th className={HEAD} />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.id} className="border-b last:border-b-0 hover:bg-muted/40">
                      <td className={cn(CELL, "whitespace-nowrap")}>{day(row.work_date)}</td>
                      <td className={CELL}>
                        <span className="font-semibold">{row.summary}</span>
                        <span className="block text-[10px] text-muted-foreground">
                          {row.metric_label}
                          {row.counts_towards_target ? "" : " · not counted towards the target"}
                          {row.revision > 1 ? ` · revision ${row.revision}` : ""}
                        </span>
                      </td>
                      <td className={CELL}>{row.field_staff?.full_name ?? row.field_staff?.email ?? "—"}</td>
                      <td className={cn(CELL, "whitespace-nowrap text-right tabular-nums")}>
                        {row.amount_spent == null ? "—" : formatNairaCompact(row.amount_spent)}
                      </td>
                      <td className={CELL}>
                        <SubmissionStatusPill status={row.status} />
                      </td>
                      <td className={cn(CELL, "text-right")}>
                        <Button type="button" variant="outline" size="sm" onClick={() => setOpenId(row.id)}>
                          {canVerify && row.status === "submitted" ? "Review" : "View"}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 ? (
            <div className="flex items-center justify-between gap-3 border-t px-4 py-2.5 text-xs text-muted-foreground">
              <span>
                Page {page} of {totalPages} · {total} in all
              </span>
              <span className="flex gap-2">
                <Button type="button" variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  Previous
                </Button>
                <Button type="button" variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                  Next
                </Button>
              </span>
            </div>
          ) : null}

          <FieldSubmissionSheet
            assetId={assetId}
            submissionId={openId}
            canVerify={canVerify}
            onOpenChange={(open) => {
              if (!open) setOpenId(null);
            }}
          />
        </>
      )}
    </DetailPanel>
  );
}
