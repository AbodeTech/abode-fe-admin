export { CSPerformanceHeader } from "./components/CSPerformanceHeader";
export { CSPeriodFilter } from "./components/CSPeriodFilter";
export { CSManagerSnapshot } from "./components/CSManagerSnapshot";
export { BacklogsSection } from "./components/BacklogsSection";
export { PortfolioHealthStrip } from "./components/PortfolioHealthStrip";
export { CustomersTable } from "./components/CustomersTable";
export { UnassignedCustomersTable } from "./components/UnassignedCustomersTable";
export { NoCSManagersEmptyState } from "./components/NoCSManagersEmptyState";
export { ManageCSManagersMenu } from "./components/ManageCSManagersMenu";
export { AddCSManagerDialog } from "./components/AddCSManagerDialog";
export { RemoveCSManagerDialog } from "./components/dialogs/RemoveCSManagerDialog";
export { UnassignedCustomersDialog } from "./components/dialogs/UnassignedCustomersDialog";
export { ManageCSTargetsDialog } from "./components/dialogs/ManageCSTargetsDialog";
export {
  useCSManagerDashboard,
  csManagerKeys,
} from "./hooks/use-cs-manager-dashboard";
export { useIsCurrentCSManager } from "./hooks/use-is-current-cs-manager";
export {
  useCSManagersList,
  useUnassignedCustomers,
  useAdminOptions,
  csManagersListKeys,
} from "./hooks/use-cs-managers-list";
export {
  useAddCSManager,
  useRemoveCSManager,
  useAssignCustomersToCSM,
  useAssignCSManagerTarget,
  type AssignCustomersToCSMInput,
  type AssignCsManagerTargetInput,
} from "./hooks/use-cs-manager-mutations";
export {
  useCSManagerTargets,
  useCSManagerTarget,
  csManagerTargetKeys,
} from "./hooks/use-cs-manager-targets";
export {
  csManagerName,
  csManagerInitials,
  type CSManagerSummary,
  type CSManagerAdmin,
} from "./lib/manager-display";
export type { AdminOption } from "./types";
