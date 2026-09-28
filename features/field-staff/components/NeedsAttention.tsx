"use client";

import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock, FilePen, MapPinOff, Scale, TrendingDown } from "lucide-react";

import type { FieldBlockers } from "../schemas/performance.schema";
import type { RosterRow } from "../hooks/use-field-roster";

/** A target under this share of its goal is flagged — the same line the red "Below target" tag uses. */
const BELOW_TARGET_PCT = 50;
const MAX_NAMES = 3;

type Mention = { key: string; text: string; personId: string; siteId?: string };

interface NeedsAttentionProps {
  rows: RosterRow[];
  blockers: FieldBlockers | undefined;
  staleAfterDays: number;
  /** Opens a person on this page, optionally on one of their sites. */
  onOpen: (personId: string, siteId?: string) => void;
}

/**
 * One card listing what's holding the role back this month: old reviews,
 * sites without targets, unpublished drafts, weights that don't total 100%,
 * and targets well behind. A line only appears when it has something in it,
 * and every name in it opens that person (and site).
 */
export function NeedsAttention({ rows, blockers, staleAfterDays, onOpen }: NeedsAttentionProps) {
  const inRole = new Set(rows.map((r) => r.staff.id));
  const nameOf = new Map(rows.map((r) => [r.staff.id, r.staff.full_name]));

  // Blockers cover every role; keep this role's.
  const stale = (blockers?.stale_reviews ?? []).filter((s) => inRole.has(s.field_staff.id));
  const drafts = (blockers?.unpublished_scorecards ?? []).filter((d) => inRole.has(d.field_staff.id));
  const draftKeys = new Set(drafts.map((d) => `${d.field_staff.id}:${d.asset.id}`));

  const noTargets: Mention[] = rows.flatMap((r) =>
    (r.month?.sites_without_targets ?? [])
      .filter((s) => !draftKeys.has(`${r.staff.id}:${s.asset.id}`))
      .map((s) => ({
        key: `${r.staff.id}:${s.asset.id}`,
        text: `${r.staff.full_name} (${s.asset.name ?? "removed site"})`,
        personId: r.staff.id,
        siteId: s.asset.id,
      }))
  );
  const unassigned: Mention[] = rows
    .filter((r) => r.staff.status === "active" && r.month && r.month.scorecards.length + r.month.sites_without_targets.length === 0)
    .map((r) => ({ key: r.staff.id, text: r.staff.full_name, personId: r.staff.id }));
  const invalid: Mention[] = rows.flatMap((r) =>
    (r.month?.scorecards ?? [])
      .filter((c) => c.scorecard_state === "invalid")
      .map((c) => ({
        key: `${r.staff.id}:${c.asset.id}`,
        text: `${r.staff.full_name} (${c.asset.name ?? "removed site"}, ${c.target_coverage.weight_total}%)`,
        personId: r.staff.id,
        siteId: c.asset.id,
      }))
  );
  const behind: Mention[] = rows.flatMap((r) =>
    (r.month?.scorecards ?? []).flatMap((c) =>
      c.metrics
        .filter((m) => m.uncapped_achievement_pct < BELOW_TARGET_PCT)
        .map((m) => ({
          key: `${r.staff.id}:${c.asset.id}:${m.metric_key}`,
          text: `${m.label}: ${r.staff.full_name}, ${c.asset.name ?? "removed site"} (${Math.round(m.uncapped_achievement_pct)}%)`,
          personId: r.staff.id,
          siteId: c.asset.id,
        }))
    )
  );

  const oldest = stale[0];
  const lines = [
    stale.length > 0 && {
      icon: Clock,
      tone: "text-[#AD1F2A]",
      text: `${stale.length} submission${stale.length === 1 ? "" : "s"} waiting more than ${staleAfterDays} days${
        oldest?.days_waiting != null
          ? ` · oldest ${oldest.days_waiting} days (${nameOf.get(oldest.field_staff.id) ?? oldest.field_staff.full_name}, ${oldest.asset.name ?? "removed site"})`
          : ""
      }`,
      action: (
        <Link href="/field-performance/review-queue" className="shrink-0 text-sm font-medium text-gray-900 hover:underline">
          Open queue →
        </Link>
      ),
    },
    noTargets.length > 0 && {
      icon: AlertTriangle,
      tone: "text-amber-600",
      text: `${noTargets.length} site${noTargets.length === 1 ? " has" : "s have"} no targets`,
      mentions: noTargets,
    },
    drafts.length > 0 && {
      icon: FilePen,
      tone: "text-amber-600",
      text: `${drafts.length} scorecard${drafts.length === 1 ? " is" : "s are"} still a draft, so the worker can't see ${drafts.length === 1 ? "it" : "them"}`,
      mentions: drafts.map((d) => ({
        key: `${d.field_staff.id}:${d.asset.id}`,
        text: `${d.field_staff.full_name} (${d.asset.name ?? "removed site"})`,
        personId: d.field_staff.id,
        siteId: d.asset.id,
      })),
    },
    invalid.length > 0 && {
      icon: Scale,
      tone: "text-[#AD1F2A]",
      text: `${invalid.length} scorecard${invalid.length === 1 ? "'s" : "s'"} weights don't total 100%`,
      mentions: invalid,
    },
    behind.length > 0 && {
      icon: TrendingDown,
      tone: "text-[#AD1F2A]",
      text: `${behind.length} target${behind.length === 1 ? " is" : "s are"} below ${BELOW_TARGET_PCT}%`,
      mentions: behind,
    },
    unassigned.length > 0 && {
      icon: MapPinOff,
      tone: "text-gray-500",
      text: `${unassigned.length} active ${unassigned.length === 1 ? "person isn't" : "people aren't"} assigned to a site this month`,
      mentions: unassigned,
    },
  ].filter(Boolean) as {
    icon: React.ElementType;
    tone: string;
    text: string;
    mentions?: Mention[];
    action?: React.ReactNode;
  }[];

  return (
    <section className="space-y-3">
      <h2 className="text-base font-semibold text-gray-900">Needs attention</h2>
      <div className="rounded-xl border border-gray-200 bg-white">
        {lines.length === 0 ? (
          <p className="flex items-center gap-2 px-4 py-3 text-sm text-[#00695C]">
            <CheckCircle2 className="h-4 w-4" />
            Nothing needs attention this month.
          </p>
        ) : (
          <ul className="divide-y">
            {lines.map((line) => (
              <li key={line.text} className="flex items-start justify-between gap-4 px-4 py-3">
                <div className="flex min-w-0 items-start gap-3">
                  <line.icon className={`mt-0.5 h-4 w-4 shrink-0 ${line.tone}`} aria-hidden />
                  <div className="min-w-0 text-sm">
                    <p className="font-medium text-gray-900">{line.text}</p>
                    {line.mentions && (
                      <p className="mt-0.5 text-gray-500">
                        {line.mentions.slice(0, MAX_NAMES).map((m, i) => (
                          <span key={m.key}>
                            {i > 0 && " · "}
                            <button
                              type="button"
                              onClick={() => onOpen(m.personId, m.siteId)}
                              className="underline decoration-gray-300 underline-offset-2 hover:text-gray-900 hover:decoration-gray-500"
                            >
                              {m.text}
                            </button>
                          </span>
                        ))}
                        {line.mentions.length > MAX_NAMES && ` and ${line.mentions.length - MAX_NAMES} more`}
                      </p>
                    )}
                  </div>
                </div>
                {line.action}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
