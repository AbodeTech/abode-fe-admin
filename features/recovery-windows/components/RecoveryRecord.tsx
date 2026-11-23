"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Send, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { RecoveryDetail } from "../schemas/recovery-window.schema";
import { useSendRecoveryReminder } from "../hooks/use-recovery-actions";
import { DeclineChoiceDialog } from "./DeclineChoiceDialog";
import { RefundPanel } from "./RefundPanel";
import { DaysLeft, RecoveryStageBadge } from "./RecoveryStageBadge";
import { SendTermsDialog } from "./SendTermsDialog";
import { dateTime, errorText, longDate, naira, productLabel, reminderLabel } from "./format";

const PRE_END = ["open", "choice_sent", "terms_sent", "payment_pending"];
const OFFER_STATUS: Record<string, string> = {
  waiting: "Waiting for customer",
  payment_pending: "Transfer being checked",
  accepted: "Accepted · moved",
  replaced: "Replaced",
  expired: "Lapsed",
};
const HISTORY_LABEL: Record<string, string> = {
  "recovery_window.opened": "Suspended · window opened",
  "recovery_window.reminder_sent": "Reminder sent by hand",
  "recovery_window.ended_early": "Customer ended the plan early",
  "recovery_window.choice_sent": "Customer asked to move",
  "recovery_window.choice_declined": "Request declined",
  "recovery_window.terms_sent": "Terms sent",
  "recovery_window.terms_expired": "Terms lapsed",
  "recovery_window.move_payment_declined": "Move payment declined",
  "recovery_window.moved": "Moved to the new plan",
  "recovery_window.plan_ended": "Window closed · plan ended",
  "recovery_window.refund_adjusted": "Refund amount changed",
  "recovery_window.refund_held": "Refund put on hold",
  "recovery_window.refund_released": "Refund taken off hold",
  "recovery_window.refund_approved": "Refund approved · owed to the customer’s bank",
  "recovery_window.refund_sent": "Refund sent to the bank (Paystack)",
  "recovery_window.refund_paid": "Refund paid to the bank",
  "recovery_window.refund_payout_failed": "Refund transfer didn’t go through",
  "recovery_window.refund_marked_paid": "Refund marked paid by hand",
  "recovery_window.cancelled": "No longer suspended",
};

export interface RecoveryPermissions {
  remind: boolean;
  sendTerms: boolean;
  approveRefunds: boolean;
}

