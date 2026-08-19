/* Flex leads — brochure downloads + site-inspection bookings, on REST
 * against /admin/flex-leads/*.
 *
 * Ported from main, where the feature ran on an in-memory dummy layer
 * because the API didn't exist. It does now — the dummy layer is gone and
 * everything is live: list, per-status counts, status/notes update, soft
 * delete (FL-5), and the filtered CSV export (FL-8, 50k-row cap).
 */

export { FlexLeadStatsStrip } from './components/FlexLeadStatsStrip';
export { FlexLeadsFilters } from './components/FlexLeadsFilters';
export { FlexLeadsTable } from './components/FlexLeadsTable';
export { FlexLeadDetailModal } from './components/FlexLeadDetailModal';
export { FlexLeadStatusBadge, FLEX_LEAD_STATUS_OPTIONS } from './components/FlexLeadStatusBadge';

export { useFlexLeads, useFlexLeadCounts, DEFAULT_FLEX_LEADS_LIMIT } from './hooks/use-flex-leads';
export {
  useUpdateFlexLead,
  useDeleteFlexLead,
  useExportFlexLeads,
} from './hooks/use-flex-lead-actions';
export type { FlexLeadListFilters } from './hooks/query-keys';

export {
  FLEX_LEAD_STATUSES,
  FLEX_LEAD_STATUS_LABELS,
  FLEX_LEAD_TYPES,
  FLEX_LEAD_TYPE_LABELS,
} from './schemas/flex-lead.schema';
export type { FlexLeadRow, FlexLeadStatus, FlexLeadType } from './schemas/flex-lead.schema';
