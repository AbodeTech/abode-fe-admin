import { registerRoutes } from '../router';
import { allocationRoutes } from './allocation';
import { assetRoutes } from './assets';
import { authRoutes } from './auth';
import { commissionRoutes } from './commission';
import { upgradeRoutes } from './upgrades';
import { withdrawalRoutes } from './withdrawals';
import { assetTransactionRoutes } from './asset-transactions';
import { salesRoutes } from './sales';

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
 * commission  — /admin/commission/* (config, overrides, audit).
 * assets      — /admin/assets/*. Currently only the list route, added for the
 *               commission override pickers; the assets feature extends it
 *               rather than re-registering when it migrates.
 * withdrawals — /admin/withdrawals/*.
 * asset-transactions — GET /admin/transactions (serves purchase rows; other
 *               types return empty pages until their screens migrate) and
 *               /admin/acquisitions/flex/*. The wallet family
 *               (/admin/wallets/*) is unclaimed.
 * upgrades    — /admin/referrals/upgrades/*. Note the other admin referral
 *               routes (/admin/users/:id/manual-upgrade, referral-status,
 *               referrer, downlines) are unclaimed — they belong to whichever
 *               feature builds that UI.
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
 * ============================================================ */

let registered = false;

export function ensureRoutesRegistered(): void {
  if (registered) return;
  registered = true;

  registerRoutes(authRoutes);
  registerRoutes(commissionRoutes);
  registerRoutes(assetRoutes);
  registerRoutes(upgradeRoutes);
  registerRoutes(withdrawalRoutes);
  registerRoutes(assetTransactionRoutes);
  registerRoutes(allocationRoutes);
  registerRoutes(salesRoutes);
  // ...added per feature as it migrates
}
