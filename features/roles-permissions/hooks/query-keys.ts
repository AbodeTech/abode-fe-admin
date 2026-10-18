export const rolesKeys = {
  all: ['roles-permissions'] as const,
  roles: ['roles-permissions', 'roles'] as const,
  role: (id: string) => ['roles-permissions', 'role', id] as const,
  roleAdmins: (id: string) => ['roles-permissions', 'role', id, 'admins'] as const,
  permissions: ['roles-permissions', 'permissions'] as const,
  adminAccounts: ['roles-permissions', 'admin-accounts'] as const,
  admin: (id: string) => ['roles-permissions', 'admin', id] as const,
};
