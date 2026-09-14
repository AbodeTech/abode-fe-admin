"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Download } from "lucide-react";
import { toast } from "sonner";

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

import { credentialStateLabel, deriveCredentialState, formatDate, formatDaysAgo, type CredentialState } from "../../credential-state";
import {
  GLOBAL_LEARNERS,
  GLOBAL_LEARNER_CHIP_COUNTS,
  GLOBAL_LEARNER_STATS,
  type FirstSalePathProgress,
  type GlobalLearner,
} from "../../dummy-global-learners";

/** Which chip a row falls under — derived from credential.state plus activity, not stored (see dummy-global-learners.ts's header). */
type Segment = "certified" | "lapsing" | "stalled" | "active" | "never_started";

function deriveSegment(learner: GlobalLearner): Segment {
  const credState = deriveCredentialState(learner.earnedAt, learner.expiresAt, learner.revokedAt);
  if (credState === "active") return "certified";
  if (credState === "expiring") return "lapsing";
  if (credState === "expired" || credState === "revoked") return "stalled";

  const hasAnyProgress =
    learner.firstSalePath.state !== "not_started" ||
    learner.coursesDone.completed > 0 ||
    learner.certification.completed > 0;
  if (!hasAnyProgress) return "never_started";
  return learner.lastActiveDaysAgo >= 14 ? "stalled" : "active";
}

const CREDENTIAL_CLASSES: Record<CredentialState, string> = {
  active: "border-emerald-300 bg-emerald-50 text-emerald-700",
  expiring: "border-amber-300 bg-amber-50 text-amber-700",
  expired: "border-red-300 bg-red-50 text-red-700",
  revoked: "border-red-300 bg-red-50 text-red-700",
  none: "border-border bg-muted text-muted-foreground",
};

function CredentialBadge({ learner }: { learner: GlobalLearner }) {
  const state = deriveCredentialState(learner.earnedAt, learner.expiresAt, learner.revokedAt);
  return (
    <Badge variant="outline" className={CREDENTIAL_CLASSES[state]}>
      {credentialStateLabel(state, learner.expiresAt)}
    </Badge>
  );
}

function ProgressBar({ completed, total, complete }: { completed: number; total: number; complete: boolean }) {
  const pct = total > 0 ? (completed / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", complete ? "bg-emerald-600" : "bg-foreground/60")}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
        {completed}/{total}
      </span>
    </div>
  );
}

function FirstSalePathCell({ progress }: { progress: FirstSalePathProgress }) {
  if (progress.state === "done") return <Badge>Done</Badge>;
  if (progress.state === "not_started") return <Badge variant="secondary">Not started</Badge>;
  return <ProgressBar completed={progress.completed} total={progress.total} complete={false} />;
}

const CHIPS: { key: string; label: string; filter: (l: GlobalLearner) => boolean }[] = [
  { key: "all", label: "All", filter: () => true },
  { key: "certified", label: "Certified", filter: (l) => deriveSegment(l) === "certified" },
  { key: "lapsing", label: "Lapsing", filter: (l) => deriveSegment(l) === "lapsing" },
  { key: "stalled", label: "Stalled", filter: (l) => deriveSegment(l) === "stalled" },
  { key: "never_started", label: "Never started", filter: (l) => deriveSegment(l) === "never_started" },
];

function chipCount(key: string): number {
  return GLOBAL_LEARNER_CHIP_COUNTS[key as keyof typeof GLOBAL_LEARNER_CHIP_COUNTS] ?? 0;
}

/**
 * Design preview — reads GLOBAL_LEARNERS directly. Only 7 of the 141
 * associates the stats cite are modelled; see dummy-global-learners.ts's
 * header for why. Credential state and chip segment are both derived at
 * render time from raw dates, never stored. "Filter by course" isn't wired
 * up (per-course granularity for all 141 people isn't modelled here) — it's
 * shown but inert, same treatment as the other not-yet-real actions across
 * this feature.
 */
