import {
  MOCK_USERS,
  formatMockDate,
  mutationOk,
  paginate,
} from "../shared";

const MANAGERS = [
  {
    _id: "mgr-001",
    userName: "amakaokeke",
    firstName: "Amaka",
    lastName: "Okeke",
    email: "amaka.okeke@example.com",
    role: "associate_manager",
  },
  {
    _id: "mgr-002",
    userName: "bodeade",
    firstName: "Bode",
    lastName: "Adeyemi",
    email: "bode.adeyemi@example.com",
    role: "associate_manager",
  },
] as const;

function prosForManager(seed: number) {
  return MOCK_USERS.slice(seed, seed + 4).map((u, i) => ({
    _id: u._id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    phoneNumber: u.phoneNumber,
    last_login: formatMockDate(i + 1),
    createdAt: formatMockDate(90 + i * 10),
  }));
}

function dashboardShape(withTarget = true) {
  const now = new Date();
  return {
    period: {
      periodType: "month",
      month: now.getMonth() + 1,
      year: now.getFullYear(),
      start: formatMockDate(30),
      end: formatMockDate(0),
    },
    ...(withTarget
      ? {
          target: {
            recruitedTarget: 20,
            recruitedSoFar: 14,
            sellingTarget: 12,
            sellingSoFar: 9,
            performanceScoreTarget: 80,
            performanceScoreSoFar: 74,
          },
        }
      : {}),
    recruitment: {
      newSignupsInPeriod: 18,
      upgradesInPeriod: 6,
      onboardedInPeriod: 11,
      totalAssigned: 42,
      onboardingQueueCount: 5,
    },
    salesAndRevenue: {
      sellingPros: 9,
      sellingProsTarget: 12,
      totalRevenue: 28_500_000,
      initialSalesRevenue: 16_000_000,
      recurringRevenue: 12_500_000,
      revenuePerSellingPro: 3_166_666,
    },
    activity: {
      activeCount: 28,
      activePct: 66,
      recentLoginCount: 22,
      recentSaleCount: 9,
      recentRecruitCount: 7,
      inactiveCount: 10,
      inactivePct: 24,
      abandonedCount: 4,
      abandonedPct: 10,
    },
    milestones: {
      earlySellers: 5,
      lateFirstSellers: 3,
    },
    performanceScore: {
      target: 80,
      actual: 74,
    },
    associatePros: MOCK_USERS.slice(0, 6).map((u, i) => ({
      id: u._id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      phoneNumber: u.phoneNumber,
      status: i % 4 === 0 ? "inactive" : "active",
      dateRecruited: formatMockDate(60 + i * 5),
      totalSales: 2 + (i % 3),
      revenueGenerated: 2_500_000 + i * 400_000,
      lastLogin: formatMockDate(i + 1),
      onboardedAt: formatMockDate(50 + i * 4),
    })),
    associateProsGroupTotal: MOCK_USERS.length,
  };
}

export const associatesHandlers: Record<
  string,
  (variables?: Record<string, unknown>) => unknown
