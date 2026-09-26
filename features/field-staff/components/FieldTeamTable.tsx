"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AdminDesktopTableWrap,
  AdminMobileCard,
  AdminMobileField,
  AdminMobileStack,
} from "@/components/shared/admin-responsive-table";

import { staffInitials, type FieldStaff } from "../schemas/field-staff.schema";
import type { RosterRow } from "../hooks/use-field-roster";
import { formatScore } from "../lib/format";

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

/** Scores only mean something with at least one live scorecard; otherwise "—", never 0%. */
const scored = (row: RosterRow) => !!row.month && row.month.scorecards.length > 0;

const siteCount = (row: RosterRow) =>
  row.month ? row.month.scorecards.length + row.month.sites_without_targets.length : 0;

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

/** How many of the month's targets are already reached, across every site. */
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
  /** Opens that person on this page. */
  onOpen: (staffId: string) => void;
  emptyState?: React.ReactNode;
}

/** The team for the month. A row opens that person's view. */
export function FieldTeamTable({ rows, onOpen, emptyState }: FieldTeamTableProps) {
  if (rows.length === 0) return <>{emptyState}</>;

  return (
    <>
      <AdminDesktopTableWrap>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Person</TableHead>
              <TableHead className="text-center">Sites</TableHead>
              <TableHead className="text-right">Score</TableHead>
              <TableHead className="text-center">Targets met</TableHead>
              <TableHead className="text-center">To review</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.staff.id} className="cursor-pointer" onClick={() => onOpen(row.staff.id)}>
                <TableCell className="max-w-[20rem]">
                  <div className="flex items-center gap-2">
                    <Person row={row} />
                    <AccountBadge status={row.staff.status} />
                  </div>
                </TableCell>
                <TableCell className="text-center tabular-nums">{siteCount(row) || <span className="text-muted-foreground">—</span>}</TableCell>
                <TableCell className="text-sm">
                  <Score row={row} />
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
        {rows.map((row) => (
          <AdminMobileCard
            key={row.staff.id}
            title={<Person row={row} />}
            subtitle={<AccountBadge status={row.staff.status} />}
            onClick={() => onOpen(row.staff.id)}
          >
            <AdminMobileField label="Sites" value={siteCount(row) || "—"} />
            <AdminMobileField label="Score" value={formatScore(scored(row) ? row.month!.total_score : null)} />
            <AdminMobileField label="Targets met" value={<TargetsMet row={row} />} />
            <AdminMobileField label="To review" value={<ToReview row={row} />} />
          </AdminMobileCard>
        ))}
      </AdminMobileStack>
    </>
  );
}
