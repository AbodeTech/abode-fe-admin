export const ticketKeys = {
  root: () => ["tickets"] as const,
  lists: () => [...ticketKeys.root(), "list"] as const,
  list: (filter?: Record<string, unknown>) =>
    [...ticketKeys.lists(), filter ?? {}] as const,
  detail: (ticketId: string) =>
    [...ticketKeys.root(), "detail", ticketId] as const,
  userSuggestions: (ticketId: string) =>
    [...ticketKeys.root(), "user-suggestions", ticketId] as const,
  similar: (search: string) =>
    [...ticketKeys.root(), "similar", search] as const,
};

export const issueKeys = {
  root: () => ["issues"] as const,
  lists: () => [...issueKeys.root(), "list"] as const,
  list: (filter?: Record<string, unknown>) =>
    [...issueKeys.lists(), filter ?? {}] as const,
  detail: (issueId: string) =>
    [...issueKeys.root(), "detail", issueId] as const,
};
