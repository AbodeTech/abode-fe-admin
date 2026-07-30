'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';
import { getAccessToken } from '@/lib/utils/cookies';

import { AdminSchema } from '../schemas/auth.schema';
import { authKeys } from './query-keys';

/**
 * The current admin session — GET /auth/admin/me.
 *
 * Two jobs:
 *  1. Re-hydrate the store on a cold page load, when there is a cookie but no
 *     login response to read from.
 *  2. Re-answer `must_change_password` on every load. The login response
 *     carries the flag too, but an admin who reloads the page or types a
 *     dashboard URL would otherwise slip past the gate.
 *
 * Not retried: a 401 here means the session is genuinely dead and the axios
 * interceptor has already handled it.
 */
export const useAdminMe = (options?: { enabled?: boolean }) => {
  const hasToken = typeof window !== 'undefined' && !!getAccessToken();

  return useQuery({
    queryKey: authKeys.me(),
    queryFn: () => apiGet('/auth/admin/me', AdminSchema),
    enabled: options?.enabled ?? hasToken,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
};
