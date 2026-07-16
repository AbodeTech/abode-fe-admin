"use client";

import { Badge } from "@/components/ui/badge";

import type { AdminConfirmationStatus } from "../hooks/use-purchase-confirmations";

const STYLES: Record<AdminConfirmationStatus, { label: string; className: string }> = {
  confirmed: {
    label: "Confirmed",
    className: "bg-green-100 text-green-800 hover:bg-green-100",
  },
  waiting: {
    label: "Waiting",
    className: "bg-orange-100 text-orange-800 hover:bg-orange-100",
  },
  disputed: {
    label: "Disputed",
    className: "bg-red-100 text-red-800 hover:bg-red-100",
  },
};

export function ConfirmationStatusBadge({
  status,
}: {
  status: AdminConfirmationStatus;
}) {
  const style = STYLES[status];
  return (
    <Badge variant="secondary" className={style.className}>
      {style.label}
    </Badge>
  );
}

/** "3 days" / "today" — how long a waiting purchase has sat unconfirmed. */
export function daysWaitingLabel(emailSentAt: string | null): string | null {
  if (!emailSentAt) return null;
  const ms = Date.now() - new Date(emailSentAt).getTime();
  const days = Math.floor(ms / (24 * 60 * 60 * 1000));
  if (days <= 0) return "today";
  return days === 1 ? "1 day" : `${days} days`;
}
