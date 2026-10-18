"use client";

import { Fragment, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Loader2,
} from "lucide-react";

import { cn } from "@/lib/utils";

import {
  AMARIS_AUDIENCE_LABELS,
  AMARIS_CHANNEL_LABELS,
  askerInitials,
  askerName,
  type AmarisQueryRow,
} from "../schemas/amaris.schema";

/* ============================================================
 * The query log. Read-only — a row expands to the full question and answer;
 * a "No answer" row expands to the handbook-gap callout instead, because
 * that is the action the log exists to prompt.
 * ============================================================ */

interface Props {
  rows: AmarisQueryRow[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  emptyLabel?: string;
}

const formatWhen = (iso: string) => {
  const date = new Date(iso);
  return date.toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" });
};

const formatTime = (iso: string) => {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
};

function AudiencePill({ audience }: { audience: AmarisQueryRow["audience"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        audience === "customer" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"
      )}
    >
      {AMARIS_AUDIENCE_LABELS[audience]}
    </span>
  );
}

function ChannelPill({ channel }: { channel: AmarisQueryRow["channel"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        channel === "whatsapp" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"
      )}
    >
      {AMARIS_CHANNEL_LABELS[channel]}
    </span>
  );
}

function StatusPill({ answered }: { answered: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        answered ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-[#AD1F2A]"
      )}
    >
      {answered ? (
        <>
          <CheckCircle2 className="h-3 w-3" aria-hidden />
          Answered
        </>
      ) : (
        <>
          <AlertCircle className="h-3 w-3" aria-hidden />
          No answer
        </>
      )}
    </span>
  );
}

export function AmarisQueryTable({
  rows,
  isLoading,
  isError,
  errorMessage,
  emptyLabel = "No questions match this filter.",
}: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (isLoading && rows.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        Loading questions…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-[#AD1F2A]">
        Couldn&apos;t load Amaris questions.
        {errorMessage ? <div className="mt-1 text-xs text-red-800">{errorMessage}</div> : null}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-8 text-center text-sm text-gray-500">
        {emptyLabel}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 text-left text-[11px] uppercase tracking-wide text-gray-500">
              <th className="w-8 px-4 py-2.5"></th>
              <th className="px-4 py-2.5 font-medium">Asker</th>
              <th className="px-4 py-2.5 font-medium">Audience</th>
              <th className="px-4 py-2.5 font-medium">Channel</th>
              <th className="px-4 py-2.5 font-medium">Question</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">When</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isOpen = Boolean(expanded[row.id]);
              return (
                <Fragment key={row.id}>
                  <tr
                    className={cn(
                      "cursor-pointer border-t border-gray-100 align-top hover:bg-gray-50/60",
                      isOpen && "bg-gray-50/40"
                    )}
                    onClick={() => setExpanded((state) => ({ ...state, [row.id]: !state[row.id] }))}
                  >
                    <td className="px-4 py-3 align-top">
                      <button
                        type="button"
                        className="text-gray-400 hover:text-gray-700"
                        aria-expanded={isOpen}
                        aria-label={isOpen ? "Collapse row" : "Expand row"}
                      >
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4" aria-hidden />
                        ) : (
                          <ChevronRight className="h-4 w-4" aria-hidden />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#E0F2F1] text-[11px] font-semibold text-[#00695C]">
                          {askerInitials(row)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate font-medium leading-tight text-gray-900">
                            {askerName(row)}
                          </p>
                          <p className="truncate text-xs leading-tight text-gray-500">
                            {row.email || row.phone || "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <AudiencePill audience={row.audience} />
                    </td>
                    <td className="px-4 py-3">
                      <ChannelPill channel={row.channel} />
                    </td>
                    <td className="max-w-md px-4 py-3 text-gray-800">
                      <p className={cn("leading-snug", !isOpen && "line-clamp-2")}>{row.question}</p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill answered={row.answered} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-xs tabular-nums text-gray-500">
                      {formatWhen(row.createdAt)}
                      <span className="block text-[10px] text-gray-400">{formatTime(row.createdAt)}</span>
                    </td>
                  </tr>
                  {isOpen ? (
                    <tr className="border-t border-gray-100 bg-gray-50/50">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="max-w-4xl space-y-3">
                          <div>
                            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-gray-500">
                              Question
                            </p>
                            <p className="whitespace-pre-wrap text-sm text-gray-800">{row.question}</p>
                          </div>
                          <div>
                            <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-gray-500">
                              Answer
                            </p>
                            {row.answered && row.answer ? (
                              <p className="whitespace-pre-wrap text-sm text-gray-800">{row.answer}</p>
                            ) : (
                              <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
                                <span>
                                  Amaris returned {row.answer ? "an unresolved answer" : "[NO_ANSWER]"} —
                                  worth adding to the handbook so this question is covered next time.
                                </span>
                              </div>
                            )}
                          </div>
                          {row.phone ? (
                            <div>
                              <p className="mb-1 text-[11px] font-medium uppercase tracking-wide text-gray-500">
                                Phone
                              </p>
                              <p className="text-sm text-gray-800">{row.phone}</p>
                            </div>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
