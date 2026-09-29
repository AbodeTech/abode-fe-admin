import { registerRoutes } from '../router';
import { allocationRoutes } from './allocation';
import { assetRoutes } from './assets';
import { authRoutes } from './auth';
import { commissionRoutes } from './commission';
import { upgradeRoutes } from './upgrades';
import { userRoutes } from './users';
import { withdrawalRoutes } from './withdrawals';
import { associateRoutes } from './associates';
import { roleRoutes } from './roles';
import { associateProTrackerRoutes } from './associate-pro-tracker';
import { assetTransactionRoutes } from './asset-transactions';
import { salesRoutes } from './sales';
import { requestRoutes } from './requests';
import { amarisRoutes } from './amaris';
import { flexLeadRoutes } from './flex-leads';
import { couponRoutes } from './coupons';
import { dashboardRoutes } from './dashboard';
import { marketplaceRoutes } from './marketplace';
import { meetingRoutes } from './meetings';
import { csManagerRoutes } from './cs-managers';
import { financialOfficerRoutes } from './financial-officers';
import { purchaseConfirmationRoutes } from './purchase-confirmations';
import { campaignEngineRoutes } from './campaigns-engine';
import { paymentPlanRoutes } from './payment-plans';
import { agencyRoutes } from './agency';
import { academyRoutes } from './academy';
import { companyEventsRoutes } from './company-events';
import { estateUpdateRoutes } from './estate-updates';
import { landConfigurationRoutes } from './land-configuration';
import { sqmInventoryRoutes } from './sqm-inventory';
import { assetCostRoutes } from './asset-costs';
import { estateProfitabilityRoutes } from './estate-profitability';
import { sellingChargesRoutes } from './selling-charges';
import { assetAnalyticsRoutes } from './asset-analytics';
import { assetSubscribersRoutes } from './asset-subscribers';
import { inventoryReconciliationRoutes } from './inventory-reconciliation';
import { siteSetupRoutes } from './site-setup';
import { courseRoutes } from './courses';
import { divisionRoutes } from './division';
import { standingRoutes } from './standing';

