// Design-time fixtures. Replace with codegen-typed GraphQL hooks when wiring real data.

export type Period = "week" | "month" | "year";

export type ProStatus = "active" | "inactive" | "abandoned";

export interface AssociateManager {
  id: string;
  name: string;
  email: string;
  avatarInitials: string;
  assignedPros: number;
}

export interface AssociatePro {
  id: string;
  name: string;
  email: string;
  status: ProStatus;
  recruitedAt: string;
  totalSales: number;
  totalRevenue: number;
  lastLogin: string;
}

export interface ManagerMetrics {
  managerId: string;
  recruitment: {
    newAssociates: number;
    newAssociatePros: number;
    associateProsViaAssociates: number;
  };
  sales: {
    sellingPros: number;
    totalPros: number;
    totalRevenue: number;
    revenuePerSellingPro: number;
  };
  activity: {
    active: number;
    inactive: number;
    abandoned: number;
  };
  milestones: {
    newProFirstSales: number;
    firstTimeSellers: number;
  };
  performance: {
    reviewCount: number;
    averageRating: number;
    score: number;
    rewardAmount: number;
  };
}

export const MOCK_MANAGERS: AssociateManager[] = [
  { id: "mgr-001", name: "Adaeze Okonkwo", email: "adaeze@abode.ng", avatarInitials: "AO", assignedPros: 18 },
  { id: "mgr-002", name: "Chukwuma Eze", email: "chukwuma@abode.ng", avatarInitials: "CE", assignedPros: 12 },
  { id: "mgr-003", name: "Folake Adebayo", email: "folake@abode.ng", avatarInitials: "FA", assignedPros: 9 },
  { id: "mgr-004", name: "Tunde Bello", email: "tunde@abode.ng", avatarInitials: "TB", assignedPros: 14 },
  { id: "mgr-005", name: "Yetunde Akpan", email: "yetunde@abode.ng", avatarInitials: "YA", assignedPros: 7 },
];

const METRICS_BY_MANAGER: Record<string, ManagerMetrics> = {
  "mgr-001": {
    managerId: "mgr-001",
    recruitment: { newAssociates: 34, newAssociatePros: 12, associateProsViaAssociates: 6 },
    sales: { sellingPros: 14, totalPros: 18, totalRevenue: 184_500_000, revenuePerSellingPro: 13_178_571 },
    activity: { active: 12, inactive: 4, abandoned: 2 },
    milestones: { newProFirstSales: 5, firstTimeSellers: 3 },
    performance: { reviewCount: 41, averageRating: 4.7, score: 8.72, rewardAmount: 2_768_500 },
  },
  "mgr-002": {
    managerId: "mgr-002",
    recruitment: { newAssociates: 19, newAssociatePros: 6, associateProsViaAssociates: 2 },
    sales: { sellingPros: 8, totalPros: 12, totalRevenue: 96_200_000, revenuePerSellingPro: 12_025_000 },
    activity: { active: 7, inactive: 3, abandoned: 2 },
    milestones: { newProFirstSales: 2, firstTimeSellers: 1 },
    performance: { reviewCount: 23, averageRating: 4.4, score: 5.23, rewardAmount: 1_443_000 },
  },
  "mgr-003": {
    managerId: "mgr-003",
    recruitment: { newAssociates: 11, newAssociatePros: 3, associateProsViaAssociates: 1 },
    sales: { sellingPros: 5, totalPros: 9, totalRevenue: 52_700_000, revenuePerSellingPro: 10_540_000 },
    activity: { active: 5, inactive: 3, abandoned: 1 },
    milestones: { newProFirstSales: 1, firstTimeSellers: 0 },
    performance: { reviewCount: 14, averageRating: 4.1, score: 3.41, rewardAmount: 790_500 },
  },
  "mgr-004": {
    managerId: "mgr-004",
    recruitment: { newAssociates: 24, newAssociatePros: 9, associateProsViaAssociates: 4 },
    sales: { sellingPros: 11, totalPros: 14, totalRevenue: 128_400_000, revenuePerSellingPro: 11_672_727 },
    activity: { active: 9, inactive: 4, abandoned: 1 },
    milestones: { newProFirstSales: 3, firstTimeSellers: 2 },
    performance: { reviewCount: 28, averageRating: 4.6, score: 6.09, rewardAmount: 1_926_000 },
  },
  "mgr-005": {
    managerId: "mgr-005",
    recruitment: { newAssociates: 8, newAssociatePros: 2, associateProsViaAssociates: 0 },
    sales: { sellingPros: 4, totalPros: 7, totalRevenue: 38_100_000, revenuePerSellingPro: 9_525_000 },
    activity: { active: 4, inactive: 2, abandoned: 1 },
    milestones: { newProFirstSales: 1, firstTimeSellers: 1 },
    performance: { reviewCount: 9, averageRating: 4.3, score: 2.09, rewardAmount: 571_500 },
  },
};

