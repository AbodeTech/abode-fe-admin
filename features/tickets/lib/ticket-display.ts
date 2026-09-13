
import { type FieldSource, type IssueStatus, type TicketChannel, type TicketFilter, type TicketSort, type TicketStatus, type TicketType } from "../schemas/ticket.schema";
/** Copy + colour tokens for every enum the ticketing surface renders.
 * Kept in one place so pill colours stay consistent across list, drawer
 * and dialogs. */

export const CHANNEL_LABELS: Record<TicketChannel, string> = {
  email: "Email",
  phone: "Phone",
  whatsapp: "WhatsApp",
  in_person: "In-person",
  other: "Other",
};

export const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In progress",
  waiting_customer: "Waiting customer",
  resolved: "Resolved",
};

export const STATUS_PILL_CLASS: Record<TicketStatus, string> = {
  open: "bg-blue-50 text-blue-700",
  in_progress: "bg-amber-50 text-amber-700",
  waiting_customer: "bg-purple-50 text-purple-700",
  resolved: "bg-emerald-50 text-emerald-700",
};

export const ISSUE_STATUS_LABELS: Record<IssueStatus, string> = {
  investigating: "Investigating",
  identified: "Identified",
  monitoring: "Monitoring",
  resolved: "Resolved",
};

export const ISSUE_STATUS_PILL_CLASS: Record<IssueStatus, string> = {
  investigating: "bg-amber-50 text-amber-700",
  identified: "bg-blue-50 text-blue-700",
  monitoring: "bg-purple-50 text-purple-700",
  resolved: "bg-emerald-50 text-emerald-700",
};

export const FILTER_LABELS: Record<TicketFilter, string> = {
  all: "All",
  mine: "Mine",
  unassigned: "Unassigned",
  unlinked: "Unlinked",
  open: "Open",
  waiting_customer: "Waiting customer",
  blocked_on_issue: "Blocked on issue",
  resolved: "Resolved",
};

export const SORT_OPTIONS: { value: TicketSort; label: string }[] = [
  { value: 'oldest_first', label: "Oldest first" },
  { value: 'newest_first', label: "Newest first" },
  { value: 'recently_updated', label: "Recently updated" },
];

export const CHANNEL_OPTIONS: { value: TicketChannel; label: string }[] = [
  { value: 'email', label: "Email" },
  { value: 'phone', label: "Phone" },
  { value: 'whatsapp', label: "WhatsApp" },
  { value: 'in_person', label: "In-person" },
  { value: 'other', label: "Other" },
];

export const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: 'open', label: "Open" },
  { value: 'in_progress', label: "In progress" },
  { value: 'waiting_customer', label: "Waiting customer" },
  { value: 'resolved', label: "Resolved" },
];

/**
 * Recurrence copy for issues.
 *
 * An incident resolved three times is not a resolved incident — it is an
 * unsolved one with a bad diagnosis, and it must not read the same in the list
 * as one that closed cleanly. `first_resolved_at` survives every reopen, so
 * "we thought we had this on 3 Aug" stays true no matter how many attempts follow.
 */
export const recurrenceLabel = (reopenCount: number): string | null => {
  if (!reopenCount) return null;
  return reopenCount === 1 ? "Came back once" : `Came back ${reopenCount}\u00d7`;
};

/** Escalating tone — a third recurrence should not look like a first. */
export const recurrencePillClass = (reopenCount: number): string => {
  if (reopenCount >= 3) return "bg-red-50 text-[#AD1F2A]";
  if (reopenCount === 2) return "bg-orange-50 text-orange-700";
  return "bg-amber-50 text-amber-700";
};

/**
 * What kind of thing a ticket is, independent of what it is about.
 *
 * Support says "issue" where the wire says `fault`. The value is left alone —
 * renaming it would need a migration, a classifier change and a re-prompt, and
 * would collide head-on with the Issue entity these very tickets group under —
 * so the translation happens once, here, and nowhere else. Anything rendering
 * a raw `ticket.type` is a bug.
 *
 * Only issues are meant to belong to an Issue record — grouping an enquiry
 * under a root cause asserts something is broken when it is not. The BE
 * documents that rule on the model but does not enforce it on
 * linkTicketToIssue, so the UI advises rather than blocks.
 */
export const TYPE_LABELS: Record<TicketType, string> = {
  enquiry: "Enquiry",
  fault: "Issue",
  request: "Request",
};

export const TYPE_PILL_CLASS: Record<TicketType, string> = {
  enquiry: "bg-sky-50 text-sky-700",
  fault: "bg-red-50 text-[#AD1F2A]",
  request: "bg-violet-50 text-violet-700",
};

export const TYPE_OPTIONS: { value: TicketType; label: string }[] = [
  { value: 'fault', label: "Issue — something is broken" },
  { value: 'enquiry', label: "Enquiry — a question, nothing broken" },
  { value: 'request', label: "Request — work needed, nothing broken" },
];

/** Turns a raw category key ("payment_process") into display copy. */
export const categoryLabel = (key?: string | null) =>
  key ? key.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase()) : null;

/** Who put the value there. Silent for human-set values — the machine is what
 *  warrants a marker, and badging every field would just be noise. */
export const SOURCE_LABELS: Record<FieldSource, string> = {
  ai: "Set by AI",
  human: "Set by a person",
};

/** The BE auto-writes at >= 0.75; below that the value is only suggested. */
export const AUTO_WRITE_CONFIDENCE = 0.75;

export const formatConfidence = (c?: number | null) =>
  c == null ? null : `${Math.round(c * 100)}%`;
