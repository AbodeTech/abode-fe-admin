import { mutationOk } from "../shared";

export const authHandlers: Record<string, (variables?: Record<string, unknown>) => unknown> = {
  SigninAdmin: () => ({
    signinAdmin: {
      authToken: "mock-admin-auth-token",
      role: "admin",
      permissions: [
        "users",
        "assets",
        "transactions",
        "allocation",
        "agency",
        "campaigns",
        "associates",
        "withdrawals",
        "roles",
      ],
    },
  }),

  SendAdminEmailVerification: () =>
    mutationOk({
      sendAdminEmailVerification: {
        success: true,
        data: {
          message: "Verification code sent",
          authToken: "mock-reset-session-token",
        },
      },
    }),

  VerifyAdminEmail: () => ({
    verifyAdminEmail: {
      message: "Email verified",
      authToken: "mock-verified-password-token",
    },
  }),

  UpdateAdminPassword: () => ({
    updateAdminPassword: true,
  }),
};
