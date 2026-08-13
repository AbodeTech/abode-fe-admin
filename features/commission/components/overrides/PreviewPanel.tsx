"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, FlaskConical, Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPercent } from "@/lib/utils/format";
import { cn } from "@/lib/utils";

import {
  COMMISSION_LEG_LABELS,
  OFFER_TYPES,
  OFFER_TYPE_LABELS,
  OVERRIDE_SOURCE_LABELS,
  type OfferType,
} from "../../schemas/commission.schema";
import { useCommissionPreview } from "../../hooks/use-commission-preview";
import { AssetPicker } from "../shared/AssetPicker";
import { UserPicker } from "@/components/shared/UserPicker";

/* ============================================================
 * The dry-run (ticket 9b) — "what would this referrer actually earn?"
 *
 * The server resolves the asset_user → user → asset → default chain and says,
 * per leg, which level won. The frontend never reimplements that chain
 * (design decision in COMMISSION-ADMIN-DESIGN.md): duplicated resolution
 * rules drift, and this panel exists precisely to show the truth.
 *
 * A standalone panel rather than the in-dialog preview the design first
 * sketched: the endpoint requires user + asset + offer type, and only the
 * asset+user dialog has all three. Here the admin picks any combination.
 * ============================================================ */

export function PreviewPanel() {
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState("");
  const [assetId, setAssetId] = useState("");
  const [offerType, setOfferType] = useState<OfferType | "">("");

  const preview = useCommissionPreview({ userId, assetId, offerType });
  const ready = Boolean(userId && assetId && offerType);

  return (
    <section className="rounded-lg border">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-4 py-3 text-left hover:bg-muted/40"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        )}
        <FlaskConical className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="font-medium">Preview earnings</span>
        <span className="hidden text-sm text-muted-foreground sm:inline">
          — dry-run what a referrer would earn on an asset, without touching anything
        </span>
      </button>

      {open ? (
        <div className="space-y-4 border-t p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="min-w-0 space-y-1">
              <p className="text-xs text-muted-foreground">Referrer</p>
              <UserPicker value={userId} onChange={setUserId} placeholder="Select a referrer" />
            </div>
            <div className="min-w-0 space-y-1">
              <p className="text-xs text-muted-foreground">Asset</p>
              <AssetPicker value={assetId} onChange={setAssetId} />
            </div>
            <div className="min-w-0 space-y-1">
              <p className="text-xs text-muted-foreground">Offer type</p>
              <Select
                value={offerType}
                onValueChange={(value) => setOfferType(value as OfferType)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose" />
                </SelectTrigger>
                <SelectContent>
                  {OFFER_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {OFFER_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!ready ? (
            <p className="text-sm text-muted-foreground">
              Pick a referrer, an asset and an offer type to resolve the rates.
            </p>
          ) : preview.isLoading ? (
            <p className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Resolving…
            </p>
          ) : preview.error ? (
            <p className="text-sm text-destructive">
              {preview.error.message || "Couldn't resolve the preview"}
            </p>
          ) : preview.data ? (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <Badge variant="outline" className="capitalize">
                  {preview.data.referrer_tier.replace(/-/g, " ")}
                </Badge>
                <span>Config v{preview.data.config_version}</span>
                <span>WHT {formatPercent(preview.data.wht_rate)}</span>
              </div>

              <div className="space-y-1.5">
                {preview.data.rates.map((leg) => (
                  <div
                    key={leg.commission_tier}
                    className={cn(
                      "flex flex-wrap items-baseline gap-x-3 gap-y-0.5 text-sm",
                      !leg.applies && "opacity-60"
                    )}
                  >
                    <span className="w-16 text-muted-foreground">
                      {COMMISSION_LEG_LABELS[leg.commission_tier]}
                    </span>
                    <span className="font-medium tabular-nums">
                      {leg.rate != null ? formatPercent(leg.rate) : "—"}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {leg.override_source
                        ? `← ${OVERRIDE_SOURCE_LABELS[leg.override_source]}`
                        : leg.applies
                          ? ""
                          : "pays nobody at this tier"}
                    </span>
                  </div>
                ))}
              </div>

              <p className="text-xs text-muted-foreground">
                Rates a purchase made right now would freeze. Existing payment plans keep the
                rates they were created with.
              </p>
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
