"use client";

import { useState } from "react";
import { AlertTriangle, Loader2, Pencil, Split } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { UnresolvedRef } from "@/components/shared/UnresolvedRef";
import { formatPercent } from "@/lib/utils/format";

import {
  DEVELOPER_PLOT_RATE_FIELDS,
  type DeveloperPlotConfig,
  type DeveloperPlotRateKey,
} from "../../schemas/commission.schema";
import {
  useDeveloperPlotConfig,
  useUpsertDeveloperPlotConfig,
  useUserDisplayName,
} from "../../hooks/use-developer-plot-config";
import { UserPicker } from "@/components/shared/UserPicker";

/* ============================================================
 * Developer plots — the three-way commission split.
 *
 * Two fixed founders earn on every developer-plot sale; which of the four
 * rates applies depends on whether the buyer's referrer is one of them.
 * Until this is configured, developer-plot sales FAIL commission resolution
 * (`DEVELOPER_PLOT_CONFIG_MISSING`) — so "unset" renders as a warning, not
 * as an empty card.
 * ============================================================ */

/** `0.07 * 100 = 7.000000000000001` — same guard as the main config form. */
const toPercentInput = (fraction: number | undefined): number =>
  Number(((fraction ?? 0) * 100).toFixed(4));
const toFraction = (percent: number): number => percent / 100;

function FounderName({ userId }: { userId: string }) {
  const { data: name, isLoading } = useUserDisplayName(userId);
  if (isLoading) return <span className="text-muted-foreground">…</span>;
  return <UnresolvedRef name={name} id={userId} kind="founder" />;
}

function EditDialog({
  config,
  open,
  onOpenChange,
}: {
  config: DeveloperPlotConfig | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const upsert = useUpsertDeveloperPlotConfig();

  const [founderA, setFounderA] = useState(config?.founder_user_ids[0] ?? "");
  const [founderB, setFounderB] = useState(config?.founder_user_ids[1] ?? "");
  const [rates, setRates] = useState<Record<DeveloperPlotRateKey, number>>({
    founder_referrer_rate: toPercentInput(config?.founder_referrer_rate ?? 0.08),
    founder_bystander_rate: toPercentInput(config?.founder_bystander_rate ?? 0.05),
    external_referrer_rate: toPercentInput(config?.external_referrer_rate ?? 0.06),
    founder_rate_when_external_referrer: toPercentInput(
      config?.founder_rate_when_external_referrer ?? 0.05
    ),
  });
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!founderA || !founderB) {
      setError("Pick both founders — exactly two are required.");
      return;
    }
    if (founderA === founderB) {
      setError("The two founders must be different people.");
      return;
    }
    const bad = Object.entries(rates).find(([, v]) => !Number.isFinite(v) || v < 0 || v > 100);
    if (bad) {
      setError("Every rate must be between 0% and 100%.");
      return;
    }
    setError(null);

    upsert.mutate(
      {
        founder_user_ids: [founderA, founderB],
        founder_referrer_rate: toFraction(rates.founder_referrer_rate),
        founder_bystander_rate: toFraction(rates.founder_bystander_rate),
        external_referrer_rate: toFraction(rates.external_referrer_rate),
        founder_rate_when_external_referrer: toFraction(rates.founder_rate_when_external_referrer),
        ...(reason.trim() ? { reason: reason.trim() } : {}),
      },
      {
        onSuccess: (saved) => {
          toast.success(`Developer-plot config saved — version ${saved.version}`);
          onOpenChange(false);
        },
        onError: (err) => toast.error(err.message || "Couldn't save the config"),
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Developer-plot commission</DialogTitle>
          <DialogDescription>
            Saving publishes version {(config?.version ?? 0) + 1}. Plans that already exist keep
            the rates they froze at purchase — only new sales use these values.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="min-w-0 space-y-1.5">
              <Label className="text-xs">Founder one</Label>
              <UserPicker value={founderA} onChange={setFounderA} placeholder="Pick founder one" />
            </div>
            <div className="min-w-0 space-y-1.5">
              <Label className="text-xs">Founder two</Label>
              <UserPicker value={founderB} onChange={setFounderB} placeholder="Pick founder two" />
            </div>
          </div>

          <Separator />

          <div className="grid gap-3 sm:grid-cols-2">
            {DEVELOPER_PLOT_RATE_FIELDS.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label className="text-xs">{field.label}</Label>
                <div className="relative">
                  <Input
                    type="number"
                    step="0.01"
                    min={0}
                    max={100}
                    className="pr-8"
                    value={rates[field.key]}
                    onChange={(event) =>
                      setRates((state) => ({
                        ...state,
                        [field.key]: event.target.valueAsNumber,
                      }))
                    }
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    %
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{field.hint}</p>
              </div>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Reason (recorded on the version)</Label>
            <Textarea
              rows={2}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="e.g. Founder line-up change for the Q4 developer-plot push"
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={upsert.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={upsert.isPending}>
            {upsert.isPending ? (
              <>
                Saving <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              </>
            ) : (
              `Save — publish v${(config?.version ?? 0) + 1}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function DeveloperPlotCard() {
  const { data: config, isLoading, error } = useDeveloperPlotConfig();
  const [editing, setEditing] = useState(false);

  if (isLoading) return null;
  if (error) {
    return (
      <section className="rounded-lg border p-4 text-sm text-destructive">
        Couldn&apos;t load the developer-plot config: {error.message}
      </section>
    );
  }

  return (
    <>
      <section className="rounded-lg border">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b px-4 py-3">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 font-medium">
              <Split className="h-4 w-4 text-muted-foreground" aria-hidden />
              Developer plots
              {config ? (
                <span className="text-xs font-normal text-muted-foreground">v{config.version}</span>
              ) : null}
            </h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              The three-way split: two founders earn on every developer-plot sale, at rates that
              depend on who referred the buyer.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setEditing(true)} className="shrink-0">
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            {config ? "Edit" : "Configure"}
          </Button>
        </div>

        {config ? (
          <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="min-w-0 space-y-0.5 lg:col-span-1">
              <p className="text-xs text-muted-foreground">Founders</p>
              <div className="space-y-0.5 text-sm">
                <p><FounderName userId={config.founder_user_ids[0]} /></p>
                <p><FounderName userId={config.founder_user_ids[1]} /></p>
              </div>
            </div>
            {DEVELOPER_PLOT_RATE_FIELDS.map((field) => (
              <div key={field.key} className="min-w-0 space-y-0.5">
                <p className="text-xs text-muted-foreground">{field.label}</p>
                <p className="text-sm font-medium tabular-nums">
                  {formatPercent(config[field.key])}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-start gap-2.5 p-4">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" aria-hidden />
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Not configured.</span> Developer-plot
              sales cannot resolve commission until the two founders and their rates are set —
              a purchase would fail with <code className="text-xs">DEVELOPER_PLOT_CONFIG_MISSING</code>.
            </p>
          </div>
        )}
      </section>

      {editing ? <EditDialog config={config ?? null} open onOpenChange={setEditing} /> : null}
    </>
  );
}
