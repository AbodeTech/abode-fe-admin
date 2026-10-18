"use client";

import { CheckCircle2, Eye, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { UnresolvedRef } from "@/components/shared/UnresolvedRef";
import { ViewTransactionEvidence } from "@/components/shared/ViewTransactionEvidence";
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
  personPhone,
  type Upgrade,
} from "../schemas/upgrade.schema";
import { UpgradeStatusBadge } from "./UpgradeStatusBadge";

function formatDate(value: string | null | undefined): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" });
}

/** `/users/:id`, or null when the ref is missing entirely. */
function userHref(id: string | null): string | null {
  return id ? `/users/${id}` : null;
}

/**
 * Who is asking. The name links through to their profile — an admin working
 * this queue reaches for the applicant's account constantly, to check what else
 * they own before granting a tier.
 */
function Applicant({ upgrade }: { upgrade: Upgrade }) {
  const email = personEmail(upgrade.user);
  const id = personId(upgrade.user);

  return (
    <div className="min-w-0 space-y-0.5">
      <div className="text-sm font-medium">
        <UnresolvedRef
          name={personName(upgrade.user)}
          id={id}
          href={userHref(id)}
          kind="applicant"
        />
      </div>
      {email ? <p className="truncate text-xs text-muted-foreground">{email}</p> : null}
    </div>
  );
}

function Referrer({ upgrade }: { upgrade: Upgrade }) {
  const id = personId(upgrade.referrer);

  return (
    <UnresolvedRef
      name={personName(upgrade.referrer)}
      id={id}
      href={userHref(id)}
      kind="referrer"
    />
  );
}

/**
 * Who reviewed the row and when — sits under the status badge rather than in a
 * column of its own, because it only exists for reviewed rows and it answers a
 * question about the status ("who set this?") rather than about the upgrade.
 */
function ReviewedBy({ upgrade }: { upgrade: Upgrade }) {
  const name = personName(upgrade.reviewed_by);
  const id = personId(upgrade.reviewed_by);
  if (!name && !id) return null;

  // A span, not a p: `AdminMobileCard` renders `subtitle` inside a <p>, and a
  // nested <p> is invalid and trips React's hydration check.
  return (
    <span className="block text-xs text-muted-foreground">
      by <UnresolvedRef name={name} id={id} kind="admin" />
      {upgrade.reviewed_at ? ` · ${formatDate(upgrade.reviewed_at)}` : ""}
    </span>
  );
}

/**
 * The transfer receipt, opened in-app rather than as a raw link — an admin
 * comparing a reference against a bank statement needs to zoom and rotate a
 * phone photo, and a new tab loses their place in the queue.
 */
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
        <ViewTransactionEvidence
          image={upgrade.file_url}
          trigger={
            /*
              A native `title` rather than a Radix tooltip: this element is handed
              to `ViewTransactionEvidence`, which wraps it in `DialogTrigger
              asChild`. `asChild` clones the immediate child, and `Tooltip.Root`
              renders no DOM node — the click would never reach the button and the
              receipt would never open. Nesting can't be fixed from out here.
            */
            <Button
              variant="ghost"
              size="icon"
              className="-ml-2 h-8 w-8"
              aria-label="View payment receipt"
              title="View receipt"
            >
              <Eye className="h-4 w-4 text-muted-foreground" />
            </Button>
          }
        />
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
  /**
   * False hides the Approve/Decline actions entirely. The BE guards both with
   * `modify_referral_status`, so without it the buttons can only produce a 403.
   */
  canReview: boolean;
  onApprove: (upgrade: Upgrade) => void;
  onDecline: (upgrade: Upgrade) => void;
}

