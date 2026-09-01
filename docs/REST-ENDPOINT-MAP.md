# REST Endpoint Map — abode-admin-fe

Planning artifact for the GraphQL removal on `admin-graphql-decoupling`.
Maps the FE's GraphQL operations to REST endpoints on `abode-be-v2` (staging,
base `/api/v1`). All paths below are relative to that base.

Source of truth for the operation list: `lib/mocks/handlers/*` (160 mocked
operations) plus the 25 unmocked ones found in source — **185 operations total**
across 86 hook files and 18 features.

**Status legend**

| Status | Meaning |
|---|---|
| ✅ real | Endpoint exists on BE staging. Response shape may differ from the GraphQL shape — the hook's Zod schema + mapper absorb that. |
| ⚠️ adapt | Endpoint exists but semantics don't map 1:1 (merged endpoints, different model, FE-side derivation needed). |
| 🚧 provisional | No BE endpoint. Path invented following BE conventions; **mock-only** until the BE ships it. |

> Provisional paths never hit the network (mock mode intercepts them). They are
> also the **proposal to the BE team** — review before BE builds them.

---

## Coverage summary

The admin backend is strongest exactly where admin CRUD lives, and absent for
everything analytical or campaign-related.

| Feature | BE coverage |
|---|---|
| `assets` | ✅ Strong — full CRUD incl. nested offers/sizes/plans |
| `users` | ✅ Strong — list, detail, edit, suspend/unsuspend |
| `roles-permissions` | ✅ Complete — roles, permissions, admins, invite |
| `admin-logs` | ✅ `GET /admin/audit-logs` |
| `commission-config` | ✅ Complete — config + overrides + audit |
| `associate-upgrade` | ✅ Complete — queue (populated + searchable), approve/decline, manual upgrade with fee + commission |
| `requests` | ✅ Complete — admin list + status change |
| `agency` | ⚠️ Partial — list/detail/activate/suspend only; no create, no dashboard, no transactions |
| `auth` | ✅ Admin login/me/change-password |
| `marketplace` | ⚠️ Partial — public list/detail/cancel; **no admin moderation** |
| `associates` (managers) | 🚧 **None** — 26 operations, zero BE |
| `transactions` | ✅ Partial — `GET /admin/transactions` + unified transfer approve/decline; no stats/export |
| `dashboard` | 🚧 None |
| `analytics` | 🚧 None |
| `campaigns` | 🚧 Engine REST mocked (`/admin/campaigns*`); Associate Pro tracker still GraphQL |
| `allocation` | 🚧 None |
| `sales` | 🚧 None |

**Roughly 45% of operations map to real endpoints; 55% are provisional.**

---

## Auth — `features/auth`, `actions/auth.ts`

| Operation | REST | Status | Notes |
|---|---|---|---|
| `SigninAdmin` | `POST /auth/admin/login` | ✅ real | Returns `{ accessToken, refreshToken, admin }`. **Two FE login paths exist today** (client `signinAdminClient` + server `loginAction`) — collapse to one during conversion. |
| `SendAdminEmailVerification` | `POST /auth/forgot-password` | ⚠️ adapt | No admin-specific reset on BE; the shared endpoint is the closest fit. Confirm admins are in scope for it. |
| `VerifyAdminEmail` | `POST /auth/verify-otp` | ⚠️ adapt | Shared endpoint; purpose-scoped bearer token. |
| `UpdateAdminPassword` | `POST /auth/admin/change-password` | ✅ real | BE also enforces a forced first-login change (`PasswordChangeGuard`). |

New endpoints worth adopting: `GET /auth/admin/me` (session probe — would let
middleware verify rather than trust a cookie), `POST /auth/admin/logout-all`.

> **⚠ Open decision — refresh tokens.** BE issues short-lived access tokens +
> rotating refresh. The FE has **no refresh flow** (`logoutAction` deletes a
> `refreshToken` that is never set). Resolve before auth points at the real BE.

## Users — `features/users` (24 ops, 8,519 LOC — heaviest feature)