> = {
  GetTopAssociates: (variables) => {
    const page = Number(variables?.page ?? 1) || 1;
    const limit = Number(variables?.limit ?? 25) || 25;
    const rows = MOCK_USERS.map((u, i) => ({
      name: `${u.firstName} ${u.lastName}`,
      status: i % 3 === 0 ? "associatePro" : "associate",
      email: u.email,
      sales_person: `${u.firstName} ${u.lastName}`,
      no_of_clients: 12 + i * 2,
      referred_user_count: 20 + i * 3,
      referred_associate_count: 4 + i,
      referred_associate_pro_count: i,
      units_sold: 8 + i,
      size_sold: 2400 + i * 300,
      expected_revenue: 18_000_000 + i * 2_000_000,
      received_revenue: 12_000_000 + i * 1_500_000,
      balance: 6_000_000 + i * 500_000,
      collection_rate: 68 + i * 2,
      commission: 900_000 + i * 80_000,
    }));
    const paged = paginate(rows, page, limit);
    return { getTopAssociates: { count: paged.count, data: paged.data } };
  },

  GetAssociateManagers: (variables) => {
    const page = Number(variables?.page ?? 1) || 1;
    const limit = Number(variables?.limit ?? 20) || 20;
    const results = MANAGERS.map((m, i) => ({
      _id: `am-${m._id}`,
      manager: m,
      associate_pros_count: 4,
      associate_pros: prosForManager(i * 2),
      createdAt: formatMockDate(120),
      updatedAt: formatMockDate(2),
    }));
    const paged = paginate(results, page, limit);
    return {
      getAssociateManagers: {
        count: paged.count,
        page: paged.page,
        limit: paged.limit,
        results: paged.data,
      },
    };
  },

  GetAssociateManager: (variables) => {
    const managerId = String(variables?.managerId ?? MANAGERS[0]._id);
    const manager = MANAGERS.find((m) => m._id === managerId) ?? MANAGERS[0];
    return {
      getAssociateManager: {
        _id: `am-${manager._id}`,
        manager,
        associate_pros: prosForManager(0),
        createdAt: formatMockDate(120),
        updatedAt: formatMockDate(2),
      },
    };
  },

  AdminGetManagerDashboard: () => ({
    adminGetManagerDashboard: dashboardShape(true),
  }),

  ManagerDashboard: () => ({
    managerDashboard: dashboardShape(true),
  }),

  GetAllManagersDashboard: () => ({
    getAllManagersDashboard: dashboardShape(true),
  }),

  GetSystemAssociatesDashboard: () => ({
    getSystemAssociatesDashboard: dashboardShape(false),
  }),

  GetUnassignedAssociatePros: (variables) => {
    const page = Number(variables?.page ?? 1) || 1;
    const limit = Number(variables?.limit ?? 25) || 25;
    const rows = MOCK_USERS.slice(4).map((u) => ({
      _id: u._id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      phoneNumber: u.phoneNumber,
      last_login: formatMockDate(3),
      createdAt: formatMockDate(40),
    }));
    const paged = paginate(rows, page, limit);
    return {
      getUnassignedAssociatePros: {
        count: paged.count,
        page: paged.page,
        limit: paged.limit,
        results: paged.data,
      },
    };
  },

  GetUnassignedAssociateProsCount: () => ({
    getUnassignedAssociateProsCount: 4,
  }),

  GetManagerSalesRecord: (variables) => {
    const page = Number(variables?.page ?? 1) || 1;
    const limit = Number(variables?.limit ?? 25) || 25;
    const rows = MOCK_USERS.slice(0, 5).map((u, i) => ({
      _id: `sale-${u._id}`,
      proName: `${u.firstName} ${u.lastName}`,
      assetName: `Asset ${i + 1}`,
      amount: 1_500_000 + i * 200_000,
      date: formatMockDate(i + 2),
    }));
    const paged = paginate(rows, page, limit);
    return {
      getManagerSalesRecord: { count: paged.count, data: paged.data },
    };
  },

  AdminGetManagerSalesRecord: (variables) =>
    associatesHandlers.GetManagerSalesRecord?.(variables),

  ListAssociateManagerTargets: (variables) => ({
    listAssociateManagerTargets: [1, 2, 3].map((m) => ({
      _id: `target-${m}`,
      manager: String(variables?.managerId ?? MANAGERS[0]._id),
      month: m,
      year: 2026,
      associate_pro_recruited_target: 15 + m,
      selling_associate_pro_target: 10 + m,
      performance_score_target: 75 + m,
      createdAt: formatMockDate(60),
      updatedAt: formatMockDate(5),
    })),
  }),

  GetAssociateManagerTarget: (variables) => ({
    getAssociateManagerTarget: {
      _id: "target-current",
      manager: String(variables?.managerId ?? MANAGERS[0]._id),
      month: Number(variables?.month ?? new Date().getMonth() + 1),
      year: Number(variables?.year ?? new Date().getFullYear()),
      associate_pro_recruited_target: 20,
      selling_associate_pro_target: 12,
      performance_score_target: 80,
      createdAt: formatMockDate(30),
      updatedAt: formatMockDate(2),
    },
  }),

  GetManagerRatingSeries: () => ({
    getManagerRatingSeries: [5, 4, 3, 2, 1, 0].map((ago) => ({
      month: ((new Date().getMonth() - ago + 12) % 12) + 1,
      year: new Date().getFullYear(),
      score: 70 + ago,
      recruitedSoFar: 10 + ago,
      sellingSoFar: 6 + ago,
    })),
  }),

  GetOnboardingAttempts: () => ({
    getOnboardingAttempts: [1, 2].map((n) => ({
      _id: `onb-${n}`,
      attemptedAt: formatMockDate(n),
      notes: n === 1 ? "Left voicemail" : "Scheduled call",
      outcome: n === 1 ? "no_answer" : "follow_up",
    })),
  }),

  AdminDashboardProsGroup: () => ({
    adminDashboardProsGroup: {
      pros: MOCK_USERS.slice(0, 5).map((u) => ({
        id: u._id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        status: "active",
      })),
      total: 5,
    },
  }),

  SelfDashboardProsGroup: (variables) =>
    associatesHandlers.AdminDashboardProsGroup?.(variables),
  AllManagersDashboardProsGroup: (variables) =>
    associatesHandlers.AdminDashboardProsGroup?.(variables),
  SystemDashboardProsGroup: (variables) =>
    associatesHandlers.AdminDashboardProsGroup?.(variables),

  ExportManagerSalesRecord: (variables) =>
    associatesHandlers.GetManagerSalesRecord?.(variables),
  ExportManagerDashboardPros: (variables) =>
    associatesHandlers.AdminDashboardProsGroup?.(variables),

  AddAssociateManager: () => ({
    addAssociateManager: {
      _id: "am-new",
      manager: MANAGERS[0],
      associate_pros: [],
      createdAt: formatMockDate(0),
      updatedAt: formatMockDate(0),
    },
  }),
  RemoveAssociateManager: (variables) => {
    const input = (variables?.input ?? {}) as Record<string, unknown>;
    return {
      removeAssociateManager: {
        managerId: String(input.managerId ?? MANAGERS[0]._id),
        removed: true,
      },
    };
  },
  ReassignAssociatePro: () => ({
    reassignAssociatePro: {
      _id: "am-001",
      manager: { _id: MANAGERS[0]._id },
      associate_pros: [{ _id: MOCK_USERS[0]._id }],
      updatedAt: formatMockDate(0),
    },
  }),
  BulkAssignAssociateProsToManager: () => ({
    bulkAssignAssociateProsToManager: {
      _id: "am-001",
      manager: { _id: MANAGERS[0]._id },
      associate_pros: MOCK_USERS.slice(0, 3).map((u) => ({ _id: u._id })),
      updatedAt: formatMockDate(0),
    },
  }),
  AssignAssociateManagerTarget: () => ({
    assignAssociateManagerTarget: {
      _id: "target-new",
      manager: MANAGERS[0]._id,
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      associate_pro_recruited_target: 20,
      selling_associate_pro_target: 12,
      performance_score_target: 80,
      createdAt: formatMockDate(0),
      updatedAt: formatMockDate(0),
    },
  }),
  LogOnboardingAttempt: () => ({
    logOnboardingAttempt: {
      _id: "onb-new",
      pro: MOCK_USERS[0]._id,
      outcome: "follow_up",
      attemptNumber: 1,
      isOverdue: false,
      createdAt: formatMockDate(0),
    },
  }),

  // Upgrade domain (managers/performance/upgrade pages)
  GetAllUpgradeRequests: (variables) => {
    const page = Number(variables?.page ?? 1) || 1;
    const limit = Number(variables?.limit ?? 25) || 25;
    const rows = MOCK_USERS.slice(0, 5).map((u, i) => ({
      _id: `upgrade-${u._id}`,
      admin_status: ["pending", "approved", "declined", "pending", "pending"][i],
      createdAt: formatMockDate(i + 1),
      fee_amount: 200_000,
      transaction_type: "upgrade",
      user_upgrade_type: i % 2 === 0 ? "associate" : "associatePro",
      file_Url: "https://example.com/upgrade-receipt.jpg",
      user: {
        _id: u._id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        phoneNumber: u.phoneNumber,
      },
      associate: {
        _id: MOCK_USERS[0]._id,
        firstName: MOCK_USERS[0].firstName,
        lastName: MOCK_USERS[0].lastName,
        email: MOCK_USERS[0].email,
        phoneNumber: MOCK_USERS[0].phoneNumber,
      },
    }));
    const filtered = variables?.adminStatus
      ? rows.filter((r) => r.admin_status === variables.adminStatus)
      : rows;
    const paged = paginate(filtered, page, limit);
    return {
      getAllUpgradeRequests: {
        upgradeRequests: paged.data,
        pagination: {
          currentPage: paged.currentPage,
          limit: paged.limit,
          totalCount: paged.count,
          totalPages: paged.totalPages,
        },
      },
    };
  },

  ExportUpgradeRequests: (variables) =>
    associatesHandlers.GetAllUpgradeRequests?.(variables),

  SearchUpgradeUsers: (variables) => {
    const page = Number(variables?.page ?? 1) || 1;
    const limit = Number(variables?.limit ?? 25) || 25;
    const q = String(variables?.searchQuery ?? "").toLowerCase();
    let rows = MOCK_USERS.map((u) => ({
      _id: u._id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
    }));
    if (q) {
      rows = rows.filter(
        (r) =>
          r.firstName.toLowerCase().includes(q) ||
          r.email.toLowerCase().includes(q)
      );
    }
    const paged = paginate(rows, page, limit);
    return {
      getAllUsers: { count: paged.count, data: paged.data },
    };
  },

  GetActiveCoupons: () => ({
    getActiveCoupons: {
      count: 1,
      data: [
        {
          _id: "coupon-001",
          couponCode: "PRO20",
          discountPercentage: 20,
          startDate: formatMockDate(30),
          endDate: formatMockDate(-60),
          expiryDate: formatMockDate(-60),
          expiryType: "fixed_date",
          usageLimit: 100,
          usageLimitType: "total",
          status: "active",
          activeImmediately: true,
          createdAt: formatMockDate(30),
          updatedAt: formatMockDate(1),
        },
      ],
    },
  }),

  CreateCoupon: () =>
    mutationOk({
      createCoupon: {
        success: true,
        message: "Coupon created",
        data: { _id: "coupon-new" },
      },
    }),
  UpdateCouponStatus: () =>
    mutationOk({
      updateCouponStatus: { success: true, message: "Coupon status updated" },
    }),
  DeleteCoupon: () =>
    mutationOk({
      deleteCoupon: { success: true, message: "Coupon deleted" },
    }),
  UpdateCoupon: () =>
    mutationOk({
      updateCoupon: {
        success: true,
        message: "Coupon updated",
        data: { _id: "coupon-001" },
      },
    }),

  DeclineUpgradeRequest: () => ({ declineUpgradeRequest: true }),
  ApproveUpgradeToAssociate: () => ({ approveUpgradeToAssociate: true }),
  ApproveUpgradeToAssociatePro: () => ({ approveUpgradeToAssociatePro: true }),
  ManualUpgradeToAssociatePro: () =>
    mutationOk({
      manualUpgradeToAssociatePro: {
        success: true,
        message: "Manual upgrade created",
      },
    }),
};
