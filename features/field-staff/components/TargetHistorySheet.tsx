"use client";

import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

import { SCORECARD_STATE_LABELS, type FieldScorecard } from "../schemas/scorecard.schema";
import { useFieldScorecards } from "../hooks/use-field-scorecards";
import { formatDateTime, formatPeriod, formatQuantity } from "../lib/format";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";

function Version({ card }: { card: FieldScorecard }) {
  return (
    <li className={cn("rounded-lg border p-4", card.is_current && "border-foreground/40")}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold">
          Version {card.version} · {SCORECARD_STATE_LABELS[card.state]}
        </p>
        {card.is_current ? (
          <span className="rounded-full bg-[#E0F2F1] px-2 py-0.5 text-xs font-medium text-[#00695C]">Current</span>
        ) : (
          <span className="text-xs text-muted-foreground">Replaced</span>
        )}
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {card.published_at ? `Published ${formatDateTime(card.published_at)}` : `Created ${formatDateTime(card.created_at)}`}
        {card.finalised_at && ` · finalised ${formatDateTime(card.finalised_at)}`}
      </p>
      {card.restatement_reason && (
        <p className="mt-2 rounded-md bg-muted/60 px-3 py-2 text-sm">
          <span className="font-medium">{card.is_restatement ? "Restated because: " : "Changed because: "}</span>
          {card.restatement_reason}
        </p>
      )}
      <ul className="mt-3 space-y-1.5 text-sm">
        {card.targets.map((t) => (
          <li key={t.metric_key} className="flex justify-between gap-3">
            <span>
              {t.label}
              {t.note && <span className="block text-xs text-muted-foreground">{t.note}</span>}
            </span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {formatQuantity(t.target, t.unit)} · {t.weight}%
            </span>
          </li>
        ))}
        {card.targets.length === 0 && <li className="text-muted-foreground">No metrics included</li>}
      </ul>
      {!card.weights_complete && card.targets.length > 0 && (
        <p className="mt-2 text-xs text-amber-700">Weights total {card.weight_total}%, not 100%.</p>
      )}
    </li>
  );
}

interface TargetHistorySheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  staffId: string;
  asset: { id: string; name: string };
  year: number;
  month: number;
}

/** Every version of one month's targets, newest first, with the reason for each change. */
export function TargetHistorySheet({ open, onOpenChange, staffId, asset, year, month }: TargetHistorySheetProps) {
  const versions = useFieldScorecards(
    { field_staff_id: staffId, asset_id: asset.id, year, month, current_only: false, limit: 100 },
    { enabled: open }
  );
  const rows = [...(versions.data?.items ?? [])].sort((a, b) => b.version - a.version);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Target history</SheetTitle>
          <SheetDescription>
            {asset.name} · {formatPeriod(year, month)}
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-6">
          {versions.isLoading ? (
            <div className="flex justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : versions.error ? (
            <p className="text-sm text-[#AD1F2A]">{versions.error.message}</p>
          ) : rows.length === 0 ? (
            <p className="text-sm text-muted-foreground">No targets have been set for this month.</p>
          ) : (
            <ol className="space-y-3">
              {rows.map((card) => (
                <Version key={card.id} card={card} />
              ))}
            </ol>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
