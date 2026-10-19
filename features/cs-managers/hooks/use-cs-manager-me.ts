'use client';

import { useQuery } from '@tanstack/react-query';

import { ApiClientError, apiGet } from '@/lib/api-client';

import { CSManagerProfileSchema } from '../schemas/cs-manager.schema';
import { csManagerKeys } from './query-keys';

/**
 * GET /admin/cs-managers/me — whether the signed-in admin has a CS Manager
 * book, and which manager they are. Open to every admin, like
 * GET /admin/managers/me.
 *
 * The route landed in BE e660a21. An environment without it answers 404,
 * and this resolves to `null`, which `useIsCurrentCSManager` reads as "ask
 * the manager list instead".
 */
export const useCSManagerMe = () =>
  useQuery({
    queryKey: csManagerKeys.me(),
    queryFn: async () => {
      try {
        return await apiGet('/admin/cs-managers/me', CSManagerProfileSchema);
      } catch (err) {
        if (err instanceof ApiClientError && err.statusCode === 404) return null;
        throw err;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