export const getManagerMetrics = (managerId: string): ManagerMetrics =>
  METRICS_BY_MANAGER[managerId] ?? METRICS_BY_MANAGER["mgr-001"];

export const MOCK_PROS_BY_MANAGER: Record<string, AssociatePro[]> = {
  "mgr-001": [
    { id: "pro-101", name: "Ada Eze", email: "ada@example.ng", status: "active", recruitedAt: "2025-03-12", totalSales: 9, totalRevenue: 14_200_000, lastLogin: "2h ago" },
    { id: "pro-102", name: "Bayo Akinola", email: "bayo@example.ng", status: "active", recruitedAt: "2025-02-04", totalSales: 7, totalRevenue: 11_750_000, lastLogin: "1d ago" },
    { id: "pro-103", name: "Chioma Nwosu", email: "chioma@example.ng", status: "active", recruitedAt: "2024-12-18", totalSales: 12, totalRevenue: 22_400_000, lastLogin: "3h ago" },
    { id: "pro-104", name: "David Obi", email: "david@example.ng", status: "inactive", recruitedAt: "2024-09-22", totalSales: 0, totalRevenue: 0, lastLogin: "2 months ago" },
    { id: "pro-105", name: "Esther Salami", email: "esther@example.ng", status: "active", recruitedAt: "2025-01-30", totalSales: 4, totalRevenue: 7_300_000, lastLogin: "5h ago" },
    { id: "pro-106", name: "Femi Ojo", email: "femi@example.ng", status: "abandoned", recruitedAt: "2024-05-10", totalSales: 0, totalRevenue: 0, lastLogin: "8 months ago" },
    { id: "pro-107", name: "Gloria Eke", email: "gloria@example.ng", status: "active", recruitedAt: "2025-04-02", totalSales: 3, totalRevenue: 4_800_000, lastLogin: "12h ago" },
    { id: "pro-108", name: "Henry Bassey", email: "henry@example.ng", status: "inactive", recruitedAt: "2024-08-14", totalSales: 1, totalRevenue: 1_200_000, lastLogin: "3 months ago" },
    { id: "pro-109", name: "Ifeoma Udo", email: "ifeoma@example.ng", status: "active", recruitedAt: "2025-02-21", totalSales: 6, totalRevenue: 9_650_000, lastLogin: "yesterday" },
    { id: "pro-110", name: "John Adeola", email: "john@example.ng", status: "active", recruitedAt: "2024-11-09", totalSales: 8, totalRevenue: 12_900_000, lastLogin: "4h ago" },
  ],
  "mgr-002": [
    { id: "pro-201", name: "Kayode Lawal", email: "kayode@example.ng", status: "active", recruitedAt: "2025-01-15", totalSales: 5, totalRevenue: 8_400_000, lastLogin: "1h ago" },
    { id: "pro-202", name: "Lola Sanusi", email: "lola@example.ng", status: "active", recruitedAt: "2024-10-08", totalSales: 11, totalRevenue: 19_800_000, lastLogin: "6h ago" },
    { id: "pro-203", name: "Musa Bello", email: "musa@example.ng", status: "inactive", recruitedAt: "2024-07-20", totalSales: 0, totalRevenue: 0, lastLogin: "4 months ago" },
    { id: "pro-204", name: "Nkechi Obi", email: "nkechi@example.ng", status: "active", recruitedAt: "2025-03-01", totalSales: 4, totalRevenue: 6_700_000, lastLogin: "yesterday" },
    { id: "pro-205", name: "Oluwaseun Ade", email: "seun@example.ng", status: "abandoned", recruitedAt: "2024-04-12", totalSales: 0, totalRevenue: 0, lastLogin: "7 months ago" },
  ],
  "mgr-003": [
    { id: "pro-301", name: "Patrick Okoro", email: "patrick@example.ng", status: "active", recruitedAt: "2025-02-19", totalSales: 6, totalRevenue: 10_200_000, lastLogin: "2h ago" },
    { id: "pro-302", name: "Queen Effiong", email: "queen@example.ng", status: "inactive", recruitedAt: "2024-09-05", totalSales: 1, totalRevenue: 1_500_000, lastLogin: "3 months ago" },
    { id: "pro-303", name: "Rachael Inuwa", email: "rachael@example.ng", status: "active", recruitedAt: "2025-01-22", totalSales: 3, totalRevenue: 5_400_000, lastLogin: "yesterday" },
  ],
  "mgr-004": [
    { id: "pro-401", name: "Sade Coker", email: "sade@example.ng", status: "active", recruitedAt: "2025-03-10", totalSales: 5, totalRevenue: 8_900_000, lastLogin: "2h ago" },
    { id: "pro-402", name: "Tobi Adams", email: "tobi@example.ng", status: "active", recruitedAt: "2024-11-12", totalSales: 8, totalRevenue: 14_300_000, lastLogin: "1d ago" },
    { id: "pro-403", name: "Uche Iheanyi", email: "uche@example.ng", status: "inactive", recruitedAt: "2024-06-30", totalSales: 2, totalRevenue: 3_100_000, lastLogin: "2 months ago" },
  ],
  "mgr-005": [
    { id: "pro-501", name: "Victor Ogun", email: "victor@example.ng", status: "active", recruitedAt: "2025-04-01", totalSales: 2, totalRevenue: 3_400_000, lastLogin: "5h ago" },
    { id: "pro-502", name: "Wendy Imeh", email: "wendy@example.ng", status: "active", recruitedAt: "2025-02-28", totalSales: 4, totalRevenue: 6_900_000, lastLogin: "yesterday" },
  ],
};

