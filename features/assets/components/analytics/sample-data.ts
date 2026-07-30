/* ============================================================
 * Sample data for the asset analytics panels.
 *
 * There is **no asset analytics endpoint** on abode-be-v2 — no portfolio
 * statistics, no per-category health, no subscriber counts (⛔ ticket 17).
 * These panels stay on the page so the design reads as a whole while the
 * asset CRUD work proceeds, driven by the figures below.
 *
 * Two scopes live here:
 *   • portfolio-wide  — the assets list page (PortfolioStats, CategoryStats)
 *   • per-asset       — the detail Performance tab (AssetHealthStats,
 *                       SizePlanBreakdown)
 *
 * Every panel using this renders a "Sample data" chip. An em-dash reads as
 * "unknown"; a chart reading "₦45m sold · 62% allocated" reads as a fact, and
 * demo screenshots end up in decks.
 *
 * Delete this file — and the chips — when the endpoint lands.
 *
 * Amounts are decimal naira.
 * ============================================================ */

export type PortfolioStats = {
  totalPortfolioValue: number;
  totalCapacitySqm: number;
  activeCustomers: number;
  overallEfficiency: number;
  totalValueSold: number;
  totalSqmSold: number;
  totalMoneyReceived: number;
  totalBalanceOwed: number;
  defaulting: {
    defaultingCustomers: number;
    defaultedAssetValue: number;
    amountPaidByDefaulters: number;
    amountStillOwing: number;
  };
};

export type CategoryStats = {
  title: string;
  count: number;
  sqm: number;
  revenue: number;
  efficiency: number;
  occupancy: number;
  valueSold: number;
  sqmSold: number;
  moneyReceived: number;
  totalBalance: number;
  defaulting: {
    defaultedAssetValue: number;
    defaultersPaid: number;
    defaultersOwing: number;
  };
};

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

export const SAMPLE_PORTFOLIO: PortfolioStats = {
  totalPortfolioValue: 4_820_000_000,
  totalCapacitySqm: 186_400,
  activeCustomers: 1_284,
  overallEfficiency: 68.4,
  totalValueSold: 3_297_500_000,
  totalSqmSold: 127_500,
  totalMoneyReceived: 2_141_300_000,
  totalBalanceOwed: 1_156_200_000,
  defaulting: {
    defaultingCustomers: 47,
    defaultedAssetValue: 188_400_000,
    amountPaidByDefaulters: 61_900_000,
    amountStillOwing: 126_500_000,
  },
};

export const SAMPLE_CATEGORIES: CategoryStats[] = [
  {
    title: 'Flex',
    count: 14,
    sqm: 104_800,
    revenue: 2_640_000_000,
    efficiency: 71.2,
    occupancy: 64.8,
    valueSold: 1_874_000_000,
    sqmSold: 67_900,
    moneyReceived: 1_205_600_000,
    totalBalance: 668_400_000,
    defaulting: {
      defaultedAssetValue: 112_700_000,
      defaultersPaid: 38_400_000,
      defaultersOwing: 74_300_000,
    },
  },
  {
    title: 'Full ownership',
    count: 9,
    sqm: 81_600,
    revenue: 2_180_000_000,
    efficiency: 64.9,
    occupancy: 73.1,
    valueSold: 1_423_500_000,
    sqmSold: 59_600,
    moneyReceived: 935_700_000,
    totalBalance: 487_800_000,
    defaulting: {
      defaultedAssetValue: 75_700_000,
      defaultersPaid: 23_500_000,
      defaultersOwing: 52_200_000,
    },
  },
];

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
