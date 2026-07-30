import {
  MOCK_AGENCY_IDS,
  MOCK_ASSET_NAMES,
  MOCK_USERS,
  formatMockDate,
  mutationOk,
  paginate,
} from "../shared";

const AGENCY_NAMES = [
  "Horizon Realty Partners",
  "Lagos Land Collective",
  "Pearl Estate Agency",
  "Greenfield Brokers",
] as const;

function buildAgencyList() {
  return MOCK_AGENCY_IDS.map((id, i) => ({
    _id: id,
    agency_name: AGENCY_NAMES[i] ?? `Agency ${i + 1}`,
    commission_percentage: [10, 12, 8, 15][i] ?? 10,
    contact: {
      email: `ops@${id}.example.com`,
      phoneNumber: `+23480${10000000 + i}`,
    },
    total_amount_paid: 12_500_000 + i * 2_100_000,
    total_balance: 3_200_000 + i * 400_000,
    total_referrals: 18 + i * 4,
    total_sales_volume: 45_000_000 + i * 8_000_000,
  }));
}

function buildAgencyDetail(id: string) {
  const idx = MOCK_AGENCY_IDS.indexOf(id as (typeof MOCK_AGENCY_IDS)[number]);
  const i = idx >= 0 ? idx : 0;
  const referrals = MOCK_USERS.slice(0, 4).map((u) => ({
    user: {
      _id: u._id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      phoneNumber: u.phoneNumber,
    },
  }));

  const transactions = MOCK_USERS.slice(0, 3).map((u, ti) => ({
    amount: 1_500_000 + ti * 250_000,
    commission_earned: 150_000 + ti * 25_000,
    transaction_type: ti % 2 === 0 ? "asset_purchase" : "installment",
    transaction_date: formatMockDate(ti * 7),
    asset: {
      asset_name: MOCK_ASSET_NAMES[ti % MOCK_ASSET_NAMES.length],
      asset_type: ti % 2 === 0 ? "flex" : "full-ownership",
    },
    referral_user: {
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
    },
    transaction_id: {
      _id: `txn-agency-${i}-${ti}`,
      status: "approved",
      admin_status: "approved",
    },
  }));

  return {
    _id: id,
    agency_name: AGENCY_NAMES[i] ?? "Mock Agency",
    agency_code: `AGY-${String(i + 1).padStart(3, "0")}`,
    email: `ops@${id}.example.com`,
    phoneNumber: `+23480${10000000 + i}`,
    address: `${10 + i} Admiralty Way`,
    city: "Lagos",
    state: "Lagos",
    country: "Nigeria",
    commission_percentage: [10, 12, 8, 15][i] ?? 10,
    communication_preference: "email",
    status: "active",
    verified: true,
    is_suspended: false,
    suspension_reason: null,
    total_referrals: 18 + i * 4,
    purchases_on_behalf_count: 2 + i,
    total_commission_earned: 4_800_000 + i * 600_000,
    withdrawn_commission: 1_200_000 + i * 100_000,
    available_commission_balance: 3_600_000 + i * 500_000,
    total_transaction_amount: 45_000_000 + i * 8_000_000,
    createdAt: formatMockDate(90 + i * 10),
    referrals,
    transactions,
  };
}

export const agencyHandlers: Record<
  string,
  (variables?: Record<string, unknown>) => unknown