export const getProsForManager = (managerId: string): AssociatePro[] =>
  MOCK_PROS_BY_MANAGER[managerId] ?? [];

// Reverse lookup: which manager owns this Pro? Returns null when unassigned.
export const getManagerForPro = (proId: string): AssociateManager | null => {
  for (const manager of MOCK_MANAGERS) {
    const pros = MOCK_PROS_BY_MANAGER[manager.id] ?? [];
    if (pros.some((p) => p.id === proId)) return manager;
  }
  return null;
};

// Design-time stub: pretend any user-id maps to a known manager for the
// User Details page demo. Returns null for an "unassigned" preview when
// the user id ends with "0".
export const getMockManagerForUser = (userId: string): AssociateManager | null => {
  if (!userId) return MOCK_MANAGERS[0];
  if (userId.endsWith("0")) return null;
  const idx = userId.length % MOCK_MANAGERS.length;
  return MOCK_MANAGERS[idx];
};

// Existing admins eligible to become an Associate Manager (Add Manager dialog).
export const MOCK_ELIGIBLE_ADMINS = [
  { id: "adm-21", name: "Adekunle Onashile", email: "adekunle@abode.ng" },
  { id: "adm-22", name: "Bukola Iyer", email: "bukola@abode.ng" },
  { id: "adm-23", name: "Charles Nwankwo", email: "charles@abode.ng" },
  { id: "adm-24", name: "Damilola Bakare", email: "damilola@abode.ng" },
];

export const UNASSIGNED_POOL_ID = "__unassigned__";

// Unassigned Pros pool (used by Add / Change dialogs).
export const MOCK_UNASSIGNED_PROS: AssociatePro[] = [
  { id: "pro-901", name: "Zainab Yusuf", email: "zainab@example.ng", status: "active", recruitedAt: "2025-03-22", totalSales: 1, totalRevenue: 1_800_000, lastLogin: "2d ago" },
  { id: "pro-902", name: "Ahmed Okafor", email: "ahmed@example.ng", status: "inactive", recruitedAt: "2024-10-15", totalSales: 0, totalRevenue: 0, lastLogin: "5 months ago" },
  { id: "pro-903", name: "Blessing Etim", email: "blessing@example.ng", status: "active", recruitedAt: "2025-02-08", totalSales: 3, totalRevenue: 4_650_000, lastLogin: "yesterday" },
];
