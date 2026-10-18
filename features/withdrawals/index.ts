/* Withdrawals — the admin review queue, on REST against /admin/withdrawals.
 *
 * Replaces the GraphQL withdrawal-transactions screen. Refs are populated as of
 * 2026-08-13 (ticket 13) and `search` is live (confirmed against the deployed
 * spec), so the queue reaches parity with the screen it replaces except for one
 * column: the requester's TIN, which moved onto the KYC subdocument in v2 and
 * isn't reachable from this endpoint (⛔ ticket 23). No stats endpoint exists for
 * the summary cards, which is why they carry a "sample data" chip.
 */

export { WithdrawalsTable } from './components/WithdrawalsTable';
export { WithdrawalFilters } from './components/WithdrawalFilters';
export { WithdrawalExportButton } from './components/WithdrawalExportButton';
export { WithdrawalStatCards } from './components/WithdrawalStatCards';
export { WithdrawalStatusBadge } from './components/WithdrawalStatusBadge';
export { ProcessingMethodBadge } from './components/ProcessingMethodBadge';
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
export { useWithdrawalExport } from './hooks/use-withdrawal-export';
export type { WithdrawalListFilters } from './hooks/query-keys';

export {
  ADMIN_STATUSES,
  ADMIN_STATUS_LABELS,
  PAYMENT_PROVIDERS,
  PAYMENT_PROVIDER_LABELS,
  withdrawalActions,
} from './schemas/withdrawal.schema';
export type { AdminStatus, PaymentProvider, Withdrawal } from './schemas/withdrawal.schema';

// Stat cards — GET /admin/withdrawals/stats (global, date range only).
export { useWithdrawalStats } from "./hooks/use-withdrawal-stats";
export type { WithdrawalStats, WithdrawalStatsFilters } from "./schemas/withdrawal.schema";

// Wallet balance KPI — GET /admin/wallets/stats. Its own endpoint, not part of
// the queue payload, so it does not move with the date range.
export { useWalletStats } from "./hooks/use-wallet-stats";
export type { WalletStats } from "./schemas/withdrawal.schema";
