import { MOCK_ASSET_NAMES, MOCK_USERS, mutationOk } from "../shared";

export const dashboardHandlers: Record<
  string,
  (variables?: Record<string, unknown>) => unknown
> = {
  GetAdminDashboardDetails: () => ({
    getAdminDashboardDetails: {
      users: 1284,
      monthly_recurring_revenue: 86_400_000,
      associate_users: 412,
      associate_pro_users: 96,
      total_asset: 48,
      default_users: 37,
      suspended_users: 12,
      suspended_payment_plans: 19,
      total_payable: 214_000_000,
      sales: 312,
      inflow: 142_500_000,
      outflow: 28_700_000,
      total_wallet_balance: 54_200_000,
      top_associates: MOCK_USERS.slice(0, 6).map((u, i) => ({
        userName: u.userName,
        email: u.email,
        firstName: u.firstName,
        lastName: u.lastName,
        amount_brought: 8_500_000 + i * 1_200_000,
        no_of_referral: 14 + i * 3,
        phoneNumber: u.phoneNumber,
      })),
      top_selling_prop: MOCK_ASSET_NAMES.slice(0, 5).map((name, i) => ({
        asset_name: name,
        asset_pictures: [
          `https://picsum.photos/seed/abode-asset-${i}/160/120`,
        ],
        asset_location: ["Lekki", "Ibeju", "Ajah", "VGC", "Ikoyi"][i],
        units_subscribed: 24 + i * 5,
        amount_broughtin: 22_000_000 + i * 3_500_000,
      })),
    },
  }),

  InviteAdmin: () =>
    mutationOk({
      createSubAdmin: true,
    }),
};