/* ============================================================
 * Route registration. Importing this module (via lib/mocks/index.ts)
 * registers every domain's routes exactly once.
 *
 * A domain file is added here as its feature is migrated off GraphQL —
 * see docs/REST-ENDPOINT-MAP.md for the operation → endpoint mapping.
 *
 * Registration throws on a duplicate "METHOD /path", so shared paths need a
 * single owning domain. Record ownership here as it's decided.
 *
 * Ownership
 * ---------
 * auth        — /auth/*, including the shared POST /auth/refresh and POST
 *               /auth/logout (both are user+admin endpoints on the BE; the
 *               admin app only ever calls them for an admin session).
 * commission  — /admin/commission/* (config, overrides, audit, transactions).
 * assets      — /admin/assets/*. Started as just the list route (for the
 *               commission override pickers) and has since grown with the
 *               assets feature to cover: the list; the full offer/size/plan
 *               tree (`GET .../:id`, offers, sizes, plans — the old versioned
 *               plan-price/price-step-schedule routes layered on top of this
 *               tree were retired in favour of the real, asset-wide Selling
 *               Charges module, see selling-charges.ts below); blocks and
 *               plots (`GET/POST .../blocks`, `.../plots` + `/bulk`); and the
 *               asset-wide plot inventory (`GET .../plots`, `.../plots/summary`
 *               — 🚧 entirely provisional. Re-verified against real staging
 *               source: `.../plots` DOES exist for real, on the field-staff
 *               site-setup controller — just shaped nothing like this mock
 *               (see plot-inventory.schema.ts's header for the confirmed real
 *               shape); `.../plots/summary` has no real route at all). GET
 *               .../:assetId/analytics is claimed separately by
 *               asset-analytics.ts (see below), not this file.
 * withdrawals — /admin/withdrawals/*.
 * asset-transactions — GET /admin/transactions (serves purchase rows; other
 *               types return empty pages until their screens migrate),
 *               GET /admin/transactions/documents (the document-fee ledger),
 *               /admin/acquisitions/flex/*, POST
 *               /admin/acquisitions/transactions/:txId/approve|decline, GET
 *               /admin/fo/purchase/transactions/:txId, FO land-plan
 *               GET/PATCH/POST under /admin/fo/purchase/payment-plans/:id, and
 *               plan actions POST
 *               /admin/acquisitions/plans/:planId/suspend|unsuspend|allocate.
 *               The wallet family (/admin/wallets/*) is unclaimed.
 * upgrades    — /admin/referrals/upgrades/* and POST
 *               /admin/users/:id/manual-upgrade (claimed 2026-08-13 — the
 *               upgrade queue is where that UI lives). The remaining admin
 *               referral routes (referral-status, referrer, downlines) are
 *               unclaimed; they belong on a user detail page.
 * allocation  — GET /admin/allocation/eligible-clients,
 *               GET /admin/allocation/assets/:asset_id/available-plots,
 *               POST /admin/allocation/payment-plans/:plan_id/allocate,
 *               .../deallocate, .../reassign, .../send-email,
 *               GET .../history. Only the assets dropdown and CSV export
 *               are still GraphQL — see lib/mocks/handlers/allocation.ts.
 * sales       — GET /admin/sales, GET /admin/sales/dashboard,
 *               GET /admin/sales/analytics/{kpis,by-asset,timeline}. The two
 *               streaming CSV exports (GET /admin/sales/export[/full]) are
 *               NOT mocked — the admin FE builds its export client-side off
 *               the list endpoint instead (see
 *               features/sales/components/SalesExport.tsx), so nothing in
 *               this app calls those two BE routes.
 * users       — GET /admin/users, /users/:id, /:id/stats|kyc|bank-details|assets|
 *               transactions|referrals|associate-pro|campaign-standings,
 *               /overview, /analytics.
 * people.ts   — not a domain: the shared person fixtures every route populates
 *               refs from, so one id means one person across all of them.
 * dashboard   — GET /admin/dashboard/kpis, top-products, top-associates.
 * marketplace — /admin/marketplace/* (listings, pending-approvals, stats,
 *               approve/reject/suspend/unsuspend). List rows carry bare
 *               seller/buyer/asset ids (the BE's list query doesn't
 *               populate); the four action responses populate seller+asset
 *               only, never buyer — mirrors `findById` exactly (ticket #27).
 * meetings    — /admin/meetings* (CRUD, toggle-active, verifications).
 * cs-managers — /admin/cs-managers/* (role, targets, unassigned customers)
 *               and GET /admin/admins, claimed narrowly here as the admin
 *               picker source — roles-permissions still calls GraphQL's
 *               getAllAdminWithRoles and should extend this route rather
 *               than re-registering when it migrates. No dashboard route
 *               (CSM-21/CSM-39 don't exist on the BE yet, committed or not
 *               — ticket in docs/BACKEND-REQUESTS.md) and no onboarding-
 *               attempts routes (nothing in this
 *               scoped UI reaches a plan_id to call them with).
 * financial-officers — /admin/financial-officers/* (role, targets, officer and
 *               team dashboards, recovery-plan detail + reassign). 🚧 Provisional:
 *               no BE module exists — ticket 33 in docs/BACKEND-REQUESTS.md.
 * payment-plans — GET /admin/payment-plans, /summary, /export. Distinct from
 *               CS-manager plan actions under
 *               GET/POST /admin/payment-plans/:plan_id/*.
 * agency      — /admin/agencies/* (list, detail, create, update, suspend,
 *               reactivate, delete, change-owner, members, commissions) and
 *               PATCH /admin/users/:user_id/org, claimed here rather than by
 *               users: it is the agency membership controller on the BE, and
 *               the only screens calling it are the agency ones. No
 *               commissions/export route — the real one streams CSV with
 *               @SkipTransform (matches flex-leads).
 * purchase-confirmations — /admin/purchase-confirmations/* (list, counts,
 *               resolve-dispute, resend). No export route — the real
 *               endpoint streams CSV with @SkipTransform; the FE hook
 *               refuses in mock mode instead (matches flex-leads).
 * company-events — /admin/company-events/* (create/list/detail, status
 *               transitions, eligible-clients, save/remove allocations,
 *               list allocations, analytics, list registrations). Real
 *               backend module as of 2026-09-11 (PR #67 "allocation-event"),
 *               extended by PR #69 "company-events-offline" (`GET .../allocations`,
 *               `GET .../analytics`, `GET .../registrations`) and PR #70
 *               "company-events-status-onboarding" (`PATCH .../status`,
 *               `POST .../publish`, `POST .../close`) — every route here
 *               mirrors `company-events-admin.controller.ts` field-for-field
 *               now, not a forward guess or mock-only shape. Registration
 *               rows are seeded directly (not served through
 *               `event-registration.controller.ts`'s own public route,
 *               which is unclaimed here) and check-in/offline sync
 *               (`checkin/event-checkin.controller.ts`) has no FE work
 *               consuming it yet, so no route is claimed for either.
 * estate-updates — /admin/assets/:id/updates* (list, detail, create, edit,
 *               publish, archive). Carved out of the assets domain's
 *               /admin/assets/* claim; no path collides because the segment
 *               after :id is the literal "updates" (assets uses "offers" /
 *               "blocks" there).
 * land-configuration — /admin/assets/:assetId/land-configuration* (read,
 *               versioned complete-replace, history list/detail). Real module
 *               confirmed on abode-be-v2 staging (PR #82, "phase-1") — mirrors
 *               `LandConfigurationService` field-for-field, not a forward
 *               guess. Carved out of the assets domain's claim the same way
 *               estate-updates is; the segment after :assetId is the literal
 *               "land-configuration".
 * sqm-inventory — /admin/assets/:assetId/sqm-inventory* (position ledger,
 *               reconciliation dry run, activate). Real module, same PR —
 *               mirrors `AssetSqmController`/`SqmInventoryService`/
 *               `SqmActivationService` field-for-field. The segment after
 *               :assetId is the literal "sqm-inventory".
 * asset-costs — /admin/assets/:assetId/costs* (list, detail, create,
 *               items catalogue + allocation rules, obligations, stage
 *               events, coverage, impact-preview). Real module confirmed on
 *               abode-be-v2 staging (PR #82, "phase-1") — mirrors
 *               `AssetCostController`/`AssetCostEventController` field-for-
 *               field, not a forward guess. `/admin/cost-entries/*` is a
 *               separate top-level namespace this file also owns (matches
 *               the real backend's own controller split). The old
 *               estate-wide "profitability-basis" singleton this section
 *               used to note is gone — allocation is per cost item now, via
 *               each item's own `allocation-rule` sub-resource.
 * estate-profitability — GET /admin/assets/:assetId/profitability(/matrix|
 *               /drill-down). Real module, same PR. Reads asset-costs.ts,
 *               land-configuration.ts, and asset-analytics.ts's mock stores
 *               in-process (not HTTP) to compute the calculation; `revenue`/
 *               `received` in the response still come from
 *               asset-analytics.ts's `total_inventory_value`/`total_realised`
 *               fixture. The segment after :assetId is the literal
 *               "profitability".
 * selling-charges — /admin/assets/:assetId/selling-charges(/history). Real
 *               module, same PR — mirrors `SellingChargeController`/
 *               `SellingChargeService` field-for-field, including a genuine
 *               backend bug: the never-configured GET response is
 *               `{data: null, message}`, not a plain `null` (see the file's
 *               own header). Replaced the abandoned, never-wired per-plan
 *               "plan price versioning" design entirely. No
 *               `expected_version` guard on the PUT — a real gap, not an
 *               omission here. The segment after :assetId is the literal
 *               "selling-charges".
 * asset-analytics — GET /admin/assets/:assetId/analytics. A real abode-be-v2
 *               module exists for this ("ticket 17b, now live" per
 *               asset-analytics.schema.ts), but it was never mocked here, so
 *               the Performance tab 404'd in mock-mode dev until this file —
 *               delete it once mock mode can point at the real module
 *               instead. Claimed separately from assets.ts's /admin/assets/*
 *               (list-only) claim; the segment after :assetId is the literal
 *               "analytics".
 * inventory-reconciliation — GET /admin/assets/:assetId/inventory-reconciliation.
 *               Entirely provisional. Joins assets.ts's plot store and
 *               asset-analytics.ts's size breakdown in-process by `size` — a
 *               deliberately partial (by-size, not by-product) reconciliation
 *               between the physical and commercial sides of Live Inventory.
 *               The segment after :assetId is the literal
 *               "inventory-reconciliation".
 * courses     — /admin/courses/* and /admin/academy-settings/*. Entirely
 *               provisional — abode-be-v2 has no courses model yet. Covers
 *               design screens 1–2 (list, overview) only; modules/quiz/
 *               learners (screens 3, 5, 6, 7) are unbuilt.
 * field-staff — unclaimed. /admin/field-staff/*, /admin/field-scorecards/*,
 *               /admin/field-submissions/*, /admin/field-performance/* and
 *               /admin/assets/:id/site-setup are integrated against the real
 *               BE (abode-be-v2 phase-1) and have no mocks yet, so the Field
 *               Performance pages 404 in mock mode.
 * standing    — /admin/standing/* (config, summary, members). Membership is
 *               derived from a holdings fixture rather than stored, so moving
 *               a threshold in the editor moves buyers on the next read.
 * division    — /admin/division/* (config, summary, members). The associate
 *               season ladder. Two seasons of fixtures (2026 live, 2025
 *               closed) so the year picker demonstrably changes the answer,
 *               and one opted-out associate so the "Hidden" marker has a case.
 * asset-subscribers — GET /admin/assets/:assetId/subscribers. A real
 *               abode-be-v2 module exists (asset-subscribers.schema.ts cites
 *               its DTOs), but — like asset-analytics.ts before it — it was
 *               never mocked, so the Customers tab always 404'd in mock-mode
 *               dev. The CSV export sibling is deliberately not mocked; the
 *               FE hook already refuses in mock mode itself. The segment
 *               after :assetId is the literal "subscribers".
 * site-setup  — GET/PUT /admin/assets/:assetId/boundary, GET .../site-setup.
 *               REAL module, confirmed against `AssetSiteSetupController`/
 *               `SiteSetupService` in `field-staff/site-setup` — not a forward
 *               guess. Only the boundary + fencing read/write built here;
 *               `.../plots`, `.../field-history`, `.../field-costs`, and
 *               `.../field-performance` are also real on that same controller
 *               but unclaimed — no FE screen calls them yet. "Roads and
 *               services" (non-saleable land) is a DIFFERENT real module
 *               (asset/land — see land-configuration.ts), not this one.
 * ============================================================ */

