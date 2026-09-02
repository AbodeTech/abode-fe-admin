export const DEFAULT_PAYMENT_PLANS_LIMIT = 25;

export const paymentPlansKeys = {
  all: ['payment-plans'] as const,
  list: (filters?: Record<string, unknown>) => [...paymentPlansKeys.all, 'list', filters] as const,
  summary: (filters?: Record<string, unknown>) =>
    [...paymentPlansKeys.all, 'summary', filters] as const,
  export: () => [...paymentPlansKeys.all, 'export'] as const,
};
