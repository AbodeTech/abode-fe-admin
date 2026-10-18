/* Requests — the admin surface, on REST against /admin/requests/*.
 *
 * Same design as before, switched off GraphQL. Three types (location change
 * was dropped in v2), a richer lifecycle (under_review, approved → completed,
 * admin cancel), and the first backend module with documented response
 * bodies and populated refs — no em-dash pattern needed here.
 */

export { useRequestStats } from './hooks/use-request-stats';
export { useClientRequests, useClientRequest, DEFAULT_REQUESTS_LIMIT } from './hooks/use-client-requests';
export {
  useApproveRequest,
  useCancelRequest,
  useCompleteRequest,
  useDeclineRequest,
  useReviewRequest,
} from './hooks/use-action-requests';
export type { RequestListFilters, RequestStatsFilters } from './hooks/query-keys';

export { RequestStats } from './components/RequestStats';
export { RequestTypeCards } from './components/RequestTypeCards';
export { RequestsTable, RequestStatusBadge } from './components/RequestsTable';
export { RequestsFilters } from './components/RequestsFilters';
export { SubRequestStats } from './components/SubRequestStats';
export { RequestDetailModal } from './components/RequestDetailModal';

export {
  REQUEST_TYPES,
  REQUEST_TYPE_LABELS,
  REQUEST_STATUSES,
  REQUEST_STATUS_LABELS,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABELS,
  REQUEST_FEES,
  requestActions,
} from './schemas/request.schema';
export type {
  ClientRequest,
  RequestType,
  RequestStatus,
  PaymentStatus,
  RequestStatistics,
  ListAnalytics,
} from './schemas/request.schema';
export { RequestListPage } from './components/RequestListPage';
