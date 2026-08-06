/* Withdrawals — the admin review queue, on REST against /admin/withdrawals.
 *
 * Replaces the GraphQL withdrawal-transactions screen. Known gaps recorded in
 * docs/BACKEND-REQUESTS.md: no search (14-family), and no stats endpoint for
 * the old summary cards. Refs accept bare ids or populated objects (ticket 13).
 */

export { WithdrawalsTable } from './components/WithdrawalsTable';
export { WithdrawalFilters } from './components/WithdrawalFilters';
export { WithdrawalStatCards } from './components/WithdrawalStatCards';
export { WithdrawalStatusBadge } from './components/WithdrawalStatusBadge';
export {
  ReviewWithdrawalDialogs,
  type ReviewAction,
} from './components/ReviewWithdrawalDialogs';

export { useWithdrawals, DEFAULT_WITHDRAWAL_LIMIT } from './hooks/use-withdrawals';
export {
  useApproveWithdrawal,
  useDeclineWithdrawal,
  useRetryWithdrawal,
} from './hooks/use-withdrawal-review';
export type { WithdrawalListFilters } from './hooks/query-keys';

export {
  ADMIN_STATUSES,
  ADMIN_STATUS_LABELS,
  PAYMENT_PROVIDERS,
  PAYMENT_PROVIDER_LABELS,
  withdrawalActions,
} from './schemas/withdrawal.schema';
export type { AdminStatus, PaymentProvider, Withdrawal } from './schemas/withdrawal.schema';
