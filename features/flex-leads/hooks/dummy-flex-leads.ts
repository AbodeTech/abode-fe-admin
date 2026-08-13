import type { FlexLeadRow, FlexLeadStatus, FlexLeadType } from "./types";
import type { FlexLeadListFilters } from "./query-keys";

/**
 * Temporary mock data so Flex Leads UI can be reviewed before GraphQL lands.
 * Flip `USE_DUMMY_FLEX_LEADS` to false once `getFlexLeads` / `flexLeadCounts`
 * / `updateFlexLead` are live on the API.
 */
export const USE_DUMMY_FLEX_LEADS = true;

const daysAgo = (days: number, hours = 10) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hours, 15, 0, 0);
  return date.toISOString();
};

let dummyLeads: FlexLeadRow[] = [
  {
    id: "fl-001",
    type: "brochure",
    fullName: "Adaobi Okonkwo",
    email: "adaobi.okonkwo@gmail.com",
    phone: "+2348012345678",
    location: null,
    status: "new",
    adminNotes: null,
    createdAt: daysAgo(0, 9),
    updatedAt: null,
  },
  {
    id: "fl-002",
    type: "site_inspection",
    fullName: "Chinedu Eze",
    email: "chinedu.eze@yahoo.com",
    phone: "+2348098765432",
    location: "Abode Flex Estate, Lekki",
    status: "new",
    adminNotes: null,
    createdAt: daysAgo(0, 14),
    updatedAt: null,
  },
  {
    id: "fl-003",
    type: "brochure",
    fullName: "Fatima Bello",
    email: "fatima.bello@outlook.com",
    phone: "+2347033344556",
    location: null,
    status: "contacted",
    adminNotes: "Called — interested in 2-bedroom Flex units. Follow up Friday.",
    createdAt: daysAgo(1, 11),
    updatedAt: daysAgo(0, 16),
  },
  {
    id: "fl-004",
    type: "site_inspection",
    fullName: "Tunde Bakare",
    email: "tunde.bakare@gmail.com",
    phone: "+2348122233445",
    location: "Abode Flex Estate, Ibeju-Lekki",
    status: "scheduled",
    adminNotes: "Site visit booked for Saturday 10am. Guide: Amaka.",
    createdAt: daysAgo(2, 8),
    updatedAt: daysAgo(1, 12),
  },
  {
    id: "fl-005",
    type: "site_inspection",
    fullName: "Ngozi Adeyemi",
    email: "ngozi.adeyemi@icloud.com",
    phone: "+2348055511223",
    location: "Abode Flex Estate, Lekki",
    status: "completed",
    adminNotes: "Tour completed. Requested brochure + payment plan PDF.",
    createdAt: daysAgo(5, 10),
    updatedAt: daysAgo(3, 15),
  },
  {
    id: "fl-006",
    type: "brochure",
    fullName: "Ibrahim Musa",
    email: "ibrahim.musa@gmail.com",
    phone: "+2347066677889",
    location: null,
    status: "closed",
    adminNotes: "Not interested after pricing discussion.",
    createdAt: daysAgo(7, 13),
    updatedAt: daysAgo(4, 9),
  },
  {
    id: "fl-007",
    type: "brochure",
    fullName: "Blessing Okafor",
    email: "blessing.okafor@abode.ng",
    phone: "+2348188990011",
    location: null,
    status: "new",
    adminNotes: null,
    createdAt: daysAgo(0, 18),
    updatedAt: null,
  },
  {
    id: "fl-008",
    type: "site_inspection",
    fullName: "David Okoro",
    email: "david.okoro@proton.me",
    phone: "+2349011223344",
    location: "Showroom / Sales office",
    status: "contacted",
    adminNotes: "WhatsApp reply pending.",
    createdAt: daysAgo(1, 17),
    updatedAt: daysAgo(1, 19),
  },
  {
    id: "fl-009",
    type: "site_inspection",
    fullName: "Amina Yusuf",
    email: "amina.yusuf@gmail.com",
    phone: "+2348023456789",
    location: "Abode Flex Estate, Ibeju-Lekki",
    status: "new",
    adminNotes: null,
    createdAt: daysAgo(0, 7),
    updatedAt: null,
  },
  {
    id: "fl-010",
    type: "brochure",
    fullName: "Kelvin Nwosu",
    email: "kelvin.nwosu@hotmail.com",
    phone: "+2348134567890",
    location: null,
    status: "scheduled",
    adminNotes:
      "Converted from brochure → inspection interest. Awaiting date confirm.",
    createdAt: daysAgo(3, 9),
    updatedAt: daysAgo(2, 14),
  },
  {
    id: "fl-011",
    type: "brochure",
    fullName: "Ruth Adebayo",
    email: "ruth.adebayo@gmail.com",
    phone: "+2348076543210",
    location: null,
    status: "completed",
    adminNotes: "Downloaded brochure; enrolled in Flex waitlist.",
    createdAt: daysAgo(6, 12),
    updatedAt: daysAgo(5, 11),
  },
  {
    id: "fl-012",
    type: "site_inspection",
    fullName: "Emeka Obi",
    email: "emeka.obi@gmail.com",
    phone: "+2348091122334",
    location: "Abode Flex Estate, Lekki",
    status: "closed",
    adminNotes: "No-show for scheduled visit. Marked closed.",
    createdAt: daysAgo(8, 10),
    updatedAt: daysAgo(6, 16),
  },
];

