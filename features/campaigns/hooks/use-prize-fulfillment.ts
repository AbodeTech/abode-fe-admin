"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/* ============================================================
 * Prize fulfillment queue — 3000 Plots Project (Anniversary Mega
 * Offers). One unified queue for everything the business owes an
 * associate: checkpoint prizes (1 Acre hamper, 8 Acres trip, 25 Acres
 * car) and wheel wins, distinguished by `source`.
 *
 * TODO(real) — backend contract (abode-BE, admin side):
 *   Query checkpointFulfillmentList(status, prize, search, page, limit)
 *     → { count, data } from User.raffle_checkpoints + wheel win rows
 *   Query prizeFulfillmentCounts → { pending, contacted, delivered }
 *   Mutation updatePrizeFulfillment(entryId, status, note)
 *     → stamps status + note + admin, writes AdminLogs
 *       ("update-prize-fulfillment")
 * ============================================================ */

export const DEFAULT_FULFILLMENT_LIMIT = 10;

export type FulfillmentStatus = "pending" | "contacted" | "delivered";

export type PrizeSource = "checkpoint" | "wheel";

export type PrizeFulfillmentRow = {
  id: string;
  associateName: string;
  associateEmail: string;
  associatePhone: string;
  /** "Hamper", "All-expense-paid trip", "A car", "Blender", ... */
  prize: string;
  /** Filter group: hamper | trip | car | wheel */
  prizeGroup: "hamper" | "trip" | "car" | "wheel";
  source: PrizeSource;
  /** "1 Acre" / "8 Acres" for checkpoints, "Wheel spin" for wheel wins. */
  sourceDetail: string;
  earnedAt: string;
  status: FulfillmentStatus;
  lastNote: string | null;
  updatedAt: string | null;
};

export type FulfillmentFilters = {
  status: string;
  prize: string;
  search: string;
  page: number;
  limit: number;
};

export const prizeFulfillmentKeys = {
  all: ["campaigns", "prize-fulfillment"] as const,
  list: (filters: FulfillmentFilters) =>
    [...prizeFulfillmentKeys.all, "list", filters] as const,
  counts: () => [...prizeFulfillmentKeys.all, "counts"] as const,
};

/* --------------------- mock seed (TODO(real): delete) --------------------- */

const fakeDelay = (ms = 400) => new Promise((r) => setTimeout(r, ms));

export const mockFulfillmentRows: PrizeFulfillmentRow[] = [
  {
    id: "pf-001",
    associateName: "Ngozi Adeyemi",
    associateEmail: "ngozi.adeyemi@gmail.com",
    associatePhone: "+234 803 111 2233",
    prize: "Hamper",
    prizeGroup: "hamper",
    source: "checkpoint",
    sourceDetail: "1 Acre",
    earnedAt: "2026-07-09T15:30:00Z",
    status: "pending",
    lastNote: null,
    updatedAt: null,
  },
  {
    id: "pf-002",
    associateName: "Tunde Bakare",
    associateEmail: "tunde.bakare@gmail.com",
    associatePhone: "+234 805 444 5566",
    prize: "Hamper",
    prizeGroup: "hamper",
    source: "checkpoint",
    sourceDetail: "1 Acre",
    earnedAt: "2026-07-06T10:00:00Z",
    status: "contacted",
    lastNote: "Called 10 Jul, delivery scheduled for Friday.",
    updatedAt: "2026-07-10T09:12:00Z",
  },
  {
    id: "pf-003",
    associateName: "Ngozi Adeyemi",
    associateEmail: "ngozi.adeyemi@gmail.com",
    associatePhone: "+234 803 111 2233",
    prize: "All-expense-paid trip",
    prizeGroup: "trip",
    source: "checkpoint",
    sourceDetail: "8 Acres",
    earnedAt: "2026-07-13T18:45:00Z",
    status: "pending",
    lastNote: null,
    updatedAt: null,
  },
  {
    id: "pf-004",
    associateName: "Chidi Eze",
    associateEmail: "chidi.eze@yahoo.com",
    associatePhone: "+234 807 777 8899",
    prize: "Blender",
    prizeGroup: "wheel",
    source: "wheel",
    sourceDetail: "Wheel spin",
    earnedAt: "2026-07-12T13:20:00Z",
    status: "delivered",
    lastNote: "Picked up at the Lekki office.",
    updatedAt: "2026-07-14T11:00:00Z",
  },
  {
    id: "pf-005",
    associateName: "Halima Bello",
    associateEmail: "halima.bello@gmail.com",
    associatePhone: "+234 809 222 3344",
    prize: "₦2,000 airtime",
    prizeGroup: "wheel",
    source: "wheel",
    sourceDetail: "Wheel spin",
    earnedAt: "2026-07-14T08:05:00Z",
    status: "contacted",
    lastNote: "Airtime sent, awaiting confirmation.",
    updatedAt: "2026-07-14T10:30:00Z",
  },
  {
    id: "pf-006",
    associateName: "Funke Alabi",
    associateEmail: "funke.alabi@gmail.com",
    associatePhone: "+234 802 555 6677",
    prize: "Microwave oven",
    prizeGroup: "wheel",
    source: "wheel",
    sourceDetail: "Wheel spin",
    earnedAt: "2026-07-15T16:40:00Z",
    status: "pending",
    lastNote: null,
    updatedAt: null,
  },
  {
    id: "pf-007",
    associateName: "Ibrahim Musa",
    associateEmail: "ibrahim.musa@outlook.com",
    associatePhone: "+234 806 888 9900",
    prize: "Hamper",
    prizeGroup: "hamper",
    source: "checkpoint",
    sourceDetail: "1 Acre",
    earnedAt: "2026-07-11T12:15:00Z",
    status: "delivered",
    lastNote: "Delivered via dispatch, waybill 4412.",
    updatedAt: "2026-07-13T15:45:00Z",
  },
];

