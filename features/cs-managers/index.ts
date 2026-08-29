// Hooks
export { useCSManagers, useUnassignedCustomers, useAdminPicker, DEFAULT_UNASSIGNED_LIMIT } from './hooks/use-cs-managers';
export { useCSManagerTargets, useCSManagerTarget } from './hooks/use-cs-manager-targets';
export {
  useAddCSManager,
  useRemoveCSManager,
  useAssignCustomersToCSM,
  useUpsertCSManagerTarget,
} from './hooks/use-cs-manager-mutations';
export { useCSManagerDashboard } from './hooks/use-cs-manager-dashboard';
export {
  useCustomerOnboardingAttempts,
  useLogOnboardingCall,
  useMarkDeedDelivered,
} from './hooks/use-plan-actions';
export { useExportDashboardPlans } from './hooks/use-export-dashboard-plans';
export { useIsCurrentCSManager } from './hooks/use-is-current-cs-manager';
export { csManagerKeys } from './hooks/query-keys';

// Components
export { ManageCSManagersMenu } from './components/ManageCSManagersMenu';
export { AddCSManagerDialog } from './components/AddCSManagerDialog';
export { RemoveCSManagerDialog } from './components/RemoveCSManagerDialog';
export { ManageCSTargetsDialog } from './components/ManageCSTargetsDialog';
export { UnassignedCustomersTable } from './components/UnassignedCustomersTable';
export { UnassignedCustomersDialog } from './components/UnassignedCustomersDialog';
export { NoCSManagersEmptyState } from './components/NoCSManagersEmptyState';
export { CSPerformanceHeader } from './components/CSPerformanceHeader';
export { CSPeriodFilter } from './components/CSPeriodFilter';
export { CSManagerSnapshot } from './components/CSManagerSnapshot';
export { BacklogsSection } from './components/BacklogsSection';
export { PortfolioHealthStrip } from './components/PortfolioHealthStrip';
export { CustomersTable } from './components/CustomersTable';
export { PlanDetailDrawer } from './components/PlanDetailDrawer';

// Schemas
export {
  adminMinName,
  adminMinInitials,
  pickerRowName,
  pickerRowInitials,
  PLAN_FILTER_KEYS,
  PLAN_SORT_KEYS,
} from './schemas/cs-manager.schema';
export type {
  CSManagerSummary,
  CSManagerTarget,
  UnassignedCustomer,
  AdminPickerRow,
  AdminMin,
  AssignTargetPayload,
  CSManagerDashboard,
  PlanRow,
  PlanFilterKey,
  PlanSortKey,
} from './schemas/cs-manager.schema';
