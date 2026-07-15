export const MOCK_USERS = [
  {
    _id: "user-001",
    firstName: "Ada",
    lastName: "Okafor",
    email: "ada.okafor@example.com",
    phoneNumber: "+2348011111111",
    userName: "adaokafor",
  },
  {
    _id: "user-002",
    firstName: "Chidi",
    lastName: "Eze",
    email: "chidi.eze@example.com",
    phoneNumber: "+2348022222222",
    userName: "chidieze",
  },
  {
    _id: "user-003",
    firstName: "Funke",
    lastName: "Adebayo",
    email: "funke.adebayo@example.com",
    phoneNumber: "+2348033333333",
    userName: "funkeade",
  },
  {
    _id: "user-004",
    firstName: "Ibrahim",
    lastName: "Musa",
    email: "ibrahim.musa@example.com",
    phoneNumber: "+2348044444444",
    userName: "ibrahimm",
  },
  {
    _id: "user-005",
    firstName: "Ngozi",
    lastName: "Nwosu",
    email: "ngozi.nwosu@example.com",
    phoneNumber: "+2348055555555",
    userName: "ngozin",
  },
  {
    _id: "user-006",
    firstName: "Tunde",
    lastName: "Balogun",
    email: "tunde.balogun@example.com",
    phoneNumber: "+2348066666666",
    userName: "tundeb",
  },
  {
    _id: "user-007",
    firstName: "Zainab",
    lastName: "Bello",
    email: "zainab.bello@example.com",
    phoneNumber: "+2348077777777",
    userName: "zainabb",
  },
  {
    _id: "user-008",
    firstName: "Emeka",
    lastName: "Obi",
    email: "emeka.obi@example.com",
    phoneNumber: "+2348088888888",
    userName: "emekao",
  },
] as const;

export const MOCK_AGENCY_IDS = [
  "agency-001",
  "agency-002",
  "agency-003",
  "agency-004",
] as const;

export const MOCK_ASSET_NAMES = [
  "Abode Meadows Phase 1",
  "Lekki Pearl Estate",
  "Victoria Garden City Plots",
  "Ibeju Flex Residences",
  "Ajah Full Ownership Block A",
] as const;

export const MOCK_ASSET_IDS = [
  "asset-001",
  "asset-002",
  "asset-003",
  "asset-004",
  "asset-005",
] as const;

export function formatMockDate(daysAgo: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString();
}

export function paginate<T>(rows: T[], page = 1, limit = 25) {
  const start = (page - 1) * limit;
  const data = rows.slice(start, start + limit);
  return {
    data,
    count: rows.length,
    page,
    limit,
    currentPage: page,
    totalPages: Math.max(1, Math.ceil(rows.length / limit)),
  };
}

export function mutationOk<T extends Record<string, unknown>>(payload: T): T {
  return payload;
}
