export const whatsappKeys = {
  all: ['whatsapp'] as const,
  contactsList: () => [...whatsappKeys.all, 'contacts'] as const,
  contacts: (filters?: {
    page?: number;
    limit?: number;
    search?: string | null;
    unresolvedOnly?: boolean;
  }) => [...whatsappKeys.contactsList(), filters] as const,
  conversations: () => [...whatsappKeys.all, 'conversation'] as const,
  conversation: (phoneNumber: string, page?: number) =>
    [...whatsappKeys.conversations(), phoneNumber, page ?? 1] as const,
};
