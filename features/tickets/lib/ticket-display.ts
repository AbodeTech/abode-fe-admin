import {
  TicketChannel,
  TicketStatus,
  IssueStatus,
  TicketFilter,
  TicketSort,
} from "@/lib/gql/graphql";

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
  unassigned: "Unassigned",
  unlinked: "Unlinked",
  open: "Open",
  waiting_customer: "Waiting customer",
  blocked_on_issue: "Blocked on issue",
  resolved: "Resolved",
};

export const SORT_OPTIONS: { value: TicketSort; label: string }[] = [
  { value: TicketSort.OldestFirst, label: "Oldest first" },
  { value: TicketSort.NewestFirst, label: "Newest first" },
  { value: TicketSort.RecentlyUpdated, label: "Recently updated" },
];

export const CHANNEL_OPTIONS: { value: TicketChannel; label: string }[] = [
  { value: TicketChannel.Email, label: "Email" },
  { value: TicketChannel.Phone, label: "Phone" },
  { value: TicketChannel.Whatsapp, label: "WhatsApp" },
  { value: TicketChannel.InPerson, label: "In-person" },
  { value: TicketChannel.Other, label: "Other" },
];

export const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: TicketStatus.Open, label: "Open" },
  { value: TicketStatus.InProgress, label: "In progress" },
  { value: TicketStatus.WaitingCustomer, label: "Waiting customer" },
  { value: TicketStatus.Resolved, label: "Resolved" },
];
