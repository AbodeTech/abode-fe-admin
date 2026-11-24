# Roles & Permissions — Impact Register

Source: `abode-admin-roles-permissions-prd.pdf` (first draft, MVP). Review date 2026-11-17.
Scope of this document: facts about what the PRD touches in `abode-fe-admin`. No code was changed.
Backend: the real REST backend is `abode-be-v2` (branch `staging`) at `C:\Users\user\Desktop\Abode-Combine\Abode-Backend\abode-be-v2`; section 6 was checked against it. The `Abode-Backend/abode-BE` folder inside this workspace is the old v1 GraphQL backend and is not relevant.

## 1. What exists today

| Concern | Today | File |
|---|---|---|
| Nav filtering | Static `navGroups` (14 groups, 46 items); filter by `requiresPermission`, `requiresSuperAdmin`, `requiresTrackerAccess`. `restrictedToRoles` exists, unused. | `components/layout/Sidebar.tsx:57-216, 276-313` |
| Landing page | Always `/` (generic KPI dashboard) | `SignInForm.tsx:46`, `ChangePasswordForm.tsx:54`, `middleware.ts:58`, `app/(dashboard)/page.tsx` |
| Route guard | Cookie-only; no role/permission awareness | `middleware.ts`, `AdminSessionGate.tsx` |
| 403 handling | Not global; a few pages render their own blocked state | `lib/api-client.ts`; `associates/performance`, `financial-officers`, `customer-managers`, `associates/managers` |
| Role shape | Single nullable `{id,name,is_super_admin}`; no slug, no landing field; `permissions: string[]` derived server-side | `features/auth/schemas/auth.schema.ts:25-54` |
| Permission vocabulary | 113 unique keys; ~30 never checked; some gates use keys outside the union (tracker keys, `manage_all_tickets`, `route_tickets`) | `hooks/use-admin-permission.ts` |
| Roles admin UI | Create role, single-select Change Role, no edit/delete; **ungated** | `features/roles-permissions/*`, `security/roles` |
| Audit | v1 records actor email + timestamp; denied attempts not recorded; FE admin-logs hook still GraphQL | `features/admin-logs`, v1 `AdminLogs` |
| QA | Mock login is always super admin → RBAC cannot be exercised in mock mode | `lib/mocks/routes/auth.ts` |

## 2. Shell / infrastructure files affected (all roles)
`components/layout/Sidebar.tsx`, `components/layout/Header.tsx`, `app/(dashboard)/layout.tsx`, `app/(dashboard)/page.tsx`, `features/auth/components/{SignInForm,ChangePasswordForm,AdminSessionGate}.tsx`, `features/auth/schemas/auth.schema.ts`, `store/auth-store.ts`, `middleware.ts`, `hooks/use-admin-permission.ts`, `lib/api-client.ts`, `lib/mocks/routes/{auth,roles}.ts`, a new "No access" state.
Roles admin: `app/(dashboard)/security/roles/page.tsx`, `security/roles/[id]/page.tsx`, `features/roles-permissions/components/{RolesGrid,AdminsTable,ChangeRoleDialog,CreateRoleDialog,AdminDetailHeader}.tsx`, `features/dashboard/components/InviteAdminDialog.tsx`, `security/adminlogs`.

## 3. User Details — every action, ungrouped (PRD risk: "every User Details action" must be reviewed and grouped before release)
Page: `app/(dashboard)/users/[id]/page.tsx`, feature `features/users/components/detail/`.

