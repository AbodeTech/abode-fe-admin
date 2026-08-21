// Hooks
export { useAdminDashboard } from './hooks/use-admin-dashboard';
export type { DashboardData } from './hooks/use-admin-dashboard';
export { useDashboardKpis } from './hooks/use-dashboard-kpis';
export type { DashboardKpis, DashboardKpiRange } from './schemas/dashboard-kpi.schema';
export { useDashboardTopProducts } from './hooks/use-dashboard-top-products';
export { useDashboardTopAssociates } from './hooks/use-dashboard-top-associates';
export {
  DEFAULT_TOP_LIST_LIMIT,
  MAX_TOP_LIST_LIMIT,
  type TopProduct,
  type TopAssociate,
} from './schemas/dashboard-top.schema';

// Components
export { default as DashboardQuickOverview } from './components/DashboardQuickOverview';
export { default as TopSellingProducts } from './components/TopSellingProducts';
export { default as TopAssociates } from './components/TopAssociates';
export { default as InviteAdminDialog } from './components/InviteAdminDialog';

export { useInviteAdmin } from './hooks/use-invite-admin';
