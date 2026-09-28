"use client";

import { cn } from "@/lib/utils";
import type {
  AllocationStatus,
  DoaStatus,
  OnboardingStatus,
  PaymentStatus,
} from "@/lib/gql/graphql";

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
  status: PaymentStatus;
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

export function OnboardingPill({ status }: { status: OnboardingStatus }) {
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
 * What was already tried on this plan.
 *
 * Sits under the onboarding pill because "call pending" says the same thing
 * about a plan nobody has rung and one rung three times without an answer —
 * and those are different jobs. The CSMs were recording it anyway: a run of
 * "didn't pick" and "call dropped" ended up typed into the land-choice reason,
 * because that was the only box on the form that took free text.
 */
const ATTEMPT_LABELS: Record<string, string> = {
  no_answer: "Didn't pick",
  rescheduled: "Call booked",
  spoke: "Spoke",
  done: "Call done",
};

export function LastAttemptNote({
  attempt,
}: {
  attempt?: { outcome: string; calledAt: string; attempts: number } | null;
}) {
  if (!attempt) return null;
  const label = ATTEMPT_LABELS[attempt.outcome] ?? attempt.outcome;
  const days = Math.floor(
    (Date.now() - new Date(attempt.calledAt).getTime()) / 86_400_000
  );
  const when = days < 1 ? "today" : days === 1 ? "yesterday" : `${days}d ago`;
  return (
    <span className="mt-1 block text-[11px] text-gray-500">
      {label} · {when}
      {/* Only worth saying once it is more than one: "1 try" is noise, and
          "3 tries" is the reason to pick up the phone differently. */}
      {attempt.attempts > 1 ? ` · ${attempt.attempts} tries` : ""}
    </span>
  );
}

export function AllocationPill({
  status,
  label,
}: {
  status: AllocationStatus;
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
      return (
        <span className={cn(PILL_BASE, "bg-red-50 text-[#AD1F2A]")}>Awaiting</span>
      );
    default:
      return <span className={cn(PILL_BASE, "bg-gray-100 text-gray-400")}>—</span>;
  }
}

export function DoaPill({
  status,
  label,
}: {
  status: DoaStatus;
  label?: string | null;
}) {
  switch (status) {
    case "sent":
      return (
        <span className={cn(PILL_BASE, "bg-emerald-50 text-emerald-700")}>
          {label ?? "Sent"}
        </span>
      );
    case "not_sent":
      return (
        <span className={cn(PILL_BASE, "bg-amber-50 text-amber-700")}>Not sent</span>
      );
    default:
      return <span className={cn(PILL_BASE, "bg-gray-100 text-gray-400")}>—</span>;
  }
}

const MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export const formatShortDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
};

/** Project convention: names render lastName firstName, initials too. */
export const planCustomerName = (c: { firstName?: string | null; lastName?: string | null }) =>
  `${c.lastName ?? ""} ${c.firstName ?? ""}`.trim();

export const planCustomerInitials = (c: {
  firstName?: string | null;
  lastName?: string | null;
}) => ((c.lastName?.[0] ?? "") + (c.firstName?.[0] ?? "")).toUpperCase();
