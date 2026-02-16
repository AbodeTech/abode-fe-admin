export const associateKeys = {
  all: ['associates'] as const,
  list: (filters?: Record<string, unknown>) =>
    [...associateKeys.all, 'list', filters] as const,
};
