export const rolesKeys = {
  all: ['roles-permissions'] as const,
  roles: ['roles-permissions', 'roles'] as const,
  permissions: ['roles-permissions', 'permissions'] as const,
  admins: (filters?: Record<string, unknown>) =>
    ['roles-permissions', 'admins', filters] as const,
  admin: (id: string) => ['roles-permissions', 'admin', id] as const,
};