export function RecoveryRecord({
  record,
  listHref,
  permissions,
}: {
  record: RecoveryDetail;
  listHref: string;
  permissions: RecoveryPermissions;
}) {
  const [termsOpen, setTermsOpen] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);
  const remind = useSendRecoveryReminder();
  const inWindow = PRE_END.includes(record.stage);
  const canSendTerms =
    permissions.sendTerms && ["open", "choice_sent", "terms_sent"].includes(record.stage);
  const latestChoice = record.choices.at(-1);
  const isFo = record.plan_type !== "flex";

  const sendReminder = async () => {
    try {
      await remind.mutateAsync({ id: record.id });
      toast.success("Reminder sent");
    } catch (err) {
      toast.error(
        errorText(
          err,
          { RECOVERY_REMINDER_SENT_RECENTLY: "A reminder already went out in the last 24 hours." },
          "Couldn't send the reminder"
        )
      );
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <Link href={listHref} className="text-sm text-muted-foreground hover:text-foreground">
            Finance › Recovery period
          </Link>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            {record.customer_name ?? "Unknown customer"} · {record.asset_name}
            {record.size_sqm ? ` · ${record.size_sqm} sqm` : ""}
          </h1>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>
              {productLabel(record.plan_type)}
              {record.unique_asset_id ? ` · ${record.unique_asset_id}` : ""}
            </span>
            <RecoveryStageBadge stage={record.stage} />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={`/users/${record.user_id}`}>View customer</Link>
          </Button>
          {permissions.remind && record.can_remind ? (
            <Button variant="outline" className="gap-2" onClick={sendReminder} disabled={remind.isPending}>
              <Bell className="h-4 w-4" /> Send reminder
            </Button>
          ) : null}
          {permissions.sendTerms && record.stage === "choice_sent" ? (
            <Button variant="outline" className="gap-2" onClick={() => setDeclineOpen(true)}>
              <XCircle className="h-4 w-4" /> Can’t offer it
            </Button>
          ) : null}
          {canSendTerms ? (
            <Button className="gap-2" onClick={() => setTermsOpen(true)}>
              <Send className="h-4 w-4" />
              {record.stage === "terms_sent" ? "Send new terms" : latestChoice && !latestChoice.outcome ? "Send terms" : "Send an option"}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-none shadow-sm">
          <CardContent className="space-y-3 p-5">
            <p className="text-sm text-muted-foreground">Window ends</p>
            <p className="text-2xl font-bold tabular-nums">{longDate(record.window_ends_at)}</p>
            <DaysLeft days={record.days_left} ended={!inWindow} />
            <p className="text-xs text-muted-foreground">
              Suspended {longDate(record.suspended_at)}. The end date was set then (3 calendar months, cut to the
              month’s last day) and never moves.
            </p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="space-y-2 p-5 text-sm tabular-nums">
            <p className="text-base font-semibold">Payment position</p>
            <Pair label="Land price" value={naira(record.snapshot.land_price)} />
            <Pair
              label="Paid on land"
              value={`${naira(record.snapshot.land_paid)} · ${Math.round(record.share_paid_pct)}%`}
            />
            {isFo ? <Pair label="Levy paid" value={naira(record.snapshot.document_paid)} /> : null}
            <Pair label="Unpaid land" value={naira(record.snapshot.land_balance)} />
            {isFo ? (
              <Pair
                label="Default fee"
                value={
                  record.plan
                    ? `${naira(record.plan.default_fee)}${record.plan.default_fee_paid ? ` · ${naira(record.plan.default_fee_paid)} paid` : ""}${record.plan.default_fee_waived ? ` · ${naira(record.plan.default_fee_waived)} waived` : ""}`
                    : naira(record.snapshot.default_fee_owed)
                }
              />
            ) : null}
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="space-y-2 p-5 text-sm">
            <p className="text-base font-semibold">Reminders</p>
            {record.reminders.length === 0 ? (
              <p className="text-muted-foreground">None yet.</p>
            ) : (
              record.reminders.map((r, idx) => (
                <Pair key={`${r.kind}-${idx}`} label={reminderLabel(r.kind)} value={`Sent ${dateTime(r.sent_at)}`} />
              ))
            )}
            {inWindow ? (
              <p className="text-xs text-muted-foreground">Automatic: 30, 14 and 3 days before the end, each once.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {record.choices.length || record.offers.length ? (
        <Card className="border-none shadow-sm">
          <CardContent className="space-y-4 p-5">
            <p className="text-base font-semibold">Requests and terms</p>
            {record.choices.length ? (
              <div className="space-y-1 text-sm">
                {record.choices.map((c, idx) => (
                  <p key={idx}>
                    <span className="text-muted-foreground">{longDate(c.chosen_at)} · chose </span>
                    {c.asset_name} · {c.size_sqm} sqm · {productLabel(c.asset_type)}
                    {c.tenor_months ? ` · ${c.tenor_months} months` : ""}
                    <span className="text-muted-foreground">
                      {c.outcome === "terms_sent" ? " · terms sent" : c.outcome === "declined" ? ` · turned down (${c.decline_note})` : " · waiting for terms"}
                    </span>
                  </p>
                ))}
              </div>
            ) : null}
            {record.offers.length ? (
              <div className="overflow-x-auto">
                <Table className="text-sm tabular-nums">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Version</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">Carried over</TableHead>
                      <TableHead className="text-right">Due now</TableHead>
                      <TableHead>Holds until</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[...record.offers].reverse().map((o) => (
                      <TableRow key={o.version} className={o.status === "replaced" || o.status === "expired" ? "text-muted-foreground" : undefined}>
                        <TableCell className="font-semibold">
                          v{o.version}
                          {o.is_counter ? <span className="ml-1 text-xs font-normal">(different option)</span> : null}
                        </TableCell>
                        <TableCell>{longDate(o.sent_at)}</TableCell>
                        <TableCell>
                          {o.asset_name} · {o.size_sqm} sqm · {productLabel(o.asset_type)} · {o.tenor_months} mo
                        </TableCell>
                        <TableCell className="text-right">
                          {naira(o.land_price)}
                          {o.document_price ? <span className="block text-xs">+ levy {naira(o.document_price)}</span> : null}
                        </TableCell>
                        <TableCell className="text-right">{naira(o.land_carry + o.document_carry)}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {naira(o.due_now)}
                          <span className="block text-xs font-normal">
                            {[
                              o.default_fee ? (o.default_fee_waived ? "fee waived" : `${naira(o.default_fee)} fee`) : null,
                              o.change_fee_waived ? "change fee waived" : `${naira(o.change_fee)} change`,
                              o.upfront_land ? `${naira(o.upfront_land)} land` : null,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        </TableCell>
                        <TableCell>{longDate(o.holds_until)}</TableCell>
                        <TableCell>{OFFER_STATUS[o.status] ?? o.status}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {record.offers.at(-1)?.customer_note ? (
                  <p className="mt-2 text-sm text-muted-foreground">
                    Note to the customer: “{record.offers.at(-1)?.customer_note}”
                  </p>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {record.move ? (
        <Card className="border-none shadow-sm">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-5 text-sm">
            <div>
              <p className="text-base font-semibold">Moved {longDate(record.move.moved_at)}</p>
              <p className="text-muted-foreground">
                {naira(record.move.carry_over)} carried over on terms v{record.move.offer_version}. The old plan is
                closed and its plot released.
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link href={`/users/${record.user_id}`}>Open the new plan</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {record.ending ? (
          <RefundPanel record={record} canApprove={permissions.approveRefunds} />
        ) : inWindow && record.expected ? (
          <Card className="border-none shadow-sm">
            <CardContent className="space-y-2 p-5 text-sm tabular-nums">
              <p className="text-base font-semibold">If the window closes with no move</p>
              <Pair
                label="Share paid"
                value={`${Math.round(record.expected.share_paid_pct)}% · ${record.expected.kind === "refund" ? "refund due" : "no refund"}`}
              />
              {record.expected.admin_charge ? (
                <Pair label="Admin charge · 20% of land price" value={`− ${naira(record.expected.admin_charge)}`} />
              ) : null}
              {isFo && record.expected.default_fee_deducted ? (
                <Pair label="Default fee" value={`− ${naira(record.expected.default_fee_deducted)}`} />
              ) : null}
              <Pair label="Refund" value={naira(record.expected.refund_amount)} strong />
              <p className="text-xs text-muted-foreground">
                On {longDate(record.window_ends_at)} the plan ends and these figures freeze. A refund waits for finance to
                approve it, then is paid to the customer’s bank from Transactions › Refunds.
              </p>
            </CardContent>
          </Card>
        ) : null}

        <Card className="border-none shadow-sm">
          <CardContent className="space-y-2 p-5 text-sm">
            <p className="text-base font-semibold">History</p>
            <div className="grid grid-cols-[110px_minmax(0,1fr)] gap-x-3 gap-y-2">
              {record.history.map((h, idx) => (
                <div key={idx} className="contents">
                  <span className="text-muted-foreground tabular-nums">{dateTime(h.at)}</span>
                  <span>
                    {HISTORY_LABEL[h.action] ?? h.action}
                    {h.reason ? <span className="block text-xs text-muted-foreground">{h.reason}</span> : null}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {termsOpen ? <SendTermsDialog open={termsOpen} onOpenChange={setTermsOpen} record={record} /> : null}
      <DeclineChoiceDialog open={declineOpen} onOpenChange={setDeclineOpen} record={record} />
    </div>
  );
}

function Pair({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className={strong ? "font-semibold" : "font-medium"}>{value}</span>
    </div>
  );
}
