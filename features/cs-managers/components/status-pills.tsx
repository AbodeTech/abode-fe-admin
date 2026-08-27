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
