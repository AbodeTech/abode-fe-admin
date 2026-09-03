// Hooks
export { useUsers, useSystemUsersOverview } from './hooks/use-users';
export { useUserAnalytics } from './hooks/use-user-analytics';
export type { UserAnalyticsData, AnalyticsDataPoint, RegistrationTrendPoint, HowYouHeardPoint } from './hooks/use-user-analytics';
export { useUserDetails, useUserCore, useUserStats } from './hooks/use-user-detail';
export type { UsersData, SystemUsersOverviewData } from './hooks/use-users';
export type { UserDetailsData } from './hooks/use-user-detail';
export type { AdminUserRow, UserOverview, UserAnalytics, UserTier } from './schemas/user.schema';
export { useUserReferrals } from './hooks/use-user-referrals';
export type { UserReferralData } from './hooks/use-user-referrals';
export {
  useEditUserProfile,
  useEditUserWallet,
  useModifyReferralStatus,
  useReassignReferrer,
  useAddUserReferral,
  useDeleteUserReferral,
  useUpdateUserTin,
  useClearUserTin,
  useSuspendUser,
  useUnsuspendUser,
  useForcePasswordReset,
  useSuspendWallet,
  useUnsuspendWallet,
} from './hooks/use-user-mutations';
export {
  useSuspendedUsers,
  useExportSuspendedUsers,
} from './hooks/use-suspended-users';
export { useExportUsersByFilter, useExportUsersWithAsset } from './hooks/use-export-users';
export { useRegisterUser } from './hooks/use-register-user';

// Types
export type {
  User,
  UserDetail,
  UserTransaction,
  SystemUsersMetrics,
  UserReferral,
  EditUserProfileInput,
  EditUserWalletInput,
  ModifyReferralStatusInput,
} from './types/user.types';

// Components
export { UsersTable } from './components/all/UsersTable';
export { UserProfile } from './components/detail/UserProfile';
export { UserProfileHeader } from './components/detail/UserProfileHeader';
export { UserStats } from './components/detail/UserStats';
export { UserStatsCards } from './components/detail/UserStatsCards';
export { UserInfo } from './components/detail/UserInfo';
export { UserAssetsList } from './components/detail/UserAssetsList';
export { UserAssetActions } from './components/detail/UserAssetActions';
export { UserEditActions } from './components/detail/UserEditActions';
export { UserReferralActions } from './components/detail/UserReferralActions';
export { UserTransactions } from './components/detail/UserTransactions';
export { UserTransactionsList } from './components/detail/UserTransactionsList';
export { SystemUserOverview } from './components/all/SystemUserOverview';
export { UsersPageActions } from './components/all/UsersPageActions';
export { UsersExportModal } from './components/all/UsersExportModal';
export { RegisterUserModal } from './components/modals/RegisterUserModal';
export { SuspendedUsersTable } from './components/suspended/SuspendedUsersTable';
export { UserPaymentPlanUnSuspend } from './components/modals/UserPaymentPlanUnSuspend';
export { UserPaymentPlanSuspend } from './components/modals/UserPaymentPlanSuspend';
export { ReasonActionModal } from './components/modals/ReasonActionModal';
export { ReassignReferrerModal } from './components/modals/ReassignReferrerModal';

// Table components
export { UserReferralsTable } from './components/detail/tables/UserReferralsTable';

// Analytics components
export { UserAnalyticsAcquisition } from './components/analytics/UserAnalyticsAcquisition';
export { UserAnalyticsDemographics } from './components/analytics/UserAnalyticsDemographics';
export { UserAnalyticsConversion } from './components/analytics/UserAnalyticsConversion';
