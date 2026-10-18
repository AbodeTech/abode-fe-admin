import {
  MOCK_ASSET_IDS,
  MOCK_ASSET_NAMES,
  formatMockDate,
  paginate,
} from "../shared";

function buildAssets() {
  return MOCK_ASSET_IDS.map((id, i) => {
    const isFlex = i % 2 === 0;
    return {
      _id: id,
      asset_name: MOCK_ASSET_NAMES[i % MOCK_ASSET_NAMES.length],
      asset_location: ["Lekki Phase 1", "Ibeju-Lekki", "Ajah", "VGC", "Ikoyi"][i],
      sold: false,
      asset_type: isFlex ? "flex" : "full-ownership",
      collectionEfficiencyRate: 72 + i * 3,
      asset_option: [
        {
          size: 300,
          unit: 12,
          price: 4_500_000,
          zero_months: 5_200_000,
          flex_payment_plans: isFlex
            ? [
                { price: 4_500_000, unit: 8 },
                { price: 4_800_000, unit: 4 },
              ]
            : [],
        },
        {
          size: 450,
          unit: 8,
          price: 6_200_000,
          zero_months: 7_100_000,
          flex_payment_plans: isFlex
            ? [{ price: 6_200_000, unit: 6 }]
            : [],
        },
      ],
    };
  });
}

function inventoryStats() {
  return {
    assetsSummary: {
      totalAssets: MOCK_ASSET_IDS.length,
      totalWorth: 420_000_000,
      totalFlexAssets: 3,
      totalFlexWorth: 210_000_000,
      totalFullOwnershipAssets: 2,
      totalFullOwnershipWorth: 210_000_000,
    },
    portfolio: {
      totalPortfolioValue: 420_000_000,
      totalCapacitySqm: 48_000,
      activeCustomers: 518,
      overallEfficiency: 78,
      totalValueSold: 265_000_000,
      totalSqmSold: 28_500,
      totalMoneyReceived: 182_000_000,
      totalBalanceOwed: 83_000_000,
      defaulting: {
        defaultingCustomers: 37,
        defaultedAssetValue: 22_000_000,
        amountPaidByDefaulters: 8_400_000,
        amountStillOwing: 13_600_000,
      },
    },
    categories: [
      {
        category: "flex",
        activeAssetCount: 3,
        totalSqm: 24_000,
        grossRevenue: 210_000_000,
        collectionEfficiency: 76,
        occupancyRate: 68,
        totalValueSold: 140_000_000,
        totalSqmSold: 16_000,
        totalMoneyReceived: 98_000_000,
        totalBalance: 42_000_000,
        defaulting: {
          defaultedAssetValue: 12_000_000,
          defaultersPaid: 4_500_000,
          defaultersOwing: 7_500_000,
        },
      },
      {
        category: "full-ownership",
        activeAssetCount: 2,
        totalSqm: 24_000,
        grossRevenue: 210_000_000,
        collectionEfficiency: 81,
        occupancyRate: 54,
        totalValueSold: 125_000_000,
        totalSqmSold: 12_500,
        totalMoneyReceived: 84_000_000,
        totalBalance: 41_000_000,
        defaulting: {
          defaultedAssetValue: 10_000_000,
          defaultersPaid: 3_900_000,
          defaultersOwing: 6_100_000,
        },
      },
    ],
  };
}

