import {
  MOCK_ASSET_NAMES,
  MOCK_USERS,
  formatMockDate,
  mutationOk,
  paginate,
} from "../shared";

const REFERRAL_STATUSES = ["user", "associate", "associatePro"] as const;

function buildUserRows() {
  return MOCK_USERS.map((u, i) => ({
    _id: u._id,
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    phoneNumber: u.phoneNumber,
    createdAt: formatMockDate(30 + i * 7),
    referral_status: REFERRAL_STATUSES[i % REFERRAL_STATUSES.length],
    referrer:
      i === 0
        ? null
        : `${MOCK_USERS[i - 1].firstName} ${MOCK_USERS[i - 1].lastName}`,
    howYouHearAboutUs: ["Referral", "Instagram", "Google", "Event"][i % 4],
    virtual_subscriptions: i % 3,
    virtual_networth: 2_500_000 + i * 800_000,
    subscriptions: i % 4,
    is_suspended: i === 6,
    gender: i % 2 === 0 ? "female" : "male",
    country: "Nigeria",
    Networth: 3_200_000 + i * 900_000,
  }));
}

function buildUserDetail(id: string) {
  const user = MOCK_USERS.find((u) => u._id === id) ?? MOCK_USERS[0];
  const i = MOCK_USERS.findIndex((u) => u._id === user._id);

  return {
    Networth: 4_500_000 + i * 500_000,
    virtual_networth: 3_800_000 + i * 400_000,
    virtual_subscriptions: 2,
    _id: user._id,
    address: `${20 + i} Admiralty Way, Lekki`,
    amount_paid: 2_800_000,
    amount_payable: 5_000_000,
    balance_payable: 2_200_000,
    referral_status: REFERRAL_STATUSES[i % REFERRAL_STATUSES.length],
    country: "Nigeria",
    date_of_birth: "1992-04-12",
    email: user.email,
    last_login: formatMockDate(1),
    default_status: i === 5 ? "default" : "active",
    employment_status: "Employed",
    firstName: user.firstName,
    gender: i % 2 === 0 ? "female" : "male",
    lastName: user.lastName,
    marital_status: i % 2 === 0 ? "Married" : "Single",
    occupation: "Professional",
    phoneNumber: user.phoneNumber,
    is_suspended: i === 6,
    profile_pic: null,
    referral:
      i === 0
        ? null
        : {
            firstName: MOCK_USERS[0].firstName,
            lastName: MOCK_USERS[0].lastName,
            email: MOCK_USERS[0].email,
          },
    associate_manager:
      i > 2
        ? {
            _id: "mgr-001",
            firstName: "Amaka",
            lastName: "Okeke",
            userName: "amakaokeke",
            email: "amaka.okeke@example.com",
          }
        : null,
    kyc: { tin: i % 2 === 0 ? "12345678-0001" : null },
    subscriptions: 2,
    transaction: [1, 2, 3].map((n) => ({
      _id: `user-txn-${user._id}-${n}`,
      time_of_transaction: formatMockDate(n * 4),
      amount: String(250_000 * n),
      type: n % 2 === 0 ? "credit" : "debit",
      status: "approved",
      description: n === 1 ? "Asset installment" : "Wallet top-up",
      transaction_type: n === 1 ? "asset" : "topup",
      paystack_reference: `psk_${user._id}_${n}`,
      transfer_reference: null,
      transfer_file: null,
    })),
    wallet: { balance: String(450_000 + i * 50_000) },
    units_purchased: 2,
    userName: user.userName,
    next_date_of_payment: formatMockDate(-14),
  };
}

function buildSuspendedPlans() {
  return MOCK_USERS.slice(0, 5).map((u, i) => ({
    firstName: u.firstName,
    lastName: u.lastName,
    email: u.email,
    phoneNumber: u.phoneNumber,
    referrer: `${MOCK_USERS[0].firstName} ${MOCK_USERS[0].lastName}`,
    asset_name: MOCK_ASSET_NAMES[i % MOCK_ASSET_NAMES.length],
    size: [300, 450, 500][i % 3],
    asset_type: i % 2 === 0 ? "flex" : "full-ownership",
    no_of_units: 1,
    amount_paid: 1_200_000 + i * 200_000,
    balance: 2_800_000 + i * 150_000,
    start_date: formatMockDate(120 + i * 10),
    next_date: formatMockDate(10 + i),
    user_id: u._id,
    unique_asset_id: `ua-${u._id}`,
    is_suspended: true,
  }));
}

export const usersHandlers: Record<
  string,
  (variables?: Record<string, unknown>) => unknown