export function GlobalLearners() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeKey = searchParams.get("filter") ?? "all";
  const activeChip = CHIPS.find((c) => c.key === activeKey) ?? CHIPS[0];
  const rows = GLOBAL_LEARNERS.filter(activeChip.filter);

  const applyChip = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (key === "all") params.delete("filter");
    else params.set("filter", key);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1400px] space-y-4 px-3 pb-16 sm:px-4 sm:pb-20">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">Learners</h1>
          <p className="text-muted-foreground">
            {GLOBAL_LEARNER_STATS.associates} associates. {GLOBAL_LEARNER_STATS.lapsingIn30Days} credentials
            lapse within thirty days.
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:shrink-0">
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => toast("Filtering by course isn't wired up yet")}>
            Filter by course
          </Button>
          <Button
            className="w-full sm:w-auto"
            onClick={() => {
              const header = ["Associate", "First sale path", "Courses done", "Certification", "Credential", "Expires", "Last active"];
              const lines = rows.map((r) => {
                const credState = deriveCredentialState(r.earnedAt, r.expiresAt, r.revokedAt);
                return [
                  r.name,
                  r.firstSalePath.state === "done" ? "Done" : r.firstSalePath.state === "not_started" ? "Not started" : `${r.firstSalePath.completed}/${r.firstSalePath.total}`,
                  `${r.coursesDone.completed} of ${r.coursesDone.total}`,
                  `${r.certification.completed}/${r.certification.total}`,
                  credentialStateLabel(credState, r.expiresAt),
                  formatDate(r.expiresAt),
                  formatDaysAgo(r.lastActiveDaysAgo),
                ]
                  .map((v) => `"${String(v).replace(/"/g, '""')}"`)
                  .join(",");
              });
              const csv = [header.join(","), ...lines].join("\n");
              const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = "learners.csv";
              link.click();
              URL.revokeObjectURL(url);
            }}
          >
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border p-4 sm:grid-cols-5">
        {[
          { label: "Associates", value: GLOBAL_LEARNER_STATS.associates },
          { label: "Started something", value: GLOBAL_LEARNER_STATS.startedSomething },
          { label: "Certified", value: GLOBAL_LEARNER_STATS.certified },
          { label: "Lapsing in 30 days", value: GLOBAL_LEARNER_STATS.lapsingIn30Days, accent: "text-amber-600" },
          { label: "Never opened a course", value: GLOBAL_LEARNER_STATS.neverOpenedCourse },
        ].map((stat) => (
          <div key={stat.label} className="space-y-0.5">
            <p className="text-xs text-muted-foreground">{stat.label}</p>
            <p className={cn("text-xl font-semibold tabular-nums", stat.accent)}>{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          {CHIPS.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => applyChip(chip.key)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm",
                activeKey === chip.key
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-foreground hover:bg-muted"
              )}
            >
              {chip.label}
              <span className={cn("ml-1.5 tabular-nums", activeKey === chip.key ? "opacity-70" : "text-muted-foreground")}>
                {chipCount(chip.key)}
              </span>
            </button>
          ))}
        </div>

        {rows.length === 0 ? (
          <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
            No one in this sample matches that filter — the full roster of {GLOBAL_LEARNER_STATS.associates} would.
          </div>
        ) : (
          <>
            <AdminDesktopTableWrap>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Associate</TableHead>
                    <TableHead>First sale path</TableHead>
                    <TableHead>Courses done</TableHead>
                    <TableHead>Certification</TableHead>
                    <TableHead>Credential</TableHead>
                    <TableHead>Expires</TableHead>
                    <TableHead>Last active</TableHead>
                    <TableHead className="w-px" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((learner) => {
                    const credState = deriveCredentialState(learner.earnedAt, learner.expiresAt, learner.revokedAt);
                    return (
                      <TableRow key={learner.id}>
                        <TableCell>
                          <p className="font-medium">{learner.name}</p>
                          <p className="text-xs text-muted-foreground">{learner.meta}</p>
                        </TableCell>
                        <TableCell>
                          <FirstSalePathCell progress={learner.firstSalePath} />
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {learner.coursesDone.completed} of {learner.coursesDone.total}
                        </TableCell>
                        <TableCell>
                          <ProgressBar
                            completed={learner.certification.completed}
                            total={learner.certification.total}
                            complete={learner.certification.completed >= learner.certification.total}
                          />
                        </TableCell>
                        <TableCell>
                          <CredentialBadge learner={learner} />
                        </TableCell>
                        <TableCell
                          className={cn(
                            "tabular-nums",
                            credState === "expired" && "text-red-600",
                            credState === "expiring" && "text-amber-600"
                          )}
                        >
                          {formatDate(learner.expiresAt)}
                        </TableCell>
                        <TableCell className="tabular-nums">{formatDaysAgo(learner.lastActiveDaysAgo)}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" onClick={() => toast("Associate detail isn't wired up yet")}>
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </AdminDesktopTableWrap>

            <AdminMobileStack>
              {rows.map((learner) => (
                <AdminMobileCard
                  key={learner.id}
                  title={learner.name}
                  subtitle={<CredentialBadge learner={learner} />}
                >
                  <AdminMobileField label="First sale path" value={<FirstSalePathCell progress={learner.firstSalePath} />} />
                  <AdminMobileField
                    label="Courses done"
                    value={`${learner.coursesDone.completed} of ${learner.coursesDone.total}`}
                  />
                  <AdminMobileField
                    label="Certification"
                    value={
                      <ProgressBar
                        completed={learner.certification.completed}
                        total={learner.certification.total}
                        complete={learner.certification.completed >= learner.certification.total}
                      />
                    }
                  />
                  <AdminMobileField label="Expires" value={formatDate(learner.expiresAt)} />
                  <AdminMobileField label="Last active" value={formatDaysAgo(learner.lastActiveDaysAgo)} />
                  <div className="flex justify-end pt-1">
                    <Button variant="outline" size="sm" onClick={() => toast("Associate detail isn't wired up yet")}>
                      View
                    </Button>
                  </div>
                </AdminMobileCard>
              ))}
            </AdminMobileStack>
          </>
        )}
      </div>
    </div>
  );
}
