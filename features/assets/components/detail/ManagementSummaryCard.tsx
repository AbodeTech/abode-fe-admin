"use client";

import { CalendarDays, ChartNoAxesCombined, Map, ShoppingCart, type LucideIcon } from "lucide-react";

import { useAdminPermissions } from "@/hooks/use-admin-permission";
import { cn } from "@/lib/utils";
import { formatSqmExact } from "@/lib/utils/format";

import { useAssetAllocationEvents } from "../../hooks/use-asset-allocation-events";
import { useCostCoverage } from "../../hooks/use-cost-coverage";
import { useEstateProfitability } from "../../hooks/use-estate-profitability";
import { useLandConfiguration } from "../../hooks/use-land-configuration";
import { useSqmInventory } from "../../hooks/use-sqm-inventory";
import { formatEventDate, nextAllocationEvent } from "../../schemas/allocation-event.schema";
import { ledgerTotals, productPositions } from "../../schemas/sqm-inventory.schema";
import { DetailPanel } from "./DetailPanel";

type Tone = "neutral" | "good" | "warn";

const TONE_CLASS: Record<Tone, string> = {
  neutral: "",
  good: "text-emerald-600",
  warn: "text-amber-600",
};

function Question({
  icon: Icon,
  question,
  detail,
  answer,
  tone = "neutral",
}: {
  icon: LucideIcon;
  question: string;
  detail: string;
  answer: string;
  tone?: Tone;
}) {
  return (
    <div className="grid grid-cols-[32px_1fr_auto] items-center gap-2.5 border-t py-2.5 first:border-t-0 first:pt-0 last:pb-0">
      <div className="grid size-7.5 place-items-center rounded-md bg-muted">
        <Icon className="h-4 w-4" aria-hidden />
      </div>
      <div className="min-w-0">
        <strong className="block text-xs font-semibold">{question}</strong>
        <small className="text-[11px] text-muted-foreground">{detail}</small>
      </div>
      <b className={cn("text-xs font-semibold tabular-nums", TONE_CLASS[tone])}>{answer}</b>
    </div>
  );
}

const percent = (value: number) => `${value.toFixed(1)}%`;

/**
 * "The four questions this asset must answer" — each row is one real endpoint,
 * and shows an em-dash rather than a made-up figure when that endpoint has
 * nothing to say yet (or the admin can't see it):
 *
 *  1. Is all land accounted for?      GET .../land-configuration
 *  2. What is commercially available? GET .../sqm-inventory (per-product roll-up)
 *  3. Next physical allocation event  GET /admin/company-events?asset_id=
 *  4. Is the asset profitable?        GET .../profitability + .../costs/coverage
 */
export function ManagementSummaryCard({ assetId }: { assetId: string }) {
  const permissions = useAdminPermissions();
  const canViewAssets = permissions.has("view_assets");
  const canViewProfit = permissions.has("view_asset_profitability");

  const { data: land } = useLandConfiguration(assetId, { enabled: canViewAssets });
  const { data: inventory } = useSqmInventory(assetId, { enabled: canViewAssets });
  const { data: events } = useAssetAllocationEvents(assetId, { enabled: permissions.has("view_allocations") });
  const { data: profitability } = useEstateProfitability(assetId, undefined, { enabled: canViewProfit });
  const { data: coverage } = useCostCoverage(assetId, { enabled: permissions.has("view_asset_costs") });

  // 1. Land
  const total = land?.total_land_sqm ?? null;
  const landConfigured = Boolean(land && land.state !== "not_configured" && total);
  const unclassified = land?.unclassified_sqm ?? 0;

  // 2. Commercial availability
  const products = inventory ? productPositions(inventory.positions) : [];
  const ledger = ledgerTotals(products);
  const ledgerLive = Boolean(inventory?.sqm_inventory_active && ledger.capacity_sqm > 0);

  // 3. Next event
  const nextEvent = events ? nextAllocationEvent(events.items) : null;

  // 4. Profit
  const margin = profitability?.summary.margin_pct ?? null;
  const unknownCosts = coverage?.totals.incomplete ?? 0;

  return (
    <DetailPanel title="Management summary" description="The four questions this asset must answer">
      <Question
        icon={Map}
        question="Is all land accounted for?"
        detail={
          !landConfigured
            ? "Land account not configured"
            : unclassified > 0
              ? `${formatSqmExact(unclassified)} needs classification`
              : "Every sqm is classified"
        }
        answer={landConfigured && total ? percent(((total - unclassified) / total) * 100) : "—"}
        tone={!landConfigured ? "neutral" : unclassified > 0 ? "warn" : "good"}
      />
      <Question
        icon={ShoppingCart}
        question="What is commercially available?"
        detail={
          ledgerLive
            ? `${formatSqmExact(ledger.available_sqm)} across ${products.length} product${products.length === 1 ? "" : "s"}`
            : "Sqm ledger not active — still on legacy units"
        }
        answer={ledgerLive ? percent((ledger.available_sqm / ledger.capacity_sqm) * 100) : "—"}
      />
      <Question
        icon={CalendarDays}
        question="Next physical allocation event"
        detail={nextEvent ? `${formatEventDate(nextEvent.starts_at)} · ${nextEvent.title}` : "None scheduled"}
        answer={
          nextEvent
            ? `${nextEvent.reserved_size.toLocaleString()} ${nextEvent.size_unit ?? "sqm"}`
            : "—"
        }
        tone={nextEvent ? "good" : "neutral"}
      />
      <Question
        icon={ChartNoAxesCombined}
        question="Is the asset profitable?"
        detail={
          !canViewProfit
            ? "Needs the view_asset_profitability permission"
            : unknownCosts > 0
              ? `Excludes ${unknownCosts} incomplete cost item${unknownCosts === 1 ? "" : "s"}`
              : "Net margin on recognised costs"
        }
        answer={margin == null ? "—" : percent(margin)}
        tone={margin == null ? "neutral" : margin >= 0 && unknownCosts === 0 ? "good" : "warn"}
      />
    </DetailPanel>
  );
}
