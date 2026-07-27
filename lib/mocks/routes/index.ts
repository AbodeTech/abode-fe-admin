import { registerRoutes } from '../router';
import { assetRoutes } from './assets';
import { authRoutes } from './auth';
import { commissionRoutes } from './commission';
import { upgradeRoutes } from './upgrades';

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
 * upgrades    — /admin/referrals/upgrades/*. Note the other admin referral
 *               routes (/admin/users/:id/manual-upgrade, referral-status,
 *               referrer, downlines) are unclaimed — they belong to whichever
 *               feature builds that UI.
 * ============================================================ */

let registered = false;

export function ensureRoutesRegistered(): void {
  if (registered) return;
  registered = true;

  registerRoutes(authRoutes);
  registerRoutes(commissionRoutes);
  registerRoutes(assetRoutes);
  registerRoutes(upgradeRoutes);
  // ...added per feature as it migrates
}
