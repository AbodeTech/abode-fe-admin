"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import { useAssetHistory } from "../../hooks/use-asset-history";
import { ASSET_HISTORY_KIND_LABELS } from "../../schemas/asset-history.schema";
import { AssetEstateUpdates } from "./AssetEstateUpdates";
import { DetailPanel } from "./DetailPanel";

const PAGE = 30;

const shortDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "No date";

/**
 * Asset history — the design's Updates tab: one timeline of material land,
 * price, cost and physical-readiness changes, newest first.
 *
 * `useAssetHistory` merges it from six separate endpoints, because the
 * backend has no single history feed. Each line is one real record from one
 * of them, prefixed with the area it came from. If an area can't be read
 * (no permission, or its request failed), the panel says which, so a short
 * timeline is never mistaken for a complete one.
 */
export function AssetHistory({ assetId }: { assetId: string }) {
  const { entries, isLoading, missing } = useAssetHistory(assetId);
  const [shown, setShown] = useState(PAGE);

  return (
    <DetailPanel title="Asset history" description="Material land, price, cost and physical-readiness changes">
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ) : entries.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">Nothing has been recorded on this asset yet.</p>
      ) : (
        <>
          {entries.slice(0, shown).map((entry) => (
            <div key={entry.id} className="grid grid-cols-[95px_1fr] gap-3 border-t py-2.5 text-xs first:border-t-0 first:pt-0">
              <time className="text-[11px] text-muted-foreground">{shortDate(entry.at)}</time>
              <p>
                <strong className="font-semibold">{entry.title}</strong>
                <small className="mt-0.5 block text-muted-foreground">
                  {[ASSET_HISTORY_KIND_LABELS[entry.kind], ...entry.detail].join(" · ")}
                </small>
              </p>
            </div>
          ))}
          {entries.length > shown ? (
            <div className="border-t pt-3 text-center">
              <Button variant="outline" size="sm" onClick={() => setShown((count) => count + PAGE)}>
                Show {Math.min(PAGE, entries.length - shown)} more
              </Button>
            </div>
          ) : null}
        </>
      )}

      {missing.length > 0 ? (
        <p className="mt-3 border-t pt-3 text-[11px] text-amber-700">
          Not included: {missing.map((source) => `${source.label.toLowerCase()} (${source.reason})`).join("; ")}.
        </p>
      ) : null}
    </DetailPanel>
  );
}

const VIEWS = [
  { value: "history", label: "Asset history" },
  { value: "announcements", label: "Buyer announcements" },
] as const;

/**
 * The Updates tab. It opens on the design's Asset history. The second view is
 * the announcements feed (progress posts published to buyers), which is a
 * separate, working feature the design has no screen for; it stays reachable
 * here rather than being removed.
 *
 * The view is in the URL (`?view=announcements`), so either can be linked to,
 * and the announcements list keeps its own `status` and `page` params.
 */
export function AssetUpdates({ assetId }: { assetId: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const view = searchParams.get("view") === "announcements" ? "announcements" : "history";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {VIEWS.map((option) => (
          <button
            key={option.value}
            type="button"
            aria-pressed={view === option.value}
            onClick={() => router.replace(option.value === "history" ? "?" : `?view=${option.value}`, { scroll: false })}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs",
              view === option.value ? "border-foreground bg-foreground text-background" : "bg-background hover:bg-muted"
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {view === "history" ? <AssetHistory assetId={assetId} /> : <AssetEstateUpdates assetId={assetId} />}
    </div>
  );
}
