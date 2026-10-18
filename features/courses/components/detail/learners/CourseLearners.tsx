"use client";

import { useParams, useSearchParams } from "next/navigation";
import { Download, Users } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { Pagination } from "@/components/shared/Pagination";
import { cn } from "@/lib/utils";
import { USER_TIER_LABELS, type UserTier } from "@/features/upgrades/schemas/upgrade.schema";

import { useCourseDetail } from "../../../hooks/use-course-detail";
import {
  DEFAULT_LEARNERS_LIMIT,
  useCourseLearners,
  useCourseLearnersExport,
} from "../../../hooks/use-learners";
import { formatDate } from "../../../credential-state";
import { downloadCsv } from "../../../lib/csv";
import type { EnrolmentRow } from "../../../schemas/learner.schema";

function tierLabel(tier: string | null): string {
  if (!tier) return "—";
  return USER_TIER_LABELS[tier as UserTier] ?? tier;
}

function ModulesProgress({ progress }: { progress: EnrolmentRow["progress"] }) {
  if (progress.total_modules === 0) {
    return <span className="text-xs text-muted-foreground">No modules yet</span>;
  }

  const pct = progress.percent;
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", progress.complete ? "bg-emerald-600" : "bg-foreground/60")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
        {progress.completed_modules}/{progress.total_modules}
      </span>
    </div>
  );
}

function QuizCell({ attempts }: { attempts: EnrolmentRow["attempts"] }) {
  if (attempts.total === 0) return <span className="text-muted-foreground">—</span>;
  return (
    <div>
      <p className="tabular-nums">{attempts.best_score_pct !== null ? `${attempts.best_score_pct}%` : "—"}</p>
      <p className="text-xs text-muted-foreground">
        {attempts.total} attempt{attempts.total === 1 ? "" : "s"}
        {attempts.failed > 0 ? ` · ${attempts.failed} failed` : ""}
      </p>
    </div>
  );
}

function exportRows(rows: EnrolmentRow[]) {
  return rows.map((r) => ({
    name: r.learner.name ?? "",
    email: r.learner.email ?? "",
    tier: tierLabel(r.learner.tier),
    started_at: r.started_at,
    completed_at: r.completed_at ?? "",
    modules_completed: r.progress.completed_modules,
    modules_total: r.progress.total_modules,
    progress_pct: r.progress.percent,
    quiz_best_score_pct: r.attempts.best_score_pct ?? "",
    quiz_attempts: r.attempts.total,
    quiz_passed: r.attempts.passed ? "yes" : "no",
  }));
}

/**
 * `GET /admin/courses/:id/learners` — one row per enrolment on this course.
 * No credential/certification data: the BE row doesn't carry it yet (see
 * docs/COURSE-LEARNERS-BACKEND-GAPS.md).
 */
export function CourseLearners() {
  const params = useParams<{ id: string }>();
  const courseId = params.id;
  const searchParams = useSearchParams();
  const page = Number(searchParams.get("page")) || 1;

  const { data: course } = useCourseDetail(courseId);
  const { data, isLoading, isError, error } = useCourseLearners(courseId, {
    page,
    limit: DEFAULT_LEARNERS_LIMIT,
  });
  const exportLearners = useCourseLearnersExport();

  const rows = data?.items ?? [];
  const total = data?.meta.total ?? 0;

  const handleExport = () => {
    exportLearners.mutate(courseId, {
      onSuccess: ({ rows: exportedRows, truncated }) => {
        if (!exportedRows.length) {
          toast.info("No learners to export");
          return;
        }
        downloadCsv(
          exportRows(exportedRows),
          `${(course?.title ?? "course").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-learners.csv`
        );
        if (truncated) toast.warning("Capped at 1,000 rows — export narrower pages to get everything.");
        else toast.success("Export ready");
      },
      onError: (err) => toast.error(err.message || "Failed to export"),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">Learners</h2>
          <p className="text-sm text-muted-foreground">
            {total} learner{total === 1 ? "" : "s"} enrolled
          </p>
        </div>
        <Button
          variant="outline"
          className="w-full sm:w-auto"
          onClick={handleExport}
          disabled={exportLearners.isPending}
        >
          <Download className="mr-2 h-4 w-4" />
          {exportLearners.isPending ? "Exporting…" : "Export CSV"}
        </Button>
      </div>

      {/*
        Only "Enrolled" is shown — it's the one real number here (this
        page's meta.total). A completed/in-progress breakdown would need
        either a BE aggregate or summing completed_at across every page
        client-side; the course record itself carries no such counts (see
        docs/COURSE-LEARNERS-BACKEND-GAPS.md). Still uses the app's usual
        stat-card grid (see WithdrawalStatCards) rather than a standalone box,
        even with just one card, for consistent spacing with every other
        stats-above-a-table screen.
      */}
      <div className="grid min-w-0 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="min-w-0 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Enrolled</CardTitle>
            <Users className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold tabular-nums">{total}</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-12 w-full" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-destructive">
          {error?.message || "Couldn't load learners."}
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
          No one has enrolled in this course yet.
        </div>
      ) : (
        <>
          <AdminDesktopTableWrap>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Associate</TableHead>
                  <TableHead>Tier</TableHead>
                  <TableHead>Modules</TableHead>
                  <TableHead>Quiz</TableHead>
                  <TableHead>Started</TableHead>
                  <TableHead>Completed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.enrolment_id}>
                    <TableCell>
                      <p className="font-medium">{row.learner.name ?? "—"}</p>
                      <p className="text-xs text-muted-foreground">{row.learner.email ?? "—"}</p>
                    </TableCell>
                    <TableCell>{tierLabel(row.learner.tier)}</TableCell>
                    <TableCell>
                      <ModulesProgress progress={row.progress} />
                    </TableCell>
                    <TableCell>
                      <QuizCell attempts={row.attempts} />
                    </TableCell>
                    <TableCell className="tabular-nums">{formatDate(row.started_at)}</TableCell>
                    <TableCell className="tabular-nums">{formatDate(row.completed_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </AdminDesktopTableWrap>

          <AdminMobileStack>
            {rows.map((row) => (
              <AdminMobileCard key={row.enrolment_id} title={row.learner.name ?? "—"} subtitle={row.learner.email ?? "—"}>
                <AdminMobileField label="Tier" value={tierLabel(row.learner.tier)} />
                <AdminMobileField label="Modules" value={<ModulesProgress progress={row.progress} />} />
                <AdminMobileField label="Quiz" value={<QuizCell attempts={row.attempts} />} />
                <AdminMobileField label="Started" value={formatDate(row.started_at)} />
                <AdminMobileField label="Completed" value={formatDate(row.completed_at)} />
              </AdminMobileCard>
            ))}
          </AdminMobileStack>

          <Pagination count={total} currentIdx={page} limit={DEFAULT_LEARNERS_LIMIT} />
        </>
      )}
    </div>
  );
}
