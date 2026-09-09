import axios, { type InternalAxiosRequestConfig } from 'axios';
import { z, ZodError } from 'zod';

import { useAuthStore } from '@/store/auth-store';
import {
  clearAuthCookies,
  getAccessToken,
  getRefreshToken,
  setSessionCookies,
} from '@/lib/utils/cookies';
import { dispatchMockRequest, isMockApiEnabled, MockHttpError } from '@/lib/mocks';

/* ============================================================
 * REST API client — the single transport for the app.
 *
 * Component → feature hook → apiGet/apiPost/... → axios → BE (/api/v1)
 *
 * - The BE wraps every response in { success, message, data, meta? }.
 *   That envelope is modeled HERE, once. Helpers hand back only the
 *   inner payload, validated by the caller's Zod schema.
 * - In mock mode (NEXT_PUBLIC_USE_MOCKS=true) requests never hit the
 *   network — they dispatch to lib/mocks/routes/* keyed by "METHOD /path".
 *
 * See guidelines/Data_Fetching_Guidelines.md.
 * ============================================================ */

const API_ENDPOINT = process.env.NEXT_PUBLIC_API_BASE_URL || '';

if (!API_ENDPOINT && !isMockApiEnabled()) {
  console.error('NEXT_PUBLIC_API_BASE_URL is not defined');
}

export const apiClient = axios.create({
  baseURL: API_ENDPOINT,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  // An explicit per-request token (RequestConfig.token) wins. The password
  // recovery flow runs logged-out and carries its own scoped bearer token.
  if (config.headers.Authorization) return config;

  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* -------------------- refresh, single-flight -------------------- */

const REFRESH_PATH = '/auth/refresh';
const ADMIN_LOGIN_PATH = '/auth/admin/login';

type RetryableConfig = InternalAxiosRequestConfig & {
  /** Set once a request has already been retried with a refreshed token. */
  _retried?: boolean;
  /** Set when the caller supplied its own token — refreshing it is meaningless. */
  _noRefresh?: boolean;
};

/**
 * Bare client for the refresh call itself. It must NOT carry the interceptors
 * below, or a failing refresh would recurse into refreshing.
 */
const refreshClient = axios.create({
  baseURL: API_ENDPOINT,
  headers: { 'Content-Type': 'application/json' },
});

/** Only the fields the interceptor needs; the BE also returns `admin`. */
const RefreshResultSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
});

let refreshPromise: Promise<string> | null = null;

function endSession(): void {
  clearAuthCookies();
  useAuthStore.getState().logout();
  if (typeof window !== 'undefined' && window.location.pathname !== '/signin') {
    window.location.href = '/signin';
  }
}

/**
 * Trade the refresh token for a fresh pair, returning the new access token.
 *
 * The BE rotates refresh tokens — redeeming one burns it and issues a
 * replacement. So concurrent 401s MUST share a single in-flight call. Without
 * this lock, a page that fires five queries would send five refreshes with the
 * same token: the first succeeds, the other four hit "Invalid or expired
 * session", and the admin is logged out anyway.
 */
function refreshSession(): Promise<string> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token stored');

    const res = await refreshClient.post(REFRESH_PATH, { refreshToken });
    const tokens = unwrap(RefreshResultSchema, res.data).data;

    setSessionCookies(tokens);
    return tokens.accessToken;
  })();

  // Clear the slot regardless of outcome so a later 401 can try again.
  void refreshPromise.catch(() => undefined).finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

/**
 * The REST BE returns a real 401 for expired/missing/invalid tokens, so the
 * GraphQL-era error sniffing (extensions.code === 'UNAUTHENTICATED', message
 * contains "unauthorized") is gone — a status check is sufficient.
 *
 * Note: 403 is deliberately NOT handled here. The BE's PasswordChangeGuard
 * 403s every admin route while `must_change_password` is set; that is a
 * routing concern (see features/auth), not a dead session.
 */
apiClient.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!axios.isAxiosError(error) || typeof window === 'undefined') {
      return Promise.reject(error);
    }

    const original = error.config as RetryableConfig | undefined;
    if (error.response?.status !== 401 || !original) {
      return Promise.reject(error);
    }

    const path = original.url ?? '';

    // These 401s are not a dead session, so ending one would be wrong:
    //  - login: bad credentials. Bouncing would wipe the form and its message.
    //  - _noRefresh: a logged-out flow carrying its own scoped token (password
    //    recovery). There is no session to end, and the form needs to say the
    //    reset code expired rather than silently redirect to /signin.
    if (path.includes(ADMIN_LOGIN_PATH) || original._noRefresh) {
      return Promise.reject(error);
    }

    // Refresh itself failed, or we already retried once. Nothing left to try.
    if (path.includes(REFRESH_PATH) || original._retried) {
      endSession();
      return Promise.reject(error);
    }

    try {
      const accessToken = await refreshSession();
      original._retried = true;
      original.headers.Authorization = `Bearer ${accessToken}`;
      return await apiClient.request(original);
    } catch {
      endSession();
      return Promise.reject(error);
    }
  }
);

