"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Download } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AdminDesktopTableWrap,
  AdminMobileCard,
  AdminMobileField,
  AdminMobileStack,
} from "@/components/shared/admin-responsive-table";
import { cn } from "@/lib/utils";

import { DUMMY_COURSES } from "../../../dummy-data";
import { credentialStateLabel, deriveCredentialState, formatDate, formatDaysAgo } from "../../../credential-state";
import { getLearnerStatsForCourse, getLearnersForCourse, type CourseLearner } from "../../../dummy-learners";

/** The row-level status the "Status" column and chips key off — a blend of credential.state (derived) and engagement (stored). */
type RowStatus = "certified" | "expiring" | "expired" | "in_progress" | "stalled";

function rowStatus(learner: CourseLearner): RowStatus {
  const credState = deriveCredentialState(learner.earnedAt, learner.expiresAt, learner.revokedAt);
  if (credState === "active") return "certified";
  if (credState === "expiring") return "expiring";
  if (credState === "expired" || credState === "revoked") return "expired";
  return learner.engagement === "stalled" ? "stalled" : "in_progress";
}

function rowStatusLabel(learner: CourseLearner): string {
  const credState = deriveCredentialState(learner.earnedAt, learner.expiresAt, learner.revokedAt);
  const status = rowStatus(learner);
  if (status === "certified" || status === "expiring" || status === "expired") {
    return credentialStateLabel(credState, learner.expiresAt);
  }
  return status === "stalled" ? `Stalled ${learner.lastActiveDaysAgo} days` : "In progress";
}

const STATUS_CLASSES: Record<RowStatus, string> = {
  certified: "border-emerald-300 bg-emerald-50 text-emerald-700",
  expiring: "border-amber-300 bg-amber-50 text-amber-700",
  in_progress: "border-sky-300 bg-sky-50 text-sky-700",
  stalled: "border-border bg-muted text-muted-foreground",
  expired: "border-red-300 bg-red-50 text-red-700",
};

function StatusBadge({ learner }: { learner: CourseLearner }) {
  const status = rowStatus(learner);
  return (
    <Badge variant="outline" className={STATUS_CLASSES[status]}>
      {rowStatusLabel(learner)}
    </Badge>
  );
}

function ModulesProgress({ learner }: { learner: CourseLearner }) {
  const pct = learner.modulesTotal > 0 ? (learner.modulesCompleted / learner.modulesTotal) * 100 : 0;
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", pct >= 100 ? "bg-emerald-600" : "bg-foreground/60")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
        {learner.modulesCompleted}/{learner.modulesTotal}
      </span>
    </div>
  );
}