| Operation | REST | Status | Notes |
|---|---|---|---|
| `GetAllUsers` | `GET /admin/users` | ✅ real | Paginated `?page&limit&search`. |
| `GetUserDetailsByAdmin` | `GET /admin/users/:id` | ✅ real | |
| `EditUserDetailsByAdmin` | `PATCH /admin/users/:id` | ✅ real | |
| `SuspendUser` | `PATCH /admin/users/:id/suspend` | ✅ real | |
| `UnsuspendUser` | `PATCH /admin/users/:id/unsuspend` | ✅ real | |
| `ModifyUserReferralStatus` | `PATCH /admin/users/:id/referral-status` | ✅ real | |
| `ViewUserReferralsByAdmin` | `GET /admin/users/:id/downlines` | ✅ real | |
| `RemoveReferralByAdmin` | `PATCH /admin/users/:id/referrer` | ⚠️ adapt | BE models *setting* the referrer; removal = set null. Confirm. |
| `AddReferralByAdmin` | `PATCH /admin/users/:id/referrer` | ⚠️ adapt | Same endpoint. |
| `GetAllSuspendedUsers` | `GET /admin/users` | ⚠️ adapt | Filter param (`?is_suspended=true`) — confirm the DTO supports it, otherwise FE-side filter. |
| `GetAllDefaultUsers` | `GET /admin/users` | ⚠️ adapt | "Default" = payment-defaulting. Needs a BE filter or derivation from acquisitions. |
| `GetSuspendedPaymentPlans` | `GET /acquisitions` | ⚠️ adapt | Admin acquisitions list; filter to suspended. |
| `GetSuspendedPaymentPlansSummary` | — | 🚧 provisional | `GET /acquisitions/summary`. No BE aggregate. |
| `Metrics`, `GetUserAnalytics` | — | 🚧 provisional | `GET /admin/users/metrics`. No BE. |
| `AdminSignupUser` | `POST /auth/signup` | ⚠️ adapt | Admin-created user; BE has no admin-side create. |
| `EditUserWalletDetailsByAdmin`, `EditWalletCommission` | — | 🚧 provisional | `PATCH /admin/users/:id/wallet`. No BE. |
| `UpdateUserTin`, `ClearUserTin` | `PATCH /admin/users/:id` | ⚠️ adapt | Fold into the user PATCH if `tin` is in the DTO. |
| `ExportUsersByFilter`, `ExportUsersWithAsset`, `ExportSuspendedUsers`, `ExportDefaultUsers`, `ExportSuspendedPaymentPlans` | — | 🚧 provisional | `GET /admin/users/export`. **No export endpoints anywhere on the BE** — see Exports note below. |

## Assets — `features/assets` (18 ops)

| Operation | REST | Status |
|---|---|---|
| `GetFeatureAdminAssets` | `GET /admin/assets` | ✅ real |
| `ViewAsset` | `GET /admin/assets/:id` | ✅ real |
| `CreateFlexAsset`, `CreateFullOwnershipAsset` | `POST /admin/assets` | ⚠️ adapt — one endpoint, offer type in body |
| `UpdateAsset` | `PATCH /admin/assets/:id` | ✅ real |
| `GetAssetIdByName`, `ViewAssetByName`, `ViewAssetOptionDataByName` | `GET /admin/assets?search=` | ⚠️ adapt — BE has no by-name lookup; search then select |
| `FeatureAssetStatistics`, `GetAssetAnalytics` | — | 🚧 `GET /admin/assets/statistics` |
| `GetAssetBlocks`, `CreateBlock`, `DeleteBlock`, `GetBlockPlots`, `CreatePlots`, `UpdatePlotSize`, `GetAvailablePlotsForAsset` | — | 🚧 `/admin/assets/:id/blocks[...]` — **no blocks/plots model on the BE at all** |

The BE's nested offer/size/plan endpoints (`PATCH /admin/assets/:assetId/offers/:offerType`,
`.../sizes`, `.../plans/:tenor`) have **no FE consumer yet** — the FE edits
these inline via `UpdateAsset`. Worth aligning during conversion.

