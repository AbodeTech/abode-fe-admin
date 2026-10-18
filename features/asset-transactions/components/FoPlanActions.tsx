"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatNaira } from "@/lib/utils/format";

import {
  FO_PLAN_SUSPEND_REASON_MIN,
  allocateFoPlanSchema,
  foPlanSuspendReasonSchema,
  type FoLandPlan,
} from "../schemas/fo-plan.schema";
import {
  useAllocateFoPlan,
  useFoLandPlan,
  useSuspendFoPlan,
  useUnsuspendFoPlan,
} from "../hooks/use-fo-plan";

type LandPlanQuery = ReturnType<typeof useFoLandPlan>;

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="min-w-0 space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm wrap-break-word">
        {value || <span className="text-muted-foreground">—</span>}
      </div>
    </div>
  );
}

function allocationLabel(plan: FoLandPlan): string {
  const block = plan.block?.trim();
  const plot = plan.plot?.trim();
  if (block && plot) return `Block ${block} · Plot ${plot}`;
  if (block || plot) return [block && `Block ${block}`, plot && `Plot ${plot}`].filter(Boolean).join(" · ");
  return "Unallocated";
}

export function FoPlanActions({
  planId,
  usePlan = useFoLandPlan,
  title = "Land payment plan",
  allocateDescription = "Full-ownership allocation is a single block and plot pair on the land plan.",
}: {
  planId: string;
  usePlan?: (planId: string | null | undefined) => LandPlanQuery;
  title?: string;
  allocateDescription?: string;
}) {
  const { data: plan, isLoading, error } = usePlan(planId);
  const suspend = useSuspendFoPlan();
  const unsuspend = useUnsuspendFoPlan();
  const allocate = useAllocateFoPlan();

  const [dialog, setDialog] = useState<"suspend" | "unsuspend" | "allocate" | null>(null);
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [block, setBlock] = useState("");
  const [plot, setPlot] = useState("");
  const [allocateError, setAllocateError] = useState<string | null>(null);

  const pending = suspend.isPending || unsuspend.isPending || allocate.isPending;

  const close = () => {
    setDialog(null);
    setReason("");
    setReasonError(null);
    setBlock("");
    setPlot("");
    setAllocateError(null);
  };

  const openAllocate = () => {
    setBlock(plan?.block ?? "");
    setPlot(plan?.plot ?? "");
    setAllocateError(null);
    setDialog("allocate");
  };

  const submitSuspend = () => {
    const parsed = foPlanSuspendReasonSchema.safeParse(reason);
    if (!parsed.success) {
      setReasonError(parsed.error.issues[0]?.message ?? "Enter a reason");
      return;
    }
    suspend.mutate(
      { id: planId, reason: parsed.data },
      {
        onSuccess: (result) => {
          toast.success(result.message ?? "Payment plan suspended");
          close();
        },
        onError: (err) => toast.error(err.message || "Couldn't suspend the plan"),
      }
    );
  };

  const submitUnsuspend = () => {
    unsuspend.mutate(
      { id: planId },
      {
        onSuccess: (result) => {
          toast.success(result.message ?? "Payment plan unsuspended");
          close();
        },
        onError: (err) => toast.error(err.message || "Couldn't unsuspend the plan"),
      }
    );
  };

  const submitAllocate = () => {
    const parsed = allocateFoPlanSchema.safeParse({ block, plot });
    if (!parsed.success) {
      setAllocateError(parsed.error.issues[0]?.message ?? "Block and plot are required");
      return;
    }
    allocate.mutate(
      { id: planId, ...parsed.data },
      {
        onSuccess: (result) => {
          toast.success(result.message ?? `Allocated block ${parsed.data.block}, plot ${parsed.data.plot}`);
          close();
        },
        onError: (err) => toast.error(err.message || "Couldn't allocate the plot"),
      }
    );
  };

  if (isLoading) {
    return (
      <section className="rounded-lg border px-4 py-6 text-sm text-muted-foreground">
        Loading payment plan…
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-500">
        <h3 className="font-bold">Error loading payment plan</h3>
        <p>{error.message}</p>
      </section>
    );
  }

  if (!plan) return null;

  const suspended = Boolean(plan.is_suspended);
  const hasAllocation = Boolean(plan.block?.trim() && plan.plot?.trim());

  return (
    <section className="rounded-lg border">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <h2 className="font-medium">{title}</h2>
        <span
          className={
            suspended
              ? "rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800"
              : "rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800"
          }
        >
          {suspended ? "Suspended" : "Active"}
        </span>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
        <Field label="Allocation" value={allocationLabel(plan)} />
        <Field
          label="Allocation status"
          value={plan.allocation_status ? plan.allocation_status.replace(/_/g, " ") : "pending"}
        />
        <Field label="Allocated on" value={formatDate(plan.allocation_date)} />
        {plan.amount_paid != null ? (
          <Field label="Amount paid" value={<span className="tabular-nums">{formatNaira(plan.amount_paid)}</span>} />
        ) : null}
        {plan.balance != null ? (
          <Field label="Balance" value={<span className="tabular-nums">{formatNaira(plan.balance)}</span>} />
        ) : null}
        {plan.size != null ? <Field label="Size" value={`${plan.size.toLocaleString()} sqm`} /> : null}
        {plan.default_count != null ? (
          <Field label="Default count" value={<span className="tabular-nums">{plan.default_count}</span>} />
        ) : null}
        {plan.unique_asset_id ? <Field label="Unique asset id" value={plan.unique_asset_id} /> : null}
      </div>

      <div className="flex flex-wrap gap-2 border-t px-4 py-3">
        {suspended ? (
          <Button type="button" variant="outline" onClick={() => setDialog("unsuspend")}>
            Unsuspend
          </Button>
        ) : (
          <Button type="button" variant="outline" onClick={() => setDialog("suspend")}>
            Suspend
          </Button>
        )}
        <Button type="button" onClick={openAllocate}>
          {hasAllocation ? "Update allocation" : "Allocate plot"}
        </Button>
      </div>

      <Dialog open={dialog === "suspend"} onOpenChange={(open) => (open ? undefined : close())}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Suspend this payment plan?</DialogTitle>
            <DialogDescription>
              Recurring collections stop until the plan is unsuspended. The buyer is emailed this reason.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">
              Reason — at least {FO_PLAN_SUSPEND_REASON_MIN} characters
            </p>
            <Textarea
              rows={3}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Why this plan is being suspended"
              aria-invalid={Boolean(reasonError)}
            />
            {reasonError ? <p className="text-xs text-destructive">{reasonError}</p> : null}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close} disabled={pending}>
              Cancel
            </Button>
            <Button type="button" variant="destructive" onClick={submitSuspend} disabled={pending}>
              {suspend.isPending ? (
                <>
                  Suspending <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                </>
              ) : (
                "Confirm suspend"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "unsuspend"} onOpenChange={(open) => (open ? undefined : close())}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Unsuspend this payment plan?</DialogTitle>
            <DialogDescription>
              Collections resume and the default count is reset to zero.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close} disabled={pending}>
              Cancel
            </Button>
            <Button type="button" onClick={submitUnsuspend} disabled={pending}>
              {unsuspend.isPending ? (
                <>
                  Unsuspending <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                </>
              ) : (
                "Confirm unsuspend"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "allocate"} onOpenChange={(open) => (open ? undefined : close())}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{hasAllocation ? "Update allocation" : "Allocate plot"}</DialogTitle>
            <DialogDescription>
              {allocateDescription}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="fo-plan-block">Block</Label>
              <Input
                id="fo-plan-block"
                value={block}
                onChange={(event) => setBlock(event.target.value)}
                placeholder="A"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="fo-plan-plot">Plot</Label>
              <Input
                id="fo-plan-plot"
                value={plot}
                onChange={(event) => setPlot(event.target.value)}
                placeholder="12"
              />
            </div>
          </div>
          {allocateError ? <p className="text-xs text-destructive">{allocateError}</p> : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close} disabled={pending}>
              Cancel
            </Button>
            <Button type="button" onClick={submitAllocate} disabled={pending}>
              {allocate.isPending ? (
                <>
                  Saving <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                </>
              ) : hasAllocation ? (
                "Save allocation"
              ) : (
                "Allocate"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
