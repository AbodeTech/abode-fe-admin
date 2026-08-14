export const assistantQueryKeys = {
  root: () => ["assistant-questions"] as const,
  list: (filters?: {
    page?: number;
    limit?: number;
    audience?: string | null;
    answered?: boolean | null;
    search?: string | null;
  }) => [...assistantQueryKeys.root(), "list", filters ?? {}] as const,
  counts: () => [...assistantQueryKeys.root(), "counts"] as const,
};