function analyticsStats() {
  return {
    totalInventory: 48_000_000,
    totalRealised: 28_000_000,
    remainingValue: 20_000_000,
    totalSqmSold: 4_200,
    totalSqmRemaining: 3_800,
    efficiencyRate: 74,
    totalActiveCustomers: 86,
    defaulting: {
      totalDefaultingCustomers: 7,
      totalDefaultedAssetValue: 3_200_000,
      totalDefaultedOutstandingValue: 1_800_000,
    },
    terminated: {
      totalTerminatedCustomers: 3,
      totalTerminatedAssetValue: 1_100_000,
      totalTerminatedBalance: 420_000,
    },
    sizePlanBreakdown: [
      {
        size: 300,
        plans: [
          {
            name: "12 months",
            startValue: 18_000_000,
            soldValue: 12_000_000,
            totalSqmSold: 1800,
            totalSqmRemaining: 1200,
            totalPlans: 20,
            totalDefaultingUsers: 2,
            totalDefaultedValue: 800_000,
            totalDefaultedBalance: 420_000,
            totalBalance: 4_500_000,
            totalTerminatedPlans: 1,
            totalTerminatedValue: 450_000,
            totalTerminatedBalance: 120_000,
            efficiency: 78,
          },
        ],
      },
      {
        size: 450,
        plans: [
          {
            name: "Outright",
            startValue: 22_000_000,
            soldValue: 14_000_000,
            totalSqmSold: 2400,
            totalSqmRemaining: 1800,
            totalPlans: 15,
            totalDefaultingUsers: 1,
            totalDefaultedValue: 600_000,
            totalDefaultedBalance: 300_000,
            totalBalance: 6_200_000,
            totalTerminatedPlans: 0,
            totalTerminatedValue: 0,
            totalTerminatedBalance: 0,
            efficiency: 82,
          },
        ],
      },
    ],
  };
}

function assetDetail(id: string) {
  const idx = MOCK_ASSET_IDS.indexOf(id as (typeof MOCK_ASSET_IDS)[number]);
  const i = idx >= 0 ? idx : 0;
  const isFlex = i % 2 === 0;
  return {
    _id: id,
    asset_name: MOCK_ASSET_NAMES[i % MOCK_ASSET_NAMES.length],
    asset_location: ["Lekki Phase 1", "Ibeju-Lekki", "Ajah", "VGC", "Ikoyi"][i],
    asset_type: isFlex ? "flex" : "full-ownership",
    description: "Premium gated estate with infrastructure backlog cleared.",
    title: "Certificate of Occupancy",
    basic_details: { allocation_qualification: 50 },
    asset_pictures: [`https://picsum.photos/seed/${id}/800/500`],
    amenities: ["Gate house", "Estate roads", "Drainage"],
    asset_purpose: "Residential",
    google_map: "https://maps.google.com/?q=Lekki",
    gogle_map: "https://maps.google.com/?q=Lekki",
    topography: "Flat",
    landmark: "Near Lekki Free Trade Zone",
    asset_history: "Acquired 2022",
    asset_documents: [],
    documents: {
      deed_of_assignment: null,
      survey: null,
      contract_of_sales: null,
      estate_layout: null,
    },
    asset_option: [
      {
        size: 300,
        unit: 12,
        price: 4_500_000,
        flex_payment_plans: isFlex
          ? [
              {
                description: "12-month flex",
                duration_months: 12,
                initial_payment: 900_000,
                monthly_installment: 300_000,
                price: 4_500_000,
                unit: 8,
              },
            ]
          : [],
        zero_months: 5_200_000,
        three_months: 5_000_000,
        six_months: 4_800_000,
        twelve_months: 4_500_000,
        one_month: 5_100_000,
        five_months: 4_900_000,
        seven_months: 4_700_000,
        development_fee: 250_000,
        initial_payment: 900_000,
        monthly_installment: 300_000,
        one_month_initial_payment: 1_000_000,
        five_months_initial_payment: 950_000,
        seven_months_initial_payment: 920_000,
      },
    ],
  };
}

export const assetsHandlers: Record<
  string,
  (variables?: Record<string, unknown>) => unknown
