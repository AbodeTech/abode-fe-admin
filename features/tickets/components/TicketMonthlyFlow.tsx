"use client";

import { useState } from "react";
import { ChevronRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { MonthlyFlowChart, flowRatio } from "@/components/shared/MonthlyFlowChart";
import { useTicketMonthlyFlow } from "../hooks/use-tickets";

/**
 * Tickets in against tickets out, for the inbox.
 *
 * Folded away by default. The inbox is a working screen — somebody opens it to
 * answer a customer, not to read a trend — so this waits behind one click, and
 * does not fetch until it is opened. The headline rides on the toggle row, so
 * the answer does not need the chart, only the click.
 *
 * The chart itself is shared with the CS-manager performance page; the shape of
 * the question is identical, only the scope differs.
 */
export function TicketMonthlyFlow({ months = 6 }: { months?: number }) {
  const [open, setOpen] = useState(false);
  const { data, isLoading, isError } = useTicketMonthlyFlow(months, open);

  const points = data ?? [];
  const { totalIn, totalOut, ratio } = flowRatio(points);

  return (
    <div className="rounded-lg border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3 py-2.5 text-left"
      >
        <ChevronRight
          className={cn(
            "h-4 w-4 shrink-0 text-gray-400 transition-transform",
            open && "rotate-90"
          )}
        />
        <span className="text-sm font-medium text-gray-900">Trends this month</span>
        <span className="text-xs text-gray-500">Came in vs resolved</span>
        {open && ratio !== null && (
          <span className="ml-auto text-xs text-gray-600">
            <span className="font-semibold tabular-nums text-gray-900">
              {totalOut.toLocaleString()}
            </span>{" "}
            resolved of{" "}
            <span className="font-semibold tabular-nums text-gray-900">
              {totalIn.toLocaleString()}
            </span>{" "}
            in ·{" "}
            <span
              className={
                ratio >= 1 ? "font-semibold text-[#1baf7a]" : "font-semibold text-[#AD1F2A]"
              }
            >
              {ratio >= 1 ? "keeping up" : "falling behind"}
            </span>
          </span>
        )}
      </button>

      {open && (
        <div className="border-t border-gray-100 p-4 pt-3">
          {isLoading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading the monthly view…
            </div>
          ) : isError || !points.length ? (
            // The queue below still works without this, so a failure is
            // reported quietly rather than taking the page down.
            <p className="py-4 text-[11px] text-gray-500">
              The monthly view is unavailable right now.
            </p>
          ) : (
            <>
              <p className="mb-3 text-xs text-gray-500">
                Counted in the month each happened — a ticket resolved this month
                usually arrived in an earlier one.
              </p>
              <MonthlyFlowChart points={points} />
            </>
          )}
        </div>
      )}
    </div>
  );
}
