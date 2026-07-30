// Components
export { SignInForm } from './components/SignInForm';
export { ForgotPasswordForm } from './components/ForgotPasswordForm';
export { ResetPasswordForm } from './components/ResetPasswordForm';
export { ChangePasswordForm } from './components/ChangePasswordForm';
export { AdminSessionGate } from './components/AdminSessionGate';

// Hooks
export { useAdminLogin } from './hooks/use-admin-login';
export { useAdminMe } from './hooks/use-admin-me';
export { useChangePassword } from './hooks/use-change-password';
export { useLogout } from './hooks/use-logout';
export { useForgotPassword, useResetPassword } from './hooks/use-password-recovery';
export { authKeys } from './hooks/query-keys';

// Types — other features legitimately need the admin identity type.
export type { Admin, AdminRole } from './schemas/auth.schema';
export { ADMIN_ROLES, AdminSchema } from './schemas/auth.schema';
