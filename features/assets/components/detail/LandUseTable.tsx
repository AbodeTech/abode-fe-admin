"use client";

import { Fragment, useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminPermissions } from "@/hooks/use-admin-permission";
import { cn } from "@/lib/utils";
import { formatSqm } from "@/lib/utils/format";

import { useLandConfiguration } from "../../hooks/use-land-configuration";
import {
  LAND_USE_CATEGORIES,
  LAND_USE_CATEGORY_LABELS,
  type AssetLandUse,
  type LandUseCategory,
} from "../../schemas/land-configuration.schema";

function groupByCategory(rows: AssetLandUse[]): { category: LandUseCategory; rows: AssetLandUse[]; total: number }[] {
  return LAND_USE_CATEGORIES.map((category) => {
    const categoryRows = rows.filter((row) => row.category === category);
    return { category, rows: categoryRows, total: categoryRows.reduce((sum, r) => sum + r.allocated_sqm, 0) };
  }).filter((group) => group.rows.length > 0);
}

interface Props {
  assetId: string;
  onEdit: () => void;
  /** A named row was clicked — opens the Land Account editor focused on the non-saleable section, never a Costs page. */
  onRowClick?: (row: AssetLandUse) => void;
}

/**
 * Roads & Services — the non-saleable land-use rows, grouped by category with
 * their named sub-rows drillable underneath. Read-only: all edits happen in
 * the Land Account editor via `onEdit`/`onRowClick`.
 */
export function LandUseTable({ assetId, onEdit, onRowClick }: Props) {
  const permissions = useAdminPermissions();
  const canView = permissions.has("view_assets");
  const canManage = permissions.has("manage_assets");
  const { data, isLoading } = useLandConfiguration(assetId, { enabled: canView });
  const [collapsed, setCollapsed] = useState<LandUseCategory[]>([]);

  const isOpen = (category: LandUseCategory) => !collapsed.includes(category);
  const toggle = (category: LandUseCategory) =>
    setCollapsed((prev) => (prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]));

  if (!canView) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="font-medium">You do not have permission to view roads &amp; services.</p>
          <p className="mt-1 text-sm text-muted-foreground">An admin can grant the view_assets permission.</p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <section className="rounded-xl border p-4 sm:p-6">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="mt-4 h-20 w-full" />
      </section>
    );
  }

  if (!data || data.state === "not_configured") return null;

  const total = data.total_land_sqm ?? 0;
  const groups = groupByCategory(data.non_saleable);
  const pct = (n: number) => (total > 0 ? `${((n / total) * 100).toFixed(1)}%` : "—");
  const rowClickHandler = canManage ? onRowClick : undefined;

  return (
    <section className="rounded-xl border">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
        <div>
          <h2 className="font-medium">Roads & services</h2>
          <p className="text-xs text-muted-foreground">
            Non-saleable land — roads, service plots, recreation, public use, and other named areas.
          </p>
        </div>
        {canManage ? (
          <Button variant="outline" size="sm" onClick={onEdit}>
            Edit breakdown
          </Button>
        ) : null}
      </div>

      {groups.length === 0 ? (
        <div className="p-6 text-center text-sm text-muted-foreground">
          No non-saleable land has been recorded for this estate yet.
        </div>
      ) : (
        <>
          {/* ── desktop ─────────────────────────────────────────────── */}
          <div className="hidden overflow-x-auto md:block">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-8" />
                  <TableHead className="h-10 text-[10px] font-bold uppercase tracking-wider">Category / Name</TableHead>
                  <TableHead className="h-10 text-right text-[10px] font-bold uppercase tracking-wider">Area</TableHead>
                  <TableHead className="h-10 text-right text-[10px] font-bold uppercase tracking-wider">Share of estate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groups.map((group) => {
                  const open = isOpen(group.category);
                  return (
                    <Fragment key={group.category}>
                      <TableRow
                        className="cursor-pointer bg-muted/20 hover:bg-muted/40"
                        onClick={() => toggle(group.category)}
                      >
                        <TableCell>
                          {open ? <ChevronDown className="h-4 w-4" aria-hidden /> : <ChevronRight className="h-4 w-4" aria-hidden />}
                        </TableCell>
                        <TableCell className="text-xs font-bold uppercase tracking-widest">
                          {LAND_USE_CATEGORY_LABELS[group.category]}
                        </TableCell>
                        <TableCell className="text-right text-xs font-bold tabular-nums">{formatSqm(group.total)}</TableCell>
                        <TableCell className="text-right text-xs font-bold tabular-nums">{pct(group.total)}</TableCell>
                      </TableRow>
                      {open &&
                        group.rows.map((row, index) => (
                          <TableRow
                            key={row.id ?? `${group.category}-${index}`}
                            className={cn(rowClickHandler && "cursor-pointer hover:bg-muted/40")}
                            role={rowClickHandler ? "button" : undefined}
                            tabIndex={rowClickHandler ? 0 : undefined}
                            onClick={() => rowClickHandler?.(row)}
                            onKeyDown={(e) => {
                              if (rowClickHandler && (e.key === "Enter" || e.key === " ")) {
                                e.preventDefault();
                                rowClickHandler(row);
                              }
                            }}
                          >
                            <TableCell />
                            <TableCell className="pl-8 text-sm">{row.label}</TableCell>
                            <TableCell className="text-right text-sm tabular-nums">{formatSqm(row.allocated_sqm)}</TableCell>
                            <TableCell className="text-right text-sm tabular-nums">{pct(row.allocated_sqm)}</TableCell>
                          </TableRow>
                        ))}
                    </Fragment>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* ── mobile ──────────────────────────────────────────────── */}
          <div className="space-y-3 p-4 md:hidden">
            {groups.map((group) => {
              const open = isOpen(group.category);
              return (
                <div key={group.category} className="overflow-hidden rounded-lg border">
                  <button
                    type="button"
                    onClick={() => toggle(group.category)}
                    aria-expanded={open}
                    className="flex w-full items-center gap-2 bg-muted/20 px-3 py-2.5 text-left"
                  >
                    {open ? <ChevronDown className="h-4 w-4 shrink-0" aria-hidden /> : <ChevronRight className="h-4 w-4 shrink-0" aria-hidden />}
                    <span className="text-xs font-bold uppercase tracking-widest">{LAND_USE_CATEGORY_LABELS[group.category]}</span>
                    <span className="ml-auto text-xs font-bold tabular-nums text-muted-foreground">{formatSqm(group.total)}</span>
                  </button>
                  {open ? (
                    <dl className="space-y-2 border-t px-3 py-2.5">
                      {group.rows.map((row, index) => (
                        <div
                          key={row.id ?? `${group.category}-${index}`}
                          role={rowClickHandler ? "button" : undefined}
                          tabIndex={rowClickHandler ? 0 : undefined}
                          onClick={() => rowClickHandler?.(row)}
                          onKeyDown={(e) => {
                            if (rowClickHandler && (e.key === "Enter" || e.key === " ")) {
                              e.preventDefault();
                              rowClickHandler(row);
                            }
                          }}
                          className={cn("flex items-center justify-between gap-3", rowClickHandler && "cursor-pointer")}
                        >
                          <dt className="min-w-0 text-sm">{row.label}</dt>
                          <dd className="shrink-0 text-sm tabular-nums">{formatSqm(row.allocated_sqm)}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