## Roles & Permissions — `features/roles-permissions` (6 ops)

| Operation | REST | Status |
|---|---|---|
| `GetAllRoles` | `GET /admin/roles` | ✅ real |
| `GetAllPermissions` | `GET /admin/permissions` | ✅ real |
| `GetAllAdminWithRoles` | `GET /admin/admins` | ✅ real |
| `GetAdminWithRole` | `GET /admin/admins/:id` | ✅ real |
| `UpdateAdminRole` | `PATCH /admin/admins/:id/role` | ✅ real |
| `CreateRole` | — | 🚧 `POST /admin/roles` — BE roles look fixed (`admin\|subadmin\|moderator\|viewer`); confirm whether custom roles are supported |
| `InviteAdmin` (dashboard) | `POST /admin/create-subadmin` | ✅ real |

## Admin Logs — `features/admin-logs`

| Operation | REST | Status |
|---|---|---|
| `GetAllAdminLogs` | `GET /admin/audit-logs` | ✅ real |
| `ExportAdminLogs` | — | 🚧 provisional (see Exports) |

## Commission Config — `features/commission-config` (7 ops)

| Operation | REST | Status |
|---|---|---|
| `GetCommissionConfig` | `GET /admin/commission/config` | ✅ real |
| `UpdateCommissionConfig` | `POST /admin/commission/config` | ✅ real |
| `GetAssetCommissionOverrides` | `GET /admin/commission/overrides` | ✅ real |
| `UpsertAssetCommissionOverride` | `POST /admin/commission/overrides/asset` | ✅ real |
| `DeleteAssetCommissionOverride` | `DELETE /admin/commission/overrides/asset/:id` | ✅ real |
| `GetAssetCommissionOverride` | `GET /admin/commission/overrides` | ⚠️ adapt — no single-override read; filter the list |
| `GetCommissionConfigHistory` | — | 🚧 `GET /admin/commission/config/history` |

BE also exposes `GET /admin/commission/audit/:paymentPlanId` and
`POST /overrides/user` + `/overrides/asset-user`, none of which the FE uses yet.

## Associate Upgrade — `features/associate-upgrade` (12 ops)

| Operation | REST | Status |
|---|---|---|
| `GetAllUpgradeRequests` | `GET /admin/referrals/upgrades` | ✅ real — populated refs + `search` (tickets 13/14, 2026-08-13) |
| `ApproveUpgradeToAssociate`, `ApproveUpgradeToAssociatePro` | `PATCH /admin/referrals/upgrades/:id/approve` | ✅ real — **no body**; the target tier is already on the upgrade row |
| `DeclineUpgradeRequest` | `PATCH /admin/referrals/upgrades/:id/decline` | ✅ real |
| `ManualUpgradeToAssociatePro` | `POST /admin/users/:id/manual-upgrade` | ✅ real — `to_tier`, `fee_amount?`, `pay_commission?`, `reason` (min 20); no `paymentUrl` |
| `SearchUpgradeUsers` | `GET /admin/users?search=` | ✅ real — handler wired 2026-08-13 (ticket 2) |
| `GetActiveCoupons`, `CreateCoupon`, `UpdateCoupon`, `UpdateCouponStatus`, `DeleteCoupon` | `/admin/coupons` (GET/POST); `/admin/coupons/:code` (GET/PATCH/DELETE); `/admin/coupons/:code/status` (PATCH) | ✅ real — requires `manage_promotions` |
| `ExportUpgradeRequests` | — | 🚧 provisional (see Exports) |

## Requests — `features/requests` (6 ops)

| Operation | REST | Status |
|---|---|---|
| `GetAllClientRequests` | `GET /client-services/admin/requests` | ✅ real |
| `UpdateRequestStatus` | `PATCH /client-services/admin/requests/:id/status` | ✅ real |
| `SystemApproveLocationChangeRequest`, `SystemApproveDocumentChangeRequest`, `SystemApproveAssetUpdateRequest` | `PATCH /client-services/admin/requests/:id/status` | ⚠️ adapt — three ops collapse into the one status endpoint; the per-type side effects (actually applying the change) are BE-side and may not exist |
| `GetRequestStatistics` | — | 🚧 `GET /client-services/admin/requests/statistics` |

