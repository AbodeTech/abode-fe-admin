"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Loader2, Search, Users } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { useStandingMembers, useStandingSummary } from "../hooks/use-standing";
import {
  checkpointRangeLabel,
  formatSqm,
  type StandingSummaryRow,
} from "../schemas/standing.schema";

const PAGE_SIZE = 20;

const fullName = (m: { first_name: string; last_name: string }) =>
  `${m.first_name} ${m.last_name}`.trim() || "—";

const initials = (m: { first_name: string; last_name: string }) =>
  `${m.first_name?.[0] ?? ""}${m.last_name?.[0] ?? ""}`.toUpperCase() || "?";

const sinceLabel = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-NG", { month: "short", year: "numeric" })
    : "—";

/**
 * Who stands where: the ladder down the left, the buyers on the selected rung
 * on the right.
 *
 * Standing is derived from live plans on every read, so these numbers move when
 * a plan is cancelled or a size corrected. That is the point — nothing here is
 * a stored flag that can drift from the plans it came from.
 */
export function StandingMembers() {
  const summary = useStandingSummary();
  const [picked, setPicked] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  /**
   * Until the admin picks one, show the rung with the most buyers on it — the
   * one they are most likely here for. Derived rather than set in an effect, so
   * the first paint already has a selection instead of flashing an empty table.
   */
  const fallback = useMemo(() => {
    const rows = summary.data?.checkpoints ?? [];
    if (!rows.length) return null;
    return [...rows].sort((a, b) => b.members - a.members)[0]?.key ?? rows[0].key;
  }, [summary.data]);

  const selected = picked ?? fallback;

  const members = useStandingMembers(selected, {
    page,
    limit: PAGE_SIZE,
    search: search.trim() || undefined,
  });

  const current = summary.data?.checkpoints.find((c) => c.key === selected) ?? null;
  const total = members.data?.meta?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (summary.isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 py-10">
        <Loader2 className="h-4 w-4 animate-spin" />
        Working out who stands where…
      </div>
    );
  }

  if (summary.isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        Couldn&apos;t load standings. Refresh and try again.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5">
      <div className="space-y-2">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {summary.data?.total_members.toLocaleString() ?? 0} buyers with a standing
        </p>
        {summary.data?.checkpoints.map((row) => (
          <CheckpointButton
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
              {current?.name ?? "Select a tier"}
            </h3>
            {current && (
              <p className="text-xs text-gray-500">
                {checkpointRangeLabel(current)} · {current.members.toLocaleString()} buyer
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
              Loading buyers…
            </div>
          ) : members.isError ? (
            <p className="p-6 text-sm text-red-700">
              Couldn&apos;t load the buyers on this tier.
            </p>
          ) : (members.data?.items.length ?? 0) === 0 ? (
            <EmptyMembers searching={!!search.trim()} tier={current?.name} />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="text-left font-medium px-4 py-2.5">Buyer</th>
                  <th className="text-right font-medium px-4 py-2.5">Land held</th>
                  <th className="text-right font-medium px-4 py-2.5">Plots</th>
                  <th className="text-left font-medium px-4 py-2.5">Owner since</th>
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
                          <p className="font-medium text-gray-900 truncate">{fullName(m)}</p>
                          <p className="text-xs text-gray-500 truncate">{m.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums font-medium text-gray-900">
                      {formatSqm(m.sqm)}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-gray-600">
                      {m.plots}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{sinceLabel(m.since)}</td>
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
              Page {page} of {totalPages} · {total.toLocaleString()} buyer
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
  );
}

function CheckpointButton({
  row,
  active,
  onSelect,
}: {
  row: StandingSummaryRow;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      aria-current={active ? "true" : undefined}
      className={cn(
        "w-full text-left rounded-lg border px-3 py-2.5 transition-colors",
        active
          ? "border-[#00695C] bg-[#E0F2F1]"
          : "border-gray-200 bg-white hover:border-gray-300"
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
      <p className="text-[11px] text-gray-500 mt-0.5">{checkpointRangeLabel(row)}</p>
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
          ? "No buyer on this tier matches that search."
          : `Nobody holds enough land for ${tier ?? "this tier"} yet.`}
      </p>
    </div>
  );
}
