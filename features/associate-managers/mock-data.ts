// Mock-data scaffolding for parts of the feature the BE hasn't shipped yet.
// Everything here is temporary — strip the matching section when the BE
// endpoint lands.
//
// What's still mock (and why):
//   - ONBOARDING_*           BE has no onboarding endpoint yet
//   - getOnboardingRecord    same — feeds the OnboardingDetailsDialog
//   - getMockManagerForUser  no `getManagerForPro(proId)` query for the
//                            ManagerAssignmentCard on /users/[id]
//
// Type re-exports kept for components that still pass legacy-shaped values
// through (AssociateProsTable adapter, BulkReassignDialog).

// ---------------------------------------------------------------------------
// Shared types
// ---------------------------------------------------------------------------

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
  phone: string | null;
  status: ProStatus;
  recruitedAt: string;
  onboardedAt: string | null;
  totalSales: number;
  totalRevenue: number;
  lastLogin: string;
}

export interface OnboardingRecord {
  proId: string;
  onboardedAt: string;
  welcomeCallDone: boolean;
  welcomeCallDate?: string;
  materialsSent: string[];
  walkthroughDone: boolean;
  notes?: string;
}

// ---------------------------------------------------------------------------
// Onboarding (mock)
// ---------------------------------------------------------------------------

export const ONBOARDING_MATERIALS: { value: string; label: string }[] = [
  { value: "welcome_pack", label: "Welcome pack" },
  { value: "plan_guide", label: "Plan guide" },
  { value: "commission_sheet", label: "Commission sheet" },
  { value: "product_catalogue", label: "Product catalogue" },
];

export const getOnboardingRecord = (proId: string): OnboardingRecord | null => {
  // BE doesn't expose onboarding records yet. Always return null until then.
  void proId;
  return null;
};

// ---------------------------------------------------------------------------
// User → Manager mock (for ManagerAssignmentCard on /users/[id])
// ---------------------------------------------------------------------------

const MOCK_MANAGERS_FOR_CARD: AssociateManager[] = [
  { id: "mgr-001", name: "Adaeze Okonkwo", email: "adaeze@abode.ng", avatarInitials: "AO", assignedPros: 0 },
  { id: "mgr-002", name: "Chukwuma Eze", email: "chukwuma@abode.ng", avatarInitials: "CE", assignedPros: 0 },
  { id: "mgr-003", name: "Folake Adebayo", email: "folake@abode.ng", avatarInitials: "FA", assignedPros: 0 },
];

/** Design-time stub: deterministically picks a fake manager based on userId.
 * User-ids ending in "0" preview the "Unassigned" state. */
export const getMockManagerForUser = (
  userId: string
): AssociateManager | null => {
  if (!userId) return MOCK_MANAGERS_FOR_CARD[0];
  if (userId.endsWith("0")) return null;
  const idx = userId.length % MOCK_MANAGERS_FOR_CARD.length;
  return MOCK_MANAGERS_FOR_CARD[idx];
};
