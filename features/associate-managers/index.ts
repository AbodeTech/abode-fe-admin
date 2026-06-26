// Components — consumed by app pages
export { PerformanceHeader } from "./components/PerformanceHeader";
export { ManagerSnapshot } from "./components/ManagerSnapshot";
export { RecruitmentSection } from "./components/RecruitmentSection";
export { SalesRevenueSection } from "./components/SalesRevenueSection";
export { ActivitySection } from "./components/ActivitySection";
export { MilestonesSection } from "./components/MilestonesSection";
export { AssociateProsTable } from "./components/AssociateProsTable";
export { ManagerAssignmentCard } from "./components/ManagerAssignmentCard";
export { NoManagersEmptyState } from "./components/NoManagersEmptyState";
export { TeamSalesSection } from "./components/TeamSalesSection";
export { SystemAssociatesTable } from "./components/SystemAssociatesTable";

// Hooks — read
export {
  useAssociateManagers,
  useAssociateManager,
} from "./hooks/use-associate-managers";
export {
  useAdminManagerDashboard,
  useManagerDashboard,
} from "./hooks/use-manager-dashboard";
export {
  useManagerTargets,
  useManagerTarget,
} from "./hooks/use-manager-targets";
export {
  useUnassignedPros,
  useUnassignedProsCount,
} from "./hooks/use-unassigned-pros";
export { useIsCurrentUserManager } from "./hooks/use-is-current-user-manager";
export { useOnboardingAttempts } from "./hooks/use-onboarding-attempts";
export type { OnboardingAttemptData } from "./hooks/use-onboarding-attempts";
export {
  useSystemAssociatesDashboard,
  DEFAULT_SYSTEM_ASSOCIATES_LIMIT,
} from "./hooks/use-system-associates-dashboard";
export {
  useAllManagersDashboard,
  DEFAULT_ALL_MANAGERS_LIMIT,
} from "./hooks/use-all-managers-dashboard";
export { useExportManagerDashboardPros } from "./hooks/use-export-manager-pros";
export { useExportManagerSalesRecord } from "./hooks/use-export-manager-sales";
export { buildManagerDashboardFilter } from "./lib/dashboard-filter";
export {
  PRO_GROUP_OPTIONS,
  PRO_SORT_OPTIONS,
} from "./lib/roster-filter-options";

// Hooks — mutations
export { useAddManager } from "./hooks/use-add-manager";
export { useRemoveManager } from "./hooks/use-remove-manager";
export { useReassignPro } from "./hooks/use-reassign-pro";
export { useBulkAssignPros } from "./hooks/use-bulk-assign-pros";
export { useAssignManagerTarget } from "./hooks/use-assign-manager-target";
export { useLogOnboardingAttempt } from "./hooks/use-log-onboarding-attempt";
