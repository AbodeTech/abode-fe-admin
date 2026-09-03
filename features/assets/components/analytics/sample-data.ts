/* ============================================================
 * Sample data for the per-asset Performance tab.
 *
 * Portfolio-wide analytics (the assets list page) is now real — see
 * `usePortfolioAnalytics` and GET /admin/assets/analytics/portfolio.
 * There is still **no per-asset analytics endpoint** on abode-be-v2 (⛔
 * ticket 17b), so the detail page's Performance tab stays on the fixtures
 * below, each rendering a "Sample data" chip. An em-dash reads as "unknown";
 * a chart reading "₦45m sold · 62% allocated" reads as a fact, and demo
 * screenshots end up in decks.
 *
 * Delete this file — and the chips — when the per-asset endpoint lands.
 *
 * Amounts are decimal naira.
 * ============================================================ */

/* -------------------- per-asset (detail → Performance) -------------------- */

/** One asset's sale-through and arrears position. */
export type AssetHealthStats = {
  startingInventory: number;
  totalRealised: number;
  remainingValue: number;
  sqmSold: number;
  sqmRemaining: number;
  /** Collected ÷ due, as a percentage. */
  efficiencyRate: number;
  activeCustomers: number;
  defaulting: { customers: number; assetValue: number; outstanding: number };
  terminated: { customers: number; assetValue: number; outstanding: number };
};

/** One payment plan's performance within a size. */
export type PlanPerformance = {
  name: string;
  startValue: number;
  soldValue: number;
  sqmSold: number;
  sqmRemaining: number;
  /** Number of subscriptions taken on this plan. */
  transactions: number;
  defaultingUsers: number;
  defaultedValue: number;
  defaultedBalance: number;
  terminatedPlans: number;
  terminatedValue: number;
  terminatedBalance: number;
  efficiency: number;
};

export type SizePlanBreakdown = {
  /** Square metres, as a label — sizes are named by area. */
  size: string;
  plans: PlanPerformance[];
};

/* -------------------- fixtures -------------------- */

/**
 * One asset's health. The totals below reconcile with `SAMPLE_SIZE_PLANS` —
 * both render on the same tab, and figures that visibly disagree read as a
 * bug rather than as sample data.
 */
export const SAMPLE_ASSET_HEALTH: AssetHealthStats = {
  startingInventory: 1_830_000_000,
  totalRealised: 1_149_200_000,
  remainingValue: 680_800_000,
  sqmSold: 87_300,
  sqmRemaining: 51_900,
  efficiencyRate: 78.6,
  activeCustomers: 148,
  defaulting: { customers: 25, assetValue: 129_400_000, outstanding: 79_400_000 },
  terminated: { customers: 12, assetValue: 60_800_000, outstanding: 26_200_000 },
};

export const SAMPLE_SIZE_PLANS: SizePlanBreakdown[] = [
  {
    size: '300',
    plans: [
      {
        name: 'Outright',
        startValue: 180_000_000,
        soldValue: 126_000_000,
        sqmSold: 8_400,
        sqmRemaining: 3_600,
        transactions: 28,
        defaultingUsers: 0,
        defaultedValue: 0,
        defaultedBalance: 0,
        terminatedPlans: 1,
        terminatedValue: 4_500_000,
        terminatedBalance: 1_200_000,
        efficiency: 96.4,
      },
      {
        name: '12 months',
        startValue: 240_000_000,
        soldValue: 158_400_000,
        sqmSold: 10_800,
        sqmRemaining: 5_400,
        transactions: 36,
        defaultingUsers: 3,
        defaultedValue: 13_200_000,
        defaultedBalance: 7_900_000,
        terminatedPlans: 2,
        terminatedValue: 8_800_000,
        terminatedBalance: 3_100_000,
        efficiency: 82.7,
      },
      {
        name: '24 months',
        startValue: 320_000_000,
        soldValue: 192_000_000,
        sqmSold: 12_600,
        sqmRemaining: 8_400,
        transactions: 42,
        defaultingUsers: 7,
        defaultedValue: 31_500_000,
        defaultedBalance: 19_400_000,
        terminatedPlans: 3,
        terminatedValue: 13_500_000,
        terminatedBalance: 6_200_000,
        efficiency: 71.3,
      },
    ],
  },
  {
    size: '500',
    plans: [
      {
        name: 'Outright',
        startValue: 250_000_000,
        soldValue: 175_000_000,
        sqmSold: 14_000,
        sqmRemaining: 6_000,
        transactions: 22,
        defaultingUsers: 1,
        defaultedValue: 8_600_000,
        defaultedBalance: 4_100_000,
        terminatedPlans: 0,
        terminatedValue: 0,
        terminatedBalance: 0,
        efficiency: 94.1,
      },
      {
        name: '18 months',
        startValue: 380_000_000,
        soldValue: 235_600_000,
        sqmSold: 18_500,
        sqmRemaining: 11_500,
        transactions: 31,
        defaultingUsers: 5,
        defaultedValue: 27_800_000,
        defaultedBalance: 16_300_000,
        terminatedPlans: 2,
        terminatedValue: 11_400_000,
        terminatedBalance: 4_800_000,
        efficiency: 77.9,
      },
    ],
  },
  {
    size: '1000',
    plans: [
      {
        name: '36 months',
        startValue: 460_000_000,
        soldValue: 262_200_000,
        sqmSold: 23_000,
        sqmRemaining: 17_000,
        transactions: 26,
        defaultingUsers: 9,
        defaultedValue: 48_300_000,
        defaultedBalance: 31_700_000,
        terminatedPlans: 4,
        terminatedValue: 22_600_000,
        terminatedBalance: 10_900_000,
        efficiency: 64.2,
      },
    ],
  },
];