export function UpgradesTable({
  rows,
  isLoading,
  emptyState,
  canReview,
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

  /**
   * Icon buttons, as the screen this replaces used. Each carries both a tooltip
   * and an `aria-label`: colour and glyph alone don't say which one approves, and
   * these two actions are a tier grant and a rejection email respectively.
   */
  const actions = (upgrade: Upgrade) =>
    canReview && upgrade.status === "pending" ? (
      <div className="flex items-center gap-1">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onApprove(upgrade)}
              aria-label="Approve upgrade"
            >
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Approve</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDecline(upgrade)}
              aria-label="Decline upgrade"
            >
              <XCircle className="h-4 w-4 text-rose-600" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Decline</TooltipContent>
        </Tooltip>
      </div>
    ) : null;

  return (
    <>
      {/*
        Column order follows the screen this replaces: the two people first, then
        the applicant's phone, then what the upgrade is, how it was paid, how
        much, where it stands, when it arrived, the actions, and evidence last.

        Two deliberate differences from that screen. `Referral phone` is absent
        because the BE's referrer projection has no `phoneNumber` (⛔ ticket 22a)
        and a column that is structurally always "—" reads as "this person has no
        number on file"; when it lands it slots in directly after Phone. And the
        trailing column carries the bank and reference alongside the receipt,
        which the old screen showed nowhere — an admin checking a transfer needs
        the reference next to the image, not inside it.
      */}
      <AdminDesktopTableWrap>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Applicant</TableHead>
              <TableHead>Referrer</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Referrer phone</TableHead>
              <TableHead>Upgrade</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Fee</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Requested</TableHead>
              {canReview ? <TableHead className="w-px">Action</TableHead> : null}
              <TableHead>Payment evidence</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((upgrade) => (
              <TableRow key={upgrade._id}>
                <TableCell className="max-w-[14rem]">
                  <Applicant upgrade={upgrade} />
                </TableCell>
                <TableCell className="max-w-[12rem] text-sm">
                  <Referrer upgrade={upgrade} />
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap tabular-nums">
                  {personPhone(upgrade.user) ?? "—"}
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap tabular-nums">
                  {personPhone(upgrade.referrer) ?? "—"}
                </TableCell>
                <TableCell className="text-sm whitespace-nowrap">
                  {USER_TIER_LABELS[upgrade.from_tier]}
                  <span className="mx-1 text-muted-foreground">→</span>
                  <span className="font-medium">{USER_TIER_LABELS[upgrade.to_tier]}</span>
                </TableCell>
                <TableCell className="text-sm">
                  {UPGRADE_PAYMENT_METHOD_LABELS[upgrade.payment_method]}
                </TableCell>
                <TableCell>
                  <Fee upgrade={upgrade} />
                </TableCell>
                <TableCell>
                  <div className="space-y-0.5">
                    <UpgradeStatusBadge status={upgrade.status} />
                    <ReviewedBy upgrade={upgrade} />
                  </div>
                </TableCell>
                <TableCell className="text-sm tabular-nums whitespace-nowrap">
                  {formatDate(upgrade.createdAt)}
                </TableCell>
                {canReview ? <TableCell>{actions(upgrade)}</TableCell> : null}
                <TableCell className="max-w-[12rem]">
                  <PaymentEvidence upgrade={upgrade} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </AdminDesktopTableWrap>

      {/* Same field order as the desktop columns, so the two read alike. */}
      <AdminMobileStack>
        {rows.map((upgrade) => (
          <AdminMobileCard
            key={upgrade._id}
            title={<Applicant upgrade={upgrade} />}
            subtitle={
              <span className="space-y-0.5">
                <UpgradeStatusBadge status={upgrade.status} />
                <ReviewedBy upgrade={upgrade} />
              </span>
            }
          >
            <AdminMobileField label="Referrer" value={<Referrer upgrade={upgrade} />} />
            <AdminMobileField label="Phone" value={personPhone(upgrade.user) ?? "—"} />
            <AdminMobileField
              label="Referrer phone"
              value={personPhone(upgrade.referrer) ?? "—"}
            />
            <AdminMobileField
              label="Upgrade"
              value={`${USER_TIER_LABELS[upgrade.from_tier]} → ${USER_TIER_LABELS[upgrade.to_tier]}`}
            />
            <AdminMobileField
              label="Method"
              value={UPGRADE_PAYMENT_METHOD_LABELS[upgrade.payment_method]}
            />
            <AdminMobileField label="Fee" value={<Fee upgrade={upgrade} />} />
            <AdminMobileField label="Requested" value={formatDate(upgrade.createdAt)} />
            <AdminMobileField label="Evidence" value={<PaymentEvidence upgrade={upgrade} />} />
            {upgrade.decline_reason ? (
              <AdminMobileField label="Decline reason" value={upgrade.decline_reason} />
            ) : null}
            {canReview && upgrade.status === "pending" ? (
              <AdminMobileField label="Actions" value={actions(upgrade)} />
            ) : null}
          </AdminMobileCard>
        ))}
      </AdminMobileStack>
    </>
  );
}
