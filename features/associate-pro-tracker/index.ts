/* ============================================================
 * Associate Pro Yearly Tracker.
 *
 * Covers the four endpoints abode-be-v2 exposes: the dashboard's five metric
 * sections, the year list, and reading/writing a year's goals.
 *
 * The design doc's recruitment, upgrades and payment-plan tables and the CSV
 * export are NOT here — the BE has no routes for them. See
 * docs/TRANSACTION-STATS-GAPS.md.
 * ============================================================ */

export { TrackerHeader } from './components/TrackerHeader';
export { YearPicker } from './components/YearPicker';
export { KeyMetricsSection } from './components/KeyMetricsSection';
export { ConversionMetricsSection } from './components/ConversionMetricsSection';
export { GraphsSection } from './components/GraphsSection';
export { GoalsNotSetPrompt } from './components/GoalsNotSetPrompt';
export { SetYearlyGoalDialog } from './components/SetYearlyGoalDialog';
export { SectionErrorBoundary } from './components/SectionErrorBoundary';

export { useTrackerDashboard } from './hooks/use-tracker-dashboard';
export { useYearsList } from './hooks/use-years-list';
export { useYearlyGoal } from './hooks/use-yearly-goal';
export { useUpsertYearlyGoal } from './hooks/use-upsert-yearly-goal';
export { useTrackerPermissions } from './hooks/use-tracker-permissions';
export { trackerKeys } from './hooks/query-keys';

export {
  MAX_TRACKER_YEAR,
  MIN_TRACKER_YEAR,
  TRACKER_PERMISSIONS,
  upsertYearlyGoalSchema,
} from './schemas/tracker.schema';
export type {
  DailyPoint,
  Funnel,
  Series,
  TrackerDashboard,
  UpsertYearlyGoalPayload,
  YearPeriod,
  YearlyGoal,
  YearsList,
} from './schemas/tracker.schema';
