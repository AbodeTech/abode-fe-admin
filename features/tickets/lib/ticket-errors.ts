import { ApiClientError } from '@/lib/api-client';

/**
 * Server-side validation the UI mirrors, so a user is told before the round
 * trip rather than by a 400. Kept in step with
 * abode-be-v2/src/modules/support-ticket/support-ticket.constants.ts.
 */
export const MIN_RESOLUTION_LENGTH = 20;
export const MIN_NOTE_LENGTH = 5;
/** Unresolved past this is "breaching" in the queue strip. */
export const BREACH_AFTER_HOURS = 48;

/**
 * Someone else changed this ticket since we rendered it.
 *
 * The BE answers a failed `expected_updated_at` with a 400 rather than a 409,
 * so the status code alone cannot tell this apart from a validation failure —
 * the discriminator is the `code` the exception filter passes through. Never
 * match on the message.
 */
export const isStaleTicketError = (error: unknown): boolean =>
  error instanceof ApiClientError && error.code === 'TICKET_STALE_STATE';

/** Linking is fault-only, and the BE enforces it rather than advising. */
export const isNotAFaultError = (error: unknown): boolean =>
  error instanceof ApiClientError && error.code === 'INVALID_TICKET_TYPE_FOR_ISSUE';

/**
 * What to show when a write fails.
 *
 * A stale write is not the user's mistake and there is nothing to correct, so
 * it gets its own copy telling them what actually happened and what to do.
 */
export const ticketWriteError = (error: unknown, fallback: string): string => {
  if (isStaleTicketError(error)) {
    return 'Someone else changed this ticket while you had it open — reopen it to see their change.';
  }
  if (error instanceof ApiClientError && error.messages.length) {
    return error.messages[0];
  }
  return error instanceof Error ? error.message : fallback;
};
