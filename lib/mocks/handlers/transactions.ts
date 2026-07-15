import {
  MOCK_ASSET_NAMES,
  MOCK_USERS,
  formatMockDate,
  mutationOk,
  paginate,
} from "../shared";

function buildTopupRows() {
  return MOCK_USERS.map((u, i) => ({
    _id: `topup-${u._id}`,
    amount: 50_000 + i * 25_000,
    status: i % 3 === 0 ? "pending" : "approved",
    admin_status: i % 3 === 0 ? "pending" : "approved",
    time_of_transaction: formatMockDate(i + 1),
    transaction_type: "topup",
    transfer_file: i % 2 === 0 ? { file: "https://example.com/receipt.jpg" } : null,
    user: { firstName: u.firstName, lastName: u.lastName, _id: u._id },
  }));
}

function buildWithdrawalRows() {
  return MOCK_USERS.map((u, i) => ({
    _id: `wd-${u._id}`,
    admin_status: ["pending", "approved", "declined"][i % 3],
    amount: 80_000 + i * 20_000,
    time_of_transaction: formatMockDate(i + 2),
    processing_type: i % 2 === 0 ? "paystack" : "manual",
    tin: i % 2 === 0 ? "12345678-0001" : null,
    bank_details: {
      accountNumber: `01${10000000 + i}`,
      bankName: "Access Bank",
      name: `${u.firstName} ${u.lastName}`,
    },
    user: {
      firstName: u.firstName,
      lastName: u.lastName,
      _id: u._id,
      tin: i % 2 === 0 ? "12345678-0001" : null,
    },
  }));
}

function buildDocumentRows() {
  return MOCK_USERS.map((u, i) => ({
    _id: `doc-${u._id}`,
    amount: 150_000 + i * 10_000,
    description: "Document fee - asset purchase",
    admin_status: i % 4 === 0 ? "pending" : "approved",
    plot_size: [300, 450, 500][i % 3],
    asset_type: i % 2 === 0 ? "flex" : "full-ownership",
    referral: i === 0 ? null : `${MOCK_USERS[0].firstName} ${MOCK_USERS[0].lastName}`,
    transaction_type: "document",
    transfer_file: { file: "https://example.com/doc-receipt.jpg" },
    user: { firstName: u.firstName, lastName: u.lastName, _id: u._id },
    time_of_transaction: formatMockDate(i + 3),
  }));
}

function buildAssetTxnRows() {
  return MOCK_USERS.map((u, i) => ({
    _id: `asset-txn-${u._id}`,
    amount: 500_000 + i * 75_000,
    description: "asset purchase installment",
    admin_status: i % 5 === 0 ? "pending" : "approved",
    plot_size: [300, 450, 500][i % 3],
    asset_type: i % 2 === 0 ? "flex" : "full-ownership",
    referral: i === 0 ? null : `${MOCK_USERS[0].firstName} ${MOCK_USERS[0].lastName}`,
    property_owner: `${u.firstName} ${u.lastName}`,
    transaction_type: "asset",
    transfer_file: { file: "https://example.com/asset-receipt.jpg" },
    user: { firstName: u.firstName, lastName: u.lastName, _id: u._id },
    time_of_transaction: formatMockDate(i + 4),
  }));
}

function buildCommissionRows() {
  return MOCK_USERS.map((u, i) => ({
    _id: `comm-${u._id}`,
    tin: "12345678-0001",
    admin_status: i % 3 === 0 ? "pending" : "processed",
    amount: 45_000 + i * 8_000,
    asset_type: i % 2 === 0 ? "flex" : "full-ownership",
    description: "Referral commission",
    user: {
      _id: u._id,
      firstName: u.firstName,
      lastName: u.lastName,
      referrer: `${MOCK_USERS[0].firstName} ${MOCK_USERS[0].lastName}`,
      referral_status: i % 2 === 0 ? "associate" : "associatePro",
      email: u.email,
      tin: "12345678-0001",
    },
    plot_size: 300,
    status: "completed",
    referral: `${MOCK_USERS[(i + 1) % MOCK_USERS.length].firstName} ${MOCK_USERS[(i + 1) % MOCK_USERS.length].lastName}`,
    transaction_type: "commission",
    time_of_transaction: formatMockDate(i + 1),
  }));
}

function pageOf<T>(rows: T[], variables?: Record<string, unknown>) {
  const page = Number(variables?.page ?? 1) || 1;
  const limit = Number(variables?.limit ?? 10) || 10;
  return paginate(rows, page, limit);
}