/* -------------------- error contract -------------------- */

/**
 * Thrown for any REST request that fails — transport (network / non-2xx) or a
 * response that doesn't match the caller's Zod schema.
 */
export class ApiClientError extends Error {
  readonly name = 'ApiClientError';
  readonly statusCode: number | null;
  /**
   * The BE's error discriminator. In practice this is the Nest exception name
   * ("UnauthorizedException", "Bad Request") from the envelope's `error` field
   * — coarse, so branch on `statusCode` rather than on this. `SCHEMA_MISMATCH`
   * is set locally when a response fails its Zod schema.
   */
  readonly code: string | null;
  readonly method: string | null;
  readonly path: string | null;
  /** BE `message` normalized — class-validator failures arrive as string[]. */
  readonly messages: readonly string[];
  readonly details: unknown;

  constructor(opts: {
    messages: readonly string[];
    statusCode?: number | null;
    code?: string | null;
    method?: string | null;
    path?: string | null;
    details?: unknown;
  }) {
    super(opts.messages[0] ?? 'Request failed');
    this.statusCode = opts.statusCode ?? null;
    this.code = opts.code ?? null;
    this.method = opts.method ?? null;
    this.path = opts.path ?? null;
    this.messages = opts.messages;
    this.details = opts.details ?? null;
  }

  /** "GET /admin/users" — useful as a telemetry dimension. */
  get endpoint(): string | null {
    return this.method && this.path ? `${this.method} ${this.path}` : null;
  }
}

export function isAuthError(error: unknown): boolean {
  return error instanceof ApiClientError && error.statusCode === 401;
}

export function isClientError(error: unknown): boolean {
  if (!(error instanceof ApiClientError) || error.statusCode == null) return false;
  return error.statusCode >= 400 && error.statusCode < 500;
}

function normalizeMessages(message: unknown, fallback: string): string[] {
  if (Array.isArray(message)) {
    const strings = message.filter((m): m is string => typeof m === 'string');
    if (strings.length > 0) return strings;
  }
  if (typeof message === 'string' && message) return [message];
  return [fallback];
}

