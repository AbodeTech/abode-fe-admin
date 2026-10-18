import type { TopAssociateListParams } from '../schemas/top-associate.schema';

export const associateKeys = {
  all: ['associates'] as const,
  lists: () => [...associateKeys.all, 'list'] as const,
  list: (params?: TopAssociateListParams) => [...associateKeys.lists(), params ?? {}] as const,
};
