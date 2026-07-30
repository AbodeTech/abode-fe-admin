"use client";

import { ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UnresolvedRef } from "@/components/shared/UnresolvedRef";
import {
  AdminDesktopTableWrap,
  AdminMobileCard,
  AdminMobileField,
  AdminMobileStack,
} from "@/components/shared/admin-responsive-table";
import { formatNaira } from "@/lib/utils/format";

import {
  UPGRADE_PAYMENT_METHOD_LABELS,
  USER_TIER_LABELS,
  personEmail,
  personId,
  personName,
  type Upgrade,
} from "../schemas/upgrade.schema";
import { UpgradeStatusBadge } from "./UpgradeStatusBadge";

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" });
}

/**
 * Who is asking. ⛔ ticket 13 — the backend returns a bare ObjectId, so the
 * name renders as an em-dash with the id one hover away until it populates.
 */
function Applicant({ upgrade }: { upgrade: Upgrade }) {
  const email = personEmail(upgrade.user);

  return (
    <div className="min-w-0 space-y-0.5">
      <div className="text-sm font-medium">
        <UnresolvedRef
          name={personName(upgrade.user)}
          id={personId(upgrade.user)}
          kind="applicant"
        />
      </div>
      {email ? <p className="truncate text-xs text-muted-foreground">{email}</p> : null}
    </div>
  );
}

/** The transfer receipt the applicant uploaded, when there is one. */
function PaymentEvidence({ upgrade }: { upgrade: Upgrade }) {
  if (!upgrade.file_url && !upgrade.reference_no && !upgrade.bank_name) {
    return <span className="text-sm text-muted-foreground">—</span>;
  }

  return (
    <div className="min-w-0 space-y-1">
      {upgrade.bank_name ? <p className="text-sm">{upgrade.bank_name}</p> : null}
      {upgrade.reference_no ? (
        <p className="truncate font-mono text-xs text-muted-foreground">{upgrade.reference_no}</p>
      ) : null}
      {upgrade.file_url ? (
        <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
          <a href={upgrade.file_url} target="_blank" rel="noopener noreferrer">
            View receipt
            <ExternalLink className="ml-1 h-3 w-3" />
          </a>
        </Button>
      ) : null}
    </div>
  );
}

function Fee({ upgrade }: { upgrade: Upgrade }) {
  const discounted = upgrade.discount_amount != null && upgrade.discount_amount > 0;

  return (
    <div className="space-y-0.5">
      <p className="text-sm font-medium tabular-nums">{formatNaira(upgrade.fee_amount)}</p>
      {discounted ? (
        <p className="text-xs text-muted-foreground">
          {upgrade.coupon_code_snapshot ? `${upgrade.coupon_code_snapshot} · ` : ""}
          −{formatNaira(upgrade.discount_amount)}
        </p>
      ) : null}
    </div>
  );
}

interface UpgradesTableProps {
  rows: Upgrade[];
  isLoading?: boolean;
  emptyState?: React.ReactNode;
  onApprove: (upgrade: Upgrade) => void;
  onDecline: (upgrade: Upgrade) => void;
}

export function UpgradesTable({
  rows,
  isLoading,
  emptyState,
  onApprove,
  onDecline,
}: UpgradesTableProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  if (rows.length === 0) return <>{emptyState}</>;

  const actions = (upgrade: Upgrade) =>
    upgrade.status === "pending" ? (
      <div className="flex gap-2">
        <Button size="sm" onClick={() => onApprove(upgrade)}>
          Approve
        </Button>
        <Button size="sm" variant="outline" onClick={() => onDecline(upgrade)}>
          Decline
        </Button>
      </div>
    ) : null;

  return (
    <>
      <AdminDesktopTableWrap>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Applicant</TableHead>
              <TableHead>Upgrade</TableHead>
              <TableHead>Fee</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Payment evidence</TableHead>
              <TableHead>Referrer</TableHead>
              <TableHead>Requested</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-px" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((upgrade) => (
              <TableRow key={upgrade._id}>
                <TableCell className="max-w-[14rem]">
                  <Applicant upgrade={upgrade} />
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap">
                  {USER_TIER_LABELS[upgrade.from_tier]}
                  <span className="mx-1 text-muted-foreground">→</span>
                  <span className="font-medium">{USER_TIER_LABELS[upgrade.to_tier]}</span>
                </TableCell>
                <TableCell>
                  <Fee upgrade={upgrade} />
                </TableCell>
                <TableCell className="text-sm">
                  {UPGRADE_PAYMENT_METHOD_LABELS[upgrade.payment_method]}
                </TableCell>
                <TableCell className="max-w-[12rem]">
                  <PaymentEvidence upgrade={upgrade} />
                </TableCell>
                <TableCell className="max-w-[12rem] text-sm">
                  <UnresolvedRef
                    name={personName(upgrade.referrer)}
                    id={personId(upgrade.referrer)}
                    kind="referrer"
                  />
                </TableCell>
                <TableCell className="text-sm tabular-nums whitespace-nowrap">
                  {formatDate(upgrade.createdAt)}
                </TableCell>
                <TableCell>
                  <UpgradeStatusBadge status={upgrade.status} />
                </TableCell>
                <TableCell className="text-right">{actions(upgrade)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminDesktopTableWrap>

      <AdminMobileStack>
        {rows.map((upgrade) => (
          <AdminMobileCard
            key={upgrade._id}
            title={<Applicant upgrade={upgrade} />}
            subtitle={
              <span className="flex flex-wrap items-center gap-2">
                <UpgradeStatusBadge status={upgrade.status} />
                <span>
                  {USER_TIER_LABELS[upgrade.from_tier]} → {USER_TIER_LABELS[upgrade.to_tier]}
                </span>
              </span>
            }
          >
            <AdminMobileField label="Fee" value={<Fee upgrade={upgrade} />} />
            <AdminMobileField
              label="Method"
              value={UPGRADE_PAYMENT_METHOD_LABELS[upgrade.payment_method]}
            />
            <AdminMobileField label="Evidence" value={<PaymentEvidence upgrade={upgrade} />} />
            <AdminMobileField
              label="Referrer"
              value={
                <UnresolvedRef
                  name={personName(upgrade.referrer)}
                  id={personId(upgrade.referrer)}
                  kind="referrer"
                />
              }
            />
            <AdminMobileField label="Requested" value={formatDate(upgrade.createdAt)} />
            {upgrade.decline_reason ? (
              <AdminMobileField label="Decline reason" value={upgrade.decline_reason} />
            ) : null}
            {upgrade.status === "pending" ? <div className="pt-1">{actions(upgrade)}</div> : null}
          </AdminMobileCard>
        ))}
      </AdminMobileStack>
    </>
  );
}
