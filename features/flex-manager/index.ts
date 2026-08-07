export { FlexManagerSnapshot } from "./components/FlexManagerSnapshot";
export { UnassignedFlexManagerCard } from "./components/UnassignedFlexManagerCard";
export {
  useFlexManagerDashboard,
  useCurrentFlexManager,
  flexManagerKeys,
} from "./hooks/use-flex-manager-dashboard";
export {
  useAssignFlexManager,
  useUnassignFlexManager,
  useAssignFlexManagerTarget,
  type AssignFlexManagerTargetInput,
} from "./hooks/use-flex-manager-mutations";
export {
  useFlexManagerTargets,
  useFlexManagerTarget,
} from "./hooks/use-flex-manager-targets";
