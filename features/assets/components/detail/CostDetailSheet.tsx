"use client";

import { useState } from "react";
import { CheckCircle2, ChevronDown, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatNaira } from "@/lib/utils/format";

import { OFFER_TYPE_LABELS } from "../../schemas/asset.schema";
import {
  COST_GROUP_LABELS,
  COST_SOURCE_TYPE_LABELS,
  FINANCIAL_STAGE_LABELS,
  type AssetCostEvent,
  type FinancialStage,
} from "../../schemas/asset-cost.schema";
import { useCostObligation } from "../../hooks/use-cost-obligations";
import { useAcceptClaim, useApproveEvent } from "../../hooks/use-cost-events";
import { RecordStageAmountDialog } from "./RecordStageAmountDialog";
import { ReverseAdjustDialog } from "./ReverseAdjustDialog";
import { EditCostMetadataDialog } from "./EditCostMetadataDialog";

/** A forward stage is one the admin can choose to record — reversal/adjustment are backend-generated only. */
const RECORDABLE_STAGES: readonly FinancialStage[] = ["budget", "committed", "claimed", "incurred", "paid"];

const STATUS_TONE: Record<AssetCostEvent["status"], string> = {
  draft: "bg-muted text-muted-foreground",
  approved: "bg-emerald-500/10 text-emerald-600",
  reversed: "bg-rose-500/10 text-rose-600",
  archived: "bg-muted text-muted-foreground",
};

function ApproveButton({
  assetId,
  obligationId,
  eventId,
  stage,
}: {
  assetId: string;
  obligationId: string;
  eventId: string;
  stage: FinancialStage;
}) {
  const approve = useApproveEvent(assetId, obligationId, eventId);
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      disabled={approve.isPending}
      onClick={() =>
        approve.mutate(
          {},
          {
            onSuccess: () => toast.success(`${FINANCIAL_STAGE_LABELS[stage]} approved`),
            onError: (error) => toast.error(error.message || "Couldn't approve this entry"),
          }
        )
      }
    >
      {approve.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Approve"}
    </Button>
  );
}