## Agency — `features/agency` (8 ops, all raw-string GraphQL today)

| Operation | REST | Status |
|---|---|---|
| `GetAgencies` | `GET /agencies` | ✅ real |
| `GetAgencyById` | `GET /agencies/:id` | ✅ real |
| `SuspendAgency` | `PATCH /agencies/:id/suspend` | ✅ real |
| `ReactivateAgency` | `PATCH /agencies/:id/activate` | ✅ real |
| `CreateAgency` | — | 🚧 `POST /agencies` |
| `GetAgencyDashboard` | — | 🚧 `GET /agencies/:id/dashboard` |
| `GetAgencyTransactions` | — | 🚧 `GET /agencies/:id/transactions` |
| `UpdateAgencyCommission` | — | 🚧 `PATCH /agencies/:id/commission` (or via commission overrides) |

## Marketplace — `features/marketplace` (7 ops)

| Operation | REST | Status |
|---|---|---|
| `ViewAllMarketplaceListings` | `GET /marketplace` | ⚠️ adapt — public endpoint; no admin view with moderation fields |
| `GetMarketplaceDashboard` | — | 🚧 `GET /admin/marketplace/statistics` |
| `ViewPendingMarketplaceApprovals` | — | 🚧 `GET /admin/marketplace/pending` |
| `SuspendMarketplaceListing` / `UnsuspendMarketplaceListing` | — | 🚧 `PATCH /admin/marketplace/:id/suspend` / `/unsuspend` |
| `ApproveMarketplacePurchase` / `RejectMarketplacePurchase` | — | 🚧 `PATCH /admin/marketplace/purchases/:id/approve` / `/reject` |

**There is no admin marketplace module on the BE** — only the public browse
endpoints plus a user-side cancel.

## Transactions — `features/transactions` + `features/asset-transactions`

Asset purchases (the screen at `/transactions/assets`) are **live**. Other transaction families (topup, document, commission) remain provisional.

| Operation | REST | Status | Notes |
|---|---|---|---|
| Asset purchase list | `GET /admin/transactions?type=purchase` | ✅ real | Filters: `status`, `payment_method`, `sales_type` (`ap`/`rap`/`dp`), `asset_type` (`flex`/`full-ownership`), `search`, `start_date`, `end_date`, `user`. No `admin_status`. |
| FO transaction detail | `GET /admin/fo/purchase/transactions/:id` | ✅ real | Land row includes the outright document sibling. Used by `/transactions/assets/:id`. |
| Approve transfer | `POST /admin/acquisitions/transactions/:txId/approve` | ✅ real | Empty body. BE routes by kind (flex or FO). Returns `{ payment_plan_id }` (flex) or `{ plan_id }` (FO). Permission `approve_payments`. Do **not** call on `fo_outright_doc`. |
| Decline transfer | `POST /admin/acquisitions/transactions/:txId/decline` | ✅ real | `{ reason }` min 20 chars. Outright land also declines the sibling doc tx. |
| FO land plan detail | `GET /admin/fo/purchase/payment-plans/:id` | ✅ real | Land plan with linked document plan. Used to drive suspend / allocate on the FO transaction page. |
| Suspend plan | `POST /admin/acquisitions/plans/:planId/suspend` | ✅ real | `{ reason }` min 20 chars. Replaces FO/flex/legacy acquisition suspend. |
| Unsuspend plan | `POST /admin/acquisitions/plans/:planId/unsuspend` | ✅ real | Empty body. Resets default count. Replaces FO/flex unsuspend. |
| Allocate plan | `POST /admin/acquisitions/plans/:planId/allocate` | ✅ real | `{ block, plot }` both required strings. Also used from the allocation modal for `assetType=full-ownership`. |
| `GetTopupTransaction`, `GetDocumentTransaction`, `GetCommissionTransactions` | `GET /admin/transactions?type=…` | ⚠️ adapt | Same list endpoint; those screens are not migrated. |
| `AdminTransactionDataPoint`, `GetAssetTransactionsStatistics` | — | 🚧 `GET /admin/transactions/statistics` | |

