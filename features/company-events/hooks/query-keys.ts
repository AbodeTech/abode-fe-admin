export const companyEventKeys = {
  all: ['company-events'] as const,
  list: (filters?: Record<string, unknown>) => [...companyEventKeys.all, 'list', filters] as const,
  detail: (id: string) => [...companyEventKeys.all, 'detail', id] as const,
  assets: ['company-events', 'assets'] as const,
  eligibleClients: (eventId: string, filters?: Record<string, unknown>) =>
    [...companyEventKeys.all, 'eligible-clients', eventId, filters] as const,
  allocations: (eventId: string, filters?: Record<string, unknown>) =>
    [...companyEventKeys.all, 'allocations', eventId, filters] as const,
  registrations: (eventId: string, filters?: Record<string, unknown>) =>
    [...companyEventKeys.all, 'registrations', eventId, filters] as const,
  metrics: (eventId: string) => [...companyEventKeys.all, 'metrics', eventId] as const,
  export: (scope: string) => [...companyEventKeys.all, 'export', scope] as const,
};
