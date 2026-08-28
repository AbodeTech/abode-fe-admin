import type { MockRoutes } from '../router';
import { body } from './util';

/* ============================================================
 * Admin dashboard mocks — /admin/dashboard/*.
 *
 * Shapes match AdminDashboardService KPIs / top lists.
 * ============================================================ */

export const dashboardRoutes: MockRoutes = {
  'GET /admin/dashboard/kpis': () =>
    body({
      // Period-scoped tiles — honour ?from/?to, carry a prior-period delta.
      period_revenue: { value: 86_400_000, delta_pct: 12.5 },
      inflow: { value: 86_400_000, delta_pct: 12.5 },
      outflow: { value: 28_700_000, delta_pct: -4.2 },
      period_new_users: { value: 42, delta_pct: 8 },
      period_new_payment_plans: { value: 18, delta_pct: -2.1 },
      admin_created_plans_in_period: { value: 3, delta_pct: 50 },

      // A breakdown, not a tile — honours the filter but carries no badge.
      revenue_by_asset_type: {
        flex: 62_000_000,
        full_ownership: 24_400_000,
        commercial: 0,
        developer_plot: 0,
      },

      // Lifetime tiles — ignore the filter, no delta field at all.
      total_users: { value: 1284 },
      associate_users: { value: 412 },
      associate_pro_users: { value: 96 },
      total_assets: { value: 48 },
      default_users: { value: 37 },
      suspended_users: { value: 12 },
      suspended_payment_plans: { value: 19 },
      wallet_balances_held_total: { value: 54_200_000 },
      total_payment_plans: { value: 890 },
      admin_created_plans_count: { value: 44 },
      closed_plans_count: { value: 120 },
    }),

  'GET /admin/dashboard/top-products': ({ query }) => {
    const limit = Math.min(20, Math.max(1, Number(query.limit ?? 5) || 5));
    const rows = [
      {
        asset_id: '665faaaa00000000000000a1',
        name: 'Aviation City',
        asset_location: 'Lekki',
        asset_type: 'flex',
        plans_sold: 48,
        total_collected: 86_000_000,
      },
      {
        asset_id: '665faaaa00000000000000a2',
        name: 'Harmony Gardens',
        asset_location: 'Ibeju',
        asset_type: 'flex',
        plans_sold: 36,
        total_collected: 54_200_000,
      },
      {
        asset_id: '665faaaa00000000000000a3',
        name: 'Palm Court',
        asset_location: 'Ajah',
        asset_type: 'full_ownership',
        plans_sold: 22,
        total_collected: 41_500_000,
      },
      {
        asset_id: '665faaaa00000000000000a4',
        name: 'Coral Estate',
        asset_location: 'VGC',
        asset_type: 'flex',
        plans_sold: 18,
        total_collected: 29_800_000,
      },
      {
        asset_id: '665faaaa00000000000000a5',
        name: 'Skyline Residences',
        asset_location: 'Ikoyi',
        asset_type: 'full_ownership',
        plans_sold: 12,
        total_collected: 21_100_000,
      },
    ];
    return rows.slice(0, limit);
  },

  'GET /admin/dashboard/top-associates': ({ query }) => {
    const limit = Math.min(20, Math.max(1, Number(query.limit ?? 5) || 5));
    const rows = [
      {
        user_id: '665fuuuu00000000000000u1',
        name: 'Adaeze Okonkwo',
        email: 'adaeze@example.com',
        referral_status: 'associate-pro',
        total_commission: 12_400_000,
        commission_transactions: 86,
      },
      {
        user_id: '665fuuuu00000000000000u2',
        name: 'Chinedu Balogun',
        email: 'chinedu@example.com',
        referral_status: 'associate',
        total_commission: 9_850_000,
        commission_transactions: 64,
      },
      {
        user_id: '665fuuuu00000000000000u3',
        name: 'Fatima Yusuf',
        email: 'fatima@example.com',
        referral_status: 'associate-pro',
        total_commission: 8_200_000,
        commission_transactions: 51,
      },
      {
        user_id: '665fuuuu00000000000000u4',
        name: 'Ibrahim Musa',
        email: 'ibrahim@example.com',
        referral_status: 'associate',
        total_commission: 6_750_000,
        commission_transactions: 43,
      },
      {
        user_id: '665fuuuu00000000000000u5',
        name: 'Ngozi Eze',
        email: 'ngozi@example.com',
        referral_status: 'associate',
        total_commission: 5_100_000,
        commission_transactions: 37,
      },
      {
        user_id: '665fuuuu00000000000000u6',
        name: 'Tunde Adebayo',
        email: 'tunde@example.com',
        referral_status: 'associate-pro',
        total_commission: 4_800_000,
        commission_transactions: 31,
      },
      {
        user_id: '665fuuuu00000000000000u7',
        name: 'Amina Bello',
        email: 'amina@example.com',
        referral_status: 'associate',
        total_commission: 4_250_000,
        commission_transactions: 28,
      },
      {
        user_id: '665fuuuu00000000000000u8',
        name: 'Emeka Obi',
        email: 'emeka@example.com',
        referral_status: 'associate',
        total_commission: 3_900_000,
        commission_transactions: 24,
      },
      {
        user_id: '665fuuuu00000000000000u9',
        name: 'Halima Sani',
        email: 'halima@example.com',
        referral_status: 'premium',
        total_commission: 3_450_000,
        commission_transactions: 22,
      },
      {
        user_id: '665fuuuu00000000000000ua',
        name: 'Kunle Adeyemi',
        email: 'kunle@example.com',
        referral_status: 'associate',
        total_commission: 3_100_000,
        commission_transactions: 19,
      },
      {
        user_id: '665fuuuu00000000000000ub',
        name: 'Blessing Okoro',
        email: 'blessing@example.com',
        referral_status: 'associate-pro',
        total_commission: 2_850_000,
        commission_transactions: 17,
      },
      {
        user_id: '665fuuuu00000000000000uc',
        name: 'Yusuf Aliyu',
        email: 'yusuf@example.com',
        referral_status: 'associate',
        total_commission: 2_600_000,
        commission_transactions: 15,
      },
      {
        user_id: '665fuuuu00000000000000ud',
        name: 'Chioma Nwosu',
        email: 'chioma@example.com',
        referral_status: 'associate',
        total_commission: 2_350_000,
        commission_transactions: 14,
      },
      {
        user_id: '665fuuuu00000000000000ue',
        name: 'Segun Bakare',
        email: 'segun@example.com',
        referral_status: 'premium',
        total_commission: 2_100_000,
        commission_transactions: 12,
      },
      {
        user_id: '665fuuuu00000000000000uf',
        name: 'Zainab Lawal',
        email: 'zainab@example.com',
        referral_status: 'associate',
        total_commission: 1_900_000,
        commission_transactions: 11,
      },
      {
        user_id: '665fuuuu00000000000000ug',
        name: 'Daniel Okeke',
        email: 'daniel@example.com',
        referral_status: 'associate',
        total_commission: 1_650_000,
        commission_transactions: 10,
      },
      {
        user_id: '665fuuuu00000000000000uh',
        name: 'Funke Adesina',
        email: 'funke@example.com',
        referral_status: 'associate-pro',
        total_commission: 1_400_000,
        commission_transactions: 9,
      },
      {
        user_id: '665fuuuu00000000000000ui',
        name: 'Hassan Ibrahim',
        email: 'hassan@example.com',
        referral_status: 'associate',
        total_commission: 1_200_000,
        commission_transactions: 8,
      },
      {
        user_id: '665fuuuu00000000000000uj',
        name: 'Peace Anene',
        email: 'peace@example.com',
        referral_status: 'associate',
        total_commission: 980_000,
        commission_transactions: 7,
      },
      {
        user_id: '665fuuuu00000000000000uk',
        name: 'Victor Eze',
        email: 'victor@example.com',
        referral_status: 'default',
        total_commission: 750_000,
        commission_transactions: 5,
      },
    ];
    return rows.slice(0, limit);
  },
};
