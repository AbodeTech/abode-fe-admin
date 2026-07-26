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
| `associate-upgrade` | ✅ Complete — upgrades, approve/decline, manual upgrade |
| `requests` | ✅ Complete — admin list + status change |
| `agency` | ⚠️ Partial — list/detail/activate/suspend only; no create, no dashboard, no transactions |
| `auth` | ✅ Admin login/me/change-password |
| `marketplace` | ⚠️ Partial — public list/detail/cancel; **no admin moderation** |
| `associates` (managers) | 🚧 **None** — 26 operations, zero BE |
| `transactions` | 🚧 **None** — 19 operations, zero BE admin transactions API |
| `dashboard` | 🚧 None |
| `analytics` | 🚧 None |
| `campaigns` | 🚧 None |
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
| `GetAllUpgradeRequests` | `GET /admin/referrals/upgrades` | ✅ real |
| `ApproveUpgradeToAssociate`, `ApproveUpgradeToAssociatePro` | `PATCH /admin/referrals/upgrades/:id/approve` | ⚠️ adapt — one endpoint, tier in body |
| `DeclineUpgradeRequest` | `PATCH /admin/referrals/upgrades/:id/decline` | ✅ real |
| `ManualUpgradeToAssociatePro` | `POST /admin/users/:id/manual-upgrade` | ✅ real |
| `SearchUpgradeUsers` | `GET /admin/users?search=` | ⚠️ adapt |
| `GetActiveCoupons`, `CreateCoupon`, `UpdateCoupon`, `UpdateCouponStatus`, `DeleteCoupon` | `/promotions/coupons` (GET/POST/PATCH/DELETE) | ✅ real — `UpdateCouponStatus` folds into `PATCH /promotions/coupons/:id` |
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

## Transactions — `features/transactions` (19 ops) — 🚧 **entirely provisional**

The BE has `GET /wallet/transactions` (a user's own) and **no admin
transactions API whatsoever**. Every operation here is provisional:

| Operations | Proposed REST |
|---|---|
| `GetTopupTransaction`, `GetWithdrawalTransaction`, `GetDocumentTransaction`, `GetCommissionTransactions`, `GetAssetTransaction` | `GET /admin/transactions?type=topup\|withdrawal\|document\|commission\|asset` |
| `ApproveTransaction`, `DeclineTransaction`, `ApprovePaystackTransaction`, `ApproveAssetTransaction`, `DeclineAssetTransaction`, `DeclineDocumentTransaction` | `PATCH /admin/transactions/:id/approve` / `/decline` (type in body) |
| `ProcessCommission`, `ProcessReceipt` | `POST /admin/transactions/:id/process` |
| `AdminTransactionDataPoint`, `GetAssetTransactionsStatistics` | `GET /admin/transactions/statistics` |
| `GetUsersWithZeroBalance` | `GET /admin/users?balance=0` |
| `Export*Transactions` (×3) | See Exports |

This is the **single largest BE ask** — a core admin surface with no backend.

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
| `campaigns` | 8 ops (raffle, hamper, Campaign2000, recruitment analytics, leaderboards) | `GET /admin/campaigns/*` |
| `allocation` | 7 ops (eligible clients, allocate/deallocate/reassign land, allocation email) | `/admin/allocation/*` |

None of these exist on the BE. Campaigns and allocation are whole domains, not
just missing endpoints.

---

## Cross-cutting notes

### Exports (10+ operations)

Every `Export*` operation returns generated file data. **The BE has no export
endpoints** and its `DocumentModule` (PDF generation) exposes no routes at all.
Options to settle with BE: a per-resource `?format=csv` param, dedicated
`/admin/*/export` endpoints, or keep generating CSVs client-side from a
full-page fetch (what the mock does today).

### Statistics / dashboards

A recurring pattern: nearly every feature has a `*Statistics` / `*Dashboard`
operation with no BE counterpart. If the BE adds a single convention
(`GET /admin/{resource}/statistics`), roughly 10 provisional endpoints resolve
at once. Worth proposing as one design rather than ten tickets.

### Contract questions

- `POST /admin/assets` — does one endpoint take both flex and full-ownership via an offer-type discriminator, or are separate paths wanted?
- `PATCH /admin/referrals/upgrades/:id/approve` — is the target tier in the body, or should approve be tier-specific?
- `GET /admin/users` — which filters does `AdminUserFilterDto` actually accept? The FE needs at minimum `search`, `is_suspended`, and a defaulting flag. Note `forbidNonWhitelisted` makes a wrong param a hard 400.
- Are BE admin roles fixed (`admin|subadmin|moderator|viewer`), or can the FE create custom roles as `CreateRole` implies?
- Should `/agencies` gain create + dashboard + transactions, or is agency management out of scope for v2?
