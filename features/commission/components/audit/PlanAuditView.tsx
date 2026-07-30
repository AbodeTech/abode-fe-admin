"use client";

import { Ban } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { UnresolvedRef } from "@/components/shared/UnresolvedRef";
import { formatPercent } from "@/lib/utils/format";

import {
  COMMISSION_LEG_LABELS,
  OVERRIDE_SOURCE_LABELS,
  shapedUserName,
  type CommissionLeg,
  type ShapedUserRef,
} from "../../schemas/commission.schema";
import { usePlanAudit } from "../../hooks/use-plan-audit";

/* ============================================================
 * Per-plan resolution forensics (step 8) — answers "why is this the number?"
 *
 * Everything shown is the plan's own frozen snapshot. No recomputation
 * client-side: a surprising rate here is what the plan actually locked in at
 * creation, which is precisely what an admin investigating a payout needs to
 * see — not what today's config would produce. The preview panel on the
 * overrides page answers that other question.
 * ============================================================ */

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

/** Name when the populate resolved, em-dash + copyable id when it didn't. */
function PersonValue({ person, kind }: { person: ShapedUserRef | null; kind: string }) {
  if (!person) return null;
  return <UnresolvedRef name={shapedUserName(person)} id={person.id} kind={kind} />;
}

function legLabel(commissionType: string): string {
  return COMMISSION_LEG_LABELS[commissionType as CommissionLeg] ?? commissionType;
}

export function PlanAuditView({ paymentPlanId }: { paymentPlanId: string }) {
  const { data: audit, isLoading, error } = usePlanAudit(paymentPlanId);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading the plan&apos;s record…</p>;
  }

  if (error) {
    return (
      <div className="rounded-md border border-dashed p-8 text-center">
        <p className="font-medium">Couldn&apos;t load this plan</p>
        <p className="mt-1 text-sm text-muted-foreground">
          {error.message || "No payment plan has this ID."}
        </p>
      </div>
    );
  }

  if (!audit) return null;

  return (
    <div className="space-y-4">
      <section className="rounded-lg border">
        <div className="border-b px-4 py-3">
          <h2 className="font-medium">The deal</h2>
        </div>
        <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Buyer" value={<PersonValue person={audit.buyer} kind="buyer" />} />
          <Field
            label="Asset"
            value={
              audit.asset ? <UnresolvedRef name={audit.asset.name} id={audit.asset.id} kind="asset" /> : null
            }
          />
          <Field
            label="Config version at creation"
            value={audit.commission_config_version != null ? `v${audit.commission_config_version}` : null}
          />
          <Field
            label="WHT rate frozen"
            value={audit.wht_rate != null ? formatPercent(audit.wht_rate) : null}
          />
        </div>
      </section>

      {!audit.commission_payable ? (
        <div className="flex items-start gap-2.5 rounded-lg border border-dashed p-4">
          <Ban className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <div className="min-w-0">
            <p className="font-medium">This plan pays no commission</p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              No recipient was resolved when it was created — the buyer had no referrer and no
              agency. That is permanent for this plan: recipients are frozen at creation, not
              re-resolved later.
            </p>
          </div>
        </div>
      ) : (
        <section className="rounded-lg border">
          <div className="border-b px-4 py-3">
            <h2 className="font-medium">Who earns, and why</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Frozen when the plan was created. Later rate or override changes don&apos;t touch it.
            </p>
          </div>
          <ul>
            {audit.commission_recipients.map((recipient, index) => (
              <li
                key={`${recipient.commission_type}-${index}`}
                className="grid gap-4 border-b px-4 py-3 last:border-b-0 sm:grid-cols-2 lg:grid-cols-4"
              >
                <Field
                  label={legLabel(recipient.commission_type)}
                  value={<PersonValue person={recipient.user} kind="recipient" />}
                />
                <Field label="Rate" value={formatPercent(recipient.rate)} />
                <Field
                  label="Tier at creation"
                  value={
                    recipient.tier_at_creation ? (
                      <span className="capitalize">
                        {recipient.tier_at_creation.replace(/-/g, " ")}
                      </span>
                    ) : null
                  }
                />
                <Field
                  label="Rate came from"
                  value={
                    recipient.override_source ? (
                      <Badge variant="outline">
                        {OVERRIDE_SOURCE_LABELS[recipient.override_source]}
                      </Badge>
                    ) : null
                  }
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