function EventRow({
  assetId,
  obligationId,
  event,
  canManage,
  onReverse,
}: {
  assetId: string;
  obligationId: string;
  event: AssetCostEvent;
  canManage: boolean;
  onReverse: (event: AssetCostEvent) => void;
}) {
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3">
      <div className="w-24 shrink-0">
        <p className="text-sm font-medium">{event.stage_label || FINANCIAL_STAGE_LABELS[event.financial_stage]}</p>
        <span className={cn("inline-block rounded-full px-1.5 py-0.5 text-[10px] font-medium capitalize", STATUS_TONE[event.status])}>
          {event.status}
        </span>
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium tabular-nums">{event.amount != null ? formatNaira(event.amount) : "Not recorded"}</p>
        {event.vendor || event.reference ? (
          <p className="text-xs text-muted-foreground">
            {[event.vendor, event.reference].filter(Boolean).join(" · ")}
          </p>
        ) : null}
        {event.note ? <p className="text-xs text-muted-foreground">{event.note}</p> : null}
      </div>

      {canManage ? (
        <div className="flex shrink-0 items-center gap-2">
          {event.status === "draft" ? (
            <ApproveButton assetId={assetId} obligationId={obligationId} eventId={event.id} stage={event.financial_stage} />
          ) : null}
          {event.status === "approved" ? (
            <Button type="button" size="sm" variant="outline" onClick={() => onReverse(event)}>
              Reverse
            </Button>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

interface Props {
  assetId: string;
  obligationId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  canManage: boolean;
  canApprove: boolean;
}

/**
 * The View/Edit hub for one cost record (obligation) — every event ever
 * recorded against it (there is no separate "history" endpoint on the real
 * backend; the event list itself, with each entry's own status, IS the
 * history), plus entry points to add a new stage, reverse an approved one,
 * accept a field-submission claim, and edit the underlying cost item.
 */
export function CostDetailSheet({ assetId, obligationId, open, onOpenChange, canManage, canApprove }: Props) {
  const { data, isLoading, error } = useCostObligation(assetId, obligationId, { enabled: open });
  const acceptClaim = useAcceptClaim(assetId, obligationId ?? "");
  const [recordStage, setRecordStage] = useState<FinancialStage | null>(null);
  const [reverseTarget, setReverseTarget] = useState<AssetCostEvent | null>(null);
  const [editOpen, setEditOpen] = useState(false);

  const obligation = data?.obligation ?? null;
  const costItem = data?.cost_item ?? null;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
          <SheetHeader className="border-b px-6 py-5 text-left">
            <SheetTitle>{obligation ? obligation.title : "Cost detail"}</SheetTitle>
            <SheetDescription>
              {obligation && costItem
                ? `${COST_GROUP_LABELS[costItem.group ?? "acquisition"]} · ${costItem.name}${
                    obligation.product ? ` · ${OFFER_TYPE_LABELS[obligation.product]}` : " · Estate-wide"
                  }`
                : "Loading…"}
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
            {error ? (
              <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
                <h3 className="font-bold">Error loading this cost record</h3>
                <p>{error.message}</p>
              </div>
            ) : isLoading || !data || !obligation ? (
              <div className="space-y-3">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            ) : (
              <>
                {obligation.source_type !== "manual" ? (
                  <Badge variant="outline">
                    {COST_SOURCE_TYPE_LABELS[obligation.source_type]}
                    {obligation.source_id ? ` · ${obligation.source_id}` : ""}
                  </Badge>
                ) : null}

                <div className="flex items-center justify-between gap-2 rounded-lg border p-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Current recognised cost</p>
                    <p className="text-lg font-bold tabular-nums">{formatNaira(data.recognised_cost)}</p>
                  </div>
                  {canManage && obligation.status !== "archived" ? (
                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button type="button" size="sm" variant="outline">
                            Add stage
                            <ChevronDown className="ml-1.5 h-3.5 w-3.5" aria-hidden />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {RECORDABLE_STAGES.map((stage) => (
                            <DropdownMenuItem key={stage} onClick={() => setRecordStage(stage)}>
                              {FINANCIAL_STAGE_LABELS[stage]}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                      {canApprove && obligation.source_type === "field_submission" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          disabled={acceptClaim.isPending}
                          onClick={() =>
                            acceptClaim.mutate(
                              {},
                              {
                                onSuccess: () => toast.success("Claim accepted — it now counts against profit"),
                                onError: (error) => toast.error(error.message || "Couldn't accept this claim"),
                              }
                            )
                          }
                        >
                          {acceptClaim.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" />}
                          Accept claim
                        </Button>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                {data.events.length === 0 ? (
                  <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
                    No stages recorded yet.
                  </p>
                ) : (
                  <ul className="divide-y rounded-lg border">
                    {data.events.map((event) => (
                      <EventRow
                        key={event.id}
                        assetId={assetId}
                        obligationId={obligation.id}
                        event={event}
                        canManage={canManage && obligation.status !== "archived"}
                        onReverse={setReverseTarget}
                      />
                    ))}
                  </ul>
                )}

                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border p-3 text-sm">
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Vendor</dt>
                    <dd>{obligation.vendor ?? "—"}</dd>
                  </div>
                  <div>
                    <dt className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Reference</dt>
                    <dd>{obligation.reference ?? "—"}</dd>
                  </div>
                  {obligation.description ? (
                    <div className="col-span-2">
                      <dt className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Description</dt>
                      <dd className="whitespace-pre-wrap">{obligation.description}</dd>
                    </div>
                  ) : null}
                </dl>

                {canManage && costItem ? (
                  <Button type="button" variant="outline" size="sm" onClick={() => setEditOpen(true)}>
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Edit cost item
                  </Button>
                ) : null}
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {obligation && recordStage ? (
        <RecordStageAmountDialog
          assetId={assetId}
          obligationId={obligation.id}
          stage={recordStage}
          open={recordStage !== null}
          onOpenChange={(next) => {
            if (!next) setRecordStage(null);
          }}
        />
      ) : null}

      {obligation && reverseTarget ? (
        <ReverseAdjustDialog
          assetId={assetId}
          obligationId={obligation.id}
          eventId={reverseTarget.id}
          stage={reverseTarget.financial_stage}
          currentAmount={reverseTarget.amount}
          open={reverseTarget !== null}
          onOpenChange={(next) => {
            if (!next) setReverseTarget(null);
          }}
        />
      ) : null}

      {costItem ? (
        <EditCostMetadataDialog assetId={assetId} item={costItem} open={editOpen} onOpenChange={setEditOpen} />
      ) : null}
    </>
  );
}
