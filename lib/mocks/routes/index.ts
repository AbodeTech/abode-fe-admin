import { registerRoutes } from '../router';
import { assetRoutes } from './assets';
import { authRoutes } from './auth';
import { commissionRoutes } from './commission';
import { upgradeRoutes } from './upgrades';
import { userRoutes } from './users';
import { withdrawalRoutes } from './withdrawals';
import { assetTransactionRoutes } from './asset-transactions';
import { requestRoutes } from './requests';
import { amarisRoutes } from './amaris';
import { flexLeadRoutes } from './flex-leads';
import { couponRoutes } from './coupons';
import { dashboardRoutes } from './dashboard';
import { marketplaceRoutes } from './marketplace';
import { meetingRoutes } from './meetings';
import { csManagerRoutes } from './cs-managers';
import { purchaseConfirmationRoutes } from './purchase-confirmations';

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
 * assets      — /admin/assets/*. Currently only the list route, added for the
 *               commission override pickers; the assets feature extends it
 *               rather than re-registering when it migrates.
 * withdrawals — /admin/withdrawals/*.
 * asset-transactions — GET /admin/transactions (serves purchase rows; other
 *               types return empty pages until their screens migrate),
 *               POST /admin/acquisitions/transactions/:txId/approve|decline,
 *               GET /admin/fo/purchase/transactions/:txId, FO land-plan
 *               GET /admin/fo/purchase/payment-plans/:id, and plan actions
 *               POST /admin/acquisitions/plans/:planId/suspend|unsuspend|allocate.
 *               The wallet
 *               family (/admin/wallets/*) is unclaimed.
 * upgrades    — /admin/referrals/upgrades/* and POST
 *               /admin/users/:id/manual-upgrade (claimed 2026-08-13 — the
 *               upgrade queue is where that UI lives). The remaining admin
 *               referral routes (referral-status, referrer, downlines) are
 *               unclaimed; they belong on a user detail page.
 * users       — GET /admin/users, added for the shared UserPicker. The users
 *               feature extends this table when it migrates rather than
 *               re-registering the path.
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
 *               attempts / mark-deed-delivered routes (nothing in this
 *               scoped UI reaches a plan_id to call them with).
 * purchase-confirmations — /admin/purchase-confirmations/* (list, counts,
 *               resolve-dispute, resend). No export route — the real
 *               endpoint streams CSV with @SkipTransform; the FE hook
 *               refuses in mock mode instead (matches flex-leads).
 * ============================================================ */

let registered = false;

export function ensureRoutesRegistered(): void {
  if (registered) return;
  registered = true;

  registerRoutes(authRoutes);
  registerRoutes(commissionRoutes);
  registerRoutes(assetRoutes);
  registerRoutes(upgradeRoutes);
  registerRoutes(userRoutes);
  registerRoutes(withdrawalRoutes);
  registerRoutes(assetTransactionRoutes);
  registerRoutes(requestRoutes);
  registerRoutes(amarisRoutes);
  registerRoutes(flexLeadRoutes);
  registerRoutes(couponRoutes);
  registerRoutes(dashboardRoutes);
  registerRoutes(marketplaceRoutes);
  registerRoutes(meetingRoutes);
  registerRoutes(csManagerRoutes);
  registerRoutes(purchaseConfirmationRoutes);
  // ...added per feature as it migrates
}
