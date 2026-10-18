"use client";

import Link from "next/link";
import { TriangleAlert } from "lucide-react";

import { useAdminPermissions } from "@/hooks/use-admin-permission";
import { formatSqmExact } from "@/lib/utils/format";

import { useCostCoverage } from "../../hooks/use-cost-coverage";
import { useLandConfiguration } from "../../hooks/use-land-configuration";

type Issue = { text: string; target: "land" | "costs" };

function plural(count: number, one: string, many: string): string {
  return `${count.toLocaleString()} ${count === 1 ? one : many}`;
}

/** "a", "a and b", "a, b and c" — then a capital and a full stop. */
function sentence(parts: string[]): string {
  const joined =
    parts.length <= 1 ? (parts[0] ?? "") : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
  return `${joined.charAt(0).toUpperCase()}${joined.slice(1)}.`;
}

/**
 * The Overview's "needs attention" strip. Every line is read from a real
 * endpoint, and nothing is shown at all when there is nothing to fix:
 *
 *  - land that belongs to no product and no road/service — `unclassified_sqm`
 *    on GET .../land-configuration, plus that endpoint's own `warnings`;
 *  - cost items the profit figure can't trust yet — `totals.incomplete` and
 *    `totals.entries_without_an_amount` on GET .../costs/coverage.
 *
 * "Review issues" goes to whichever side has the first problem: the land
 * editor (`onReviewLand`) or the Costs tab.
 */
export function AssetAttentionBanner({ assetId, onReviewLand }: { assetId: string; onReviewLand: () => void }) {
  const permissions = useAdminPermissions();
  const { data: land } = useLandConfiguration(assetId, { enabled: permissions.has("view_assets") });
  const { data: coverage } = useCostCoverage(assetId, { enabled: permissions.has("view_asset_costs") });

  const issues: Issue[] = [];

  if (land && land.state !== "not_configured") {
    if (land.unclassified_sqm > 0) {
      issues.push({ text: `${formatSqmExact(land.unclassified_sqm)} is unclassified`, target: "land" });
    }
    if (land.warnings.length > 0) {
      issues.push({
        text: `the land account has ${plural(land.warnings.length, "warning", "warnings")}`,
        target: "land",
      });
    }
  }

  if (coverage) {
    if (coverage.totals.incomplete > 0) {
      issues.push({
        text: `${plural(coverage.totals.incomplete, "cost item is", "cost items are")} incomplete`,
        target: "costs",
      });
    }
    if (coverage.totals.entries_without_an_amount > 0) {
      issues.push({
        text: `${plural(coverage.totals.entries_without_an_amount, "cost entry has", "cost entries have")} no amount`,
        target: "costs",
      });
    }
  }

  if (issues.length === 0) return null;

  const reviewClass = "shrink-0 whitespace-nowrap text-xs font-medium hover:underline sm:ml-auto";

  return (
    <aside className="flex flex-col items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3.5 py-3 sm:flex-row">
      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
      <div className="min-w-0">
        <strong className="block text-[13px] font-semibold">
          {plural(issues.length, "item needs", "items need")} attention before this asset is fully reconciled
        </strong>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          {sentence(issues.map((issue) => issue.text))}
        </p>
      </div>
      {issues[0].target === "land" ? (
        <button type="button" onClick={onReviewLand} className={reviewClass}>
          Review issues →
        </button>
      ) : (
        <Link href={`/assets/${assetId}/costs`} className={reviewClass}>
          Review issues →
        </Link>
      )}
    </aside>
  );
}
