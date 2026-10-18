"use client";

import { ArrowDown, ArrowUp } from "lucide-react";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AdminDesktopTableWrap,
  AdminMobileCard,
  AdminMobileField,
  AdminMobileStack,
} from "@/components/shared/admin-responsive-table";

import { assetName, staffInitials, type FieldStaff } from "../schemas/field-staff.schema";
import type { RosterRow } from "../hooks/use-field-roster";
import { formatScore } from "../lib/format";

/** Scores only mean something with at least one live scorecard; otherwise "—", never 0%. */
const scored = (row: RosterRow) => !!row.month && row.month.scorecards.length > 0;

const siteCount = (row: RosterRow) =>
  row.month ? row.month.scorecards.length + row.month.sites_without_targets.length : 0;

/**
 * Best verified score first, numbered. People with nothing scored go last and
 * unranked — their "score" isn't comparable — active before invited/disabled.
 */
function rank(rows: RosterRow[]): { row: RosterRow; rank: number | null }[] {
  const ranked = rows
    .filter(scored)
    .sort((a, b) => b.month!.total_score - a.month!.total_score)
    .map((row, i) => ({ row, rank: i + 1 }));
  const rest = rows
    .filter((r) => !scored(r))
    .sort((a, b) => Number(a.staff.status !== "active") - Number(b.staff.status !== "active"))
    .map((row) => ({ row, rank: null }));
  return [...ranked, ...rest];
}

function Person({ row }: { row: RosterRow }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#E0F2F1] text-[11px] font-semibold text-[#00695C]">
        {staffInitials(row.staff)}
      </span>
      <div className="min-w-0">
        <p className="truncate font-medium">{row.staff.full_name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {row.staff.status === "invited" ? "Invited · not activated yet" : row.staff.email}
        </p>
      </div>
    </div>
  );
}

function AccountBadge({ status }: { status: FieldStaff["status"] }) {
  if (status === "invited") return <Badge variant="outline">Invited</Badge>;
  if (status === "disabled") return <Badge variant="secondary">Disabled</Badge>;
  return null;
}

function Score({ row }: { row: RosterRow }) {
  if (!scored(row)) return <span className="text-muted-foreground">—</span>;
  const score = row.month!.total_score;
  return (
    <div className="ml-auto w-24 space-y-1 text-right">
      <p className="font-medium tabular-nums">{formatScore(score)}</p>
      <div className="h-1 overflow-hidden rounded-full bg-muted" aria-hidden>
        <div
          className={score >= 100 ? "h-full bg-[#00695C]" : "h-full bg-foreground/60"}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
    </div>
  );
}

/** Change against last month's verified score. Arrow + sign + number, so it never relies on colour alone. */
function Change({ row, previous }: { row: RosterRow; previous: Map<string, number> }) {
  if (!scored(row)) return <span className="text-muted-foreground">—</span>;
  const before = previous.get(row.staff.id);
  if (before === undefined) return <span className="text-xs text-muted-foreground">New</span>;
  const delta = Math.round((row.month!.total_score - before) * 10) / 10;
  if (delta === 0) return <span className="text-xs tabular-nums text-muted-foreground">0.0</span>;
  const up = delta > 0;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium tabular-nums", up ? "text-[#00695C]" : "text-[#AD1F2A]")}>
      {up ? <ArrowUp className="h-3 w-3" aria-hidden /> : <ArrowDown className="h-3 w-3" aria-hidden />}
      {up ? "+" : "−"}
      {Math.abs(delta).toFixed(1)}
    </span>
  );
}

/**
 * Target coverage: how many of the metrics the admin offers for the role have
 * a target, plus any weights problem. Hover shows the composition per site.
 */
function Coverage({ row, offered }: { row: RosterRow; offered: number }) {
  if (!row.month || row.month.scorecards.length === 0) {
    return <span className="text-xs text-muted-foreground">{siteCount(row) ? "No targets" : "—"}</span>;
  }
  const cards = row.month.scorecards;
  const keys = new Set(cards.flatMap((c) => c.metrics.map((m) => m.metric_key)));
  const invalid = cards.some((c) => c.scorecard_state === "invalid");
  const missingSites = row.month.sites_without_targets.length;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className="inline-flex flex-col items-center text-xs" onClick={(e) => e.stopPropagation()}>
          <span className="tabular-nums">
            <span className="font-medium">{keys.size}</span>
            <span className="text-muted-foreground"> of {Math.max(offered, keys.size)} metrics</span>
          </span>
          {invalid ? (
            <span className="text-[#AD1F2A]">Weights not 100%</span>
          ) : missingSites > 0 ? (
            <span className="text-amber-700">{missingSites} site{missingSites === 1 ? "" : "s"} without</span>
          ) : null}
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs space-y-1 text-xs">
        {cards.map((c) => (
          <p key={c.asset.id}>
            <span className="font-medium">{assetName(c.asset)}:</span>{" "}
            {c.metrics.map((m) => `${m.label} ${m.weight}%`).join(" · ")}
          </p>
        ))}
        {missingSites > 0 && (
          <p>
            No targets: {row.month.sites_without_targets.map((s) => assetName(s.asset)).join(", ")}
          </p>
        )}
      </TooltipContent>
    </Tooltip>
  );
}

