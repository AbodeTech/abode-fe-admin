# Roles & Permissions: what the backend still needs

A self-contained list of everything the admin frontend needs from `abode-be-v2` for the Roles & Permissions PRD (`abode-admin-roles-permissions-prd.pdf`) and the approved admin design. It replaces the earlier review documents; nothing in them needs to be read first.

- **Basis:** `abode-be-v2`, branch `staging`, commit `5c65fe3` (PR #179, 24 Nov 2026). The first review was against `2ac9306` (PR #178, 23 Nov 2026).
- **Method:** for every admin page I read the `@AdminAuth` guard on its main endpoint (812 handlers extracted, 514 with a permission), resolved every seeded role in `role.seed.ts` to its permission list (including implied keys, using the backend's own `permissionsFor`), and compared both with the PRD tables and the page-by-page design. Four of the six specs for the changed areas ran and pass (62 tests: permissions access, seed PRD, migration, audit-log response). Two could not run on the machine used for the review, because `@nestjs/event-emitter` and `number-to-words` are not installed in that clone: `permissions.spec.ts` and `withdrawal-queue.spec.ts` (the withdrawal redaction). I read that code instead. Nothing was run against a live database, so statements about live data come from the code and from the statement that `migrate:role-permissions` has been run on staging.
- **Scope:** backend only. Frontend work is tracked separately.

## Status at a glance

| ID | Area | Issue | Status |
|---|---|---|---|
| A1 | Users | The All Users list needs `view_users`, which no department role held | **Fixed in #179** |
| A2 | Money | Wallet and transaction lists were guarded only by `view_user` | **Fixed in #179** (one point to confirm, N1) |
| A3 | Sales | A Sales Member lands on a page that fails without a manager record | Closed: a Founder creates the record |
| A4 | Associate Performance | No key for Support, and its key also reached the Sales Lead | **Fixed in #179** |
| A6 | Tickets and Issues | No key opened the Ticket and Issue pages | **Fixed in #179** (one point to confirm, N2) |
| N3 | Roles | A role can carry any key; extras cannot | **To confirm** |
| A7 | Withdrawals | The withdrawal list showed bank details and TIN to anyone who could view it | **Fixed in #179** (spec not run, see Method) |
| B2 | FR14 | Handlers with no permission | Mostly closed; see N2 |
| B3 | Hygiene | Dead key, duplicate role, audit-log shape, Sales Lead payment plans | **Mostly fixed**; three small points remain |

## A. Items that broke a PRD requirement

### A1. The All Users list needs `view_users` (fixed)
- **Was:** `GET /admin/users` required `view_users`, which no department role held, so the page returned 403 for all of them while a single user's page (`view_user`) opened.
- **Now:** `IMPLIED_PERMISSIONS` has `view_user → view_users`. Verified by resolving every seeded role with `permissionsFor`: all nine department roles now hold `view_users`. Custom roles with `view_user` get it too, with no migration.

### A2. Wallet and transaction lists (fixed, one point to confirm)
- **Now:** `GET /admin/transactions`, `/transactions/stats`, `/transactions/documents` and `/transactions/documents/stats` require `asset_transactions`; `GET /admin/wallets`, `/wallets/stats` and `/wallets/:userId` require `view_wallets` (new key). Sales and Finance hold both. Recruitment holds neither. `cs_manager` holds neither.
- **N1. To confirm: Support Lead can still list wallets.** `adjust_wallet` implies `view_wallets` (a deliberate product rule in `IMPLIED_PERMISSIONS`), and `adjust_wallet` is in `ALL_USER_DETAIL_ACTIONS`, which `support_lead` holds. So the Support Lead opens `GET /admin/wallets`, though the design gives Support no transaction pages. It goes away if `adjust_wallet` is taken out of the Support Lead's role.
- **Unchanged and acceptable:** the associate-upgrades list (`GET /admin/referrals/upgrades`, `/stats`, `/eligible`) and `GET /admin/users/:id/transactions` still require `view_user`.

### A3. A Sales Member without a manager record (closed)
- **What happens without one:** `HTTP 403`, code `NOT_A_MANAGER`, "This view is only available to admins who manage an associate pro team" (`IsManagerGuard`). The Sales Member's landing page is built on those endpoints.
- **Decided:** a Founder creates the manager record for each Sales Member (`POST /admin/managers`, which needs `manage_manager_tracker`; a Founder is a super admin, so it is allowed). Nothing for the backend to change. Until the record exists the person sees the error, so assigning the Sales role and creating the record should be done together.

### A4. Associate Performance (fixed)
- **Now:** `GET /admin/managers/dashboard/system` requires the new `view_associate_performance`. Held by `developer`, `cs_manager`, `support_lead` and the legacy `admin` and `moderator` roles; super admins get it automatically. `sales_team_lead` no longer reaches it and keeps `view_manager_tracker` for its team views. That matches the intended audience (Founder, Developer, Support Lead, Support Member).

### A6. Tickets and Issues page access (fixed, one point to confirm)
- **Now:** `view_ticket_pages` (new, page access only, with the comment that it does not widen reach) guards `GET /admin/tickets`, `/tickets/stats`, `/tickets/:id`, `GET /admin/issues` and `/issues/:id`. Held by `cs_manager`, `support_lead`, the legacy `admin`, `moderator`, `subadmin` and `viewer` roles, and Developer. Not held by Sales, Finance or Recruitment. Reach per request is unchanged.
- **Check (as before):** an admin who is party to a ticket through another role (for example a Sales Member assigned one) cannot open the page without the key. Confirm that is acceptable.
- **N2. To confirm: 28 ticket and issue handlers are still a bare `@AdminAuth()`.** Only the list, detail and stats routes took the key. These still accept any signed-in admin and rely on per-request reach:
  - Writes: `POST /admin/tickets`, `PATCH /admin/tickets/:id`, reply, participants, resolve, classify, merge, notes, collaborators; `POST` and `PATCH /admin/issues`, link and unlink a ticket, resolve.
  - Operations: `GET /admin/tickets/ingestion/status`, `/ingestion/runs`, `POST /admin/tickets/ingestion/trigger`, `GET /admin/tickets/analytics`, `/analytics/classifier`, `/export`, `/:id/suggest-issues`.
  - Is it intended that any admin can run the ingestion trigger, read ticket analytics and export tickets? If not, these want keys (for example `manage_all_tickets` for the trigger and export).

### N3. To confirm: a role can carry any key, unlike extra permissions
- **Backend:** `POST /admin/roles` and `PATCH /admin/roles/:id` (`manage_roles`) accept any key in the pool. They do not check that the caller holds the key, and they do not apply the super-admin-only list (`view_dashboard`, `view_asset_analytics`, `view_finance_runs`, `manage_roles`, `manage_admins`) that `PUT /admin/admins/:id/extra-permissions` enforces.
- **Effect:** someone with `manage_roles` can put `manage_admins` or `view_finance_runs` on a role they hold, or create a role with it and give it to themselves, which the extras endpoint would refuse. The role editor in the admin app follows the backend and does not add a rule of its own.
- **Question:** should role writes apply the same rules as extras (a non-super admin cannot grant a key they do not hold, nor a super-admin-only key)? If yes, the endpoint should refuse it; hiding it in the app would only cover the screen.

### A7. The withdrawal list showed bank details and TIN (fixed, spec not run)
- **Now:** `GET /admin/withdrawals` redacts per caller (`redactWithdrawalRow`): bank details and `provider_meta` are nulled without `view_user_bank_details`; the requester's `kyc` (the TIN) is nulled without `view_kyc`. The rest of the row is unchanged, so a Sales Member still sees the queue. I read the implementation; its spec (`withdrawal-queue.spec.ts`) could not run in the review clone.

## B. Items for review and hygiene

### B2. Handlers that accept any signed-in admin
A recount after #179: 38 `/admin` handlers use a bare `@AdminAuth()` (43 before), counting a handler only if it has no permission, no `superAdmin: true` and no guard of its own.
- **28 are ticket and issue handlers:** see N2.
- **The other 10 need no action:** own-record lookups (`GET /admin/managers/me`, `/admin/cs-managers/me`, `/admin/financial-officers/me`, `PATCH /admin/me/start-page`), own-team views behind `IsManagerGuard` (`/admin/managers/dashboard`, `/sales-record`), the tracker dashboard (scoped in the handler), and the Financial Officer plan, dashboard and export routes, which sit behind `FinancialOfficerAccessGuard` and admit `view_financial_officer_tracker` (or export) or the owning officer.

### B3. Smaller points
- **Fixed:** `asset_transactions` now guards the transaction lists (it guarded nothing before).
- **Fixed:** `support_member` is retired (`RETIRED_ROLES` in `sync-role-permissions.ts`); `cs_manager` is the Support Member persona. The seed has 16 roles.
- **Fixed:** `sales_member` no longer holds `view_payment_plans`, so the Lead no longer opens fewer pages than their own Member.
- **Fixed:** `GET /admin/audit-logs` now returns the documented snake_case `AdminLogResponseDto` (`id`, `admin_id`, `admin_email`, `old_state`, `new_state`, `actor_type`, …), with the old camelCase fields kept as deprecated aliases, and takes `admin_id` (the old `adminId` still works). The frontend has moved to the new names, so the aliases can be removed whenever you like.
- **Still open:** the audit log can be filtered only by admin and `action`. The old admin page also searched by admin email. There is no email or text search and no date range. Export works without a backend route: the page pages through `GET /admin/audit-logs` (500 rows at a time, with the same filters) and builds the CSV, XLSX or PDF in the browser. A server-side export route (the `export-audit-logs` action exists in the schema but nothing writes it) would only matter for very large logs. Say if the search or date range are wanted.
- **Still open:** commission has no view key. Rates, overrides and the audit all read behind `manage_commission` (`commission-admin.controller.ts`), so a role cannot be given view-only commission access.
- **Still open:** two super-admin roles exist (`super_admin`, `founder_super_admin`), and `executive` is not in the PRD.

## C. Decisions the backend can rely on
- Sales Team Lead manages Campaigns, and sees KYC and bank details. Sales Member does not see KYC or bank, and cannot edit user profiles.
- Support (both roles) holds KYC and bank-details access.
- Developer has full access.
- Sales Team Lead does not hold `manage_manager_tracker`: no add, change or remove manager, no private toggle, no batch assignment, no targets. It holds `view_manager_tracker` and `reassign_manager`.
- Recruitment Lead and Member may hold the same keys; no team view is needed for now.
- A Founder creates the Associate Manager record for each Sales Member (A3).
- Associate Performance is for Founder, Developer, Support Lead and Support Member, by permission.
- Extras only add; there are no deny rules.

## D. Contract the frontend now depends on
Please tell the frontend before changing any of these.

| Surface | What the frontend reads |
|---|---|
| Session (`POST /auth/admin/login`, `GET /auth/admin/me`) | `role` and `additional_roles` (each `id`, `name`, `is_super_admin`, `default_landing_page`), `permissions`, `role_permissions`, `extra_permissions`, `start_page`, `start_page_choice`, `must_change_password` |
| Landing values | `dashboard`, `manager_performance`, `associate_pro_tracker`, `cs_manager_performance`, `financial_officer_performance`, `recruitment` (`LANDING_PAGES`) |
| `PATCH /admin/me/start-page`, `PATCH /admin/admins/:id/start-page` | body `{ start_page }`; result `{ admin_id, start_page_choice, start_page }`; 400 `START_PAGE_NOT_AVAILABLE` with `details.available` |
| `PUT /admin/admins/:id/extra-permissions` | body `{ permissions }` (the full list); result `{ admin_id, extra_permissions, permissions }` |
| `GET /admin/admins`, `GET /admin/admins/:id` | `role` and `additional_roles` as populated role documents (`_id`, `name`, `permissions`, `is_super_admin`, `default_landing_page`), plus `extra_permissions` and `start_page` |
| `POST /admin/purchase-confirmations/:plan_id/approve` | body `{ note? }` (3 to 2000 characters); key `approve_purchase_confirmation` |
| `POST /admin/managers/pros/:pro_id/reassign` | key `reassign_manager`; works for a Pro with no current manager |
| Pages and their keys | Users `view_users`; asset and document transactions `asset_transactions`; wallets `view_wallets`; Associate Performance `view_associate_performance`; Tickets and Issues `view_ticket_pages` |
| Role edit and delete | `PATCH /admin/roles/:id` (`description`, `permissions`, `default_landing_page`; no `name`) and `DELETE /admin/roles/:id`, both `manage_roles`. Refused with 400: `SUPER_ADMIN_IMMUTABLE`, `ROLE_SYSTEM_PROTECTED` (delete), `ROLE_HAS_ASSIGNED_ADMINS` (delete); the app shows the message as it is |
| Associate Pro link | `PATCH /admin/admins/:id/associate-pro` body `{ associate_pro_user_id }`, `DELETE` to unlink, both `manage_admins`; result `{ admin_id, associate_pro_user_id }`; `GET /admin/admins` carries `associate_pro_user` (an id or null); the Associate Pro picker reads `GET /admin/users?tier=associate-pro&search=` |
| Withdrawal queue | `GET /admin/withdrawals` may return `bank_details_id: null` and `user.kyc: null`; the frontend shows "Restricted" |
| Permission pool | `PERMISSIONS` in `common/permissions.ts`. The frontend keeps a verbatim copy and a script fails when the two differ, so a new key is a one-line addition on their side |
| Admin Logs | `GET /admin/audit-logs` (`view_audit_logs`), params `page`, `limit`, `admin_id`, `action`; rows in the snake_case shape. The actions `permission-denied`, `update-admin-start-page`, `update-admin-extra-permissions`, `assign-admin-role`, `approve-purchase-confirmation` and `reassign-associate-pro` are registered in the log schema |

## Suggested order
1. N3: decide whether role writes should apply the same grant rules as extra permissions.
2. N2: decide whether the ticket writes, analytics, export and ingestion trigger should be open to every admin.
3. N1: decide whether the Support Lead should be able to adjust wallets (and so list them).
4. B3: audit-log email search and date range, a commission view key, the extra super-admin roles.
