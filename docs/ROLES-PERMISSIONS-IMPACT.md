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
Sales Team Lead reassign right = #7 (referrer, `reassign_referrer`) + #12 (manager; today only the broad `manage_manager_tracker`, so a narrower key is advisable) + #15/#16.

## 4. Pages by PRD area — mutating actions and current FE gating (server keys are in section 6)

### Sales
| Page | Route | Actions | Current gate |
|---|---|---|---|
| Associate Pro Tracker (PRD first page; sidebar Campaigns › Associate Pro Tracker) | `/associate-pros/tracker` | Set/edit yearly goals | `manage_yearly_goals` on buttons only; view/export keys defined, unchecked. **No per-member view** |
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
1. Multi-role per admin ("roles may be combined"): the FE schema and the v2 `Admin.role` (one ObjectId) are both single-role.
2. Role → landing page, and a Member/Lead flag: neither exists on the server or in the session.
3. Permission keys (see section 6): most exist on the server; the app uses almost none of them. Real gaps: approve Purchase Confirmation (no endpoint); view vs manage for coupons; view vs act on asset transactions and withdrawals; dedicated Events keys; a narrower reassign-manager key; an explicit "all User Details actions" group.
4. Individual vs team data: Associate Pro Tracker has no personal-goal view; Recruitment Lead team view absent.
5. Asset cost/performance restriction must cover the exposure points above (PRD risk table), including the Dashboard (`view_dashboard`) and Sales pages.
6. Direct-access rejection (FR14): the server already rejects an endpoint call without its permission (section 6). The remaining work is the app (blocked-page state, hiding buttons).
7. Audit: admin actions are logged; whether denied attempts are logged was not checked. The FE admin-logs hook is still GraphQL.
8. Topup approval is super-admin-only in the FE; PRD says Finance approves Transactions.
9. Open item from PRD: Sales Team Lead Campaigns — design shows view-only, flagged.
10. Mock mode cannot test roles; needs a dev role switcher.

## 6. Backend v2 facts (checked against `abode-be-v2`, branch `staging`)
- Enforcement: each admin endpoint declares `@AdminAuth({ permissions: [...] })`; `PermissionsGuard` returns 403 naming the missing permission; `is_super_admin` roles hold every key (`src/common/permissions.ts`, `src/common/guards/permissions.guard.ts`). Roles are ops-editable rows.
- One role per admin: `Admin.role` is a single ObjectId (`src/modules/admin/schemas/admin.schema.ts:30`).
- Keys that already fit the PRD: `view/manage/export_flex_leads`; `view/manage/export_purchase_confirmations`; `manage_commission`, `view/export_commission_transactions`; `view/manage_courses`, `view_course_learners`, `manage_credentials`; `view/manage/export_academy`; `view/manage_meetings`; `view_associate_pro_tracker`, `manage_yearly_goals`; `view/export_financial_officer_tracker`; `view/manage/export_cs_manager_tracker`; `view_dashboard`; `reprocess_transaction`; `view/manage_campaigns`; `view_kyc`, `view_user_bank_details`.
- Do not fit the PRD yet:
  - Purchase Confirmations: only list, counts, export, resolve-dispute and resend exist. Resolve-dispute is documented as "never confirms". Approve needs a new endpoint that records the approver and time.
  - Upgrade Coupons: one class-level `manage_promotions` guards list, create, edit, status and delete, so Sales "view only" needs a view key.
  - Asset transactions (`asset_transactions`) and withdrawals (`withdrawals`) each use one key for viewing and acting.
  - Company Events are guarded by `allocate_land`, `view_allocations`, `deallocate_land` (an interim reuse). Granting event access to Sales or Recruitment would also grant land allocation.
  - Reassign an Associate Pro's manager (`POST /admin/managers/pros/:pro_id/reassign`) needs `manage_manager_tracker`, the same key that adds and removes managers and sets targets.
  - Associate upgrades: the list needs `view_user`; approve, decline and manual upgrade need `modify_referral_status`.
