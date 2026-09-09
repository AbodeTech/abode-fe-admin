import type {
  AgencyCommissionQuery,
  AgencyListQuery,
  AgencyMemberQuery,
} from '../schemas/agency.schema';

export const agencyKeys = {
  all: ['agency'] as const,
  lists: () => [...agencyKeys.all, 'list'] as const,
  list: (filters: AgencyListQuery) => [...agencyKeys.lists(), filters] as const,
  detail: (id: string) => [...agencyKeys.all, 'detail', id] as const,
  members: (id: string, filters: AgencyMemberQuery) =>
    [...agencyKeys.all, 'members', id, filters] as const,
  commissions: (id: string, filters: AgencyCommissionQuery) =>
    [...agencyKeys.all, 'commissions', id, filters] as const,
  commissionsExport: (id: string) => [...agencyKeys.all, 'commissions', id, 'export'] as const,
};