> = {
  GetFeatureAdminAssets: (variables) => {
    const page = Number(variables?.page ?? 1) || 1;
    const limit = Number(variables?.limit ?? 5000) || 5000;
    const paged = paginate(buildAssets(), page, limit);
    return {
      getAllAdminAssets: { count: paged.count, data: paged.data },
    };
  },

  GetAssetIdByName: (variables) =>
    assetsHandlers.GetFeatureAdminAssets?.(variables),

  FeatureAssetStatistics: () => ({
    getAssetInventoryData: { statistics: inventoryStats() },
  }),

  GetAssetAnalytics: () => ({
    getAssetAnalytics: { statistics: analyticsStats() },
  }),

  ViewAssetByName: () => ({
    viewAssetByName: {
      available_unit: 28,
      unit_sold: 42,
      expected_return: 96_000_000,
      total_value: 140_000_000,
      sizes: [300, 450, 500],
    },
  }),

  ViewAssetOptionDataByName: () => ({
    viewAssetOptionDataByName: {
      sizes: [
        {
          size: 300,
          available_unit: 12,
          value: 54_000_000,
          unit_sold: 18,
          expected_return: 36_000_000,
        },
        {
          size: 450,
          available_unit: 8,
          value: 49_600_000,
          unit_sold: 10,
          expected_return: 28_000_000,
        },
      ],
    },
  }),

  ViewAsset: (variables) => ({
    viewAsset: assetDetail(String(variables?.id ?? MOCK_ASSET_IDS[0])),
  }),

  CreateFlexAsset: (variables) => {
    const input = (variables?.createFlexAssetInput ?? {}) as Record<
      string,
      unknown
    >;
    return {
      createFlexAsset: {
        _id: "asset-new-flex",
        asset_name: String(input.asset_name ?? "New Flex Asset"),
      },
    };
  },

  CreateFullOwnershipAsset: (variables) => {
    const input = (variables?.createFullOwnershipAssetInput ?? {}) as Record<
      string,
      unknown
    >;
    return {
      createFullOwnershipAsset: {
        _id: "asset-new-fo",
        asset_name: String(input.asset_name ?? "New Full Ownership Asset"),
      },
    };
  },

  UpdateAsset: () => ({ updateAsset: true }),

  GetAssetBlocks: () => ({
    getAssetBlocks: [
      {
        _id: "block-001",
        asset: MOCK_ASSET_IDS[0],
        label: "Block A",
        description: "Frontage",
        createdAt: formatMockDate(90),
      },
      {
        _id: "block-002",
        asset: MOCK_ASSET_IDS[0],
        label: "Block B",
        description: "Inner",
        createdAt: formatMockDate(80),
      },
    ],
  }),

  CreateBlock: (variables) => ({
    createBlock: {
      _id: "block-new",
      asset: String(variables?.assetId ?? MOCK_ASSET_IDS[0]),
      label: String(variables?.label ?? "Block C"),
      description: (variables?.description as string | null) ?? null,
      createdAt: formatMockDate(0),
    },
  }),

  DeleteBlock: () => ({ deleteBlock: true }),

  GetBlockPlots: () => ({
    getBlockPlots: [1, 2, 3, 4, 5].map((n) => ({
      _id: `plot-${n}`,
      block: "block-001",
      block_label: "Block A",
      plot_number: n,
      size: 300,
      status: n <= 2 ? "allocated" : "available",
      payment_plan: n <= 2 ? `pp-${n}` : null,
      allocated_date: n <= 2 ? formatMockDate(10) : null,
    })),
  }),

  CreatePlots: () => ({
    createPlots: [11, 12, 13, 14, 15],
  }),

  UpdatePlotSize: (variables) => ({
    updatePlotSize: {
      _id: String(variables?.plotId ?? "plot-1"),
      block: "block-001",
      block_label: "Block A",
      plot_number: 1,
      size: Number(variables?.size ?? 300),
      status: "available",
      payment_plan: null,
      allocated_date: null,
    },
  }),

  GetAvailablePlotsForAsset: () => ({
    getAvailablePlotsForAsset: [1, 2, 3, 4].map((n) => ({
      _id: `avail-plot-${n}`,
      block: "block-001",
      block_label: "Block A",
      plot_number: 10 + n,
      size: 300,
      status: "available",
    })),
  }),
};
