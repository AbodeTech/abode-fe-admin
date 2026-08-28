export const meetingKeys = {
  all: ["meetings"] as const,
  lists: () => [...meetingKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) =>
    [...meetingKeys.lists(), filters ?? {}] as const,
  details: () => [...meetingKeys.all, "detail"] as const,
  detail: (id: string) => [...meetingKeys.details(), id] as const,
  stats: (id: string) => [...meetingKeys.all, "stats", id] as const,
  verifications: (id: string, page: number) =>
    [...meetingKeys.all, "verifications", id, page] as const,
};