| # | Action | Component | Current FE gate |
|---|---|---|---|
| 1 | Edit User Profile | `UserEditActions.tsx` / `EditUserProfileModal` | `edit_user` or `edit_user_profile` |
| 2 | Change Login Email | `ChangeUserEmailModal` | `edit_user_email` |
| 3 | Edit Ref Status / Tier | `ChangeReferralStatusModal` | `edit_user` or `modify_tier` |
| 4 | Adjust Wallet Balance | `EditUserWalletModal` | `edit_user` or `adjust_wallet` |
| 5 | Edit User TIN | `EditUserTinModal` | `edit_user` or `edit_user_tin` |
| 6 | Clear User TIN | `ClearUserTinModal` | `edit_user` or `edit_user_tin` |
| 7 | Reassign Referrer | `ReassignReferrerModal` | `edit_user` or `reassign_referrer` |
| 8 | Suspend / Unsuspend user | `UserStats.tsx` | `suspend_user` / `unsuspend_user` |
| 9 | Suspend / Unsuspend wallet | `UserStats.tsx` | `suspend_wallet` / `unsuspend_wallet` |
| 10 | Force password reset | `UserStats.tsx` | `force_password_reset` |
| 11 | Adjust streak (+ points) | `UserStreakCard.tsx` | `adjust_streak` |
| 12 | Assign / Change **manager** | `features/associate-managers/.../ManagerAssignmentCard.tsx`, `ReassignProDialog` | FE: **none**. Server: `manage_manager_tracker` (also guards add/remove manager, targets, private flag) |
| 13 | Create payment plan | `CreateUserPlanModal` | `create_user_plan` |
| 14 | Create developer plot | `UserAssetsList.tsx` | `create_developer_plot` |
| 15 | Add referral | `UserReferralsTable.tsx` | `add_referral` |
| 16 | Delete referral | `UserReferralActions.tsx` | `reassign_referrer` |
| 17 | Reprocess transaction / Send receipt email | `OtherTransactionsTable.tsx` | **none** |
| 18 | KYC card / Bank card (read) | page.tsx | `view_kyc` / `view_user_bank_details` |
| P1–P13 | Per-plan menu: Edit Plan Spec (`update_plan_spec`), Edit Legal Details (`edit_user_asset_question`), Adjust Recorded Payment (`adjust_plan_balance`), Change Next Payment Date (`override_next_payment_date`), Edit Commission Rates (`edit_plan_commission_config`), Edit Commission Recipients (`edit_plan_commission_recipients`), Send Contract / Certificate / Flex T&C / Signature Reminder (`send_user_email`), Suspend / Unsuspend Plan (`suspend_plan`/`unsuspend_plan`), Close / Close & Relocate (`close_plan`), Delete Plan (`delete_user_plan`) | `UserAssetActions.tsx`, `PlanActionModals.tsx`, `AdvancedPlanActionModals.tsx` | as listed |

Decisions on points the PRD leaves open: Sales Member = read-only, no actions (confirmed). Recruitment = read-only profile/referral data, no KYC/bank/wallet (confirmed). KYC and bank details stay with Finance (confirmed). Meetings belongs to Recruitment (confirmed). Still to confirm with the PM: Support Member "support actions" = send-email actions, force password reset, adjust streak; Export on the Upgrades page; Support Lead alone clearing allocations; who sets member goals on the Tracker.
Sales Team Lead reassign right = #7 (referrer, `reassign_referrer`) + #12 (manager; key `reassign_manager`, added 2026-11-23, so the Lead does not need `manage_manager_tracker`) + #15/#16.

## 4. Pages by PRD area — mutating actions and current FE gating (server keys are in section 6)