function TargetsMet({ row }: { row: RosterRow }) {
  const metrics = row.month?.scorecards.flatMap((card) => card.metrics) ?? [];
  if (!metrics.length) return <span className="text-muted-foreground">—</span>;
  const met = metrics.filter((m) => m.achievement_pct >= 100).length;
  return (
    <span className="tabular-nums">
      <span className="font-medium">{met}</span>
      <span className="text-muted-foreground"> / {metrics.length}</span>
    </span>
  );
}

function ToReview({ row }: { row: RosterRow }) {
  const pending = row.month?.pending_submissions ?? 0;
  if (!pending) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="inline-flex rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">{pending}</span>
  );
}

interface FieldTeamTableProps {
  rows: RosterRow[];
  /** Last month's verified score per staff id — only people who had targets then. */
  previous: Map<string, number>;
  previousLabel: string;
  /** How many metrics the admin offers this role (hidden ones excluded). */
  offeredMetrics: number;
  /** Opens that person on this page. */
  onOpen: (staffId: string) => void;
  emptyState?: React.ReactNode;
}

/** The team for the month, ranked by verified score. A row opens that person's view. */
export function FieldTeamTable({ rows, previous, previousLabel, offeredMetrics, onOpen, emptyState }: FieldTeamTableProps) {
  if (rows.length === 0) return <>{emptyState}</>;
  const ranked = rank(rows);

  return (
    <TooltipProvider delayDuration={150}>
      <AdminDesktopTableWrap>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10 text-center">#</TableHead>
              <TableHead>Person</TableHead>
              <TableHead className="text-center">Sites</TableHead>
              <TableHead className="text-right">Score</TableHead>
              <TableHead className="text-center">vs {previousLabel}</TableHead>
              <TableHead className="text-center">Targets</TableHead>
              <TableHead className="text-center">Met</TableHead>
              <TableHead className="text-center">To review</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {ranked.map(({ row, rank: position }) => (
              <TableRow key={row.staff.id} className="cursor-pointer" onClick={() => onOpen(row.staff.id)}>
                <TableCell className="text-center text-sm font-semibold tabular-nums text-muted-foreground">
                  {position ?? "—"}
                </TableCell>
                <TableCell className="max-w-[18rem]">
                  <div className="flex items-center gap-2">
                    <Person row={row} />
                    <AccountBadge status={row.staff.status} />
                  </div>
                </TableCell>
                <TableCell className="text-center tabular-nums">
                  {siteCount(row) || <span className="text-muted-foreground">—</span>}
                </TableCell>
                <TableCell className="text-sm">
                  <Score row={row} />
                </TableCell>
                <TableCell className="text-center">
                  <Change row={row} previous={previous} />
                </TableCell>
                <TableCell className="text-center">
                  <Coverage row={row} offered={offeredMetrics} />
                </TableCell>
                <TableCell className="text-center text-sm">
                  <TargetsMet row={row} />
                </TableCell>
                <TableCell className="text-center">
                  <ToReview row={row} />
                </TableCell>
                <TableCell className="text-right">
                  <Button size="sm" variant="outline">
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminDesktopTableWrap>

      <AdminMobileStack>
        {ranked.map(({ row, rank: position }) => (
          <AdminMobileCard
            key={row.staff.id}
            title={
              <div className="flex items-center gap-2">
                {position && <span className="text-sm font-semibold text-muted-foreground">#{position}</span>}
                <Person row={row} />
              </div>
            }
            subtitle={<AccountBadge status={row.staff.status} />}
            onClick={() => onOpen(row.staff.id)}
          >
            <AdminMobileField label="Score" value={formatScore(scored(row) ? row.month!.total_score : null)} />
            <AdminMobileField label={`vs ${previousLabel}`} value={<Change row={row} previous={previous} />} />
            <AdminMobileField label="Targets" value={<Coverage row={row} offered={offeredMetrics} />} />
            <AdminMobileField label="Met" value={<TargetsMet row={row} />} />
            <AdminMobileField label="To review" value={<ToReview row={row} />} />
          </AdminMobileCard>
        ))}
      </AdminMobileStack>
    </TooltipProvider>
  );
}
