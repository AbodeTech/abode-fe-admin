'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { apiGetPaged } from '@/lib/api-client';

import { WhatsappContactSchema } from '../schemas/whatsapp.schema';
import { whatsappKeys, type WhatsappContactFilters } from './query-keys';

/** The BE defaults to 25 and caps at 100. */
export const DEFAULT_WHATSAPP_CONTACTS_LIMIT = 25;

/**
 * GET /admin/whatsapp/contacts — every number we have a message from or to,
 * newest conversation first. `q` matches the phone number's digits only;
 * `unresolved` keeps numbers with a failed, rate-limited or undelivered message.
 */
export const useWhatsappContacts = (filters?: WhatsappContactFilters) => {
  const { page = 1, limit = DEFAULT_WHATSAPP_CONTACTS_LIMIT, q, unresolved } = filters ?? {};

  return useQuery({
    queryKey: whatsappKeys.contacts({ page, limit, q, unresolved }),
    queryFn: () =>
      apiGetPaged('/admin/whatsapp/contacts', WhatsappContactSchema, {
        params: {
          page,
          limit,
          q: q || undefined,
          unresolved: unresolved ? 'true' : undefined,
        },
      }),
    // Keep the list on screen while a search or page change loads.
    placeholderData: keepPreviousData,
  });
};
