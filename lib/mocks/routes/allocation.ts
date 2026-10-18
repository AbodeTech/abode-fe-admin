import { MockHttpError, type MockRoutes } from '../router';
import { MOCK_ASSET_IDS, MOCK_ASSET_NAMES, MOCK_USERS, formatMockDate } from '../shared';
import { body, paged } from './util';

/* ============================================================
 * Allocation — /admin/allocation/*.
 *
 * Every route below mirrors abode-be-v2's allocation module as it exists on
 * `origin/staging` (2026-08-28) — not yet deployed to the environment this
 * app talks to, so confirm against a live call once it ships. See
 * features/allocation/schemas/allocation.schema.ts for the field-level notes.
 *
 * The assets dropdown and export are still GraphQL and unclaimed here — see
 * lib/mocks/handlers/allocation.ts.
 * ============================================================ */

const PLAN_STATUSES = ['active', 'completed'] as const;
const REASON_MIN_LENGTH = 20;

type AllocationEntry = { plot_id: string; block_label: string; plot_number: number; size: number };

type MockClient = {
  payment_plan_id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  asset_id: string;
  asset_name: string;
  asset_location: string;
  asset_type: string;
  unique_asset_id: string;
  size: number;
  no_of_units: number;
  amount_paid: number;
  amount_payable: number;
  balance: number;
  payment_percentage: number;
  allocation_status: 'pending' | 'allocated' | 'email_sent';
  allocation_date: string | null;
  allocations: AllocationEntry[];
  plan_status: (typeof PLAN_STATUSES)[number];
  date_joined: string;
};

type MockPlot = {
  _id: string;
  block: string;
  block_label: string;
  plot_number: number;
  size: number;
  status: 'available' | 'allocated';
};

type MockHistoryRow = {
  _id: string;
  payment_plan: string;
  user: string;
  allocations: AllocationEntry[];
  actor: string | null;
  action: 'allocated' | 'deallocated' | 'reassigned' | 'email_sent' | 'auto_released';
  reason: string | null;
  createdAt: string;
  updatedAt: string;
};

const MOCK_ADMIN_ID = 'mock-admin-001';

/** Built once and mutated in place, so a mutation is visible on the next fetch. */
const clients: MockClient[] = MOCK_USERS.map((user, i) => {
  const assetIndex = i % MOCK_ASSET_NAMES.length;
  const size = [300, 450, 500, 600][i % 4];
  const amountPaid = 300_000 + i * 70_000;
  const amountPayable = i % 5 === 0 ? 0 : 20_000 + (i % 4) * 25_000;
  const balance = i % 5 === 0 ? 0 : 200_000 + (i % 6) * 150_000;
  const status = i % 4 === 0 ? 'allocated' : 'pending';

  return {
    payment_plan_id: `pp-${user._id}`,
    user_id: user._id,
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
    phone: user.phoneNumber,
    asset_id: MOCK_ASSET_IDS[assetIndex],
    asset_name: MOCK_ASSET_NAMES[assetIndex],
    asset_location: ['Ibeju-Lekki, Lagos', 'Epe, Lagos', 'Ikeja, Lagos', 'Abeokuta, Ogun', 'Asaba, Delta'][
      i % 5
    ],
    asset_type: i % 3 === 0 ? 'flex' : i % 3 === 1 ? 'full-ownership' : 'commercial',
    unique_asset_id: `MOCK${String(i).padStart(4, '0')}`,
    size,
    no_of_units: 1 + (i % 3),
    amount_paid: amountPaid,
    amount_payable: amountPayable,
    balance,
    payment_percentage: amountPayable > 0 ? Math.round((amountPaid / amountPayable) * 100 * 100) / 100 : 0,
    allocation_status: status,
    allocation_date: status === 'pending' ? null : formatMockDate(-(i * 3)),
    allocations: [],
    plan_status: PLAN_STATUSES[i % PLAN_STATUSES.length],
    date_joined: formatMockDate(120 + i * 30),
  };
});

/** Two blocks of 12 plots each, sizes stepped by 50 so most required totals are reachable. */
const plotsByAsset: Record<string, MockPlot[]> = {};
const historyByPlan: Record<string, MockHistoryRow[]> = {};

function ensurePlots(assetId: string): MockPlot[] {
  if (plotsByAsset[assetId]) return plotsByAsset[assetId];

  const blocks = ['A', 'B'];
  const plots: MockPlot[] = [];
  blocks.forEach((blockLabel, blockIndex) => {
    for (let n = 1; n <= 12; n++) {
      plots.push({
        _id: `${assetId}-${blockLabel}-${n}`,
        block: `${assetId}-block-${blockIndex}`,
        block_label: blockLabel,
        plot_number: n,
        size: 100 + (n - 1) * 50,
        status: 'available',
      });
    }
  });

  // Reflect any client already seeded as "allocated" so the picker doesn't
  // offer plots the eligible-clients list claims are already taken.
  clients
    .filter((c) => c.asset_id === assetId && c.allocation_status !== 'pending')
    .forEach((c) => {
      const need = c.size * c.no_of_units;
      let claimed = 0;
      const claimedEntries: AllocationEntry[] = [];
      for (const plot of plots) {
        if (claimed >= need) break;
        if (plot.status !== 'available') continue;
        plot.status = 'allocated';
        claimed += plot.size;
        claimedEntries.push({
          plot_id: plot._id,
          block_label: plot.block_label,
          plot_number: plot.plot_number,
          size: plot.size,
        });
      }
      c.allocations = claimedEntries;
    });

  plotsByAsset[assetId] = plots;
  return plots;
}

