import type { AccessRule } from './access';
import { FALLBACK_LANDING_ROUTE, type LandingPage } from './landing';

/* ============================================================
 * The page registry — the ONE list of dashboard pages.
 *
 * The sidebar, the route guard and the landing-page lookup all read this list.
 * A new page is one entry here plus, if it needs a new permission, one key in
 * `permissions.ts`. No role name appears anywhere in it.
 *
 * `access` is what the page's MAIN read endpoint needs on the server, checked
 * against abode-be-v2 `@AdminAuth` (see docs/ROLES-PERMISSIONS-IMPACT.md and
 * `yarn tsx scripts/rbac-registry-qa.ts`). It is a usability gate: the server
 * stays the authority and still answers 403 to a forged request.
 *
 * Route patterns: `[param]` matches exactly one segment. An entry also covers
 * every path beneath it, and the LONGEST matching entry wins — so `/users/[id]`
 * (needs `view_user`) is not caught by `/users` (needs `view_users`). The
 * dashboard `/` matches only itself.
 * ============================================================ */

export interface PageEntry {
  /** Stable id: the sidebar, the verification script and tests refer to a page by it. */
  id: string;
  /** Route pattern, e.g. `/users/[id]`. */
  route: string;
  label: string;
  /** Sidebar group title. Omit for a page the sidebar does not list (a detail page). */
  group?: string;
  access: AccessRule;
  /**
   * For a page opened by a record (manager, CS manager, officer) as well as a key:
   * what to tell someone who holds neither. Without it they would read "your role
   * doesn't include this page", which is wrong — the page is theirs once they are
   * set up as that manager or officer.
   */
  recordNote?: string;
  /** Marks the page a landing value opens. At most one entry per landing value. */
  landing?: LandingPage;
}

