import { format, formatDistanceToNowStrict } from 'date-fns';

import type { WhatsappContactIdentity } from '../schemas/whatsapp.schema';

type Named = Pick<WhatsappContactIdentity, 'firstName' | 'lastName' | 'phoneNumber'>;

/** Meta sends E.164 without a plus; the plus is what makes it read as a number. */
export const formatPhone = (phoneNumber: string) =>
  phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;

/**
 * A number that matched no account, or matched several, comes back with no name
 * at all — see the backend's identity rule. Showing the number in the name slot
 * is honest about that; inventing "Unknown" would read as a fact about the
 * customer rather than about our records.
 */
export const contactName = (contact: Named) => {
  const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ');
  return name || formatPhone(contact.phoneNumber);
};

/** Initials for a named contact; null for an unmatched number (the avatar shows a phone icon). */
export const contactInitials = (contact: Named) => {
  const initials = `${contact.firstName?.[0] ?? ''}${contact.lastName?.[0] ?? ''}`.toUpperCase();
  return initials || null;
};

/** `AWAITING_RECEIPT` → "Awaiting receipt". `IDLE` means no flow is running, so it maps to null. */
export const stepLabel = (step: string | null | undefined) => {
  if (!step || step === 'IDLE') return null;
  const words = step.toLowerCase().replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
};

/** Statuses that mean a message didn't do its job — the "needs attention" set. */
export const FAILED_STATUSES = new Set(['failed', 'rate_limited', 'undelivered']);

export const STATUS_LABELS: Record<string, string> = {
  received: 'Received',
  processed: 'Handled',
  failed: 'Failed',
  rate_limited: 'Rate limited',
  skipped: 'Skipped',
  rejected: 'Rejected',
  sent: 'Sent',
  delivered: 'Delivered',
  read: 'Read',
  undelivered: 'Not delivered',
};

export const statusLabel = (status: string | null | undefined) =>
  status ? (STATUS_LABELS[status] ?? status) : '';

/**
 * List timestamps: relative inside a week, absolute past it — "8 days ago"
 * stops being useful once the question shifts from "is this live?" to "when
 * was this?".
 */
export const relativeTime = (value: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (isNaN(date.getTime())) return '';
  const age = Date.now() - date.getTime();
  return age > 7 * 24 * 60 * 60 * 1000
    ? format(date, 'd MMM')
    : formatDistanceToNowStrict(date, { addSuffix: true });
};
