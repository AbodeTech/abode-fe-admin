import { dispatchMockRoute, type MockRequest } from './router';
import { ensureRoutesRegistered } from './routes';

export { isMockApiEnabled } from './config';
export { mockDelay } from './delay';
export { MockHttpError, registerRoutes } from './router';
export type { MockRequest, MockRouteContext, MockRoutes } from './router';

/* -------------------- legacy GraphQL mock transport --------------------
 * Kept alive so features that haven't migrated off execute()/executeRaw()
 * yet keep working in mock mode. Deleted alongside lib/gql and
 * lib/graphql-client at teardown, once every feature is on REST routes.
 * ---------------------------------------------------------------------- */
export { resolveMockGraphql } from './resolve';

/**
 * Entry point used by lib/api-client.ts when mock mode is on. Routes are
 * registered lazily on first request.
 */
export function dispatchMockRequest(req: MockRequest): Promise<unknown> {
  ensureRoutesRegistered();
  return dispatchMockRoute(req);
}
