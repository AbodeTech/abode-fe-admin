"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AssistantAudience, type GetAssistantQueriesQuery } from "@/lib/gql/graphql";

type Row = GetAssistantQueriesQuery["getAssistantQueries"]["data"][number];

interface Props {
  rows: Row[];
  isLoading: boolean;
  isError: boolean;
  errorMessage?: string;
  emptyLabel?: string;
}

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const formatWhen = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

const initialsOf = (r: Row) =>
  ((r.lastName?.[0] ?? "") + (r.firstName?.[0] ?? "")).toUpperCase() ||
  r.email[0].toUpperCase();

const fullName = (r: Row) =>
  `${r.lastName ?? ""} ${r.firstName ?? ""}`.trim() || r.email;

export function AssistantQueryTable({
  rows,
  isLoading,
  isError,
  errorMessage,
  emptyLabel = "No questions match this filter.",
}: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (isLoading && rows.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 flex items-center justify-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading questions…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-[#AD1F2A]">
        Couldn&apos;t load Ilé assistant questions.
        {errorMessage && (
          <div className="mt-1 text-xs text-red-800">{errorMessage}</div>
        )}
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
    <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-gray-500 bg-gray-50">
              <th className="px-4 py-2.5 w-8"></th>
              <th className="px-4 py-2.5 font-medium">Asker</th>
              <th className="px-4 py-2.5 font-medium">Audience</th>
              <th className="px-4 py-2.5 font-medium">Question</th>
              <th className="px-4 py-2.5 font-medium">Status</th>
              <th className="px-4 py-2.5 font-medium">When</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const isOpen = !!expanded[r.id];
              return (
                <>
                  <tr
                    key={r.id}
                    className={cn(
                      "border-t border-gray-100 hover:bg-gray-50/60 cursor-pointer align-top",
                      isOpen && "bg-gray-50/40"
                    )}
                    onClick={() =>
                      setExpanded((s) => ({ ...s, [r.id]: !s[r.id] }))
                    }
                  >
                    <td className="px-4 py-3 align-top">
                      <button
                        type="button"
                        className="text-gray-400 hover:text-gray-700"
                        aria-label={isOpen ? "Collapse row" : "Expand row"}
                      >
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-full bg-[#E0F2F1] text-[#00695C] flex items-center justify-center text-[11px] font-semibold shrink-0">
                          {initialsOf(r)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 leading-tight truncate">
                            {fullName(r)}
                          </p>
                          <p className="text-xs text-gray-500 leading-tight truncate">
                            {r.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <AudiencePill audience={r.audience} />
                    </td>
                    <td className="px-4 py-3 text-gray-800 max-w-md">
                      <p className={cn("leading-snug", !isOpen && "line-clamp-2")}>
                        {r.question}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill answered={r.answered} />
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 tabular-nums whitespace-nowrap">
                      {formatWhen(r.createdAt)}
                      <span className="block text-[10px] text-gray-400">
                        {formatTime(r.createdAt)}
                      </span>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr
                      key={`${r.id}-detail`}
                      className="border-t border-gray-100 bg-gray-50/50"
                    >
                      <td colSpan={6} className="px-4 py-4">
                        <div className="max-w-4xl space-y-3">
                          <div>
                            <p className="text-[11px] uppercase tracking-wide text-gray-500 font-medium mb-1">
                              Question
                            </p>
                            <p className="text-sm text-gray-800 whitespace-pre-wrap">
                              {r.question}
                            </p>
                          </div>
                          <div>
                            <p className="text-[11px] uppercase tracking-wide text-gray-500 font-medium mb-1">
                              Answer
                            </p>
                            {r.answered && r.answer ? (
                              <p className="text-sm text-gray-800 whitespace-pre-wrap">
                                {r.answer}
                              </p>
                            ) : (
                              <div className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                                <span>
                                  Amaris returned {r.answer ? "an unresolved answer" : "[NO_ANSWER]"} —
                                  worth adding to the handbook so this question is covered next time.
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AudiencePill({ audience }: { audience: AssistantAudience }) {
  const isCustomer = audience === AssistantAudience.Customer;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
        isCustomer
          ? "bg-blue-50 text-blue-700"
          : "bg-purple-50 text-purple-700"
      )}
    >
      {isCustomer ? "Customer" : "Associate"}
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
          <CheckCircle2 className="h-3 w-3" />
          Answered
        </>
      ) : (
        <>
          <AlertCircle className="h-3 w-3" />
          No answer
        </>
      )}
    </span>
  );
}