function appendHistory(row: Omit<MockHistoryRow, '_id' | 'createdAt' | 'updatedAt'>): void {
  const now = new Date().toISOString();
  const list = (historyByPlan[row.payment_plan] ??= []);
  list.unshift({
    ...row,
    _id: `hist-${row.payment_plan}-${list.length}-${Date.now()}`,
    createdAt: now,
    updatedAt: now,
  });
}

function requireReason(reason: unknown): string {
  const value = typeof reason === 'string' ? reason.trim() : '';
  if (value.length < REASON_MIN_LENGTH) {
    throw new MockHttpError(
      400,
      `reason must be longer than or equal to ${REASON_MIN_LENGTH} characters`,
      'VALIDATION_FAILED'
    );
  }
  return value;
}

function requireClient(planId: string): MockClient {
  const client = clients.find((c) => c.payment_plan_id === planId);
  if (!client) throw new MockHttpError(404, 'Payment plan not found', 'PLAN_NOT_FOUND');
  return client;
}

function claimPlots(client: MockClient, plotIds: string[]): { entries: AllocationEntry[]; warnings: string[] } {
  const assetPlots = ensurePlots(client.asset_id);
  const selected = plotIds.map((id) => assetPlots.find((p) => p._id === id));
  if (selected.some((p) => !p)) {
    throw new MockHttpError(404, 'One or more requested plots do not exist', 'PLOT_NOT_FOUND');
  }
  if (selected.some((p) => p!.status !== 'available')) {
    throw new MockHttpError(400, 'One or more requested plots are not available', 'PLOTS_NOT_AVAILABLE');
  }

  const required = client.size * client.no_of_units;
  const total = selected.reduce((sum, p) => sum + p!.size, 0);
  const warnings: string[] = [];
  if (total !== required) {
    if (client.asset_type !== 'developer_plot') {
      throw new MockHttpError(400, 'Total plot size does not match the plan size', 'SIZE_MISMATCH');
    }
    warnings.push(
      `Developer-plot size mismatch accepted: allocated ${total} sqm vs expected ${required} sqm.`
    );
  }

  selected.forEach((p) => {
    p!.status = 'allocated';
  });
  const entries = selected.map((p) => ({
    plot_id: p!._id,
    block_label: p!.block_label,
    plot_number: p!.plot_number,
    size: p!.size,
  }));
  return { entries, warnings };
}

function releasePlots(client: MockClient): void {
  const assetPlots = ensurePlots(client.asset_id);
  const claimedIds = new Set(client.allocations.map((a) => a.plot_id));
  assetPlots.forEach((p) => {
    if (claimedIds.has(p._id)) p.status = 'available';
  });
}

function mutationResult(client: MockClient, entries: AllocationEntry[], warnings: string[]) {
  return {
    asset_name: client.asset_name,
    user_snapshot: { name: client.name, email: client.email },
    allocations: entries,
    warnings,
  };
}

