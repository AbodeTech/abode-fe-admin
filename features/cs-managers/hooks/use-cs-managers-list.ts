import { useQuery } from "@tanstack/react-query";
import type {
  AdminOption,
  CSManagerSummary,
  UnassignedCustomer,
} from "../types";

/**
 * List + queue reads for the CS Manager admin surface — TEMPORARY MOCK.
 *
 * When BE ships:
 *   - list → getCSManagers query
 *   - unassigned → getUnassignedCustomers query
 *   - admin search → reuse existing admin picker if one exists,
 *     otherwise a new listAdmins query
 * Consumer components (list table, unassigned queue, promote dialog)
 * don't change.
 */

const MOCK_CS_MANAGERS: CSManagerSummary[] = [
  {
    _id: "csm-1",
    manager: {
      _id: "adenike",
      firstName: "Adenike",
      lastName: "Balogun",
      email: "adenike.balogun@abode.ng",
    },
    assignedCustomersCount: 47,
    assignedPlansCount: 51,
    currentPeriodScore: 70.6,
    activeSince: "2026-06-01",
  },
  {
    _id: "csm-2",
    manager: {
      _id: "kunle",
      firstName: "Kunle",
      lastName: "Omotayo",
      email: "kunle.omotayo@abode.ng",
    },
    assignedCustomersCount: 32,
    assignedPlansCount: 34,
    currentPeriodScore: 85.4,
    activeSince: "2026-04-15",
  },
  {
    _id: "csm-3",
    manager: {
      _id: "yewande",
      firstName: "Yewande",
      lastName: "Adeoye",
      email: "yewande.adeoye@abode.ng",
    },
    assignedCustomersCount: 28,
    assignedPlansCount: 30,
    currentPeriodScore: 48.2,
    activeSince: "2026-08-10",
  },
];

const MOCK_UNASSIGNED: UnassignedCustomer[] = [
  {
    _id: "u1",
    firstName: "Bola",
    lastName: "Ademiluyi",
    email: "bola.ademiluyi@gmail.com",
    phone: "+2348012345678",
    firstPurchaseAt: "2026-09-22T09:00:00Z",
    daysUnassigned: 2,
    planCount: 1,
  },
  {
    _id: "u2",
    firstName: "Ifeoma",
    lastName: "Chukwu",
    email: "ifeoma.chukwu@yahoo.com",
    phone: "+2348023456789",
    firstPurchaseAt: "2026-09-19T14:00:00Z",
    daysUnassigned: 5,
    planCount: 1,
  },
  {
    _id: "u3",
    firstName: "Gbenga",
    lastName: "Salami",
    email: "gbenga.salami@outlook.com",
    phone: null,
    firstPurchaseAt: "2026-09-14T11:00:00Z",
    daysUnassigned: 10,
    planCount: 2,
  },
  {
    _id: "u4",
    firstName: "Halima",
    lastName: "Yusuf",
    email: "halima.yusuf@abode.ng",
    phone: "+2348034567890",
    firstPurchaseAt: "2026-09-05T08:00:00Z",
    daysUnassigned: 19,
    planCount: 1,
  },
];

const MOCK_ADMINS: AdminOption[] = [
  {
    _id: "adenike",
    firstName: "Adenike",
    lastName: "Balogun",
    email: "adenike.balogun@abode.ng",
    role: "manager",
    isCSManager: true,
  },
  {
    _id: "kunle",
    firstName: "Kunle",
    lastName: "Omotayo",
    email: "kunle.omotayo@abode.ng",
    role: "manager",
    isCSManager: true,
  },
  {
    _id: "yewande",
    firstName: "Yewande",
    lastName: "Adeoye",
    email: "yewande.adeoye@abode.ng",
    role: "manager",
    isCSManager: true,
  },
  {
    _id: "tayo",
    firstName: "Tayo",
    lastName: "Ogundipe",
    email: "tayo.ogundipe@abode.ng",
    role: "admin",
    isCSManager: false,
  },
  {
    _id: "nkem",
    firstName: "Nkem",
    lastName: "Okoli",
    email: "nkem.okoli@abode.ng",
    role: "admin",
    isCSManager: false,
  },
  {
    _id: "seyi",
    firstName: "Seyi",
    lastName: "Adeyemo",
    email: "seyi.adeyemo@abode.ng",
    role: "admin",
    isCSManager: false,
  },
];

export const csManagersListKeys = {
  managers: () => ["cs-managers", "list"] as const,
  unassigned: () => ["cs-managers", "unassigned"] as const,
  adminOptions: (q: string) =>
    ["cs-managers", "admin-options", q] as const,
};

export const useCSManagersList = () => {
  return useQuery({
    queryKey: csManagersListKeys.managers(),
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 80));
      return MOCK_CS_MANAGERS;
    },
  });
};

export const useUnassignedCustomers = () => {
  return useQuery({
    queryKey: csManagersListKeys.unassigned(),
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 80));
      return MOCK_UNASSIGNED;
    },
  });
};

/** Admin picker — filters against name/email, excludes existing CSMs
 * when `excludeCSManagers` is set (used by the promotion dialog). */
export const useAdminOptions = (
  query: string,
  opts?: { excludeCSManagers?: boolean }
) => {
  return useQuery({
    queryKey: [
      ...csManagersListKeys.adminOptions(query),
      opts?.excludeCSManagers ?? false,
    ] as const,
    queryFn: async () => {
      await new Promise((r) => setTimeout(r, 60));
      const q = query.trim().toLowerCase();
      return MOCK_ADMINS.filter((a) => {
        if (opts?.excludeCSManagers && a.isCSManager) return false;
        if (!q) return true;
        const name = `${a.firstName ?? ""} ${a.lastName ?? ""}`.toLowerCase();
        return name.includes(q) || a.email.toLowerCase().includes(q);
      });
    },
  });
};