function applyFilters(
  rows: PrizeFulfillmentRow[],
  filters: FulfillmentFilters
): PrizeFulfillmentRow[] {
  const q = filters.search.trim().toLowerCase();
  return rows.filter((row) => {
    if (filters.status !== "all" && row.status !== filters.status) return false;
    if (filters.prize !== "all" && row.prizeGroup !== filters.prize) return false;
    if (
      q &&
      ![row.associateName, row.associateEmail, row.prize].some((v) =>
        v.toLowerCase().includes(q)
      )
    ) {
      return false;
    }
    return true;
  });
}

const STATUS_ORDER: Record<FulfillmentStatus, number> = {
  pending: 0,
  contacted: 1,
  delivered: 2,
};

/* --------------------- hooks --------------------- */

export function usePrizeFulfillment(filters: FulfillmentFilters) {
  return useQuery({
    queryKey: prizeFulfillmentKeys.list(filters),
    queryFn: async (): Promise<{ count: number; data: PrizeFulfillmentRow[] }> => {
      // TODO(real): execute(CHECKPOINT_FULFILLMENT_LIST, filters)
      await fakeDelay();
      const filtered = applyFilters(mockFulfillmentRows, filters).sort(
        (a, b) =>
          STATUS_ORDER[a.status] - STATUS_ORDER[b.status] ||
          new Date(a.earnedAt).getTime() - new Date(b.earnedAt).getTime()
      );
      const start = (filters.page - 1) * filters.limit;
      return { count: filtered.length, data: filtered.slice(start, start + filters.limit) };
    },
  });
}

export function useFulfillmentCounts() {
  return useQuery({
    queryKey: prizeFulfillmentKeys.counts(),
    queryFn: async () => {
      // TODO(real): execute(PRIZE_FULFILLMENT_COUNTS)
      await fakeDelay(250);
      return {
        pending: mockFulfillmentRows.filter((r) => r.status === "pending").length,
        contacted: mockFulfillmentRows.filter((r) => r.status === "contacted").length,
        delivered: mockFulfillmentRows.filter((r) => r.status === "delivered").length,
      };
    },
  });
}

export function useUpdatePrizeFulfillment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      entryId: string;
      status: FulfillmentStatus;
      note: string;
    }) => {
      // TODO(real): execute(UPDATE_PRIZE_FULFILLMENT, input) — admin-logged.
      await fakeDelay(500);
      const row = mockFulfillmentRows.find((r) => r.id === input.entryId);
      if (row) {
        row.status = input.status;
        row.lastNote = input.note;
        row.updatedAt = new Date().toISOString();
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: prizeFulfillmentKeys.all });
    },
  });
}