> = {
  GetAgencyDashboard: () => ({
    getAgencyDashboard: {
      success: true,
      data: {
        total_agencies: MOCK_AGENCY_IDS.length,
        total_clients_recruited: 94,
        total_land_value_sold: 182_500_000,
        outstanding_balance: 28_400_000,
        top_performing_agencies: buildAgencyList().map((a) => ({
          _id: a._id,
          agency_name: a.agency_name,
          clients: a.total_referrals,
          email: a.contact.email,
          phoneNumber: a.contact.phoneNumber,
          sales_volume: a.total_sales_volume,
        })),
        top_selling_lands: MOCK_ASSET_NAMES.slice(0, 4).map((name, i) => ({
          asset_name: name,
          location: ["Lekki", "Ibeju", "Ajah", "VGC"][i],
          units_sold: 12 + i * 3,
          value: 18_000_000 + i * 4_500_000,
        })),
      },
    },
  }),

  GetAgencies: (variables) => {
    const page = Number(variables?.page ?? 1) || 1;
    const limit = Number(variables?.limit ?? 25) || 25;
    const query = String(variables?.query ?? "").toLowerCase();
    let rows = buildAgencyList();
    if (query) {
      rows = rows.filter(
        (a) =>
          a.agency_name.toLowerCase().includes(query) ||
          a.contact.email.toLowerCase().includes(query)
      );
    }
    const paged = paginate(rows, page, limit);
    return {
      getAgencies: {
        agencies: paged.data,
        count: paged.count,
        currentPage: paged.currentPage,
        totalPages: paged.totalPages,
        success: true,
        dashboard: {
          total_agencies: MOCK_AGENCY_IDS.length,
          active_agencies: MOCK_AGENCY_IDS.length,
          total_users_under_agencies: 94,
          all_agencies_total_sales_volume: 182_500_000,
          total_commission_paid: 14_200_000,
        },
      },
    };
  },

  GetAgencyById: (variables) => {
    const id = String(variables?.id ?? MOCK_AGENCY_IDS[0]);
    const agency = buildAgencyDetail(id);
    return {
      getAgencyById: {
        success: true,
        message: "Agency fetched",
        agency,
        statistics: {
          total_referrals: agency.total_referrals ?? 0,
          active_referrals: Math.max(1, (agency.total_referrals ?? 0) - 3),
          purchases_on_behalf: agency.purchases_on_behalf_count ?? 0,
          sub_realtors_count: 2,
          total_transactions: agency.transactions.length,
          total_commission_earned: agency.total_commission_earned,
          withdrawn_amount: agency.withdrawn_commission,
          available_balance: agency.available_commission_balance,
        },
      },
    };
  },

  GetAgencyTransactions: (variables) => {
    const agencyId = String(variables?.agencyId ?? MOCK_AGENCY_IDS[0]);
    return {
      getAgencyTransactions: [1, 2, 3, 4].map((n) => ({
        _id: `agency-wallet-${agencyId}-${n}`,
        time_of_transaction: formatMockDate(n * 5),
        amount: n % 2 === 0 ? 450_000 : -200_000,
        type: n % 2 === 0 ? "credit" : "debit",
        status: "completed",
        description:
          n % 2 === 0 ? "Commission credit" : "Commission withdrawal",
        transaction_type: n % 2 === 0 ? "commission" : "withdrawal",
        paystack_reference: n % 2 === 0 ? null : `psk_${agencyId}_${n}`,
        transfer_reference: n % 2 === 0 ? null : `trf_${agencyId}_${n}`,
        transfer_file:
          n % 2 === 0
            ? null
            : { file: "https://example.com/receipt.pdf", amount: 200_000 },
      })),
    };
  },

  CreateAgency: (variables) => {
    const input = (variables?.createAgencyInput ?? {}) as Record<string, unknown>;
    return mutationOk({
      createAgency: {
        success: true,
        message: "Agency created successfully",
        agency: { _id: "agency-new-001" },
        credentials: {
          agency_code: "AGY-NEW",
          email: String(input.email ?? "new.agency@example.com"),
          temporary_password: "TempPass123!",
        },
      },
    });
  },

  SuspendAgency: (variables) => {
    const input = (variables?.suspendAgencyInput ?? {}) as Record<string, unknown>;
    return mutationOk({
      suspendAgency: {
        success: true,
        message: "Agency suspended",
        agency: { _id: String(input.agencyId ?? MOCK_AGENCY_IDS[0]) },
      },
    });
  },

  ReactivateAgency: (variables) =>
    mutationOk({
      reactivateAgency: {
        success: true,
        message: "Agency reactivated",
        agency: { _id: String(variables?.agencyId ?? MOCK_AGENCY_IDS[0]) },
      },
    }),

  UpdateAgencyCommission: (variables) => {
    const input = (variables?.updateAgencyCommissionInput ??
      {}) as Record<string, unknown>;
    return mutationOk({
      updateAgencyCommission: {
        success: true,
        message: "Commission updated",
        agency: { _id: String(input.agencyId ?? MOCK_AGENCY_IDS[0]) },
      },
    });
  },
};
