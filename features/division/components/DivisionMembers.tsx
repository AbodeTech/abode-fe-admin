"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, EyeOff, Loader2, Search, Users } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { useDivisionMembers, useDivisionSummary } from "../hooks/use-division";
import {
  formatSqm,
  seasonLabel,
  tierRangeLabel,
  type DivisionSummaryRow,
} from "../schemas/division.schema";

const PAGE_SIZE = 20;

const fullName = (m: { first_name: string; last_name: string }) =>
  `${m.first_name} ${m.last_name}`.trim() || "—";

const initials = (m: { first_name: string; last_name: string }) =>
  `${m.first_name?.[0] ?? ""}${m.last_name?.[0] ?? ""}`.toUpperCase() || "?";

/**
 * Who is in which division: the ladder down the left, the associates in the
 * selected one on the right, for one season.
 *
 * These numbers come from the nightly sweep, not from a live count — so an
 * associate who sold this morning appears tomorrow. That is deliberate: it is
 * the same figure the associate sees on their own badge and the same one any
 * congratulations email quoted, and three surfaces disagreeing by a few hours
 * is worse than all three being one day old.
 */
export function DivisionMembers() {
  const [season, setSeason] = useState<number | null>(null);
  const summary = useDivisionSummary(season);
  const [picked, setPicked] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  /**
   * Until the admin picks one, show the division with the most associates in
   * it. Derived rather than set in an effect, so the first paint already has a
   * selection instead of flashing an empty table.
   */
  const fallback = useMemo(() => {
    const rows = summary.data?.tiers ?? [];
    if (!rows.length) return null;
    return [...rows].sort((a, b) => b.members - a.members)[0]?.key ?? rows[0].key;
  }, [summary.data]);

  const selected = picked ?? fallback;

  const members = useDivisionMembers(season, selected, {
    page,
    limit: PAGE_SIZE,
    search: search.trim() || undefined,
  });

  const current = summary.data?.tiers.find((t) => t.key === selected) ?? null;
  const total = members.data?.meta?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Which season is live comes from the server, not the browser's clock and not
  // the newest populated season — the latter marks a closed season "live" every
  // January until someone makes the year's first sale.
  const liveSeason = summary.data?.live_season_year ?? 0;
  const shownSeason = summary.data?.season_year ?? null;
  const isPastSeason = shownSeason !== null && shownSeason !== liveSeason;

  if (summary.isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 py-10">
        <Loader2 className="h-4 w-4 animate-spin" />
        Working out who is in which division…
      </div>
    );
  }

  if (summary.isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        Couldn&apos;t load divisions. Refresh and try again.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <label htmlFor="division-season" className="text-xs font-medium text-gray-500">
            Season
          </label>
          <select
            id="division-season"
            value={shownSeason ?? ""}
            onChange={(e) => {
              setSeason(Number(e.target.value));
              setPicked(null);
              setPage(1);
              setSearch("");
            }}
            className="h-9 rounded-md border border-gray-200 bg-white px-2.5 text-sm text-gray-900"
          >
            {(summary.data?.seasons ?? []).map((year) => (
              <option key={year} value={year}>
                {seasonLabel(year, liveSeason)}
              </option>
            ))}
          </select>
        </div>

        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {summary.data?.total_members.toLocaleString() ?? 0} in a division
          {(summary.data?.unranked ?? 0) > 0 && (
            <>
              {" · "}
              {summary.data?.unranked.toLocaleString()} yet to sell
            </>
          )}
        </p>
      </div>

      {isPastSeason && (
        /* A finished season is a frozen record, not a re-ranking against
           today's ladder — worth saying, because an admin who has just edited
           the thresholds will otherwise wonder why last year did not move. */
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          {shownSeason} has closed. These are the divisions associates finished on, ranked by
          the ladder as it stood then — editing the tiers now does not change them.
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
        <div className="space-y-2">
          {summary.data?.tiers.map((row) => (
            <TierButton
              key={row.key}
              row={row}
              active={row.key === selected}
              onSelect={() => {
                setPicked(row.key);
                setPage(1);
                setSearch("");
              }}
            />
          ))}
        </div>

        <div className="space-y-3 min-w-0">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">
                {current?.name ?? "Select a division"}
              </h3>
              {current && (
                <p className="text-xs text-gray-500">
                  {tierRangeLabel(current)} · {current.members.toLocaleString()} associate
                  {current.members === 1 ? "" : "s"}
                </p>
              )}
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
              <Input
                value={search}
                placeholder="Search name or email"
                className="pl-8 bg-white h-9"
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            {members.isLoading ? (
              <div className="flex items-center gap-2 text-sm text-gray-500 p-6">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading associates…
              </div>
            ) : members.isError ? (
              <p className="p-6 text-sm text-red-700">
                Couldn&apos;t load the associates in this division.
              </p>
            ) : (members.data?.items.length ?? 0) === 0 ? (
              <EmptyMembers searching={!!search.trim()} tier={current?.name} />
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th className="text-left font-medium px-4 py-2.5">Associate</th>
                    <th className="text-right font-medium px-4 py-2.5">Land placed</th>
                    <th className="text-right font-medium px-4 py-2.5">Sales</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {members.data?.items.map((m) => (
                    <tr key={m.user_id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="h-7 w-7 shrink-0 rounded-full bg-[#E0F2F1] text-[#00695C] text-[11px] font-semibold flex items-center justify-center">
                            {initials(m)}
                          </span>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate flex items-center gap-1.5">
                              {fullName(m)}
                              {!m.division_visible && (
                                /* Hidden from peers, not from ops. Shown so an
                                   admin who cannot find a known seller on the
                                   leaderboard has the answer here rather than
                                   filing a bug about the numbers. */
                                <span
                                  title="Opted out of peer tables — still ranked, hidden from other associates"
                                  className="inline-flex items-center gap-1 rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600"
                                >
                                  <EyeOff className="h-2.5 w-2.5" />
                                  Hidden
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500 truncate">{m.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900">
                        {formatSqm(m.sqm)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums text-gray-600">
                        {m.deals}
                      </td>
                      <td className="px-2 py-3">
                        <Link
                          href={`/users/${m.user_id}`}
                          className="text-gray-400 hover:text-[#00695C] inline-flex"
                          aria-label={`Open ${fullName(m)}`}
                        >
                          <ArrowUpRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>
                Page {page} of {totalPages} · {total.toLocaleString()} associate
                {total === 1 ? "" : "s"}
              </span>
              <div className="flex gap-2">
                <button
                  className="px-2.5 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </button>
                <button
                  className="px-2.5 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function TierButton({
  row,
  active,
  onSelect,
}: {
  row: DivisionSummaryRow;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      aria-current={active ? "true" : undefined}
      className={cn(
        "w-full text-left rounded-lg border px-3 py-2.5 transition-colors",
        active ? "border-[#00695C] bg-[#E0F2F1]" : "border-gray-200 bg-white hover:border-gray-300"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span
          className={cn(
            "text-sm font-medium truncate",
            active ? "text-[#00695C]" : "text-gray-900"
          )}
        >
          {row.name}
        </span>
        <span className="text-xs tabular-nums text-gray-600 shrink-0">
          {row.members.toLocaleString()}
        </span>
      </div>
      <p className="text-[11px] text-gray-500 mt-0.5">{tierRangeLabel(row)}</p>
      {row.members > 0 && (
        <p className="text-[11px] text-gray-500">{formatSqm(row.total_sqm)} between them</p>
      )}
    </button>
  );
}

function EmptyMembers({ searching, tier }: { searching: boolean; tier?: string }) {
  return (
    <div className="p-8 text-center space-y-2">
      <div className="mx-auto h-10 w-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
        <Users className="h-5 w-5" />
      </div>
      <p className="text-sm text-gray-600">
        {searching
          ? "No associate in this division matches that search."
          : `Nobody has placed enough land for ${tier ?? "this division"} this season.`}
      </p>
    </div>
  );
}
