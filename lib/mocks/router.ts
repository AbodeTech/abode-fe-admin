import { mockDelay } from './delay';

/* ============================================================
 * Mock REST router.
 *
 * Replaces the GraphQL operation-name dispatch (lib/mocks/resolve.ts).
 * Routes are keyed by "METHOD /path" with `:param` segments, e.g.
 * "GET /admin/users/:id". Registered per domain in lib/mocks/routes/*.
 *
 * Handlers return the **inner payload only** — the thing the BE would put
 * in the envelope's `data`. lib/api-client.ts parses it with the caller's
 * Zod schema, so a fixture that drifts from a schema fails loudly in dev.
 *
 * Paginated endpoints (consumed via apiGetPaged) return
 * `{ data: rows, meta }` — see routes/util.ts `paged()`.
 * ============================================================ */

export type MockRequest = {
  method: string;
  path: string;
  query: Record<string, unknown>;
  body: unknown;
};

export type MockRouteContext = {
  params: Record<string, string>;
  query: Record<string, unknown>;
  body: unknown;
};

export type MockRouteHandler = (ctx: MockRouteContext) => unknown | Promise<unknown>;

/** Route table: { "GET /admin/users": handler, "GET /admin/users/:id": handler }. */
export type MockRoutes = Record<string, MockRouteHandler>;

/**
 * Error a mock route throws to simulate a BE failure. The api client turns it
 * into an ApiClientError with the given status, so error paths (401 redirect,
 * 4xx handling, toasts) are exercisable in mock mode.
 */
export class MockHttpError extends Error {
  readonly name = 'MockHttpError';
  constructor(
    readonly statusCode: number,
    message: string,
    readonly code?: string
  ) {
    super(message);
  }
}

const registry: MockRoutes = {};

export function registerRoutes(routes: MockRoutes): void {
  for (const [key, handler] of Object.entries(routes)) {
    if (registry[key]) {
      throw new Error(`Mock API: duplicate route registration for "${key}"`);
    }
    registry[key] = handler;
  }
}

function normalizePath(path: string): string {
  const withoutQuery = path.split('?')[0];
  const trimmed = withoutQuery.replace(/\/+$/, '');
  if (!trimmed) return '/';
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
}

type Match = { handler: MockRouteHandler; params: Record<string, string> };

function matchRoute(method: string, path: string): Match | null {
  const target = normalizePath(path);
  const exact = registry[`${method} ${target}`];
  if (exact) return { handler: exact, params: {} };

  const targetSegments = target.split('/');
  for (const [key, handler] of Object.entries(registry)) {
    const [routeMethod, routePath] = key.split(' ');
    if (routeMethod !== method || !routePath.includes(':')) continue;

    const routeSegments = routePath.split('/');
    if (routeSegments.length !== targetSegments.length) continue;

    const params: Record<string, string> = {};
    const matched = routeSegments.every((segment, i) => {
      if (segment.startsWith(':')) {
        params[segment.slice(1)] = decodeURIComponent(targetSegments[i]);
        return true;
      }
      return segment === targetSegments[i];
    });

    if (matched) return { handler, params };
  }

  return null;
}

export async function dispatchMockRoute(req: MockRequest): Promise<unknown> {
  const match = matchRoute(req.method, req.path);
  if (!match) {
    throw new MockHttpError(
      404,
      `Mock API: no route registered for "${req.method} ${normalizePath(req.path)}"`,
      'MOCK_ROUTE_NOT_FOUND'
    );
  }

  await mockDelay();

  return match.handler({
    params: match.params,
    query: req.query,
    body: req.body,
  });
}