## Associates / Managers — `features/associates`, `features/associate-managers` (26 ops, 7,642 LOC) — 🚧 **entirely provisional**

"Associate manager" is a v1 concept with **no representation in `abode-be-v2`**
(the BE models associates only as a `UserTier` on the referral ladder). All 26
operations — manager dashboards, rosters, targets, ratings, onboarding attempts,
sales records, bulk assignment, pro groups — are provisional under
`/admin/associate-managers/*`.

Because this feature is large and entirely unbacked, consider migrating it
**last**: it is pure mock-to-mock work until the BE models managers.

## Dashboard / Analytics / Sales / Campaigns / Allocation — 🚧 **entirely provisional**

| Feature | Ops | Proposed base path |
|---|---|---|
| `dashboard` | `GetAdminDashboardDetails` | `GET /admin/dashboard` |
| `analytics` | `GetSalesAnalytics` (+2) | `GET /admin/analytics/sales` |
| `sales` | `GetSalesRecord`, `GetSalesStatusCounts`, `GetSalesDashboard`, `ExportSales` | `GET /admin/sales[...]` |
| `campaigns` | Engine: list/create/detail/dashboard/rewards/transition/invalidate/export/PDF. Tracker: GraphQL Campaign2000 | `GET/POST/PATCH /admin/campaigns*` |
| `allocation` | 7 ops (eligible clients, allocate/deallocate/reassign land, allocation email) | `/admin/allocation/*` — FO assign/reassign is `POST /admin/acquisitions/plans/:planId/allocate` |

None of these exist on the BE as GraphQL domains. Campaigns remain unbacked.
FO assign/reassign is the exception: it uses
`POST /admin/acquisitions/plans/:planId/allocate` (see Transactions above).

---

## Cross-cutting notes

### Exports (10+ operations)

Every `Export*` operation returns generated file data. **The BE has no export
endpoints** and its `DocumentModule` (PDF generation) exposes no routes at all.
Options to settle with BE: a per-resource `?format=csv` param, dedicated
`/admin/*/export` endpoints, or keep generating CSVs client-side from a
full-page fetch (what the mock does today).

**Decision (2026-08-13): client-side, per feature, no BE ticket.** Exports page
the existing list endpoint and build the CSV in the browser. This is honest work
— we hold every row we write — and it needs no new contract. The cost is bounded
by the page loop, so each export caps its page count and says in the UI when it
stopped short rather than handing over a silently truncated file. Revisit only
if an export needs data the list endpoint doesn't return.

### Statistics / dashboards

A recurring pattern: nearly every feature has a `*Statistics` / `*Dashboard`
operation with no BE counterpart. If the BE adds a single convention
(`GET /admin/{resource}/statistics`), roughly 10 provisional endpoints resolve
at once. Worth proposing as one design rather than ten tickets.

### Contract questions

- `POST /admin/assets` — does one endpoint take both flex and full-ownership via an offer-type discriminator, or are separate paths wanted?
- ~~`PATCH /admin/referrals/upgrades/:id/approve` — is the target tier in the body, or should approve be tier-specific?~~ **Answered 2026-08-13: neither.** The handler is `approve(@Param('id'), @CurrentUser())` — no body at all. `to_tier` is already on the upgrade row, set when the applicant submitted. One endpoint, empty body.
- ~~`GET /admin/users` — which filters does `AdminUserFilterDto` actually accept?~~ **Answered 2026-08-13** against the deployed spec: exactly `search`, `referral_status`, `is_suspended`, `page`, `limit`. Anything else is a hard 400 under `forbidNonWhitelisted`. Handler is wired (ticket 2).
- Are BE admin roles fixed (`admin|subadmin|moderator|viewer`), or can the FE create custom roles as `CreateRole` implies?
- Should `/agencies` gain create + dashboard + transactions, or is agency management out of scope for v2?
