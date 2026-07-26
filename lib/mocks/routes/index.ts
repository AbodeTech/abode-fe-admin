import { registerRoutes } from '../router';

/* ============================================================
 * Route registration. Importing this module (via lib/mocks/index.ts)
 * registers every domain's routes exactly once.
 *
 * A domain file is added here as its feature is migrated off GraphQL —
 * see docs/REST-ENDPOINT-MAP.md for the operation → endpoint mapping.
 *
 * Registration throws on a duplicate "METHOD /path", so shared paths need a
 * single owning domain. Record ownership here as it's decided.
 * ============================================================ */

let registered = false;

export function ensureRoutesRegistered(): void {
  if (registered) return;
  registered = true;

  // registerRoutes(usersRoutes);
  // registerRoutes(assetsRoutes);
  // ...added per feature as it migrates
  void registerRoutes;
}
