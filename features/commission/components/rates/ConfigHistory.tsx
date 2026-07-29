"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, History } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { formatNaira, formatPercent } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

import {
  modifiedByName,
  type CommissionConfig,
  type TierRates,
} from "../../schemas/commission.schema";

/* ============================================================
 * Version history — step 9 of the commission build order.
 *
 * Held on ticket 11 until 2026-07-28, when the backend started recording
 * `reason`, `changed_fields` and a populated `last_modified_by` on each
 * version. The diff itself stays client-side (decision D-8): the endpoint
 * returns the last 20 full documents, so both sides of every comparison are
 * already in hand — `changed_fields` says where to look, the documents say
 * what the values were.
 * ============================================================ */

type Change = { label: string; from: string; to: string };

const SCALARS: { key: keyof CommissionConfig; label: string; money?: boolean }[] = [
  { key: "wht_rate", label: "Withholding tax" },
  { key: "marketplace_platform_fee_pct", label: "Marketplace platform fee" },
  { key: "upgrade_commission_pct", label: "Upgrade commission" },
  { key: "associate_pro_fee", label: "Associate Pro fee", money: true },
  { key: "high_commission_alert_threshold", label: "High commission alert", money: true },
];

function diffTable(label: string, prev: TierRates, next: TierRates, out: Change[]) {
  const tiers = [...new Set([...Object.keys(prev ?? {}), ...Object.keys(next ?? {})])];
  for (const tier of tiers) {
    const before = prev?.[tier as keyof TierRates];
    const after = next?.[tier as keyof TierRates];
    if (before !== after) {
      out.push({
        label: `${label} · ${tier}`,
        from: before != null ? formatPercent(before) : "—",
        to: after != null ? formatPercent(after) : "—",
      });
    }
  }
}

/** Everything that differs between two versions, newest values on the right. */
function diffConfigs(prev: CommissionConfig, next: CommissionConfig): Change[] {
  const changes: Change[] = [];

  diffTable("Flex direct", prev.flexCommission.direct, next.flexCommission.direct, changes);
  const legs = ["direct", "upline", "topline"] as const;
  for (const leg of legs) {
    diffTable(
      `Full ownership ${leg}`,
      prev.fullOwnershipCommission[leg] as TierRates,
      next.fullOwnershipCommission[leg] as TierRates,
      changes
    );
  }

  for (const { key, label, money } of SCALARS) {
    const before = prev[key] as number;
    const after = next[key] as number;
    if (before !== after) {
      changes.push({
        label,
        from: money ? formatNaira(before) : formatPercent(before),
        to: money ? formatNaira(after) : formatPercent(after),
      });
    }
  }

  return changes;
}

function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function VersionRow({
  config,
  previous,
  isActive,
}: {
  config: CommissionConfig;
  previous: CommissionConfig | undefined;
  isActive: boolean;
}) {
  const [open, setOpen] = useState(false);

  const publisher = modifiedByName(config);
  // `changed_fields` only exists on versions published after the metadata
  // landed; older versions still diff, they just can't show the chips.
  const chips = config.changed_fields ?? [];
  const changes = previous && open ? diffConfigs(previous, config) : [];

  return (
    <li className="border-b last:border-b-0">
      <button
        type="button"
        onClick={() => previous && setOpen((current) => !current)}
        aria-expanded={open}
        disabled={!previous}
        className={cn(
          "flex w-full flex-wrap items-center gap-x-3 gap-y-1 px-4 py-3 text-left",
          previous && "cursor-pointer hover:bg-muted/40"
        )}
      >
        {previous ? (
          open ? (
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          )
        ) : (
          <span className="w-4 shrink-0" />
        )}

        <span className="text-sm font-semibold tabular-nums">v{config.version}</span>
        {isActive && <Badge variant="secondary">Active</Badge>}

        <span className="text-xs text-muted-foreground">{formatDate(config.createdAt)}</span>
        <span className="text-xs text-muted-foreground">
          {publisher ?? <span aria-label="Publisher unknown">—</span>}
        </span>

        {config.reason ? (
          <span className="min-w-0 basis-full text-sm text-muted-foreground sm:basis-auto sm:flex-1 sm:truncate">
            {config.reason}
          </span>
        ) : null}
      </button>

      {open && previous ? (
        <div className="space-y-1.5 border-t bg-muted/20 px-4 py-3 pl-11">
          {chips.length > 0 ? (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {chips.map((field) => (
                <Badge key={field} variant="outline" className="text-[10px]">
                  {field}
                </Badge>
              ))}
            </div>
          ) : null}

          {changes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No rate or amount differs from v{previous.version}.
            </p>
          ) : (
            changes.map((change) => (
              <div
                key={change.label}
                className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-sm"
              >
                <span className="min-w-0 flex-1 text-muted-foreground">{change.label}</span>
                <span className="tabular-nums line-through opacity-60">{change.from}</span>
                <span className="font-medium tabular-nums">{change.to}</span>
              </div>
            ))
          )}
        </div>
      ) : null}
    </li>
  );
}

export function ConfigHistory({ history }: { history: CommissionConfig[] }) {
  const [expanded, setExpanded] = useState(false);

  if (history.length === 0) return null;

  // Sorted version-desc by the BE; the previous version of history[i] is
  // history[i + 1]. The last entry has nothing to diff against.
  const visible = expanded ? history : history.slice(0, 3);

  return (
    <section className="rounded-lg border">
      <div className="flex items-center gap-2 border-b px-4 py-3">
        <History className="h-4 w-4 text-muted-foreground" aria-hidden />
        <h2 className="font-medium">Version history</h2>
        <span className="text-xs text-muted-foreground">last {history.length}</span>
      </div>

      <ul>
        {visible.map((config, index) => (
          <VersionRow
            key={config.version}
            config={config}
            previous={history[index + 1]}
            isActive={index === 0}
          />
        ))}
      </ul>

      {history.length > 3 ? (
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          className="w-full border-t px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted/40"
        >
          {expanded ? "Show fewer" : `Show all ${history.length} versions`}
        </button>
      ) : null}
    </section>
  );
}
