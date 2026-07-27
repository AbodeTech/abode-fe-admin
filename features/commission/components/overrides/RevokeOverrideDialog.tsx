"use client";

import { toast } from "sonner";
import { Loader2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatPercent } from "@/lib/utils/format";

import { COMMISSION_LEG_LABELS, COMMISSION_LEGS } from "../../schemas/commission.schema";
import {
  OVERRIDE_TYPE_LABELS,
  assetRefName,
  personRefName,
  refId,
  type NormalisedOverride,
} from "../../schemas/override.schema";
import { useRevokeOverride } from "../../hooks/use-revoke-override";

/** "Aviation City · John Okafor", falling back to ids while ⛔ 9a is open. */
function describeSubject(override: NormalisedOverride): string {
  const asset = assetRefName(override.asset) ?? refId(override.asset);
  const user = personRefName(override.user) ?? refId(override.user);
  return [asset, user].filter(Boolean).join(" · ") || "this override";
}

/** "direct 12.00%" or "direct per tier" — enough to recognise what's going. */
function describeRates(override: NormalisedOverride): string {
  const parts = COMMISSION_LEGS.flatMap((leg) => {
    const rate = override.rates[leg];
    if (!rate) return [];
    const label = COMMISSION_LEG_LABELS[leg].toLowerCase();
    return [rate.kind === "flat" ? `${label} ${formatPercent(rate.rate)}` : `${label} per tier`];
  });
  return parts.join(" · ") || "no rates set";
}

interface RevokeOverrideDialogProps {
  override: NormalisedOverride | null;
  onOpenChange: (open: boolean) => void;
}

export function RevokeOverrideDialog({ override, onOpenChange }: RevokeOverrideDialogProps) {
  const revoke = useRevokeOverride();

  if (!override) return null;

  const handleRevoke = () => {
    revoke.mutate(
      { type: override.type, id: override.id },
      {
        onSuccess: () => {
          toast.success("Override revoked");
          onOpenChange(false);
        },
        onError: (error) => toast.error(error.message || "Failed to revoke override"),
      }
    );
  };

  return (
    <AlertDialog open onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Revoke this override?</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3 text-sm">
              <p className="rounded-md border bg-muted/40 p-3">
                <span className="font-medium text-foreground">
                  {OVERRIDE_TYPE_LABELS[override.type]} · {describeSubject(override)}
                </span>
                <br />
                {describeRates(override)}
              </p>

              <p className="font-medium text-foreground">
                This only affects payment plans created from now on.
              </p>

              <p>
                Plans that already exist keep paying this rate for the rest of their life — the rate
                was frozen onto each one when it was created. Nothing is recalculated and nothing is
                clawed back.
              </p>

              <p>
                The override stays in the list as revoked, so payouts it explains can still be
                traced. You can reinstate it by creating the same override again.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={revoke.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(event) => {
              // Keep the dialog open while the request is in flight.
              event.preventDefault();
              handleRevoke();
            }}
            disabled={revoke.isPending}
          >
            {revoke.isPending ? (
              <>
                Revoking <Loader2 className="ml-2 h-4 w-4 animate-spin" />
              </>
            ) : (
              "Revoke override"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
