import {
  MOCK_ASSET_NAMES,
  MOCK_USERS,
  formatMockDate,
  mutationOk,
  paginate,
} from "../shared";

function marketplaceListing(i: number, status: string) {
  const seller = MOCK_USERS[i % MOCK_USERS.length];
  const buyer = MOCK_USERS[(i + 1) % MOCK_USERS.length];
  return {
    _id: `listing-${i + 1}`,
    seller: {
      _id: seller._id,
      firstName: seller.firstName,
      lastName: seller.lastName,
    },
    buyer:
      status === "pending_approval" || status === "sold"
        ? {
            _id: buyer._id,
            firstName: buyer.firstName,
            lastName: buyer.lastName,
          }
        : null,
    asset: {
      _id: `asset-mkt-${i}`,
      asset_name: MOCK_ASSET_NAMES[i % MOCK_ASSET_NAMES.length],
      asset_location: "Lekki",
      asset_type: i % 2 === 0 ? "flex" : "full-ownership",
    },
    listing_price: 4_800_000 + i * 200_000,
    commission_percentage: 5,
    platform_fee: 120_000,
    referral_commission: 80_000,
    seller_proceeds: 4_600_000,
    no_of_units: 1,
    unique_asset_id: `ua-mkt-${i}`,
    asset_type: i % 2 === 0 ? "flex" : "full-ownership",
    status,
    listed_at: formatMockDate(20 + i),
    expires_at: formatMockDate(-(40 - i)),
    sold_at: status === "sold" ? formatMockDate(2) : null,
    cancelled_at: null,
    receipt_image:
      status === "pending_approval"
        ? "https://example.com/receipt.jpg"
        : null,
    receipt_amount: status === "pending_approval" ? 4_800_000 : null,
    receipt_reference: status === "pending_approval" ? `ref-${i}` : null,
    suspended_reason: status === "suspended" ? "Under review" : null,
    createdAt: formatMockDate(25 + i),
  };
}

export const miscHandlers: Record<
  string,
  (variables?: Record<string, unknown>) => unknown