let registered = false;

export function ensureRoutesRegistered(): void {
  if (registered) return;

  registerRoutes(authRoutes);
  registerRoutes(commissionRoutes);
  registerRoutes(assetRoutes);
  registerRoutes(upgradeRoutes);
  registerRoutes(userRoutes);
  registerRoutes(withdrawalRoutes);
  registerRoutes(associateRoutes);
  registerRoutes(roleRoutes);
  registerRoutes(associateProTrackerRoutes);
  registerRoutes(assetTransactionRoutes);
  registerRoutes(allocationRoutes);
  registerRoutes(salesRoutes);
  registerRoutes(requestRoutes);
  registerRoutes(amarisRoutes);
  registerRoutes(flexLeadRoutes);
  registerRoutes(couponRoutes);
  registerRoutes(dashboardRoutes);
  registerRoutes(marketplaceRoutes);
  registerRoutes(meetingRoutes);
  registerRoutes(csManagerRoutes);
  registerRoutes(financialOfficerRoutes);
  registerRoutes(purchaseConfirmationRoutes);
  registerRoutes(campaignEngineRoutes);
  registerRoutes(paymentPlanRoutes);
  registerRoutes(agencyRoutes);
  registerRoutes(academyRoutes);
  registerRoutes(companyEventsRoutes);
  registerRoutes(estateUpdateRoutes);
  // `courseRoutes` was registering AFTER the `registered = true` below, which
  // defeated the retry the comment promises: a throw in it left the flag set
  // and every later attempt short-circuited. Moved above the flag with the rest.
  registerRoutes(courseRoutes);
  registerRoutes(standingRoutes);
  registerRoutes(divisionRoutes);
  registerRoutes(landConfigurationRoutes);
  registerRoutes(sqmInventoryRoutes);
  registerRoutes(assetCostRoutes);
  registerRoutes(estateProfitabilityRoutes);
  registerRoutes(sellingChargesRoutes);
  registerRoutes(assetAnalyticsRoutes);
  registerRoutes(inventoryReconciliationRoutes);
  registerRoutes(assetSubscribersRoutes);
  registerRoutes(siteSetupRoutes);

  // Only mark done after every domain registered — a throw mid-way must allow retry.
  registered = true;
  // ...added per feature as it migrates
}