export const PAGE_REGISTRY: readonly PageEntry[] = [
  /* ---------- General ---------- */
  { id: 'dashboard', route: '/', label: 'Dashboard', group: 'General', access: { any: ['view_dashboard'] }, landing: 'dashboard' },
  { id: 'assets', route: '/assets', label: 'Assets', group: 'General', access: { any: ['view_assets'] } },
  { id: 'asset-create', route: '/assets/create', label: 'New asset', access: { any: ['manage_assets'] } },
  { id: 'asset-detail', route: '/assets/[id]', label: 'Asset', access: { any: ['view_assets'] } },
  { id: 'asset-blocks', route: '/assets/[id]/blocks', label: 'Asset blocks and plots', access: { any: ['view_allocations'] } },
  { id: 'asset-costs', route: '/assets/[id]/costs', label: 'Asset costs', access: { any: ['view_asset_costs'] } },
  { id: 'asset-customers', route: '/assets/[id]/customers', label: 'Asset customers', access: { any: ['view_asset_subscribers'] } },
  { id: 'asset-performance', route: '/assets/[id]/performance', label: 'Asset performance', access: { any: ['view_asset_analytics'] } },
  { id: 'asset-site-setup', route: '/assets/[id]/site-setup', label: 'Asset site setup', access: { any: ['view_field_performance'] } },
  { id: 'asset-updates', route: '/assets/[id]/updates', label: 'Asset updates', access: { any: ['view_estate_updates'] } },
  { id: 'payment-plans', route: '/admin/payment-plans', label: 'Payment Plans', group: 'General', access: { any: ['view_payment_plans'] } },
  { id: 'agency', route: '/agency', label: 'Agency', group: 'General', access: { any: ['view_agencies'] } },
  { id: 'agency-new', route: '/agency/new', label: 'New agency', access: { any: ['manage_agencies'] } },
  { id: 'allocation', route: '/allocation', label: 'Allocation', group: 'General', access: { any: ['view_allocations'] } },
  { id: 'marketplace', route: '/marketplace', label: 'Marketplace', group: 'General', access: { any: ['view_marketplace'] } },

  /* ---------- Sales ---------- */
  { id: 'sales', route: '/sales', label: 'Sales', group: 'Sales', access: { any: ['view_sales'] } },
  { id: 'flex-leads', route: '/flex-leads', label: 'Flex Leads', group: 'Sales', access: { any: ['view_flex_leads'] } },
  { id: 'sales-analytics', route: '/analytics/sales', label: 'Sales analytics', access: { any: ['view_sales_analytics'] } },
  { id: 'user-analytics', route: '/analytics/users', label: 'User analytics', access: { any: ['view_user_analytics'] } },

  /* ---------- Events ---------- */
  { id: 'meetings', route: '/meetings', label: 'Meetings', group: 'Events', access: { any: ['view_meetings'] } },
  { id: 'recruitment', route: '/recruitment', label: 'Recruitment', group: 'Events', access: { any: ['view_academy'] }, landing: 'recruitment' },
  { id: 'recruitment-analysis', route: '/recruitment/analysis', label: 'Recruitment Analysis', group: 'Events', access: { any: ['view_academy'] } },
  { id: 'recruitment-new', route: '/recruitment/new', label: 'New programme', access: { any: ['manage_academy'] } },
  { id: 'company-events', route: '/company-events', label: 'Company Events', group: 'Events', access: { any: ['view_company_events'] } },
  { id: 'company-event-new', route: '/company-events/new', label: 'New company event', access: { any: ['manage_company_events'] } },

  /* ---------- Users ---------- */
  // The list and its overview need `view_users`; ONE user's page needs `view_user`.
  // They are different keys on the server, so a role can hold one without the other.
  { id: 'users', route: '/users', label: 'All Users', group: 'Users', access: { any: ['view_users'] } },
  { id: 'user-detail', route: '/users/[id]', label: 'User', access: { any: ['view_user'] } },
  // Suspended Users and Completed Asset Payments still read GraphQL (v1), so no
  // v2 guard exists to check; they follow the list's key until they are migrated.
  { id: 'users-suspended', route: '/users/suspended', label: 'Suspended Users', group: 'Users', access: { any: ['view_users'] } },
  { id: 'users-completed-asset-payments', route: '/users/completed-asset-payments', label: 'Completed Asset Payments', group: 'Users', access: { any: ['view_users'] } },
  { id: 'standing', route: '/standing', label: 'Portfolio Standing', group: 'Users', access: { any: ['view_standing'] } },

  /* ---------- Associates ---------- */
  // The upgrades list is guarded by `view_user` on the server, not by the
  // upgrades key (that one guards only the tracker's own list).
  { id: 'upgrades', route: '/associate-upgrade', label: 'Associates Upgrade', group: 'Associates', access: { any: ['view_user'] } },
  { id: 'top-associates', route: '/associates', label: 'Top associates', group: 'Associates', access: { any: ['view_associates_leaderboard'] } },
  // The system-wide associate dashboard: GET /admin/managers/dashboard/system is guarded
  // by its own key, so Support can hold it without the manager picker and pool that
  // view_manager_tracker also opens.
  { id: 'associate-performance', route: '/associates/performance', label: 'Associate Performance', group: 'Associates', access: { any: ['view_associate_performance'] } },
  // An Associate Manager works their own team on any role: the manager record, not a key.
  { id: 'manager-performance', route: '/associates/managers', label: 'Manager Performance', group: 'Associates', access: { any: ['view_manager_tracker'], record: 'associate_manager' }, recordNote: "You aren't set up as an Associate Manager yet, so there is no team to show. Ask a Founder to add you as a manager.", landing: 'manager_performance' },
  { id: 'division', route: '/division', label: 'Division', group: 'Associates', access: { any: ['view_division'] } },

  /* ---------- Academy ---------- */
  { id: 'courses', route: '/academy/courses', label: 'Courses', group: 'Academy', access: { any: ['view_courses'] } },
  { id: 'course-learners', route: '/academy/courses/[id]/learners', label: 'Course learners', access: { any: ['view_course_learners'] } },
  { id: 'learners', route: '/academy/learners', label: 'Learners', group: 'Academy', access: { any: ['view_course_learners'] } },
  // A developer QA harness, not a product page.
  { id: 'academy-qa', route: '/academy-qa', label: 'Academy QA', access: { superAdminOnly: true } },

  /* ---------- Customer Success ---------- */
  { id: 'cs-performance', route: '/customer-managers', label: 'CS Manager Performance', group: 'Customer Success', access: { any: ['view_cs_manager_tracker'], record: 'cs_manager' }, recordNote: "You aren't set up as a CS Manager yet, so there is no customer book to show. Ask a Founder to add you as a CS manager.", landing: 'cs_manager_performance' },
  // Page access only: view_ticket_pages opens the pages, it does not widen which
  // tickets a person can read (that is still decided per request on the server).
  { id: 'tickets', route: '/tickets', label: 'Tickets', group: 'Customer Success', access: { any: ['view_ticket_pages'] } },
  { id: 'issues', route: '/issues', label: 'Issues', group: 'Customer Success', access: { any: ['view_ticket_pages'] } },
  { id: 'purchase-confirmations', route: '/purchase-confirmations', label: 'Purchase Confirmations', group: 'Customer Success', access: { any: ['view_purchase_confirmations'] } },
  { id: 'requests', route: '/requests', label: 'Requests', group: 'Customer Success', access: { any: ['view_requests'] } },

  /* ---------- Amaris ---------- */
  { id: 'amaris', route: '/amaris', label: 'Amaris', group: 'Amaris', access: { any: ['view_amaris_queries'] } },
  { id: 'whatsapp', route: '/whatsapp', label: 'WhatsApp', group: 'Amaris', access: { any: ['view_whatsapp_inbox'] } },

  /* ---------- Finance ---------- */
  // A Financial Officer sees their own record on any role: the officer record, not a key.
  { id: 'fo-performance', route: '/financial-officers', label: 'Financial Officer Performance', group: 'Finance', access: { any: ['view_financial_officer_tracker'], record: 'financial_officer' }, recordNote: "You aren't set up as a Financial Officer yet, so there is no recovery book to show. Ask a Founder to add you as an officer.", landing: 'financial_officer_performance' },
  { id: 'finance-automation', route: '/finance-automation', label: 'Finance Automation', group: 'Finance', access: { any: ['view_finance_runs'] } },
  { id: 'recovery-period', route: '/recovery-period', label: 'Recovery period', group: 'Finance', access: { any: ['view_recovery_windows'] } },
  { id: 'coupons', route: '/associate-upgrade/coupons', label: 'Upgrade Coupons', group: 'Finance', access: { any: ['view_promotions'] } },

  /* ---------- Field Performance ---------- */
  { id: 'field-site-managers', route: '/field-performance/site-managers', label: 'Site Manager Performance', group: 'Field Performance', access: { any: ['view_field_performance'] } },
  { id: 'field-surveyors', route: '/field-performance/surveyors', label: 'Surveyor Performance', group: 'Field Performance', access: { any: ['view_field_performance'] } },
  { id: 'field-review-queue', route: '/field-performance/review-queue', label: 'Review Queue', group: 'Field Performance', access: { any: ['view_field_submissions'] } },
  { id: 'field-performance', route: '/field-performance', label: 'Field Performance', access: { any: ['view_field_performance'] } },

  /* ---------- Transactions ---------- */
  // The asset and document ledgers are guarded by `asset_transactions`, the wallet list
  // by `view_wallets`; the withdrawal queue and commission payouts have keys of their own.
  { id: 'transactions', route: '/transactions', label: 'Transactions', access: { any: ['asset_transactions'] } },
  { id: 'tx-withdrawal', route: '/transactions/withdrawal', label: 'Withdrawal', group: 'Transactions', access: { any: ['view_withdrawals'] } },
  { id: 'tx-refunds', route: '/transactions/refunds', label: 'Refunds', group: 'Transactions', access: { any: ['view_refund_payouts'] } },
  { id: 'tx-topup', route: '/transactions/topup', label: 'Topup', group: 'Transactions', access: { any: ['view_wallets'] } },
  { id: 'tx-assets', route: '/transactions/assets', label: 'Asset', group: 'Transactions', access: { any: ['asset_transactions'] } },
  { id: 'tx-document', route: '/transactions/document', label: 'Document', group: 'Transactions', access: { any: ['asset_transactions'] } },
  { id: 'tx-commission', route: '/transactions/commission', label: 'Commission Payouts', group: 'Transactions', access: { any: ['view_commission_transactions'] } },

  /* ---------- Commission ---------- */
  // Rates, overrides and the audit all read behind `manage_commission`: there is no view key.
  { id: 'commission', route: '/commission', label: 'Commission', access: { any: ['manage_commission'] } },
  { id: 'commission-rates', route: '/commission/rates', label: 'Rates', group: 'Commission', access: { any: ['manage_commission'] } },
  { id: 'commission-overrides', route: '/commission/overrides', label: 'Overrides', group: 'Commission', access: { any: ['manage_commission'] } },

  /* ---------- Campaigns ---------- */
  { id: 'campaigns', route: '/campaigns', label: 'Campaigns', group: 'Campaigns', access: { any: ['view_campaigns'] } },
  { id: 'campaign-new', route: '/campaigns/new', label: 'New campaign', access: { any: ['manage_campaigns'] } },
  // Opens to a person's own goals or their team's; the page itself answers 403 for
  // an admin with no linked Associate Pro.
  { id: 'associate-pro-tracker', route: '/associate-pros/tracker', label: 'Associate Pro Tracker', group: 'Campaigns', access: { any: ['view_own_associate_pro_tracker', 'view_associate_pro_team_tracker', 'view_associate_pro_tracker'] }, landing: 'associate_pro_tracker' },

  /* ---------- Security ---------- */
  // Admin Logs still reads GraphQL (v1); the v2 endpoint is GET /admin/audit-logs.
  { id: 'admin-logs', route: '/security/adminlogs', label: 'Admin Logs', group: 'Security', access: { any: ['view_audit_logs'] } },
  { id: 'roles', route: '/security/roles', label: 'Roles and Permissions', group: 'Security', access: { any: ['view_admin'] } },
];

