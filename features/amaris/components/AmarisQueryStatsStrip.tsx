"use client";

import {
  AlertCircle,
  CheckCircle2,
  Globe,
  MessageCircle,
  MessageSquare,
  MessagesSquare,
  Users,
} from "lucide-react";

import { cn } from "@/lib/utils";

import { useAmarisCounts } from "../hooks/use-amaris-queries";

/**
 * Counts for every question put to Amaris. The "No answer" tile is the one
 * that earns the strip its place: it is the handbook-gap backlog.
 *
 * Web/WhatsApp split is new with the REST module — v1's GraphQL log had no
 * channel concept.
 */
export function AmarisQueryStatsStrip() {
  const { data, isLoading } = useAmarisCounts();

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
    {
      label: "Web",
      value: data?.web,
      icon: Globe,
      cls: "text-gray-700 bg-gray-100",
    },
    {
      label: "WhatsApp",
      value: data?.whatsapp,
      icon: MessageCircle,
      cls: "text-green-700 bg-green-50",
    },
  ] as const;

  return (
    <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="min-w-0 rounded-xl border border-gray-200 bg-white p-3"
          title={"hint" in stat ? stat.hint : undefined}
        >
          <div className={cn("mb-2 inline-flex rounded-lg p-2", stat.cls)}>
            <stat.icon className="h-4 w-4" aria-hidden />
          </div>
          <p className="text-lg font-bold tabular-nums text-gray-900">
            {isLoading || stat.value === undefined ? "—" : stat.value.toLocaleString()}
          </p>
          <p className="truncate text-xs text-gray-500">{stat.label}</p>
        </div>
      ))}
    </div>
  );
}
