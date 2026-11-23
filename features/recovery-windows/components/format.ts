import { ApiClientError } from "@/lib/api-client";

import type { RecoveryRow, RecoveryStage } from "../schemas/recovery-window.schema";

/** The BE's domain code (`CARRY_OVER_MISMATCH`, …) when there is one. */
export const errorCode = (err: unknown): string | null =>
  err instanceof ApiClientError ? err.code : null;

/** A message from a known code, else the BE's message, else the fallback. */
export function errorText(err: unknown, known: Record<string, string>, fallback: string): string {
  const code = errorCode(err);
  if (code && known[code]) return known[code];
  return err instanceof Error && err.message ? err.message : fallback;
}

export const naira = (value: number | null | undefined) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Number(value ?? 0));

/** ₦840k / ₦6.6M, for the one-line summaries. */
export const nairaShort = (value: number | null | undefined) => {
  const n = Number(value ?? 0);
  if (Math.abs(n) >= 1_000_000) return `₦${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`;
  if (Math.abs(n) >= 1_000) return `₦${Math.round(n / 1_000)}k`;
  return naira(n);
};

export const longDate = (value: string | null | undefined) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Lagos",
  });
};

export const dateTime = (value: string | null | undefined) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Africa/Lagos",
  });
};

export const productLabel = (type: string | null | undefined) =>
  type === "flex" ? "Flex" : type === "commercial" ? "Commercial" : "Full Ownership";

export const STAGE_LABEL: Record<RecoveryStage, string> = {
  open: "No request yet",
  choice_sent: "Request to review",
  terms_sent: "Terms sent · waiting for customer",
  payment_pending: "Move payment to approve",
  moved: "Moved",
  refund_pending: "Refund to approve",
  refund_on_hold: "Refund on hold",
  ended_refund: "Ended · refund approved",
  ended_no_refund: "Ended · no refund",
  cancelled: "No longer suspended",
};

export const STAGE_TONE: Record<RecoveryStage, string> = {
  open: "bg-amber-50 text-amber-800 border-amber-200",
  choice_sent: "bg-teal-50 text-teal-800 border-teal-200",
  terms_sent: "bg-slate-100 text-slate-700 border-slate-200",
  payment_pending: "bg-amber-50 text-amber-800 border-amber-200",
  moved: "bg-green-50 text-green-800 border-green-200",
  refund_pending: "bg-red-50 text-red-700 border-red-200",
  refund_on_hold: "bg-orange-50 text-orange-800 border-orange-200",
  ended_refund: "bg-green-50 text-green-800 border-green-200",
  ended_no_refund: "bg-slate-100 text-slate-700 border-slate-200",
  cancelled: "bg-slate-100 text-slate-500 border-slate-200",
};

const REMINDER_LABEL: Record<string, string> = {
  opened: "suspension notice",
  "30d": "30 days left",
  "14d": "14 days left",
  "3d": "3 days left",
  manual: "sent by hand",
};
export const reminderLabel = (kind: string) => REMINDER_LABEL[kind] ?? kind;

/** The one-line "what happens next" shown in the list's Next step column. */
export function nextStepLine(row: RecoveryRow): string {
  const share = `${Math.round(row.share_paid_pct)}% paid`;
  switch (row.stage) {
    case "open":
      return row.expected?.kind === "refund"
        ? `Hasn’t picked a product. If nothing changes, the plan ends on ${longDate(row.window_ends_at)} with about ${nairaShort(row.expected.refund_amount)} back (${share}).`
        : `Hasn’t picked a product. If nothing changes, the plan ends on ${longDate(row.window_ends_at)} with no refund (${share}).`;
    case "choice_sent":
      return row.latest_choice
        ? `Asked on ${longDate(row.latest_choice.chosen_at)} to move to ${row.latest_choice.asset_name ?? "another product"} · ${row.latest_choice.size_sqm} sqm ${productLabel(row.latest_choice.asset_type)}. Review it, then send terms or decline.`
        : "Asked to move to another product. Review it, then send terms or decline.";
    case "terms_sent":
      return row.latest_terms
        ? `${row.latest_terms.is_counter ? "Different option" : "Terms"} for ${row.latest_terms.asset_name ?? "the new plan"} sent. ${nairaShort(row.latest_terms.due_now)} due. Hold until ${longDate(row.latest_terms.holds_until)}.`
        : "Terms sent.";
    case "payment_pending":
      return row.latest_terms
        ? `Paid ${nairaShort(row.latest_terms.due_now)} by transfer to move to ${row.latest_terms.asset_name ?? "the new plan"}. Approve it on Asset transactions.`
        : "Move payment waiting for approval.";
    case "moved":
      return `Moved. ${nairaShort(row.land_paid)} carried over.`;
    case "refund_pending":
      return `Refund ${naira(row.refund_amount)}${row.refund_adjusted ? " (changed)" : ""}. Approve it in the record.`;
    case "refund_on_hold":
      return `Refund on hold${row.hold_reason ? `: ${row.hold_reason}` : "."}`;
    case "ended_refund":
      return `Refund of ${naira(row.refund_amount)} approved, paid to the customer's bank from Refunds.`;
    case "ended_no_refund":
      return `Plan ended. ${share}, nothing refunded.`;
    case "cancelled":
      return "The plan stopped being suspended (unsuspended or closed by hand).";
  }
}
