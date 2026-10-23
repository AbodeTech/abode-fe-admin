import { apiPost } from '@/lib/api-client';

import { MessageAckSchema } from '../schemas/user-actions.schema';

/** Matches abode-be-v2's `AdminUserTransactionController` (admin/users/:id/transactions/:txId). */
const base = (userId: string, transactionId: string) =>
  `/admin/users/${userId}/transactions/${transactionId}`;

/** The BE's reason minimums: 20 characters to reprocess, 30 to force a second firing. */
export const REPROCESS_REASON_MIN = 20;
export const FORCED_REPROCESS_REASON_MIN = 30;

/** Queue the Flex or Full Ownership receipt for one completed payment. Needs send_user_email. */
export const sendTransactionReceipt = (userId: string, transactionId: string) =>
  apiPost(`${base(userId, transactionId)}/emails/receipt`, {}, MessageAckSchema);

/**
 * Fire commission for a completed plan payment, to the plan's frozen recipients. Without
 * `force` the BE refuses a payment whose commission already fired (COMMISSION_ALREADY_FIRED).
 */
export const reprocessTransaction = (
  userId: string,
  transactionId: string,
  input: { reason: string; force?: boolean }
) => apiPost(`${base(userId, transactionId)}/reprocess`, input, MessageAckSchema);