> = {
  GetAllUsers: (variables) => {
    const page = Number(variables?.page ?? 1) || 1;
    const limit = Number(variables?.limit ?? 10) || 10;
    const search = String(variables?.searchQuery ?? "").toLowerCase();
    let rows = buildUserRows();
    if (search) {
      rows = rows.filter(
        (r) =>
          r.firstName.toLowerCase().includes(search) ||
          r.lastName.toLowerCase().includes(search) ||
          r.email.toLowerCase().includes(search)
      );
    }
    if (variables?.referralStatus) {
      rows = rows.filter((r) => r.referral_status === variables.referralStatus);
    }
    const paged = paginate(rows, page, limit);
    return { getAllUsers: { count: paged.count, data: paged.data } };
  },

  GetUserDetailsByAdmin: (variables) => ({
    getUserDetailsByAdmin: buildUserDetail(
      String(variables?.getUserDetailsByAdminId ?? MOCK_USERS[0]._id)
    ),
  }),

  Metrics: () => ({
    getSystemUsersOverview: {
      metrics: {
        totalUsers: MOCK_USERS.length * 160,
        referralStatusCounts: {
          user: 640,
          associate: 412,
          associatePro: 96,
        },
        noReferralUsers: 280,
        users_with_assets: 518,
        flexSubscribers: 340,
        fullOwnershipSubscribers: 178,
        defaultUsers: 37,
        overdueUsers: 22,
        active_associate: 390,
        active_associate_pro: 88,
      },
    },
  }),

  GetUserAnalytics: () => ({
    getUserAnalytics: {
      totalUsers: 1280,
      referredCount: 820,
      notReferredCount: 460,
      referredPercentage: 64,
      notReferredPercentage: 36,
      acquisition: {
        registrationTrend: [
          { month: "Jan", count: 90 },
          { month: "Feb", count: 110 },
          { month: "Mar", count: 140 },
          { month: "Apr", count: 125 },
          { month: "May", count: 160 },
          { month: "Jun", count: 180 },
        ],
        howYouHeard: [
          { source: "Referral", count: 420 },
          { source: "Instagram", count: 310 },
          { source: "Google", count: 250 },
          { source: "Event", count: 180 },
        ],
      },
      demographics: {
        gender: [
          { label: "Female", count: 640 },
          { label: "Male", count: 620 },
        ],
        ageGroups: [
          { label: "18-24", count: 180 },
          { label: "25-34", count: 520 },
          { label: "35-44", count: 360 },
          { label: "45+", count: 220 },
        ],
        maritalStatus: [
          { label: "Single", count: 700 },
          { label: "Married", count: 580 },
        ],
        locations: [
          { label: "Lagos", count: 780 },
          { label: "Abuja", count: 220 },
          { label: "Port Harcourt", count: 140 },
        ],
        employmentStatus: [
          { label: "Employed", count: 840 },
          { label: "Self-employed", count: 320 },
          { label: "Unemployed", count: 120 },
        ],
        educationLevel: [
          { label: "Bachelor", count: 640 },
          { label: "Masters", count: 280 },
          { label: "Other", count: 360 },
        ],
        experienceLevel: [
          { label: "Junior", count: 300 },
          { label: "Mid", count: 580 },
          { label: "Senior", count: 400 },
        ],
        topOccupations: [
          { label: "Finance", count: 210 },
          { label: "Tech", count: 190 },
          { label: "Healthcare", count: 140 },
        ],
      },
    },
  }),

  GetAllSuspendedUsers: (variables) => {
    const page = Number(variables?.page ?? 1) || 1;
    const limit = Number(variables?.limit ?? 25) || 25;
    const base = buildUserRows();
    const rows = [
      ...base.filter((u) => u.is_suspended),
      ...base.slice(0, 3).map((u, i) => ({
        ...u,
        _id: `sus-${i}`,
        is_suspended: true as const,
      })),
    ];
    const paged = paginate(rows, page, limit);
    return { getAllSuspendedUsers: { count: paged.count, data: paged.data } };
  },

  ExportSuspendedUsers: (variables) =>
    usersHandlers.GetAllSuspendedUsers?.(variables),

  GetAllDefaultUsers: (variables) => {
    const page = Number(variables?.page ?? 1) || 1;
    const limit = Number(variables?.limit ?? 25) || 25;
    const rows = buildUserRows().slice(0, 5);
    const paged = paginate(rows, page, limit);
    return { getAllDefaultUsers: { count: paged.count, data: paged.data } };
  },

  ExportDefaultUsers: (variables) =>
    usersHandlers.GetAllDefaultUsers?.(variables),

  GetSuspendedPaymentPlans: (variables) => {
    const page = Number(variables?.page ?? 1) || 1;
    const limit = Number(variables?.limit ?? 25) || 25;
    let rows = buildSuspendedPlans();
    const search = String(variables?.searchQuery ?? "").toLowerCase();
    if (search) {
      rows = rows.filter(
        (r) =>
          r.firstName.toLowerCase().includes(search) ||
          r.email.toLowerCase().includes(search)
      );
    }
    if (variables?.assetType) {
      rows = rows.filter((r) => r.asset_type === variables.assetType);
    }
    const paged = paginate(rows, page, limit);
    return {
      getSuspendedPaymentPlans: { count: paged.count, data: paged.data },
    };
  },

  ExportSuspendedPaymentPlans: (variables) =>
    usersHandlers.GetSuspendedPaymentPlans?.(variables),

  GetSuspendedPaymentPlansSummary: () => ({
    getSuspendedPaymentPlansSummary: {
      totalPlans: 19,
      totalUnits: 24,
      totalAmountPaid: 18_400_000,
      totalOutstanding: 42_100_000,
      flexPlans: 11,
      fullOwnershipPlans: 8,
    },
  }),

  ViewUserReferralsByAdmin: () => ({
    viewUserReferralsByAdmin: MOCK_USERS.slice(1, 5).map((u, i) => ({
      _id: `ref-${u._id}`,
      commission: 85_000 + i * 15_000,
      createdAt: formatMockDate(20 + i * 5),
      userReferralStatus: REFERRAL_STATUSES[i % REFERRAL_STATUSES.length],
      email: u.email,
      name: `${u.firstName} ${u.lastName}`,
      phoneNumber: u.phoneNumber,
      status: "active",
    })),
  }),

  ExportUsersByFilter: () => ({
    getAllUsersWithFilters: {
      data: MOCK_USERS.map((u, i) => ({
        _id: u._id,
        firstName: u.firstName,
        lastName: u.lastName,
        last_login: formatMockDate(i + 1),
        email: u.email,
        tin: i % 2 === 0 ? "12345678-0001" : null,
        gender: i % 2 === 0 ? "female" : "male",
        occupation: "Professional",
        phoneNumber: u.phoneNumber,
        address: "Lekki, Lagos",
        country: "Nigeria",
        createdAt: formatMockDate(40 + i),
        referral:
          i === 0
            ? null
            : {
                firstName: MOCK_USERS[0].firstName,
                lastName: MOCK_USERS[0].lastName,
                email: MOCK_USERS[0].email,
              },
      })),
    },
  }),

  ExportUsersWithAsset: () => ({
    usersWithAsset: {
      data: MOCK_USERS.slice(0, 4).map((u, i) => ({
        id: u._id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        gender: i % 2 === 0 ? "female" : "male",
        occupation: "Professional",
        dateOfBirth: "1990-01-15",
        phone: u.phoneNumber,
        referral: {
          name: `${MOCK_USERS[0].firstName} ${MOCK_USERS[0].lastName}`,
          email: MOCK_USERS[0].email,
        },
        customer_assets: [
          {
            asset_name: MOCK_ASSET_NAMES[i % MOCK_ASSET_NAMES.length],
            asset_type: i % 2 === 0 ? "flex" : "full-ownership",
            balance: 1_500_000,
            document_price: 250_000,
            land_price: 4_500_000,
            month_subscription: 6,
            months_remaining: 4,
            next_date_of_payment: formatMockDate(-20),
            no_of_units: 1,
            size: 300,
            start_date: formatMockDate(180),
            land_amount_paid: 2_000_000,
            document_amount_paid: 100_000,
          },
        ],
      })),
    },
  }),

  EditUserDetailsByAdmin: () => ({ editUserDetailsByAdmin: true }),
  EditUserWalletDetailsByAdmin: () => ({ editUserWalletDetailsByAdmin: true }),
  ModifyUserReferralStatus: () => ({ modifyUserReferralStatus: true }),
  EditWalletCommission: () => ({ editWalletCommission: true }),
  UpdateUserTin: () =>
    mutationOk({
      updateUserTin: { success: true, message: "TIN updated" },
    }),
  ClearUserTin: () =>
    mutationOk({
      clearUserTin: { success: true, message: "TIN cleared" },
    }),
  SuspendUser: () => ({ suspendUser: true }),
  UnsuspendUser: () => ({ unsuspendUser: true }),
  RemoveReferralByAdmin: () => ({ removeReferralByAdmin: true }),

  AdminSignupUser: (variables) => {
    const input = (variables?.adminSignupInput ?? {}) as Record<string, unknown>;
    return mutationOk({
      adminSignupUser: {
        success: true,
        message: "User registered",
        data: {
          generatedPassword: "TempUserPass1!",
          user: {
            _id: "user-new-001",
            firstName: String(input.firstName ?? "New"),
            lastName: String(input.lastName ?? "User"),
            email: String(input.email ?? "new.user@example.com"),
          },
        },
      },
    });
  },
};
