export const authKeys = {
  all: ['auth'] as const,
  /** The current admin session — GET /auth/admin/me. */
  me: () => [...authKeys.all, 'me'] as const,
};
