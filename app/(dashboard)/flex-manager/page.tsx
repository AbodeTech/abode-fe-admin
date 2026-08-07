"use client";

import { Loader2 } from "lucide-react";
import {
  useFlexManagerDashboard,
  FlexManagerSnapshot,
  UnassignedFlexManagerCard,
} from "@/features/flex-manager";

/**
 * FLEX Manager Performance Dashboard.
 *
 * Single-holder role: the page shows either the current holder's
 * dashboard or an empty state with an "Assign a FLEX Manager" CTA.
 *
 * TEMPORARY: uses a typed fixture hook while the BE ticket
 * (guidelines/Flex_Manager_Dashboard.md) is in flight. Once BE ships,
 * the hook body swaps to `execute()` — no consumer changes.
 */
export default function FlexManagerPage() {
  const { data, isLoading, isError, error } = useFlexManagerDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-500 text-sm gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading FLEX Manager dashboard…
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-[#AD1F2A]">
        Couldn't load the FLEX Manager dashboard.
        {error instanceof Error && (
          <div className="mt-1 text-xs text-red-800">{error.message}</div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 py-2">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">
          FLEX Manager Performance
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Single-holder role overseeing new customers, new sales, and
          recurring collections on the Flex product.
        </p>
      </div>

      {data.manager ? (
        <FlexManagerSnapshot
          manager={data.manager}
          period={data.period}
          target={data.target}
          score={data.performanceScore}
        />
      ) : (
        <UnassignedFlexManagerCard />
      )}
    </div>
  );
}
