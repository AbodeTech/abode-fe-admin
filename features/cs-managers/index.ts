export { CSManagerSnapshot } from "./components/CSManagerSnapshot";
export { BacklogsSection } from "./components/BacklogsSection";
export { PortfolioHealthStrip } from "./components/PortfolioHealthStrip";
export { CustomersTable } from "./components/CustomersTable";
export { CSManagersListTable } from "./components/CSManagersListTable";
export { UnassignedCustomersTable } from "./components/UnassignedCustomersTable";
export { AddCSManagerDialog } from "./components/AddCSManagerDialog";
export { AssignCustomersDialog } from "./components/AssignCustomersDialog";
export { ManageCSTargetsDialog } from "./components/dialogs/ManageCSTargetsDialog";
export { PlanDetailDrawer } from "./components/drawers/PlanDetailDrawer";
export {
  useCSManagerDashboard,
  csManagerKeys,
} from "./hooks/use-cs-manager-dashboard";
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
  useCustomerOnboardingAttempts,
  useLogOnboardingCall,
  useMarkDeedDelivered,
  planActionKeys,
} from "./hooks/use-plan-actions";
export {
  useCSManagerTargets,
  useCSManagerTarget,
  csManagerTargetKeys,
} from "./hooks/use-cs-manager-targets";
export type { AdminOption } from "./types";
