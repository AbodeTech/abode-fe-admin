import {
  MOCK_ASSET_NAMES,
  MOCK_USERS,
  formatMockDate,
  paginate,
} from "../shared";

function campaignPaymentPlans() {
  return MOCK_USERS.map((u, i) => ({
    assetName: MOCK_ASSET_NAMES[i % MOCK_ASSET_NAMES.length],
    dateStarted: formatMockDate(60 + i * 5),
    documentAmountPaid: 50_000 + i * 10_000,
    documentPrice: 150_000,
    email: u.email,
    landAmountPaid: 1_200_000 + i * 150_000,
    landPrice: 4_500_000,
    monthsOfSubscription: 6 + i,
    nextDateOfPayment: formatMockDate(-(20 + i)),
    name: `${u.firstName} ${u.lastName}`,
    size: [300, 450, 500][i % 3],
    unit: 1,
    userId: u._id,
  }));
}

export const campaignsHandlers: Record<
  string,
  (variables?: Record<string, unknown>) => unknown
> = {
  ViewAssetRaffledrawPerformance: () => ({
    viewAssetRaffledrawPerformance: {
      salesMetrics: {
        dailySqmTargetRemaining: 420,
        percentageSold: 58,
        sqmRemainingToSell: 12_600,
        targetSqm: 30_000,
        totalSqmSold: 17_400,
      },
      financialMetrics: {
        totalRevenueGenerated: 86_400_000,
        totalAssetValueSold: 124_000_000,
        averagePaymentPerPlan: 1_450_000,
        totalBalance: 37_600_000,
      },
      promoDetails: {
        daysElapsed: 42,
        daysRemaining: 48,
        endDate: formatMockDate(-48),
        percentageDaysRemaining: 53,
        totalPromoDays: 90,
      },
      ticketMetrics: {
        totalTicketsIssued: 312,
        regularUsersWithTickets: 218,
        associatesWithTickets: 94,
        userTicketPercentage: 70,
        associatePercentage: 30,
      },
      assetBreakdown: MOCK_ASSET_NAMES.slice(0, 4).map((name, i) => ({
        assetName: name,
        percentageOfTotal: 40 - i * 8,
        totalSqmSold: 5000 - i * 800,
        totalTickets: 90 - i * 12,
      })),
      usersWithTickets: MOCK_USERS.slice(0, 5).map((u, i) => ({
        email: u.email,
        name: `${u.firstName} ${u.lastName}`,
        ticketId: `RFL-${1000 + i}`,
      })),
    },
  }),

  ViewAssetHamperPerformance: () => ({
    viewAssetHamperPerformance: {
      assetBreakdown: MOCK_ASSET_NAMES.slice(0, 3).map((name, i) => ({
        assetName: name,
        percentageOfTotal: 45 - i * 10,
        totalSqmSold: 4200 - i * 600,
        totalHampers: 60 - i * 10,
      })),
      financialMetrics: {
        totalRevenueGenerated: 42_000_000,
        totalAssetValueSold: 68_000_000,
        averagePaymentPerPlan: 980_000,
        totalBalance: 26_000_000,
      },
      salesMetrics: {
        dailySqmTargetRemaining: 280,
        percentageSold: 46,
        sqmRemainingToSell: 9_800,
        targetSqm: 18_000,
        totalSqmSold: 8_200,
      },
      referrersWithHampers: MOCK_USERS.slice(0, 4).map((u, i) => ({
        name: `${u.firstName} ${u.lastName}`,
        email: u.email,
        hamperCount: 8 - i,
        totalSqmReferred: 1200 - i * 150,
      })),
    },
  }),

  Campaign2000Dashboard: () => ({
    getCampaignDashboard: {
      associateProProgress: {
        currentAssociatePro: 96,
        percentageComplete: 48,
        targetAssociatePro: 200,
      },
      revenueMetrics: {
        totalRevenue: 52_000_000,
        revenueGoal: 100_000_000,
        percentageComplete: 52,
      },
      campaignPeriod: {
        daysRemaining: 64,
        endDate: formatMockDate(-64),
      },
      ticketMetrics: { totalTicketsIssued: 188 },
      conversionMetrics: {
        overallConversionRate: 12.4,
        userToAssociatePro: {
          totalUsers: 640,
          convertedToAssociatePro: 42,
          conversionRate: 6.5,
        },
        associateToAssociatePro: {
          totalAssociates: 412,
          convertedToAssociatePro: 54,
          conversionRate: 13.1,
        },
      },
      graphs: {
        revenueGraph: {
          chartData: [
            { date: "2026-01", amount: 6_000_000 },
            { date: "2026-02", amount: 8_500_000 },
            { date: "2026-03", amount: 11_000_000 },
            { date: "2026-04", amount: 13_200_000 },
          ],
        },
        conversionGraph: {
          userToAssociateProConversions: {
            chartData: [
              { date: "2026-01", count: 8 },
              { date: "2026-02", count: 11 },
              { date: "2026-03", count: 14 },
              { date: "2026-04", count: 9 },
            ],
          },
        },
      },
    },
    getAssociateProUpgrades: {
      total: 4,
      upgrades: MOCK_USERS.slice(0, 4).map((u, i) => ({
        upgradeId: `upg-${u._id}`,
        userFullName: `${u.firstName} ${u.lastName}`,
        userSince: formatMockDate(400 + i * 20),
        associateSince: formatMockDate(200 + i * 10),
        associateProSince: formatMockDate(30 + i * 5),
        referrerFullName: `${MOCK_USERS[0].firstName} ${MOCK_USERS[0].lastName}`,
        amountPaid: 200_000,
        adminStatus: "approved",
        ticketId: `TKT-${2000 + i}`,
      })),
    },
    getReferralAnalytics: {
      topReferrers: {
        referrers: MOCK_USERS.slice(0, 3).map((u, i) => ({
          referrerId: u._id,
          referrerFullName: `${u.firstName} ${u.lastName}`,
          referrerEmail: u.email,
          totalReferrals: 18 - i * 3,
        })),
      },
      revenueLeaders: {
        leaders: MOCK_USERS.slice(0, 3).map((u, i) => ({
          referrerId: u._id,
          referrerFullName: `${u.firstName} ${u.lastName}`,
          referrerEmail: u.email,
          totalRevenue: 8_500_000 - i * 1_200_000,
        })),
      },
      howYouHeardBreakdown: {
        totalResponses: 220,
        breakdown: [
          { source: "Referral", count: 110, percentage: 50 },
          { source: "Instagram", count: 66, percentage: 30 },
          { source: "Event", count: 44, percentage: 20 },
        ],
      },
      ticketHolders: {
        tickets: MOCK_USERS.slice(0, 4).map((u, i) => ({
          ticketId: `TKT-${3000 + i}`,
          ticketType: i % 2 === 0 ? "USER" : "REFERRAL",
          userFullName: `${u.firstName} ${u.lastName}`,
          userEmail: u.email,
          referrerFullName: `${MOCK_USERS[0].firstName} ${MOCK_USERS[0].lastName}`,
          referrerEmail: MOCK_USERS[0].email,
          amountPaid: 200_000,
          createdDate: formatMockDate(10 + i),
          isActive: true,
        })),
      },
    },
  }),

  GetAssociateRecruitmentAnalytics: (variables) => {
    const page = Number(variables?.page ?? 1) || 1;
    const limit = Number(variables?.limit ?? 25) || 25;
    const rows = MOCK_USERS.map((u, i) => ({
      _id: u._id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      createdAt: formatMockDate(20 + i * 3),
      referral:
        i === 0
          ? null
          : {
              firstName: MOCK_USERS[0].firstName,
              lastName: MOCK_USERS[0].lastName,
              email: MOCK_USERS[0].email,
            },
    }));
    const paged = paginate(rows, page, limit);
    return {
      getAllUsersWithFilters: { count: paged.count, data: paged.data },
    };
  },

  GetCampaignPaymentPlans: (variables) => {
    const page = Number(variables?.page ?? 1) || 1;
    const limit = Number(variables?.limit ?? 25) || 25;
    const paged = paginate(campaignPaymentPlans(), page, limit);
    return {
      getCampaignPaymentPlans: { count: paged.count, data: paged.data },
    };
  },

  GetHamperTransactions: (variables) =>
    campaignsHandlers.GetCampaignPaymentPlans?.(variables),

  GetRaffleTickets: () => ({
    getRaffleTickets: {
      data: MOCK_USERS.slice(0, 5).map((u, i) => ({
        referral_ticket:
          i % 2 === 0
            ? null
            : {
                ticket_id: `REF-${i}`,
                user_id: {
                  firstName: MOCK_USERS[0].firstName,
                  lastName: MOCK_USERS[0].lastName,
                  email: MOCK_USERS[0].email,
                  phoneNumber: MOCK_USERS[0].phoneNumber,
                },
              },
        user_id: {
          firstName: u.firstName,
          lastName: u.lastName,
          email: u.email,
          phoneNumber: u.phoneNumber,
        },
        asset_name: MOCK_ASSET_NAMES[i % MOCK_ASSET_NAMES.length],
        ticket_id: `RFL-${5000 + i}`,
        total_size: 300,
        units_purchased: 1,
        size_purchased: 300,
        created_date: formatMockDate(i + 2),
      })),
    },
  }),

  GetHamperLeaderboard: () => ({
    getHamperLeaderboard: MOCK_USERS.slice(0, 5).map((u, i) => ({
      email: u.email,
      hamperCount: 12 - i,
      name: `${u.firstName} ${u.lastName}`,
      numberOfReferredUsers: 20 - i * 2,
      phoneNumber: u.phoneNumber,
      referrerId: u._id,
      totalAmountPaid: 6_000_000 - i * 500_000,
      totalAssetValue: 12_000_000 - i * 800_000,
      totalBalance: 3_000_000 - i * 200_000,
      totalLandPrice: 10_000_000 - i * 700_000,
      totalSqmSold: 1800 - i * 120,
    })),
  }),
};
