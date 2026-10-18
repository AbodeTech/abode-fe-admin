/** Mirrors `WhatsappContactsQueryDto` — the wire names are `q` and `unresolved`. */
export type WhatsappContactFilters = {
  page?: number;
  limit?: number;
  q?: string;
  unresolved?: boolean;
};

export const whatsappKeys = {
  all: ['whatsapp'] as const,
  contactLists: () => [...whatsappKeys.all, 'contacts'] as const,
  contacts: (filters?: WhatsappContactFilters) =>
    [...whatsappKeys.contactLists(), filters ?? {}] as const,
  conversations: () => [...whatsappKeys.all, 'conversation'] as const,
  conversation: (phoneNumber: string, page = 1, limit?: number) =>
    [...whatsappKeys.conversations(), phoneNumber, page, limit] as const,
};
