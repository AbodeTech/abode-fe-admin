import {
  MOCK_ASSET_IDS,
  MOCK_ASSET_NAMES,
  MOCK_USERS,
  formatMockDate,
  mutationOk,
  paginate,
} from "../shared";

const ALLOCATION_STATUSES = ["pending", "allocated", "sent", "pending"] as const;

function buildEligibleClients() {
  return MOCK_USERS.map((user, i) => {
    const assetName = MOCK_ASSET_NAMES[i % MOCK_ASSET_NAMES.length];
    const totalPrice = 5_000_000 + i * 750_000;
    const amountPaid = Math.round(totalPrice * (0.35 + (i % 5) * 0.1));
    const pct = Math.min(100, Math.round((amountPaid / totalPrice) * 100));
    const status = ALLOCATION_STATUSES[i % ALLOCATION_STATUSES.length];

    return {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phoneNumber: user.phoneNumber,
      assetName,
      assetType: i % 2 === 0 ? "flex" : "full-ownership",
      assetSize: [300, 450, 500, 600][i % 4],
      unit: 1 + (i % 3),
      amountPaid,
      totalPrice,
      paymentPercentage: String(pct),
      duration: [6, 12, 18, 24][i % 4],
      location: ["Lekki", "Ibeju-Lekki", "Ajah", "VGC"][i % 4],
      end_date: formatMockDate(-(120 + i * 30)),
      referral: i % 3 === 0 ? null : `${MOCK_USERS[(i + 1) % MOCK_USERS.length].firstName} ${MOCK_USERS[(i + 1) % MOCK_USERS.length].lastName}`,
      referralStatus: i % 3 === 0 ? "user" : i % 3 === 1 ? "associate" : "associatePro",
      allocation: status === "allocated" || status === "sent" ? `BLK-A / Plot ${10 + i}` : null,
      allocationStatus: status,
      allocationDate: status === "pending" ? null : formatMockDate(i * 3),
      paymentPlan: `pp-${user._id}`,
    };
  });
}

function buildAllocationAssets() {
  return MOCK_ASSET_IDS.map((id, i) => ({
    _id: id,
    asset_name: MOCK_ASSET_NAMES[i % MOCK_ASSET_NAMES.length],
    asset_type: i % 2 === 0 ? "flex" : "full-ownership",
    asset_option: [
      { size: 300 },
      { size: 450 },
      { size: 500 },
    ],
  }));
}

function allocationMutationResult(message: string) {
  const user = MOCK_USERS[0];
  return {
    success: true,
    message,
    assetName: MOCK_ASSET_NAMES[0],
    allocations: [
      {
        plotId: "plot-001",
        block_label: "Block A",
        plot_number: 12,
        size: 300,
      },
    ],
    user: {
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
    },
  };
}

export const allocationHandlers: Record<
  string,
  (variables?: Record<string, unknown>) => unknown
> = {
  EligibleClientsForLand: (variables) => {
    const page = Number(variables?.page ?? 1) || 1;
    const limit = Number(variables?.limit ?? 25) || 25;
    const filters = (variables?.filters ?? {}) as Record<string, unknown>;
    let rows = buildEligibleClients();

    const search = String(filters.search ?? "").toLowerCase();
    if (search) {
      rows = rows.filter(
        (r) =>
          r.firstName.toLowerCase().includes(search) ||
          r.lastName.toLowerCase().includes(search) ||
          r.email.toLowerCase().includes(search) ||
          (r.assetName ?? "").toLowerCase().includes(search)
      );
    }
    if (filters.assetName) {
      const name = String(filters.assetName).toLowerCase();
      rows = rows.filter((r) => (r.assetName ?? "").toLowerCase() === name);
    }
    if (filters.assetType) {
      rows = rows.filter((r) => r.assetType === filters.assetType);
    }

    const paged = paginate(rows, page, limit);
    return {
      eligibleClientsForLand: {
        count: paged.count,
        data: paged.data,
        limit: paged.limit,
        page: paged.page,
      },
    };
  },

  ExportEligibleClientsForLand: (variables) => {
    const limit = Number(variables?.limit ?? 10_000) || 10_000;
    const rows = buildEligibleClients().slice(0, limit);
    return {
      eligibleClientsForLand: {
        count: rows.length,
        data: rows,
      },
    };
  },

  GetAllocationAssets: () => ({
    getAllAdminAssets: {
      data: buildAllocationAssets(),
    },
  }),

  AllocateLand: () =>
    mutationOk({
      allocateLand: allocationMutationResult("Land allocated successfully"),
    }),

  DeallocateLand: () =>
    mutationOk({
      deallocateLand: {
        success: true,
        message: "Land deallocated successfully",
      },
    }),

  ReassignLand: () =>
    mutationOk({
      reassignLand: allocationMutationResult("Land reassigned successfully"),
    }),

  SendAllocationEmail: () =>
    mutationOk({
      sendAllocationEmail: {
        success: true,
        message: "Allocation email sent",
      },
    }),
};
