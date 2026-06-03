// Components — consumed by app pages
export { PerformanceHeader } from "./components/PerformanceHeader";
export { ManagerSnapshot } from "./components/ManagerSnapshot";
export { RecruitmentSection } from "./components/RecruitmentSection";
export { SalesRevenueSection } from "./components/SalesRevenueSection";
export { ActivitySection } from "./components/ActivitySection";
export { MilestonesSection } from "./components/MilestonesSection";
export { AssociateProsTable } from "./components/AssociateProsTable";
export { ManagerAssignmentCard } from "./components/ManagerAssignmentCard";

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

// Hooks — mutations
export { useAddManager } from "./hooks/use-add-manager";
export { useRemoveManager } from "./hooks/use-remove-manager";
export { useReassignPro } from "./hooks/use-reassign-pro";
export { useBulkAssignPros } from "./hooks/use-bulk-assign-pros";
export { useAssignManagerTarget } from "./hooks/use-assign-manager-target";
