# Roles & Permissions: backend contradictions and issues

Review of the backend roles-and-permissions work against the PRD (`abode-admin-roles-permissions-prd.pdf`) and the approved admin design.

- **Reviewed:** `abode-be-v2`, branch `staging`, commits `3a65785` (18 Nov, PR #175) and `839695a` (19 Nov, PR #177), author Rasheed Idris.
- **Method:** read the code and resolved every seeded role to its permission list, then compared each role with the PRD tables. Nothing was run against a database, so anything about live data is stated as "from the code".
- **Frontend status:** the frontend has no roles work yet, so none of the items below are frontend faults.
- **Written:** 20 November 2026.

## Summary

The structure is mostly right: several roles per person, a landing page per role, and the split coupon and event keys all exist. The problems are in what the seeded roles actually grant, in how the seed reaches a real database, and in three features the PRD needs that do not exist.

| ID | Area | Issue | PRD ref |
|---|---|---|---|
| A1 | Landing | Seed never writes the landing page, so every seeded role lands on `dashboard` | FR02 |
| A2 | Rollout | Seeded permissions do not reach existing databases and no migration grants the new keys | FR01 |
| A3 | Developer | Developer lacks the dashboard keys and lands on a page it cannot open | FR04 |
| A4 | Purchase Confirmations | There is no approve action | FR09 |
| A5 | Sales | Sales lacks read access to 10 of the pages the PRD gives it | Sales table |
| A6 | Events | Event subpages still need land-allocation keys the event roles do not have | Sales, Recruitment tables |
| A7 | Sales landing | Landing and scoping serve the Associate Pro Tracker, not Manager Performance | FR02, FR05 |
| B1 | Sales | Sales Member can edit user profiles | Sales table |
| B2 | Support | Support Member cannot allocate land | Support table |
| B3 | Support | Support cannot open Assets or Requests | Support table |
| B4 | Finance | Finance cannot approve withdrawals or open Commission Payouts | FR10, FR11 |
| B5 | Recruitment | Recruitment cannot open Users or Courses; the new upgrades key guards the wrong endpoint | Recruitment table |
| B6 | Recruitment | Lead and Member are identical; no team view exists | FR05 |
| B7 | Managers | Reassigning a manager still needs the broad manager-tracker key | FR07 |
| C1 | Combined roles | The person's own start-page choice cannot be stored (decided: add a backend field) | Design |
| C2 | Combined roles | No per-person extra permissions (decided: add a backend field) | Design |
| C3 | Audit | Denied attempts are not logged | Design |
| D1 | Contract | Landing values are free text and undocumented | |
| D2 | FR14 | About 47 handlers accept any signed-in admin; each needs a deliberate decision | FR14 |
| D3 | Review | "Every User Details action" includes powerful actions that need sign-off | Risks table |
| D4 | Hygiene | Dead key, duplicate roles, mixed commits, no PRD-matrix test | |

## A. Breaks a PRD requirement

### A1. Seeded roles all land on `dashboard`
- **PRD:** every role has its own starting page (FR02).
- **Backend:** `role.seed.ts` sets `default_landing_page` per role (for example `associate_pro_tracker`, `cs_manager_performance`). The scripts that load that file into the database never write it: `scripts/seed-admin.ts:41-50` and `migrate-admin-roles-to-hybrid.ts:106-119` set only `is_system` and `is_super_admin` and insert `description` and `permissions`. The schema default is `'dashboard'` (`role/schemas/role.schema.ts:17`). The only writers of the field are the role create and update API (`role.service.ts:58, 91`) and the executive migration.
- **Effect:** after seeding, Sales, Support, Finance and Recruitment all return `dashboard` as their landing page.
- **Fix:** write `default_landing_page` in the seed, and add a migration that sets it on existing role rows.

### A2. Seeded permissions do not reach existing databases, and no migration grants the new keys
- **Backend:** `seed-admin.ts` uses `$setOnInsert` for `permissions`, so a role that already exists is never updated. I found no migration that grants the new keys (`view_company_events`, `manage_company_events`, `view_own_associate_pro_tracker`, `view_associate_pro_team_tracker`, `view_associate_pro_upgrades`). `permissionsFor` back-fills only `view_promotions` from `manage_promotions` (`common/permissions.ts:428-430`).
- **Effect on existing roles:**
  - Company event endpoints moved from `allocate_land` and `view_allocations` to the new event keys (`company-events-admin.controller.ts:51-266`). The built-in `subadmin`, `moderator` and `viewer` role lists in `role.seed.ts` do not include the new keys, and neither does any custom role that relied on the old ones. Those roles lose Company Events.
  - The tracker `GET /upgrades` changed from `view_associate_pro_tracker` to `view_associate_pro_upgrades` (`associate-pro-tracker.controller.ts:45-46`). Roles that hold only the old key lose that list.
- **Fix:** a migration like the existing `backfill-agency-permission-keys` that grants the new keys to roles holding the old ones, with a dry-run mode.

### A3. Developer lacks the dashboard keys
- **PRD:** Founders and Developers can see and use every admin page and action (FR04).
- **Backend:** `role.seed.ts:28-35` removes `view_dashboard`, `view_asset_analytics` and `view_finance_runs` from every non-super-admin role, and `developer` is non-super-admin (`role.seed.ts:44-46`). `migrate-executive-view-role.ts:53-66` also strips those three keys from every existing non-super-admin role, custom roles included. The dashboard endpoints require `view_dashboard` (`admin-dashboard.controller.ts:14, 20, 27`).
- **Effect:** Developer's landing page is `dashboard` and the first request returns 403. Developer also cannot open asset analytics or finance runs.
- **Fix:** give Developer the three keys, or make Developer a super-admin role. Exclude it from the strip in the migration.

### A4. There is no approve action for Purchase Confirmations
- **PRD:** Support Lead approves a Purchase Confirmation and the decision records who and when (FR09, FR13, user story).
- **Backend:** the only write endpoints are `resolve-dispute` and `resend`, both under `manage_purchase_confirmations` (`purchase-confirmation-admin.controller.ts:69-82`). The seeded `support_lead` holds that key (`role.seed.ts:96`) and its description says "approvals", which is misleading. There is no approver or approval time stored.
- **Effect:** the Support Lead cannot approve, and the FE has nothing to call.
- **Fix:** add an approve endpoint with its own key (suggest `approve_purchase_confirmation`) that stores the approver and time and writes an admin-log entry. Give the key to `support_lead` only.

### A5. Sales lacks read access to 10 of the pages the PRD gives it
- **PRD:** Sales Member and Lead can view Associate Pro Upgrades, Top Associates, Manager Performance, Division, Academy, Amaris, Agency, WhatsApp, Purchase Confirmations and Transactions.
- **Backend:** `sales_member` and `sales_team_lead` (`role.seed.ts:49-70`) lack `view_associates_leaderboard`, `view_division`, `view_courses` and `view_course_learners`, `view_amaris_queries`, `view_whatsapp_inbox`, `view_agencies`, `view_purchase_confirmations`, `view_commission_transactions`, and `withdrawals`. Associate Pro Upgrades and the asset and document transaction lists work through `view_user`, which Sales holds.
- **Effect:** those pages return 403 for Sales.
- **Note on Withdrawals:** the `withdrawals` key covers viewing and acting (`wallet-admin.controller.ts:163-245`), so Sales cannot be given view-only access until the key is split.
- **Fix:** add the missing read keys to both roles, and split `withdrawals` into view and act.

### A6. Event subpages still need land-allocation keys
- **PRD:** Sales and Recruitment view and manage Events and all event subpages, and see analysis.
- **Backend:** the event list, detail and edit endpoints moved to the new event keys, but these did not: the allocations list and the analytics endpoint (`company-events-admin.controller.ts:125, 133`, `view_allocations`), allocate and deallocate (`153, 165`, `allocate_land`, `deallocate_land`), and the confirmation sheet (`245, 254`). The Sales and Recruitment seeds hold `manage_company_events` but none of the allocation keys.
- **Effect:** the Allocation tab, the Analytics tab and the confirmation sheet return 403 for the roles that are meant to run events.
- **Fix:** guard those endpoints with the event keys, or decide explicitly which subpages stay with land allocation and grant those keys to the event roles.

### A7. Sales landing and tracker scoping serve the wrong page
- **Product intent:** the PRD's "Associate Pro Performance Tracker" is the Associate Manager Performance page (`/associates/managers`), for both Sales roles.
- **Backend:** the Sales landing slug is `associate_pro_tracker` (`role.seed.ts:57, 69`), and the new scoping covers only the Associate Pro Tracker module. Its dashboard returns 403 for a Sales Member unless an admin is linked to an Associate Pro user (`associate-pro-tracker.controller.ts:109`), and for a Sales Lead unless a manager roster exists (`:120`). Nothing creates the link except a manual call to `PATCH /admin/admins/:id/associate-pro`.
- **Manager Performance needs:** a Sales Member sees their own team through their manager record, which works. A Sales Lead needs `view_manager_tracker` to pick other managers and `manage_manager_tracker` for targets, and the seed grants neither.
- **Fix:** point the Sales landing at Manager Performance, grant the Lead the manager-tracker keys, and decide whether the own and team tracker keys are still needed.

## B. Wrong access for a role

### B1. Sales Member can edit user profiles
`role.seed.ts:54` gives `sales_member` `edit_user_profile`. Product decision: Sales Member views users and performs no profile edits. **Fix:** remove it.

### B2. Support Member cannot allocate land
The PRD gives both support roles allocation ("See availability and perform allocations"). `support_member` (`role.seed.ts:81-89`) lacks `allocate_land`; `cs_manager` and `support_lead` have it. There are also two roles for the same "CS Manager / Support Member" persona. **Fix:** grant `allocate_land` to `support_member`, and keep one of `cs_manager` or `support_member`.

### B3. Support cannot open Assets or Requests
Support seeds lack `view_assets` (asset pages, `asset-admin.controller.ts:38, 45`) and `view_requests` (requests list, `requests-admin.controller.ts:24-43`); they hold only `manage_requests`. Asset performance is separately guarded by `view_asset_analytics` (`asset-analytics.controller.ts:29, 40`), which Support does not hold, so hiding performance figures (FR08) holds on the server. I could not find where asset cost figures are served in the asset module, so please confirm they cannot be reached with `view_assets` alone.

### B4. Finance cannot approve withdrawals or open Commission Payouts
`finance_member` and `finance_lead` (`role.seed.ts:101-120`) lack `withdrawals` (needed to list and approve withdrawals) and `view_commission_transactions` (`commission-admin.controller.ts:30`), although they hold `manage_commission`. PRD: Finance views and approves Transactions and has full access to Commissions. **Fix:** add both keys.

### B5. Recruitment cannot open Users or Courses; the upgrades key guards the wrong endpoint
- Recruitment holds no `view_user`, so the Users page and user details return 403 (PRD: view users and details needed for recruitment).
- Course endpoints need `view_courses` and `manage_courses` (`course-admin.controller.ts:33+`), but the seed grants `view_academy` and `manage_academy`. The Courses pages return 403 (PRD: create and manage Academy courses).
- `view_associate_pro_upgrades` guards only the tracker's upgrades list. The Upgrades page calls `/admin/referrals/upgrades`, which needs `view_user` (`referral-admin.controller.ts:27-34`), so the new key does not open that page.

### B6. Recruitment Lead is identical to Member
`recruitment_member` and `recruitment_lead` hold the same nine keys (`role.seed.ts:121-139`). The PRD says the Lead also has a team view. No team endpoint or key exists.

### B7. Reassigning a manager needs the broad key
`POST /admin/managers/pros/:pro_id/reassign` needs `manage_manager_tracker` (`associate-manager-crud.controller.ts:56-57`), the same key that adds and removes managers and sets targets. The PRD lets the Sales Lead reassign without those powers. **Fix:** a narrower key (for example `reassign_manager`) for this endpoint only.

## C. Needed by the approved design, not in the PRD text

### C1. The person's own start-page choice cannot be stored
The landing page belongs to the role. The session returns it for the primary role and every additional role (`auth-admin.view.ts`), and "primary" is the first role in the list. A person with two roles cannot choose between them, and reordering the roles changes where they land. **Decided: add a backend field.**
- Add `start_page` to the admin record. It holds one landing value (see D1) and must match the landing page of one of the roles the person holds. When it is empty, the primary role's landing page applies, as today.
- Return it on the session so the frontend never has to guess.
- The person must be able to change it themselves (the header menu in the design), so it needs a self-service endpoint as well as the admin one. If a role is removed and the stored value no longer matches any held role, fall back to the primary role's landing page.

### C2. No per-person extra permissions
The design lets one person be granted single permissions on top of their roles. The backend has `additional_roles` only.

**Decided: add a backend field.**
- Add `extra_permissions` (a list of permission keys) to the admin record. `permissionsForAdmin` (`common/permissions.ts:435`) unions it with the roles' permissions, so the guard and the session pick it up with no other change. Extras only add; there are no deny rules.
- Validate every key against `PERMISSIONS`. Set it through an admin endpoint guarded by `manage_admins`, and return it on the session next to the combined list so the dialog can show which permissions come from a role and which are extra.
- Log each grant and revoke with the before and after lists, in the same way role changes are logged.
- Suggested rule: an admin can only grant permissions they hold themselves, and only a super admin can grant super-admin-only keys, so the field cannot be used to escalate.

### C3. Denied attempts are not logged
`permissions.guard.ts:23-27` throws 403 and writes nothing. The PRD requires actor and time only for important actions (FR13), so this is optional, but the design's Admin Logs shows denied attempts.

## D. Contract, review and hygiene

### D1. Landing values are free text and undocumented
`default_landing_page` accepts any string up to 80 characters (`create-role.dto.ts:33-38`). The values in use are `dashboard`, `associate_pro_tracker`, `cs_manager_performance`, `financial_officer_performance` and `recruitment`. The frontend needs the allowed list, and the API should reject anything else.

### D2. Handlers that accept any signed-in admin
About 47 handlers use `@AdminAuth()` with no permission: support tickets and issues (34, resolved in service code), financial-officer admin (4), manager dashboard (2), manager CRUD (1), CS manager admin (1), customer onboarding (1), tracker dashboard (1, scoped in the handler), auth (3, intended). FR14 says an out-of-role action is rejected even when submitted directly, so each non-ticket one needs a deliberate decision.

### D3. "Every User Details action" needs sign-off
`ALL_USER_DETAIL_ACTIONS` (`role.seed.ts:11-21`) is a reviewed group, as the PRD asks, but it includes `delete_user`, `adjust_wallet`, `suspend_wallet`, `approve_kyc`, `edit_user_email` and `modify_referral_status`. It goes to Sales Lead, Support Lead and both Finance roles. The PRD risk table requires explicit review before release.

### D4. Smaller points
- `asset_transactions` is granted to Finance but no endpoint requires it; approvals use `approve_payments`.
- Two super-admin roles exist (`super_admin`, `founder_super_admin`), and `executive` is not in the PRD.
- Commit `839695a` ("update on latest feedbacks") mixes role-seed edits with a purchase-confirmation status change, backfill migrations and agency and referral changes, which makes review and revert hard.
- No test asserts the seeded roles against the PRD tables. A spec that loads `DEFAULT_ROLES` and checks allowed and denied keys per role would have caught most of A and B.
- The 403 message names only the primary role (`permissions.guard.ts:25`).

## What works
- `additional_roles` with `role_ids` on create, invite and change-role; the guard and the session use the union.
- `default_landing_page` returned for each role on the session.
- `view_promotions` split from `manage_promotions`, applied to the coupon endpoints, with a back-fill for old roles.
- `view_company_events` and `manage_company_events` on event list, detail and edit.
- Block and plot endpoints now carry permissions.
- Role changes are logged with the before and after role lists, and only a super admin can assign a super-admin role.
- Purchase Confirmation view is separate from manage; Finance and Support Member hold view only.
- Asset performance is separately permissioned.

## Decisions recorded with this review
- Sales Team Lead can manage Campaigns. The seed already matches; the PRD open item is closed.
- Support holds KYC and bank-details access. The seed already matches.
- Sales Team Lead also sees KYC and bank details. The seed already matches (`ALL_USER_DETAIL_ACTIONS` includes both). Sales Member does not.
- Per-person extra permissions and the person's start page are stored in new backend fields (C1, C2).
- Sales Member has no profile editing. The seed does not match (B1).
- Developer must have full access (A3).

## Suggested order
1. A1, A2, A3: without these the roles cannot be used on a real database.
2. A4, A6, B7, C1, C2: new endpoints, fields or key changes the frontend is waiting on.
3. A5, A7, B1 to B5: seed corrections once the product decisions above are applied.
4. B6, C3, D1 to D4.
