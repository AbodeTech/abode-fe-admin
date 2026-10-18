"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Download } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

import { useCourseList } from "../../hooks/use-course-list";
import { DEFAULT_LEARNERS_LIMIT, useAllLearners, useAllLearnersExport } from "../../hooks/use-learners";
import { formatDate } from "../../credential-state";
import { downloadCsv } from "../../lib/csv";
import type { GlobalEnrolmentRow } from "../../schemas/learner.schema";

function tierLabel(tier: string | null): string {
  if (!tier) return "—";
  return USER_TIER_LABELS[tier as UserTier] ?? tier;
}

function ProgressBar({ progress }: { progress: GlobalEnrolmentRow["progress"] }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", progress.complete ? "bg-emerald-600" : "bg-foreground/60")}
          style={{ width: `${progress.percent}%` }}
        />
      </div>
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
        {progress.completed_modules}/{progress.total_modules}
      </span>
    </div>
  );
}

function QuizCell({ attempts }: { attempts: GlobalEnrolmentRow["attempts"] }) {
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

function exportRows(rows: GlobalEnrolmentRow[]) {
  return rows.map((r) => ({
    name: r.learner.name ?? "",
    email: r.learner.email ?? "",
    tier: tierLabel(r.learner.tier),
    course: r.course_title ?? "",
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
 * `GET /admin/learners` — every enrolment across every course, one row per
 * enrolment (an associate taking three courses is three rows, not one). No
 * credential/certification data or per-associate rollup: the BE doesn't
 * shape either yet — see docs/COURSE-LEARNERS-BACKEND-GAPS.md.
 */
export function GlobalLearners() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page")) || 1;
  const courseId = searchParams.get("course") ?? undefined;

  const { data: courseOptions } = useCourseList({ limit: 100 });
  const { data, isLoading, isError, error } = useAllLearners({
    page,
    limit: DEFAULT_LEARNERS_LIMIT,
    course_id: courseId,
  });
  const exportLearners = useAllLearnersExport();

  const rows = data?.items ?? [];
  const total = data?.meta.total ?? 0;

  const applyCourseFilter = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") params.delete("course");
    else params.set("course", value);
    params.delete("page");
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const handleExport = () => {
    exportLearners.mutate(
      { course_id: courseId },
      {
        onSuccess: ({ rows: exportedRows, truncated }) => {
          if (!exportedRows.length) {
            toast.info("No enrolments to export");
            return;
          }
          downloadCsv(exportRows(exportedRows), "learners.csv");
          if (truncated) toast.warning("Capped at 1,000 rows — narrow the course filter to get everything.");
          else toast.success("Export ready");
        },
        onError: (err) => toast.error(err.message || "Failed to export"),
      }
    );
  };

  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1400px] space-y-4 px-3 pb-16 sm:px-4 sm:pb-20">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">Learners</h1>
          <p className="text-muted-foreground">
            {total} enrolment{total === 1 ? "" : "s"} across every course
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:shrink-0">
          <Select value={courseId ?? "all"} onValueChange={applyCourseFilter}>
            <SelectTrigger className="h-10 w-full sm:h-9 sm:w-56">
              <SelectValue placeholder="All courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All courses</SelectItem>
              {(courseOptions?.items ?? []).map((course) => (
                <SelectItem key={course.id} value={course.id}>
                  {course.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            className="w-full sm:w-auto"
            onClick={handleExport}
            disabled={exportLearners.isPending}
          >
            <Download className="mr-2 h-4 w-4" />
            {exportLearners.isPending ? "Exporting…" : "Export CSV"}
          </Button>
        </div>
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
          No enrolments match this filter.
        </div>
      ) : (
        <>
          <AdminDesktopTableWrap>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Associate</TableHead>
                  <TableHead>Course</TableHead>
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
                    <TableCell>{row.course_title ?? "—"}</TableCell>
                    <TableCell>{tierLabel(row.learner.tier)}</TableCell>
                    <TableCell>
                      <ProgressBar progress={row.progress} />
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
              <AdminMobileCard key={row.enrolment_id} title={row.learner.name ?? "—"} subtitle={row.course_title ?? "—"}>
                <AdminMobileField label="Tier" value={tierLabel(row.learner.tier)} />
                <AdminMobileField label="Modules" value={<ProgressBar progress={row.progress} />} />
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