export const transactionsHandlers: Record<
  string,
  (variables?: Record<string, unknown>) => unknown
> = {
  GetTopupTransaction: (variables) => {
    const paged = pageOf(buildTopupRows(), variables);
    return { getTopupTransaction: { count: paged.count, data: paged.data } };
  },

  GetWithdrawalTransaction: (variables) => {
    let rows = buildWithdrawalRows();
    if (variables?.status) {
      rows = rows.filter((r) => r.admin_status === variables.status);
    }
    const paged = pageOf(rows, variables);
    return {
      getWithdrawalTransaction: { count: paged.count, data: paged.data },
    };
  },

  GetDocumentTransaction: (variables) => {
    const paged = pageOf(buildDocumentRows(), variables);
    return {
      getDocumentTransaction: { count: paged.count, data: paged.data },
    };
  },

  GetCommissionTransactions: (variables) => {
    const paged = pageOf(buildCommissionRows(), variables);
    return {
      getCommissionTransactions: { count: paged.count, data: paged.data },
    };
  },

  AdminTransactionDataPoint: () => ({
    adminTransactionDataPoint: {
      pending_transaction: 14,
      approved_transaction: 218,
      rejected_transaction: 9,
      commission_transaction: 76,
      users_wallet_balance: 54_200_000,
      auto_approved_transaction: 130,
      auto_failed_transaction: 4,
    },
  }),

  GetAssetTransaction: (variables) => {
    const paged = pageOf(buildAssetTxnRows(), variables);
    return { getAssetTransaction: { count: paged.count, data: paged.data } };
  },

  GetAssetTransactionsStatistics: () => ({
    getAssetTransactionData: {
      statistics: {
        totalTransactions: 412,
        approvedTransactions: 360,
        totalApprovedAmount: 185_000_000,
        pendingTransactions: 32,
        totalPendingAmount: 14_500_000,
        declinedTransactions: 20,
        totalDeclinedAmount: 6_200_000,
        new_sales: 48,
        total_new_sales: 62_000_000,
        flexTransactions: 240,
        totalFlexAmount: 98_000_000,
        new_flex_sales: 30,
        flex_recurring_sales: 180,
        total_flex_recurring_sales: 72_000_000,
        fullOwnershipTransactions: 172,
        totalFullOwnershipAmount: 108_000_000,
        new_fullOwnership_sales: 18,
        total_new_fullOwnership_sales: 41_000_000,
        fullOwnership_recurring_sales: 140,
        total_fullOwnership_recurring_sales: 55_000_000,
      },
    },
  }),

  GetUsersWithZeroBalance: (variables) => {
    const page = Number(variables?.page ?? 1) || 1;
    const limit = Number(variables?.limit ?? 25) || 25;
    const rows = MOCK_USERS.slice(0, 4).map((u, i) => ({
      name: `${u.firstName} ${u.lastName}`,
      email: u.email,
      phone_number: u.phoneNumber,
      sales_person: `${MOCK_USERS[0].firstName} ${MOCK_USERS[0].lastName}`,
      asset_name: MOCK_ASSET_NAMES[i % MOCK_ASSET_NAMES.length],
      unit: 1,
      size: 300,
      price: 5_000_000,
      amount_paid: 5_000_000,
      month_subscription: 12,
      start_date: formatMockDate(200),
      next_payment_date: formatMockDate(0),
    }));
    const paged = paginate(rows, page, limit);
    return {
      getUsersWithZeroBalance: { count: paged.count, data: paged.data },
    };
  },

  ExportWithdrawalTransactions: (variables) =>
    transactionsHandlers.GetWithdrawalTransaction?.(variables),
  ExportDocumentTransactions: (variables) =>
    transactionsHandlers.GetDocumentTransaction?.(variables),
  ExportCommissionTransactions: (variables) =>
    transactionsHandlers.GetCommissionTransactions?.(variables),

  ApproveTransaction: () => ({ approveTransaction: true }),
  DeclineTransaction: () => ({ declineTransaction: true }),
  ApprovePaystackTransaction: () => ({ approvePaystackTransaction: true }),
  ApproveAssetTransaction: () => ({ approveAssetTransaction: true }),
  DeclineDocumentTransaction: () => ({ declineDocumentTransaction: true }),
  ProcessCommission: () => ({ processCommission: true }),
  ProcessReceipt: () => ({ processReceipt: true }),
  DeclineAssetTransaction: () => ({ declineAssetTransaction: true }),
};
