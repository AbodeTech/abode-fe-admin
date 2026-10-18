import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Admin } from '@/features/auth/schemas/auth.schema';

/* ============================================================
 * Client-side auth state.
 *
 * Holds the admin identity only. Tokens live in cookies
 * (lib/utils/cookies.ts) because the axios interceptor and middleware.ts both
 * need them outside React. Never put a token here — a persisted store would
 * keep a stale copy after a refresh rotates it.
 *
 * `user` is typed from the Zod schema (AuthAdminView), so a BE field rename
 * becomes a compile error rather than a silently undefined value.
 * ============================================================ */

interface AuthState {
  /** The authenticated admin, or null when signed out. */
  user: Admin | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: Admin) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      login: (user) => set({ user, isAuthenticated: true }),
      logout: () => set({ user: null, isAuthenticated: false }),
      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'abode-auth-storage',
    }
  )
);
