"use client";

import { cn } from "@/lib/utils";
import type { PlanRow } from "../schemas/cs-manager.schema";

/**
 * Plan status pills — shared by CustomersTable rows and PlanDetailDrawer so a
 * plan never reads one way in the table and another in the drawer.
 */

export const PILL_BASE =
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium";

export function PaymentPill({
  status,
  label,
}: {
  status: PlanRow["payment_status"];
  label: string;
}) {
  const cls =
    status === "completed"
      ? "bg-emerald-50 text-emerald-700"
      : status === "close_to_default"
      ? "bg-red-50 text-[#AD1F2A]"
      : "bg-[#E0F2F1] text-[#00695C]";
  return <span className={cn(PILL_BASE, cls)}>{label}</span>;
}

export function OnboardingPill({ status }: { status: PlanRow["onboarding"] }) {
  switch (status) {
    case "confirmed":
      return <span className={cn(PILL_BASE, "bg-emerald-50 text-emerald-700")}>Confirmed</span>;
    case "call_pending":
      return <span className={cn(PILL_BASE, "bg-amber-50 text-amber-700")}>Call pending</span>;
    case "disputed":
      return <span className={cn(PILL_BASE, "bg-red-50 text-[#AD1F2A]")}>Disputed</span>;
    default:
      return <span className={cn(PILL_BASE, "bg-gray-100 text-gray-400")}>—</span>;
  }
}

/**
 * What was already tried on this plan, under the onboarding pill.
 *
 * "Call pending" reads the same for a plan nobody has rung and one rung three
 * times without an answer — and those are different jobs.
 */
const ATTEMPT_LABELS: Record<string, string> = {
  no_answer: "Didn't pick",
  rescheduled: "Call booked",
  spoke: "Spoke",
  done: "Call done",
};

export const lastAttemptWhen = (iso: string) => {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  return days < 1 ? "today" : days === 1 ? "yesterday" : `${days}d ago`;
};

export function LastAttemptNote({ attempt }: { attempt: PlanRow["last_attempt"] }) {
  if (!attempt) return null;
  const label = ATTEMPT_LABELS[attempt.outcome] ?? attempt.outcome;
  return (
    <span className="mt-1 block text-[11px] text-gray-500" title={formatShortDate(attempt.called_at)}>
      {label} · {lastAttemptWhen(attempt.called_at)}
      {/* "1 try" is noise; "3 tries" is the reason to ring differently. */}
      {attempt.attempts > 1 ? ` · ${attempt.attempts} tries` : ""}
    </span>
  );
}

export const productLabel = (product: PlanRow["product"]) =>
  product === "flex" ? "Flex" : product === "commercial" ? "Commercial" : "Full-ownership";

/** "500 sqm × 2" — the land the plan pays for, per unit times units. */
export const planLandLabel = (plan: Pick<PlanRow, "size" | "units">) =>
  plan.size != null
    ? `${plan.size.toLocaleString()} sqm × ${plan.units}`
    : `${plan.units} unit${plan.units === 1 ? "" : "s"}`;

/** The plan's stored allocation status, readable: "pending" → "Pending". */
export const allocationStatusLabel = (status: string | null) =>
  status ? status.charAt(0).toUpperCase() + status.slice(1).replace(/_/g, " ") : null;

/** Digits and a leading + only, for a tel: link. */
export const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, "")}`;

export function AllocationPill({
  status,
  label,
}: {
  status: PlanRow["allocation"];
  label?: string | null;
}) {
  switch (status) {
    case "allocated":
      return (
        <span className={cn(PILL_BASE, "bg-emerald-50 text-emerald-700")}>
          {label ?? "Allocated"}
        </span>
      );
    case "awaiting":
      return <span className={cn(PILL_BASE, "bg-red-50 text-[#AD1F2A]")}>Awaiting</span>;
    default:
      return <span className={cn(PILL_BASE, "bg-gray-100 text-gray-400")}>—</span>;
  }
}

export function DoaPill({
  status,
  label,
}: {
  status: PlanRow["doa"];
  label?: string | null;
}) {
  switch (status) {
    case "sent":
      return <span className={cn(PILL_BASE, "bg-emerald-50 text-emerald-700")}>{label ?? "Sent"}</span>;
    case "not_sent":
      return <span className={cn(PILL_BASE, "bg-amber-50 text-amber-700")}>Not sent</span>;
    default:
      return <span className={cn(PILL_BASE, "bg-gray-100 text-gray-400")}>—</span>;
  }
}

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export const formatShortDate = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
};

/** Project convention: names render lastName firstName, initials too. */
export const planCustomerName = (c: { first_name?: string | null; last_name?: string | null }) =>
  `${c.last_name ?? ""} ${c.first_name ?? ""}`.trim();

export const planCustomerInitials = (c: {
  first_name?: string | null;
  last_name?: string | null;
}) => ((c.last_name?.[0] ?? "") + (c.first_name?.[0] ?? "")).toUpperCase();