function downloadCsv(rows: CourseLearner[], courseTitle: string) {
  const header = ["Associate", "Modules completed", "Modules total", "Quiz score", "Status", "Last active", "Earned", "Expires"];
  const lines = rows.map((r) =>
    [
      r.name,
      r.modulesCompleted,
      r.modulesTotal,
      r.quizScorePct ?? "",
      rowStatusLabel(r),
      formatDaysAgo(r.lastActiveDaysAgo),
      formatDate(r.earnedAt),
      formatDate(r.expiresAt),
    ]
      .map((value) => `"${String(value).replace(/"/g, '""')}"`)
      .join(",")
  );
  const csv = [header.join(","), ...lines].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${courseTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-learners.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

const CHIPS: { key: string; label: string; filter: (l: CourseLearner) => boolean }[] = [
  { key: "all", label: "All", filter: () => true },
  { key: "certified", label: "Completed", filter: (l) => rowStatus(l) === "certified" },
  { key: "in_progress", label: "In progress", filter: (l) => rowStatus(l) === "in_progress" },
  { key: "expiring", label: "Expiring", filter: (l) => rowStatus(l) === "expiring" },
  { key: "expired", label: "Expired", filter: (l) => rowStatus(l) === "expired" },
];

/** Design preview — read-only rows/stats from dummy-learners.ts, filtered client-side. Status is derived at render time, never stored. Export is real (client-side CSV). */
export function CourseLearners() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const course = DUMMY_COURSES.find((c) => c.id === params.id) ?? DUMMY_COURSES[0];

  const allLearners = getLearnersForCourse(course.id, course.learners_count, course.completed_count, course.modules_count);
  const stats = getLearnerStatsForCourse(course.id, course.learners_count, course.completed_count);

  const activeChipKey = searchParams.get("filter") ?? "all";
  const activeChip = CHIPS.find((c) => c.key === activeChipKey) ?? CHIPS[0];
  const rows = allLearners.filter(activeChip.filter);

  const applyChip = (key: string) => {
    const nextParams = new URLSearchParams(searchParams.toString());
    if (key === "all") nextParams.delete("filter");
    else nextParams.set("filter", key);
    router.replace(`?${nextParams.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-4">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">Learners</h2>
          <p className="text-sm text-muted-foreground">
            {stats.started} learner{stats.started === 1 ? "" : "s"}
            {stats.expiringIn30Days > 0
              ? ` · ${stats.expiringIn30Days} credential${stats.expiringIn30Days === 1 ? "" : "s"} lapse within thirty days`
              : ""}
          </p>
        </div>
        <Button variant="outline" className="w-full sm:w-auto" onClick={() => downloadCsv(rows, course.title)}>
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border p-4 sm:grid-cols-5">
        {[
          { label: "Started", value: stats.started },
          { label: "Completed", value: stats.completed },
          { label: "In progress", value: stats.inProgress },
          { label: "Expiring in 30 days", value: stats.expiringIn30Days, accent: "text-amber-600" },
          { label: "Expired", value: stats.expired, accent: "text-red-600" },
        ].map((stat) => (
          <div key={stat.label} className="space-y-0.5">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className={cn("text-xl font-semibold tabular-nums", stat.accent)}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {CHIPS.map((chip) => (
          <button
            key={chip.key}
            type="button"
            onClick={() => applyChip(chip.key)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm",
              activeChipKey === chip.key
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-background text-foreground hover:bg-muted"
            )}
          >
            {chip.label}
            <span className={cn("ml-1.5 tabular-nums", activeChipKey === chip.key ? "opacity-70" : "text-muted-foreground")}>
              {allLearners.filter(chip.filter).length}
            </span>
          </button>
        ))}
      </div>

      {rows.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          No learners match this filter.
        </div>
      ) : (
        <>
          <AdminDesktopTableWrap>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Associate</TableHead>
                  <TableHead>Modules</TableHead>
                  <TableHead>Quiz</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last active</TableHead>
                  <TableHead>Earned</TableHead>
                  <TableHead>Expires</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((learner) => (
                  <TableRow key={learner.id}>
                    <TableCell>
                      <p className="font-medium">{learner.name}</p>
                      <p className="text-xs text-muted-foreground">{learner.meta}</p>
                    </TableCell>
                    <TableCell>
                      <ModulesProgress learner={learner} />
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {learner.quizScorePct !== null ? `${learner.quizScorePct}%` : "—"}
                    </TableCell>
                    <TableCell>
                      <StatusBadge learner={learner} />
                    </TableCell>
                    <TableCell className="tabular-nums">{formatDaysAgo(learner.lastActiveDaysAgo)}</TableCell>
                    <TableCell className="tabular-nums">{formatDate(learner.earnedAt)}</TableCell>
                    <TableCell className="tabular-nums">{formatDate(learner.expiresAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AdminDesktopTableWrap>

          <AdminMobileStack>
            {rows.map((learner) => (
              <AdminMobileCard
                key={learner.id}
                title={learner.name}
                subtitle={<StatusBadge learner={learner} />}
              >
                <AdminMobileField label="Modules" value={<ModulesProgress learner={learner} />} />
                <AdminMobileField label="Quiz" value={learner.quizScorePct !== null ? `${learner.quizScorePct}%` : "—"} />
                <AdminMobileField label="Last active" value={formatDaysAgo(learner.lastActiveDaysAgo)} />
                <AdminMobileField label="Earned" value={formatDate(learner.earnedAt)} />
                <AdminMobileField label="Expires" value={formatDate(learner.expiresAt)} />
              </AdminMobileCard>
            ))}
          </AdminMobileStack>
        </>
      )}
    </div>
  );
}