export const allocationRoutes: MockRoutes = {
  'GET /admin/allocation/eligible-clients': ({ query }) => {
    let rows = clients as MockClient[];

    const search = String(query.search ?? '').trim().toLowerCase();
    if (search) {
      rows = rows.filter(
        (r) =>
          r.name.toLowerCase().includes(search) ||
          r.email.toLowerCase().includes(search) ||
          r.phone.toLowerCase().includes(search)
      );
    }

    const assetId = query.asset_id ? String(query.asset_id) : null;
    if (assetId) {
      rows = rows.filter((r) => r.asset_id === assetId);
    }

    const assetName = query.asset_name ? String(query.asset_name).toLowerCase() : null;
    if (assetName) {
      rows = rows.filter((r) => r.asset_name.toLowerCase().includes(assetName));
    }

    const assetType = query.asset_type ? String(query.asset_type) : null;
    if (assetType) {
      rows = rows.filter((r) => r.asset_type === assetType);
    }

    const allocationStatus = query.allocation_status ? String(query.allocation_status) : null;
    if (allocationStatus) {
      rows = rows.filter((r) => r.allocation_status === allocationStatus);
    }

    const percentageMin =
      query.payment_percentage_min !== undefined ? Number(query.payment_percentage_min) : null;
    if (percentageMin !== null && !Number.isNaN(percentageMin)) {
      rows = rows.filter((r) => r.payment_percentage >= percentageMin);
    }

    const dateFrom = query.date_from ? new Date(String(query.date_from)) : null;
    const dateTo = query.date_to ? new Date(String(query.date_to)) : null;
    if (dateFrom || dateTo) {
      rows = rows.filter((r) => {
        const joined = new Date(r.date_joined);
        if (dateFrom && joined < dateFrom) return false;
        if (dateTo && joined > dateTo) return false;
        return true;
      });
    }

    return paged(rows, query, 25);
  },

  /** Unpaginated — the real endpoint's `getAvailablePlotsForAsset` returns a flat array. */
  'GET /admin/allocation/assets/:asset_id/available-plots': ({ params, query }) => {
    const size = query.size !== undefined ? Number(query.size) : undefined;
    return ensurePlots(params.asset_id).filter(
      (p) => p.status === 'available' && (size === undefined || p.size === size)
    );
  },

  'POST /admin/allocation/payment-plans/:plan_id/allocate': ({ params, body: raw }) => {
    const dto = body<{ plot_ids?: string[]; reason?: string }>(raw);
    if (!dto.plot_ids?.length) {
      throw new MockHttpError(404, 'One or more requested plots do not exist', 'PLOT_NOT_FOUND');
    }

    const client = requireClient(params.plan_id);
    if (client.allocation_status !== 'pending') {
      throw new MockHttpError(400, 'This plan already has an allocation', 'PLAN_ALREADY_ALLOCATED');
    }

    const { entries, warnings } = claimPlots(client, dto.plot_ids);
    client.allocation_status = 'allocated';
    client.allocation_date = new Date().toISOString();
    client.allocations = entries;

    appendHistory({
      payment_plan: client.payment_plan_id,
      user: client.user_id,
      allocations: entries,
      actor: MOCK_ADMIN_ID,
      action: 'allocated',
      reason: dto.reason?.trim() || null,
    });

    return mutationResult(client, entries, warnings);
  },

  'POST /admin/allocation/payment-plans/:plan_id/deallocate': ({ params, body: raw }) => {
    const dto = body<{ reason?: string }>(raw);
    const reason = requireReason(dto.reason);

    const client = requireClient(params.plan_id);
    if (client.allocation_status === 'pending') {
      throw new MockHttpError(400, 'This plan has no active allocation', 'NO_ALLOCATION');
    }

    const releasedEntries = client.allocations;
    releasePlots(client);
    client.allocations = [];
    client.allocation_status = 'pending';
    client.allocation_date = null;

    appendHistory({
      payment_plan: client.payment_plan_id,
      user: client.user_id,
      allocations: releasedEntries,
      actor: MOCK_ADMIN_ID,
      action: 'deallocated',
      reason,
    });

    return mutationResult(client, [], []);
  },

  'POST /admin/allocation/payment-plans/:plan_id/reassign': ({ params, body: raw }) => {
    const dto = body<{ new_plot_ids?: string[]; reason?: string }>(raw);
    const reason = requireReason(dto.reason);
    if (!dto.new_plot_ids?.length) {
      throw new MockHttpError(404, 'One or more requested plots do not exist', 'PLOT_NOT_FOUND');
    }

    const client = requireClient(params.plan_id);
    if (client.allocation_status === 'pending') {
      throw new MockHttpError(400, 'This plan has no active allocation', 'NO_ALLOCATION');
    }

    releasePlots(client);
    let claim: { entries: AllocationEntry[]; warnings: string[] };
    try {
      claim = claimPlots(client, dto.new_plot_ids);
    } catch (err) {
      // Mirror the real atomic release-then-claim: a failed new claim must
      // not leave the old plots released.
      client.allocations.forEach((entry) => {
        const plot = ensurePlots(client.asset_id).find((p) => p._id === entry.plot_id);
        if (plot) plot.status = 'allocated';
      });
      throw err;
    }

    client.allocation_status = 'allocated';
    client.allocation_date = new Date().toISOString();
    client.allocations = claim.entries;

    appendHistory({
      payment_plan: client.payment_plan_id,
      user: client.user_id,
      allocations: claim.entries,
      actor: MOCK_ADMIN_ID,
      action: 'reassigned',
      reason,
    });

    return mutationResult(client, claim.entries, claim.warnings);
  },

  'POST /admin/allocation/payment-plans/:plan_id/send-email': ({ params }) => {
    const client = requireClient(params.plan_id);
    if (client.allocation_status === 'pending') {
      throw new MockHttpError(400, 'This plan has no active allocation', 'NO_ALLOCATION');
    }

    client.allocation_status = 'email_sent';
    appendHistory({
      payment_plan: client.payment_plan_id,
      user: client.user_id,
      allocations: client.allocations,
      actor: MOCK_ADMIN_ID,
      action: 'email_sent',
      reason: null,
    });

    return { asset_name: client.asset_name, queued: true };
  },

  'GET /admin/allocation/payment-plans/:plan_id/history': ({ params, query }) => {
    const rows = historyByPlan[params.plan_id] ?? [];
    return paged(rows, query, 20);
  },
};
