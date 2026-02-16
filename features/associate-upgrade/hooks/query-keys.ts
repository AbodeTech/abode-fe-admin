export const upgradeKeys = {
  all: ['associate-upgrade'] as const,
  list: (filters?: Record<string, unknown>) =>
    [...upgradeKeys.all, 'list', filters] as const,
};
