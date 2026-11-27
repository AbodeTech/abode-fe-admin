/* ============================================================
 * The permission vocabulary — the backend's pool, verbatim.
 *
 * Source: abode-be-v2 `src/common/permissions.ts` (`PERMISSIONS`), copied with
 * its grouping and comments. Keys are UNDERSCORED. Typing every check against
 * this union is the point: a hand-written hyphenated key (`"suspend-user"`)
 * can never match anything, so that action is hidden from every role.
 *
 * Keeping it in step: `yarn tsx scripts/rbac-registry-qa.ts` compares this list
 * with the backend source and fails on any difference. When the backend adds a
 * key, add it here (in the same group) and, if a page needs it, to
 * `registry.ts`. Nothing else changes.
 * ============================================================ */

export const ADMIN_PERMISSIONS = [
  'view_user',
  'edit_user',
  'edit_user_profile',
  'edit_user_email',
  'delete_user',
  'suspend_user',
  'unsuspend_user',
  'force_password_reset',
  'edit_user_tin',
  'adjust_wallet',
  'suspend_wallet',
  'unsuspend_wallet',
  'modify_tier',
  'reassign_referrer',
  'create_user_plan',
  'create_developer_plot',
  'delete_user_plan',
  'edit_user_asset_question',
  'adjust_plan_balance',
  'adjust_streak',
  'override_next_payment_date',
  'update_plan_spec',
  'suspend_plan',
  'unsuspend_plan',
  'close_plan',
  'edit_plan_commission_config',
  'edit_plan_commission_recipients',
  'send_user_email',
  'bypass_email_rate_limit',

  'view_users',
  'view_user_analytics',

  'view_admin',
  'manage_admins',
  'manage_roles',

  'view_assets',
  'manage_assets',
  'delete_assets',
  'buy_asset',
  'delete_user_asset',
  'update_asset_question',
  'send_contract',

  // The asset, top-up and document transaction lists (A2). Kept apart from
  // view_user, which every department role holds for a user's own page.
  'asset_transactions',
  'view_wallets',
  'approve_payments',
  'view_withdrawals',
  'withdrawals',
  'manage_commission',
  'update_payment_plan',

  'add_referral',
  'remove_referral',
  'modify_referral_status',

  'view_kyc',
  'view_user_bank_details',
  'approve_kyc',

  'view_marketplace',
  'manage_marketplace',

  'view_agencies',
  'manage_agencies',
  'export_agencies',

  'view_courses',
  'manage_courses',
  'manage_academy_settings',
  'view_course_learners',
  'manage_credentials',

  'manage_promotions',
  'view_promotions',

  'view_requests',
  'manage_requests',

  'view_reports',
  'generate_reports',
  'view_audit_logs',

  'view_dashboard',

  'view_commission_transactions',
  'export_commission_transactions',

  'view_amaris_queries',
  'view_whatsapp_inbox',

  'view_flex_leads',
  'manage_flex_leads',
  'export_flex_leads',

  'view_allocations',
  'allocate_land',
  'deallocate_land',
  'reassign_land',
  'send_allocation_email',
  'export_allocation_list',
  'view_purchase_confirmations',
  'manage_purchase_confirmations',
  'approve_purchase_confirmation',
  'export_purchase_confirmations',
  'view_meetings',
  'manage_meetings',
  'view_company_events',
  'manage_company_events',

  'view_manager_tracker',
  // The system-wide Associate Performance dashboard (A4). Separate from
  // view_manager_tracker, which also opens the manager picker and pool.
  'view_associate_performance',
  'manage_manager_tracker',
  'reassign_manager',
  'export_manager_tracker',

  'view_cs_manager_tracker',
  'manage_cs_manager_tracker',
  'export_cs_manager_tracker',

  // Seeded to no role: officers read their own book through an ownership
  // guard, so only super admins (and roles ops grant it to) see every book.
  'view_financial_officer_tracker',
  'export_financial_officer_tracker',

  'view_campaigns',
  'manage_campaigns',
  'export_campaigns',

  'view_associate_tracker',
  'manage_associate_tracker',
  'export_associate_tracker',
  'view_sales',
  'export_sales',
  'export_sales_pii',
  'view_sales_analytics',

  'view_asset_analytics',
  'view_asset_subscribers',
  'export_asset_subscribers',

  'view_associates_leaderboard',
  'export_associates_leaderboard',

  'view_associate_pro_tracker',
  'view_own_associate_pro_tracker',
  'view_associate_pro_team_tracker',
  'view_associate_pro_upgrades',
  'manage_yearly_goals',
  'export_associate_pro_tracker',

  'view_payment_plans',
  'export_payment_plans',

  'reprocess_transaction',

  'view_academy',
  'manage_academy',
  'export_academy',

  // Estate updates (admin authors progress posts from the estate's own page;
  // buyers read them on their plot and in the weekly brief).
  'view_estate_updates',
  'manage_estate_updates',

  // Portfolio standing — the land-holding ladder buyers climb, and who is on
  // each rung. NOT `tier`: `modify_tier` above governs the account type
  // (associate, premium, agency), which is a different axis entirely.
  'view_standing',
  'manage_standing',

  // Division — the realtor season ladder (`src/modules/division/`). Same
  // view/manage split as standing; `manage_division` edits thresholds that
  // move every realtor on the next nightly sweep.
  'view_division',
  'manage_division',
  // Support tickets (SUP-65). ONE key, deliberately — not the view/manage/export
  // triple used elsewhere, because the ticket book is not gated by a flat
  // permission at all.
  //
  // Reach is derived per request (SUP-47): any admin works the tickets they are
  // party to, a CS Manager additionally decides the routing questions on those,
  // and the router — a CS Manager whose role is top-level admin — additionally
  // sees the unassigned pool. None of that is expressible as a permission
  // string, and encoding it as one would mean anybody holding `view_tickets`
  // could read every customer complaint in the system.
  //
  // This key is the exception above all of it: read and act on every ticket.
  // Kept as a permission rather than a role name so it can be granted and
  // withdrawn in the Role tables without a deploy, and so a second role can be
  // given it later without the access code changing.
  'manage_all_tickets',

  // Page access only (A6): opens the Tickets and Issues pages. It does NOT
  // widen reach; which tickets a person can read is still decided per request
  // as above. Named so it cannot be mistaken for a read-everything key.
  'view_ticket_pages',

  // The router tier (SUP-47). Held by the CS Manager who hands new tickets out:
  // it adds the UNASSIGNED POOL to what they can see, and nothing else — what
  // they have already distributed is deliberately not theirs to read back.
  //
  // v1 derived this from `Admin.role === "admin"`. That does not port: v2's
  // roles are ops-editable rows whose names can change, and `AdminActor.role`
  // is documented as "for logging and messages only, never for a privilege
  // test". So the question v1 asked by role name gets a key, which is also what
  // v1's own adminRoles.ts comment says fine-grained rights should be.
  //
  // Deliberately NOT implied by being a CS Manager. The subadmin CSMs receive
  // work; granting them the pool would let every one of them read every
  // untriaged complaint, which is most of the fence.
  'route_tickets',
  'run_realtor_todo_jobs',

  'view_finance_runs',
  'run_finance_posting',
  'run_finance_reports',
  
  'view_field_staff',
  'manage_field_staff',
  'assign_field_staff',
  'view_field_scorecards',
  'manage_field_scorecards',
  'view_field_submissions',
  'verify_field_submissions',
  'view_field_performance',
  'manage_asset_boundary',
  'view_asset_costs',
  'manage_asset_costs',
  'approve_asset_costs',
  'view_asset_profitability',
  'keep_inventory_on_close',
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

/**
 * Keys only a super admin may grant or revoke as a person's extra: the executive
 * read-outs and the keys that change who can do what. The BE refuses anyone else
 * (403); this list lets the dialog show them as locked instead of letting the
 * click fail. Copied from abode-be-v2 `SUPER_ADMIN_GRANT_ONLY_PERMISSIONS`; the
 * verification script fails if the two differ.
 */
export const SUPER_ADMIN_GRANT_ONLY_PERMISSIONS: ReadonlySet<string> = new Set<AdminPermission>([
  'view_dashboard',
  'view_asset_analytics',
  'view_finance_runs',
  'manage_roles',
  'manage_admins',
]);

const PERMISSION_SET: ReadonlySet<string> = new Set(ADMIN_PERMISSIONS);

/** Narrows an arbitrary string (a session entry, a URL param) to a known key. */
export function isAdminPermission(value: unknown): value is AdminPermission {
  return typeof value === "string" && PERMISSION_SET.has(value);
}
