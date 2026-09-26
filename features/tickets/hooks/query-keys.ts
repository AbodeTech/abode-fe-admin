export const ticketKeys = {
  root: () => ["tickets"] as const,
  lists: () => [...ticketKeys.root(), "list"] as const,
  list: (filter?: Record<string, unknown>) =>
    [...ticketKeys.lists(), filter ?? {}] as const,
  detail: (ticketId: string) =>
    [...ticketKeys.root(), "detail", ticketId] as const,
  userSuggestions: (ticketId: string) =>
    [...ticketKeys.root(), "user-suggestions", ticketId] as const,
  categories: () => [...ticketKeys.root(), "categories"] as const,
  issueSuggestions: (ticketId: string) =>
    [...ticketKeys.root(), "issue-suggestions", ticketId] as const,
  similar: (search: string) =>
    [...ticketKeys.root(), "similar", search] as const,
  // Keyed by the filter: the tiles describe whatever the list is narrowed to,
  // so two narrowings are two different results and must not share a cache entry.
  queueStats: (filter?: Record<string, unknown> | object) =>
    [...ticketKeys.root(), "queue-stats", filter ?? null] as const,
};

export const issueKeys = {
  root: () => ["issues"] as const,
  lists: () => [...issueKeys.root(), "list"] as const,
  list: (filter?: Record<string, unknown>) =>
    [...issueKeys.lists(), filter ?? {}] as const,
  detail: (issueId: string) =>
    [...issueKeys.root(), "detail", issueId] as const,
};