function toApiClientError(err: unknown, method: string, path: string): ApiClientError {
  if (err instanceof ApiClientError) return err;

  // Mock routes simulate BE failures with a real status code so error paths
  // (401 redirect, 4xx handling) are exercisable without a backend.
  if (err instanceof MockHttpError) {
    return new ApiClientError({
      messages: [err.message],
      statusCode: err.statusCode,
      code: err.code ?? null,
      method,
      path,
    });
  }

  if (err instanceof ZodError) {
    return new ApiClientError({
      messages: [
        `Response shape mismatch: ${err.issues
          .slice(0, 3)
          .map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`)
          .join('; ')}`,
      ],
      code: 'SCHEMA_MISMATCH',
      method,
      path,
      details: err.issues,
    });
  }

  if (axios.isAxiosError(err)) {
    const body = err.response?.data as
      | {
          statusCode?: number;
          code?: string;
          error?: string;
          message?: unknown;
          details?: unknown;
        }
      | undefined;
    return new ApiClientError({
      messages: normalizeMessages(body?.message, err.message || 'Network error'),
      statusCode: err.response?.status ?? null,
      // The deployed BE's error envelope names this field `error`, carrying the
      // Nest exception name ("UnauthorizedException", "Bad Request"). `code` is
      // read first in case a machine-readable code is added later.
      code: body?.code ?? body?.error ?? null,
      method,
      path,
      details: body?.details ?? null,
    });
  }

  return new ApiClientError({
    messages: [err instanceof Error ? err.message : String(err)],
    method,
    path,
  });
}

/* -------------------- the envelope, modeled once -------------------- */

/** Pagination meta, exactly as the BE hand-builds it. */
export const MetaSchema = z
  .object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  })
  .partial();

export type PageMeta = z.infer<typeof MetaSchema>;

const envelope = <T extends z.ZodTypeAny>(data: T) =>
  z.object({
    success: z.boolean(),
    message: z.string().optional(),
    data,
    meta: MetaSchema.optional(),
  });

/**
 * Parse a response through the envelope and return the inner payload.
 *
 * The cast is needed because Zod v4's `parse` returns a mapped type that
 * TypeScript can't index by `.data` while `data` is still a generic schema.
 * It's sound: the parse has already validated `data` against `schema`.
 */
function unwrap<T extends z.ZodTypeAny>(
  schema: T,
  raw: unknown
): { data: z.infer<T>; meta: PageMeta } {
  const parsed = envelope(schema).parse(raw) as {
    data: z.infer<T>;
    meta?: PageMeta;
  };
  return { data: parsed.data, meta: parsed.meta ?? {} };
}

/* -------------------- core request -------------------- */

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type RequestConfig = {
  /** Query-string params — never hand-build query strings in hooks. */
  params?: Record<string, unknown>;
  /**
   * Bearer token for this request only, overriding the session cookie. For
   * logged-out flows that carry a scoped token (password recovery). Requests
   * using it are excluded from the refresh-and-retry path.
   */
  token?: string;
  /**
   * JSON body. POST/PATCH/PUT take this via the dedicated `body` argument;
   * DELETE uses `config.body` because Nest still validates a DTO on several
   * admin deletes (TIN, referrals).
   */
  body?: unknown;
};

async function request<T extends z.ZodTypeAny>(
  method: HttpMethod,
  path: string,
  schema: T,
  opts?: { body?: unknown; config?: RequestConfig }
): Promise<z.infer<T>> {
  try {
    if (isMockApiEnabled()) {
      const payload = await dispatchMockRequest({
        method,
        path,
        query: opts?.config?.params ?? {},
        body: opts?.body ?? opts?.config?.body,
      });
      return schema.parse(payload);
    }
    const token = opts?.config?.token;
    const res = await apiClient.request({
      method,
      url: path,
      data: opts?.body ?? opts?.config?.body,
      params: opts?.config?.params,
      ...(token && {
        headers: { Authorization: `Bearer ${token}` },
        _noRefresh: true,
      }),
    } as InternalAxiosRequestConfig);
    return unwrap(schema, res.data).data;
  } catch (err) {
    throw toApiClientError(err, method, path);
  }
}

export function apiGet<T extends z.ZodTypeAny>(
  path: string,
  schema: T,
  config?: RequestConfig
): Promise<z.infer<T>> {
  return request('GET', path, schema, { config });
}

export function apiPost<T extends z.ZodTypeAny>(
  path: string,
  body: unknown,
  schema: T,
  config?: RequestConfig
): Promise<z.infer<T>> {
  return request('POST', path, schema, { body, config });
}

export function apiPut<T extends z.ZodTypeAny>(
  path: string,
  body: unknown,
  schema: T,
  config?: RequestConfig
): Promise<z.infer<T>> {
  return request('PUT', path, schema, { body, config });
}

export function apiPatch<T extends z.ZodTypeAny>(
  path: string,
  body: unknown,
  schema: T,
  config?: RequestConfig
): Promise<z.infer<T>> {
  return request('PATCH', path, schema, { body, config });
}

export function apiDelete<T extends z.ZodTypeAny>(
  path: string,
  schema: T,
  config?: RequestConfig
): Promise<z.infer<T>> {
  return request('DELETE', path, schema, { config });
}

/**
 * Paginated list endpoints: the BE puts rows in `data` and pagination in
 * `meta`. Returns both. Mock routes for paged endpoints return
 * `{ data: T[], meta? }` (see lib/mocks/routes/util.ts).
 */
export async function apiGetPaged<T extends z.ZodTypeAny>(
  path: string,
  itemSchema: T,
  config?: RequestConfig
): Promise<{ items: z.infer<T>[]; meta: PageMeta }> {
  try {
    if (isMockApiEnabled()) {
      const payload = await dispatchMockRequest({
        method: 'GET',
        path,
        query: config?.params ?? {},
        body: undefined,
      });
      const parsed = z
        .object({ data: z.array(itemSchema), meta: MetaSchema.optional() })
        .parse(payload);
      return { items: parsed.data, meta: parsed.meta ?? {} };
    }
    const res = await apiClient.request({ method: 'GET', url: path, params: config?.params });
    const { data, meta } = unwrap(z.array(itemSchema), res.data);
    return { items: data, meta };
  } catch (err) {
    throw toApiClientError(err, 'GET', path);
  }
}
