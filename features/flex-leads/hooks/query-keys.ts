import type { FlexLeadStatus, FlexLeadType } from '../schemas/flex-lead.schema';

/** Mirrors `ListFlexLeadsQueryDto` — the search param is `q` on the wire. */
export type FlexLeadListFilters = {
  status?: FlexLeadStatus;
  type?: FlexLeadType;
  q?: string;
  include_deleted?: boolean;
  page?: number;
  limit?: number;
};

export const flexLeadKeys = {
  all: ['flex-leads'] as const,
  lists: () => [...flexLeadKeys.all, 'list'] as const,
  list: (filters?: FlexLeadListFilters) => [...flexLeadKeys.lists(), filters ?? {}] as const,
  counts: () => [...flexLeadKeys.all, 'counts'] as const,
};
