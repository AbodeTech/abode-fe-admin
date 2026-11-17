"use client";

import { useState } from "react";
import { format } from "date-fns";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AdminDesktopTableWrap,
  AdminMobileCard,
  AdminMobileField,
  AdminMobileStack,
} from "@/components/shared/admin-responsive-table";

import {
  UPGRADE_TARGET_TIERS,
  USER_TIER_LABELS,
  USER_TIERS,
  type EligibleUpgrade,
  type UserTier,
} from "../schemas/upgrade.schema";
import { ManualUpgradeDialog } from "./ManualUpgradeDialog";

type TargetTier = (typeof UPGRADE_TARGET_TIERS)[number];
const isTargetTier = (tier: string): tier is TargetTier => (UPGRADE_TARGET_TIERS as readonly string[]).includes(tier);
const tierLabel = (tier: string) =>
  (USER_TIERS as readonly string[]).includes(tier) ? USER_TIER_LABELS[tier as UserTier] : tier;

const nameOf = (row: EligibleUpgrade) =>
  [row.user.first_name, row.user.last_name].filter(Boolean).join(" ") || row.user.email || "Unknown member";

const rowKey = (row: EligibleUpgrade) => `${row.user.id}:${row.to_tier}`;

interface EligibleUpgradesTableProps {
  rows: EligibleUpgrade[];
  isLoading?: boolean;
  /** `modify_referral_status` — the manual upgrade's BE permission. */
  canUpgrade: boolean;
  emptyState: React.ReactNode;
}

/**
 * Members who completed the course their next tier requires (item 12). The
 * Upgrade action opens the existing manual-upgrade dialog, filled in, so the
 * tier change, fee and audit reason go through the one reviewed path.
 */
export function EligibleUpgradesTable({ rows, isLoading, canUpgrade, emptyState }: EligibleUpgradesTableProps) {
  const [upgrading, setUpgrading] = useState<EligibleUpgrade | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    );
  }
  if (rows.length === 0) return <>{emptyState}</>;

  const action = (row: EligibleUpgrade) => {
    if (row.upgrade_requested) return <Badge variant="secondary">Request pending</Badge>;
    if (!canUpgrade || !isTargetTier(row.to_tier)) return null;
    return (
      <Button size="sm" onClick={() => setUpgrading(row)}>
        Upgrade
      </Button>
    );
  };

  const score = (row: EligibleUpgrade) => (row.best_score_pct === null ? "No quiz" : `${row.best_score_pct}%`);

  return (
    <>
      <AdminDesktopTableWrap>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Now</TableHead>
              <TableHead>Eligible for</TableHead>
              <TableHead>Course completed</TableHead>
              <TableHead>Best score</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={rowKey(row)}>
                <TableCell className="whitespace-normal">
                  <p className="font-medium">{nameOf(row)}</p>
                  <p className="text-xs text-muted-foreground">{row.user.email ?? "—"}</p>
                </TableCell>
                <TableCell>{tierLabel(row.user.referral_status)}</TableCell>
                <TableCell>
                  <Badge variant="outline">{tierLabel(row.to_tier)}</Badge>
                </TableCell>
                <TableCell className="whitespace-normal">
                  <p>{row.course.title}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(row.completed_at), "MMM d, yyyy")}</p>
                </TableCell>
                <TableCell className="tabular-nums">{score(row)}</TableCell>
                <TableCell className="text-right">{action(row)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminDesktopTableWrap>

      <AdminMobileStack>
        {rows.map((row) => (
          <AdminMobileCard key={rowKey(row)} title={nameOf(row)} subtitle={row.user.email ?? undefined}>
            <AdminMobileField label="Now" value={tierLabel(row.user.referral_status)} />
            <AdminMobileField label="Eligible for" value={tierLabel(row.to_tier)} />
            <AdminMobileField
              label="Course completed"
              value={`${row.course.title} · ${format(new Date(row.completed_at), "MMM d, yyyy")}`}
            />
            <AdminMobileField label="Best score" value={score(row)} />
            <div className="pt-2">{action(row)}</div>
          </AdminMobileCard>
        ))}
      </AdminMobileStack>

      {upgrading && isTargetTier(upgrading.to_tier) && (
        <ManualUpgradeDialog
          key={rowKey(upgrading)}
          open
          onOpenChange={(next) => (next ? undefined : setUpgrading(null))}
          prefill={{
            userId: upgrading.user.id,
            label: nameOf(upgrading),
            toTier: upgrading.to_tier,
            reason: `Completed "${upgrading.course.title}" on ${format(new Date(upgrading.completed_at), "MMM d, yyyy")}${
              upgrading.best_score_pct === null ? "" : ` with a best score of ${upgrading.best_score_pct}%`
            }.`,
          }}
        />
      )}
    </>
  );
}