> = {
  // Roles / permissions
  GetAllRoles: () => ({
    getAllRoles: {
      data: [
        {
          _id: "role-admin",
          name: "admin",
          description: "Full access",
          permissions: ["users", "assets", "transactions", "roles"],
        },
        {
          _id: "role-sub",
          name: "subadmin",
          description: "Limited access",
          permissions: ["users", "transactions"],
        },
      ],
    },
  }),

  GetAllPermissions: () => ({
    getAllPermissions: {
      data: [
        "users",
        "assets",
        "transactions",
        "allocation",
        "agency",
        "campaigns",
        "associates",
        "withdrawals",
        "roles",
      ].map((name) => ({ _id: `perm-${name}`, name, description: name })),
    },
  }),

  GetAllAdminWithRoles: () => ({
    getAllAdminWithRoles: {
      data: [
        {
          adminEmail: "admin@abode.example.com",
          adminId: "admin-001",
          adminName: "Abode Admin",
          permissions: ["users", "assets", "transactions", "roles"],
          role: "admin",
          roleId: "role-admin",
        },
        {
          adminEmail: "ops@abode.example.com",
          adminId: "admin-002",
          adminName: "Ops Subadmin",
          permissions: ["users", "transactions"],
          role: "subadmin",
          roleId: "role-sub",
        },
      ],
    },
  }),

  GetAdminWithRole: (variables) => ({
    getAdminWithRole: {
      adminEmail: "ops@abode.example.com",
      adminId: String(variables?.adminId ?? "admin-002"),
      adminName: "Ops Subadmin",
      permissions: ["users", "transactions"],
      role: "subadmin",
      roleId: "role-sub",
    },
  }),

  CreateRole: () => ({
    createRole: {
      _id: "role-new",
      name: "custom",
      description: "Custom role",
      permissions: ["users"],
    },
  }),

  UpdateAdminRole: () => ({ updateAdminRole: true }),

  // Marketplace
  GetMarketplaceDashboard: () => ({
    getMarketplaceDashboard: {
      total_listings: 42,
      active_listings: 18,
      sold_listings: 12,
      pending_approval_listings: 6,
      cancelled_listings: 3,
      expired_listings: 2,
      suspended_listings: 1,
      total_volume: 96_000_000,
      total_platform_fees: 2_400_000,
      total_referral_commissions: 1_600_000,
    },
  }),

  ViewAllMarketplaceListings: (variables) => {
    const filters = (variables?.filters ?? {}) as Record<string, unknown>;
    const page = Number(filters.page ?? 1) || 1;
    const limit = Number(filters.limit ?? 20) || 20;
    const statuses = [
      "active",
      "sold",
      "pending_approval",
      "suspended",
      "active",
    ];
    const rows = statuses.map((s, i) => marketplaceListing(i, s));
    const paged = paginate(rows, page, limit);
    return {
      viewAllMarketplaceListings: {
        listings: paged.data,
        pagination: {
          currentPage: paged.currentPage,
          totalPages: paged.totalPages,
          totalCount: paged.count,
          limit: paged.limit,
        },
      },
    };
  },

  ViewPendingMarketplaceApprovals: (variables) => {
    const page = Number(variables?.page ?? 1) || 1;
    const limit = Number(variables?.limit ?? 20) || 20;
    const rows = [0, 1, 2].map((i) => marketplaceListing(i, "pending_approval"));
    const paged = paginate(rows, page, limit);
    return {
      viewPendingMarketplaceApprovals: {
        listings: paged.data,
        pagination: {
          currentPage: paged.currentPage,
          totalPages: paged.totalPages,
          totalCount: paged.count,
          limit: paged.limit,
        },
      },
    };
  },

  SuspendMarketplaceListing: (variables) =>
    mutationOk({
      suspendMarketplaceListing: {
        success: true,
        message: "Listing suspended",
        listing: {
          _id: String(variables?.listingId ?? "listing-1"),
          status: "suspended",
        },
      },
    }),

  UnsuspendMarketplaceListing: (variables) =>
    mutationOk({
      unsuspendMarketplaceListing: {
        success: true,
        message: "Listing unsuspended",
        listing: {
          _id: String(variables?.listingId ?? "listing-1"),
          status: "active",
        },
      },
    }),

  ApproveMarketplacePurchase: (variables) =>
    mutationOk({
      approveMarketplacePurchase: {
        success: true,
        message: "Purchase approved",
        listing: {
          _id: String(variables?.listingId ?? "listing-1"),
          status: "sold",
        },
      },
    }),

  RejectMarketplacePurchase: (variables) =>
    mutationOk({
      rejectMarketplacePurchase: {
        success: true,
        message: "Purchase rejected",
        listing: {
          _id: String(variables?.listingId ?? "listing-1"),
          status: "active",
        },
      },
    }),

  // Requests
  GetAllClientRequests: (variables) => {
    const page = Number(variables?.page ?? 1) || 1;
    const limit = Number(variables?.limit ?? 25) || 25;
    const requests = MOCK_USERS.slice(0, 6).map((u, i) => ({
      _id: `req-${u._id}`,
      requestId: `CR-${1000 + i}`,
      requestType: [
        "asset_update",
        "document_change",
        "location_change",
        "custom_request",
      ][i % 4],
      status: ["pending", "approved", "declined"][i % 3],
      paymentStatus: i % 2 === 0 ? "paid" : "unpaid",
      createdAt: formatMockDate(i + 2),
      fee: 25_000,
      user: {
        _id: u._id,
        firstName: u.firstName,
        lastName: u.lastName,
        email: u.email,
        phoneNumber: u.phoneNumber,
      },
      details: { note: "Mock request details" },
    }));
    return {
      getAllClientRequests: {
        requests,
        total: requests.length,
        page,
        limit,
        analytics: {
          pending: 2,
          approved: 2,
          declined: 2,
        },
      },
    };
  },

  GetRequestStatistics: () => ({
    getRequestStatistics: {
      totalRequests: 86,
      pendingRequests: 14,
      approvedRequests: 58,
      declinedRequests: 14,
      locationChangeRequests: 22,
      documentChangeRequests: 18,
      assetUpdateRequests: 30,
      customRequests: 16,
      totalFeesCollected: 1_450_000,
      paidRequests: 60,
      unpaidRequests: 26,
    },
  }),

  UpdateRequestStatus: () =>
    mutationOk({
      updateRequestStatus: {
        success: true,
        message: "Request status updated",
      },
    }),

  SystemApproveLocationChangeRequest: () =>
    mutationOk({
      systemApproveLocationChangeRequest: {
        success: true,
        message: "Location change approved",
      },
    }),

  SystemApproveDocumentChangeRequest: () =>
    mutationOk({
      systemApproveDocumentChangeRequest: {
        success: true,
        message: "Document change approved",
      },
    }),

  SystemApproveAssetUpdateRequest: () =>
    mutationOk({
      systemApproveAssetUpdateRequest: {
        success: true,
        message: "Asset update approved",
      },
    }),

  // Sales
  GetSalesRecord: (variables) => {
    const page = Number(variables?.page ?? 1) || 1;
    const limit = Number(variables?.limit ?? 25) || 25;
    const rows = MOCK_USERS.map((u, i) => {
      const price = 5_000_000 + i * 500_000;
      const amount_paid = Math.round(price * (0.4 + (i % 5) * 0.1));
      return {
        user_firstName: u.firstName,
        user_lastName: u.lastName,
        email: u.email,
        user_phone: u.phoneNumber,
        referrer_name: `${MOCK_USERS[0].firstName} ${MOCK_USERS[0].lastName}`,
        referrer_email: MOCK_USERS[0].email,
        referrer_phone: MOCK_USERS[0].phoneNumber,
        asset_name: MOCK_ASSET_NAMES[i % MOCK_ASSET_NAMES.length],
        asset_type: i % 2 === 0 ? "flex" : "full-ownership",
        no_of_units: 1,
        document_amount_paid: 50_000,
        fullownerhsip_documentprice: 150_000,
        month_subscription: 6 + i,
        size: [300, 450, 500][i % 3],
        price,
        amount_paid,
        amount_payable: price,
        balance: price - amount_paid,
        default_amount: i === 5 ? 200_000 : 0,
        is_suspended: false,
        start_date: formatMockDate(180 + i * 5),
        next_date: formatMockDate(-(20 + i)),
      };
    });
    const paged = paginate(rows, page, limit);
    return { getSalesRecord: { count: paged.count, data: paged.data } };
  },

  GetSalesStatusCounts: (variables) =>
    miscHandlers.GetSalesRecord?.(variables),

  ExportSales: (variables) => miscHandlers.GetSalesRecord?.(variables),

  GetSalesDashboard: () => ({
    getSalesDashboard: {
      totalTransactionValue: 260_000_000,
      expectedTransactionValue: 320_000_000,
      totalReceivedTransactionValue: 182_000_000,
      outstandingTransactionValue: 78_000_000,
      totalFlexTransactionValue: 140_000_000,
      expectedFlexTransactionValue: 170_000_000,
      totalReceivedFlexTransactionValue: 98_000_000,
      outstandingFlexTransactionValue: 42_000_000,
      totalFullOwnershipTransactionValue: 120_000_000,
      expectedFullOwnershipTransactionValue: 150_000_000,
      totalReceivedFullOwnershipTransactionValue: 84_000_000,
      outstandingFullOwnershipTransactionValue: 36_000_000,
    },
  }),

  // Admin logs
  GetAllAdminLogs: (variables) => {
    const page = Number(variables?.page ?? 1) || 1;
    const limit = Number(variables?.limit ?? 25) || 25;
    const rows = [
      "LOGIN",
      "UPDATE_USER",
      "APPROVE_TRANSACTION",
      "SUSPEND_USER",
      "INVITE_ADMIN",
    ].map((action, i) => ({
      _id: `log-${i + 1}`,
      timestamp: formatMockDate(i),
      description: `${action.replaceAll("_", " ").toLowerCase()} performed`,
      action,
      adminEmail: "admin@abode.example.com",
      adminId: "admin-001",
      metadata: { mock: true, index: i },
      oldState: null,
    }));
    const paged = paginate(rows, page, limit);
    return { getAllAdminLogs: { count: paged.count, data: paged.data } };
  },

  ExportAdminLogs: (variables) => miscHandlers.GetAllAdminLogs?.(variables),
};
