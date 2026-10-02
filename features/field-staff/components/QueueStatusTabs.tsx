"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";

import type { SubmissionStatus } from "../schemas/submission.schema";

export const QUEUE_TABS = [
  { key: "waiting", label: "Waiting", status: "submitted" },
  { key: "verified", label: "Verified", status: "verified" },
  { key: "rejected", label: "Rejected", status: "rejected" },
  { key: "reversed", label: "Reversed", status: "reversed" },
] as const satisfies readonly { key: string; label: string; status: SubmissionStatus }[];

export type QueueTab = (typeof QUEUE_TABS)[number];

/** Reads `?tab=`; anything unrecognised means the waiting queue. */
export function useQueueTab(): QueueTab {
  const value = useSearchParams().get("tab");
  return QUEUE_TABS.find((t) => t.key === value) ?? QUEUE_TABS[0];
}

/**
 * Waiting work, then past decisions one status per tab — the list endpoint
 * filters by a single status, so there's no combined "all decisions" view.
 */
export function QueueStatusTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = useQueueTab();

  const select = (key: QueueTab["key"]) => {
    const params = new URLSearchParams(searchParams.toString());
    if (key === "waiting") params.delete("tab");
    else params.set("tab", key);
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="inline-flex w-fit rounded-lg bg-muted p-1" role="tablist" aria-label="Review status">
      {QUEUE_TABS.map((t) => (
        <button
          key={t.key}
          type="button"
          role="tab"
          aria-selected={active.key === t.key}
          onClick={() => select(t.key)}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm transition-colors",
            active.key === t.key ? "bg-white font-semibold shadow-sm" : "text-muted-foreground hover:text-foreground"
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