/* ---------- lookup ---------- */

const BY_ID: ReadonlyMap<string, PageEntry> = new Map(PAGE_REGISTRY.map((entry) => [entry.id, entry]));

export function getPage(id: string): PageEntry | undefined {
  return BY_ID.get(id);
}

function segments(path: string): string[] {
  return path.split('?')[0].split('#')[0].split('/').filter(Boolean);
}

const isParam = (segment: string) => segment.startsWith('[') && segment.endsWith(']');

/**
 * How well `pattern` matches the start of `path`, or -1 if it does not. Longer
 * wins; at equal length a literal segment beats a `[param]` one, so
 * `/users/suspended` is not swallowed by `/users/[id]`.
 */
function matchScore(pattern: string[], path: string[]): number {
  if (pattern.length > path.length) return -1;
  let params = 0;
  for (let i = 0; i < pattern.length; i += 1) {
    if (isParam(pattern[i])) params += 1;
    else if (pattern[i] !== path[i]) return -1;
  }
  return pattern.length * 100 - params;
}

/**
 * The registry entry that governs a pathname: the longest pattern that matches
 * it from the start. `undefined` for a path the registry does not know —
 * callers must not treat that as "denied" (the server still decides), and the
 * verification script fails the build if a real page route is unregistered.
 */
export function findPage(pathname: string): PageEntry | undefined {
  const path = segments(pathname);

  // The dashboard owns only itself: every other path "starts with" `/`.
  if (path.length === 0) return BY_ID.get('dashboard');

  let best: PageEntry | undefined;
  let bestScore = 0;
  for (const entry of PAGE_REGISTRY) {
    const pattern = segments(entry.route);
    if (pattern.length === 0) continue;
    const score = matchScore(pattern, path);
    if (score > bestScore) {
      best = entry;
      bestScore = score;
    }
  }
  return best;
}

/** The name of the page a landing value opens, e.g. `manager_performance` → "Manager Performance". */
export function landingLabel(value: string | null | undefined): string {
  if (!value) return getPage('dashboard')?.label ?? 'Dashboard';
  return PAGE_REGISTRY.find((page) => page.landing === value)?.label ?? value;
}

/** The route a landing value opens. Unknown or missing values fall back to the dashboard. */
export function landingRoute(startPage: string | null | undefined): string {
  if (!startPage) return FALLBACK_LANDING_ROUTE;
  const entry = PAGE_REGISTRY.find((candidate) => candidate.landing === startPage);
  return entry?.route ?? FALLBACK_LANDING_ROUTE;
}
