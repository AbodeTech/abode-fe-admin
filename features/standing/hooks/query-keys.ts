export const standingKeys = {
  all: ['standing'] as const,
  config: () => [...standingKeys.all, 'config'] as const,
  summary: () => [...standingKeys.all, 'summary'] as const,
  members: (checkpoint: string, params: Record<string, unknown>) =>
    [...standingKeys.all, 'members', checkpoint, params] as const,
};
