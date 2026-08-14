"use client";

import {
  MessageSquare,
  MessagesSquare,
  Users,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAssistantQueryCounts } from "../hooks/use-assistant-queries";

/** Portfolio-style counts for every question put to Amaris. */
export function AssistantQueryStatsStrip() {
  const { data, isLoading } = useAssistantQueryCounts();

  const stats = [
    {
      label: "Total questions",
      value: data?.total,
      icon: MessagesSquare,
      cls: "text-[#00695C] bg-[#E0F2F1]",
    },
    {
      label: "Customer",
      value: data?.customer,
      icon: MessageSquare,
      cls: "text-blue-700 bg-blue-50",
    },
    {
      label: "Associate",
      value: data?.associate,
      icon: Users,
      cls: "text-purple-700 bg-purple-50",
    },
    {
      label: "Answered",
      value: data?.answered,
      icon: CheckCircle2,
      cls: "text-emerald-700 bg-emerald-50",
    },
    {
      label: "No answer",
      value: data?.noAnswer,
      icon: AlertCircle,
      cls: "text-[#AD1F2A] bg-red-50",
      hint: "Handbook content gap — Amaris returned [NO_ANSWER].",
    },
  ] as const;

  return (
    <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-gray-200 bg-white p-4 flex items-center gap-3"
          title={"hint" in s ? s.hint : undefined}
        >
          <div className={cn("h-8 w-8 rounded-lg flex items-center justify-center shrink-0", s.cls)}>
            <s.icon className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p className="text-lg font-bold text-gray-900 leading-tight tabular-nums">
              {isLoading || s.value === undefined
                ? "—"
                : s.value.toLocaleString()}
            </p>
            <p className="text-xs text-gray-600 leading-tight">{s.label}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