### Sales
| Page | Route | Actions | Current gate |
|---|---|---|---|
| Associate Manager Performance (**Sales first page: the PRD's "Associate Pro Performance Tracker" is this page, per the product owner**; sidebar Associates › Manager Performance) | `/associates/managers` | Member: own team (the page already scopes to the signed-in manager). Lead (`view_manager_tracker` + `reassign_manager`, no `manage_manager_tracker`): manager picker incl. "All managers (combined)", unassigned count and list, reassign one Pro at a time. No Manage Managers menu, no Manage targets, no batch assign from the unassigned pool (decided 2026-11-23) | Page: manager record / manager-tracker permissions (check `app/(dashboard)/associates/managers/page.tsx`). Open question: does a Sales Member have a manager record? If not they need the view permission and a manager to look at |
| Associate Pro Tracker (now a normal page, sidebar Campaigns › Associate Pro Tracker) | `/associate-pros/tracker` | Set/edit yearly goals | `manage_yearly_goals` on buttons only; view/export keys defined, unchecked. **No per-member view** |
| Events | `/company-events`, `/new`, `/[id]` (tabs Allocation, Registrations, Analytics) | Create, Publish/Close/Reopen, save allocations, deallocate, resend invite, register on behalf, change pickup, remind, confirmation sheet, exports | Sidebar `view_allocations` only |
| Flex Leads | `/flex-leads` | Update status/notes, Delete, Export CSV | none |
| Upgrade Coupons | `/associate-upgrade/coupons` | Create, Edit, Pause/Activate, Delete, View usage | none |
| Campaigns | `/campaigns`, `/new`, `/[id]`, `/[id]/rewards` | Create, Edit, Publish/Pause/End, Invalidate reward, PDF, Export | `manage_campaigns`, `export_campaigns`, `view_sales` (`/campaigns/new` itself open) |
| Associate Pro Upgrades | `/associate-upgrade` | Manual upgrade, Approve/Decline, Export | `modify_referral_status` on review buttons |
| Top Associates | `/associates` | Export | none |
| Manager Performance | `/associates/managers` | Manage managers, targets, log call, reassign/bulk reassign, export | `view/manage/export_manager_tracker` or manager record |
| Division | `/division` | Save ladder | sidebar `view_division` only |
| Academy | `/academy/courses/**`, `/academy/learners` | Create/edit/publish/delete courses, modules, quiz, export | none |
| Amaris / WhatsApp | `/amaris`, `/whatsapp` | read-only | sidebar keys |
| Agency | `/agency/lists`, `/[id]`, `/new` | Onboard, edit, suspend, delete, change owner, remove member, export | `manage_agencies`, `export_agencies`, super admin |
| Purchase Confirmations | `/purchase-confirmations` | Resolve dispute, Resend email, Export — **no approve; no view-only mode** | none |
| Transactions | `/transactions/{assets,assets/[id],document,withdrawal,topup,commission,complete-assets}` | Approve/Decline (asset, withdrawal shown to everyone); document gated `asset_transactions`; topup super-admin only | mixed |
| Marketplace, Allocation, Commission, Security | `/marketplace`, `/allocation`, `/commission/*`, `/security/*` | Approve/reject listings; allocate/deallocate; publish rates, overrides; create role/change role | essentially none (`export_allocation_list` only) |

### Support
`/customer-managers` (manage menu, targets, log call, allocate — `view/export_cs_manager_tracker`, `allocate_land`, manager record), `/tickets`, `/issues`, `/requests/*` (no FE gate), `/assets/*`, `/allocation`, `/purchase-confirmations`, `/users/*`.
**Asset cost / performance exposure points** — gated: `/assets/[id]/costs` (`view_asset_costs`), Performance tab (`view_asset_profitability`, `view_asset_analytics`), FinancialPositionCard, ManagementSummaryCard, AssetAttentionBanner. **Ungated (BE decides):** the Costs and Performance tab links/routes, dashboard `/` (Revenue/Inflow/Outflow/Wallet, TopSellingProducts `total_collected`), `/sales`, `/analytics/sales`, `/assets/[id]/customers` payment figures.

### Finance
`/financial-officers` (officer record or super admin), `/finance-automation` (`view_finance_runs`, `run_*`), `/transactions/**`, `/commission/{rates,overrides,audit}` (no gates), `/campaigns/**`, `/associate-upgrade/**`, `/users/[id]` (KYC/bank gated), `/purchase-confirmations` (view only per PRD).

### Recruitment
`/recruitment` (+`/new`, `/[programmeId]`, cohorts: dashboard, registrants, referrals, sessions, tests, settings) gated by `manage_academy`/`export_academy`/`manage_meetings`; sidebar entry ungated. `/company-events/**`, `/meetings/**`, `/academy/courses/**` (ungated), `/associate-upgrade` (view-only already supported by `modify_referral_status`), `/users/**`. **No team-view screen exists for the Lead.**

### Not mentioned in the PRD (needs PM decision; design defaults to Founder/Developer only)
`/` dashboard, `/sales`, `/analytics/{sales,users}`, `/standing`, `/associates/performance`, `/admin/payment-plans`, `/field-performance/**`, `/meetings/**` (if not Events), `/academy/learners`, `/commission/audit*`, `/users/suspended`, `/users/completed-asset-payments`, `/finance-automation`, `/security/*` for non-founders.

## 5. Gaps to resolve with PM / Backend
**Status 2026-11-24:** the gaps below were closed by backend PRs #178 (staging `2ac9306`) and #179 (staging `5c65fe3`: Users list key, wallet and transaction keys, Associate Performance key, ticket page key, withdrawal redaction, audit-log shape, `support_member` retired). `ROLES-PERMISSIONS-BACKEND-ISSUES.md` lists what the backend still owes (N1 Support Lead wallets, N2 open ticket handlers, small B3 points).

**Frontend foundation (2026-11-23, branch `rbac-foundation`):** `lib/rbac/` holds the permission list (the backend pool verbatim), access rules and the page registry; `hooks/use-access.ts`, `Can`, `NoAccess` and `PageAccessGuard` read it; `scripts/rbac-registry-qa.ts` verifies it against the backend source. Findings that are the frontend's to handle:
- The registry follows what the server allows. Since #179 the Users list opens for every department role (`view_users` is implied by `view_user`), the asset and document ledgers need `asset_transactions`, Topup needs `view_wallets`, Associate Performance needs `view_associate_performance` and Tickets and Issues need `view_ticket_pages`, so Recruitment and Support no longer see the money pages. The Support Lead still reaches the wallet list through `adjust_wallet` (backend N1).
- **User Details actions (audited 2026-11-24):** every write in `features/users` was matched to its backend guard. Fixed: the `edit_user ||` override in the edit menu (a v1 leftover: `edit_user` guards only wallet provisioning, so it showed actions the server refuses); Reprocess transaction needs `reprocess_transaction` and Send receipt needs `send_user_email`; Close and Relocate needs `close_plan` and `create_user_plan` together.
- **PRD comparison (2026-11-24):** two gaps found and fixed. The Asset transactions ledger and the full-ownership transfer page showed Approve/Decline to everyone who could read them (Sales holds `asset_transactions`), but approving is `approve_payments` on the server (PRD FR06, FR10): both now need it. The asset detail page listed the Performance, Costs, Customers, Updates and Site Setup tabs to everyone, so Support saw links to figures it must not see (FR08): the tabs now follow the registry and are left out when the page is closed to the person.
- **Associate Pro link:** Change access has an Associate Pro tab (link, search by name or email, unlink) on `PATCH` and `DELETE /admin/admins/:id/associate-pro`; the admin page says Linked or Not linked.
- **Role edit and delete:** each role card has Edit and Delete (`manage_roles`). Edit changes description, landing page and permissions, says how many admins it affects and what is added or removed; the name is fixed and the super-admin role is locked. Delete is for custom roles nobody holds; a held role lists its admins with a link to each one's access page.
- **Live check against staging (2026-11-24):** found that a target nobody has set arrives as `null`, which the manager dashboard schema rejected, so Associate Performance failed with a shape-mismatch error. Fixed (`target.*_target`, `selling_pros_target` and `performance_score.target` are nullable, and the UI shows "no target set", never a zero). The live check now parses both dashboards with the app's schema.
- The withdrawal queue now arrives with bank details and TIN left out for callers without `view_user_bank_details` or `view_kyc`; the table and review dialog show "Restricted" instead of an unresolved reference.
- Admin Logs now reads `GET /admin/audit-logs` (`view_audit_logs`), so `permission-denied` entries and role, extra-permission and start-page changes appear. Rows are read in the documented snake_case shape and filtered with `admin_id`. Filters are by admin and action only (backend B3); export (CSV, XLSX, PDF) is built in the browser by paging the endpoint, kept from `main` (#135). Suspended Users still reads GraphQL v1.
- Security › Roles and Permissions: admins are listed with every role, extra permissions and start page; "Change access" edits all three with the backend's own rules (roles need `manage_roles`; extras and start page need `manage_admins`; nobody edits themselves; super-admin roles and keys are locked for non-super admins).
- The manager, CS manager, Financial Officer and ticket pickers read `role` from `GET /admin/admins`, which is a populated role document since backend 3a65785; their schemas now accept both a string and a document.
- `GET /admin/admins` returns populated role documents; `AdminAccountSchema` now accepts both ids and documents.
- A Sales Member's landing page needs a manager record (backend A3); until it is settled the page may show the not-a-manager error.
1. Multi-role per admin ("roles may be combined"): built on the backend (`additional_roles`, `role_ids`); the FE schema is still single-role.
1b. **Extra permissions per admin** (added 2026-11-20): built on the backend as `Admin.extra_permissions`, unioned in `permissionsForAdmin`; `PUT /admin/admins/:id/extra-permissions` (`manage_admins`). The session returns `permissions`, `role_permissions` and `extra_permissions`, so the Change Admin Access dialog (Roles tab + Extra permissions tab, locked rows for keys a role already gives) can tell them apart. Additive only. Rules enforced by the server: grant only keys you hold, super-admin-only keys need a super admin, no self-edit; each change is logged (`update-admin-extra-permissions`).
2. Role → landing page: the session returns each role's `default_landing_page` (a validated list of six values), the person's `start_page_choice` and the resolved `start_page`. The FE must not compute it. A Member/Lead flag does not exist and is not needed: Lead and Member are different roles with different keys.
3. Permission keys (see section 6): most exist on the server; the app uses almost none of them. Added 2026-11-23: `approve_purchase_confirmation`, `view_withdrawals` (split from `withdrawals`), `reassign_manager`, event keys on every event subpage. Still open: an explicit "all User Details actions" sign-off (D3).
4. Individual vs team data: Associate Pro Tracker has no personal-goal view (no longer the Sales landing); Recruitment Lead team view absent.
5. Asset cost/performance restriction must cover the exposure points above (PRD risk table), including the Dashboard (`view_dashboard`) and Sales pages.
6. Direct-access rejection (FR14): the server already rejects an endpoint call without its permission (section 6). The remaining work is the app (blocked-page state, hiding buttons).
7. Audit: admin actions are logged; whether denied attempts are logged was not checked. The FE admin-logs hook is still GraphQL.
8. Topup approval is super-admin-only in the FE; PRD says Finance approves Transactions.
9. Open item from PRD: Sales Team Lead Campaigns — design shows view-only, flagged.
10. Mock mode cannot test roles; needs a dev role switcher. Mock routes also lack `/admin/managers/*`, so the new Sales landing page cannot be browser-checked in mock mode until those routes are mocked.

## 6. Backend v2 facts (checked against `abode-be-v2`, branch `staging`)
- Enforcement: each admin endpoint declares `@AdminAuth({ permissions: [...] })`; `PermissionsGuard` returns 403 naming the missing permission; `is_super_admin` roles hold every key (`src/common/permissions.ts`, `src/common/guards/permissions.guard.ts`). Roles are ops-editable rows.
- One role per admin: `Admin.role` is a single ObjectId (`src/modules/admin/schemas/admin.schema.ts:30`).
- Keys that already fit the PRD: `view/manage/export_flex_leads`; `view/manage/export_purchase_confirmations`; `manage_commission`, `view/export_commission_transactions`; `view/manage_courses`, `view_course_learners`, `manage_credentials`; `view/manage/export_academy`; `view/manage_meetings`; `view_associate_pro_tracker`, `manage_yearly_goals`; `view/export_financial_officer_tracker`; `view/manage/export_cs_manager_tracker`; `view_dashboard`; `reprocess_transaction`; `view/manage_campaigns`; `view_kyc`, `view_user_bank_details`.
- Fit the PRD since 2026-11-23 (PR #178): approve Purchase Confirmation (`POST /purchase-confirmations/:plan_id/approve`, `approve_purchase_confirmation`, records `approved_by` and `approved_at`); `reassign_manager`; `view_withdrawals`; event subpages on `view/manage_company_events`; `start_page` and `extra_permissions`. The bullets below describe the state before that and are kept for the record.
- Did not fit the PRD (before #178):
  - Purchase Confirmations: only list, counts, export, resolve-dispute and resend existed. Resolve-dispute is documented as "never confirms". Approve needed a new endpoint that records the approver and time.
  - Upgrade Coupons: one class-level `manage_promotions` guards list, create, edit, status and delete, so Sales "view only" needs a view key.
  - Asset transactions (`asset_transactions`) and withdrawals (`withdrawals`) each use one key for viewing and acting.
  - Company Events are guarded by `allocate_land`, `view_allocations`, `deallocate_land` (an interim reuse). Granting event access to Sales or Recruitment would also grant land allocation.
  - Reassign an Associate Pro's manager (`POST /admin/managers/pros/:pro_id/reassign`) needs `manage_manager_tracker`, the same key that adds and removes managers and sets targets.
  - Associate upgrades: the list needs `view_user`; approve, decline and manual upgrade need `modify_referral_status`.