function matchesSearch(row: FlexLeadRow, search: string) {
  if (!search) return true;
  const q = search.toLowerCase();
  return (
    row.fullName.toLowerCase().includes(q) ||
    row.email.toLowerCase().includes(q) ||
    row.phone.toLowerCase().includes(q) ||
    (row.location?.toLowerCase().includes(q) ?? false)
  );
}

function filterLeads(filters: FlexLeadListFilters): FlexLeadRow[] {
  return dummyLeads.filter((row) => {
    if (filters.status !== "all" && row.status !== filters.status) return false;
    if (filters.type !== "all" && row.type !== filters.type) return false;
    if (!matchesSearch(row, filters.search.trim())) return false;
    return true;
  });
}

export function getDummyFlexLeads(filters: FlexLeadListFilters) {
  const filtered = filterLeads(filters).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const start = (filters.page - 1) * filters.limit;
  return {
    count: filtered.length,
    data: filtered.slice(start, start + filters.limit),
  };
}

export function getDummyFlexLeadCounts() {
  const counts = {
    new: 0,
    contacted: 0,
    scheduled: 0,
    completed: 0,
    closed: 0,
  };
  for (const row of dummyLeads) {
    counts[row.status] += 1;
  }
  return counts;
}

export function updateDummyFlexLead(input: {
  id: string;
  status: FlexLeadStatus;
  adminNotes?: string | null;
}) {
  const index = dummyLeads.findIndex((row) => row.id === input.id);
  if (index === -1) {
    throw new Error("Lead not found in dummy data.");
  }

  const current = dummyLeads[index];
  const updated: FlexLeadRow = {
    ...current,
    status: input.status,
    adminNotes:
      input.adminNotes === undefined ? current.adminNotes : input.adminNotes,
    updatedAt: new Date().toISOString(),
  };

  dummyLeads = [
    ...dummyLeads.slice(0, index),
    updated,
    ...dummyLeads.slice(index + 1),
  ];

  return {
    id: updated.id,
    status: updated.status,
    adminNotes: updated.adminNotes,
  };
}

/** Sample shapes of each lead type (for docs). */
export const DUMMY_LEAD_TYPE_EXAMPLES: Record<FlexLeadType, FlexLeadRow> = {
  brochure: dummyLeads[0],
  site_inspection: dummyLeads[1],
};
