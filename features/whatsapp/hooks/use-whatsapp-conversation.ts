'use client';

import { useQuery } from '@tanstack/react-query';

import { apiGet } from '@/lib/api-client';

import { WhatsappConversationSchema } from '../schemas/whatsapp.schema';
import { whatsappKeys } from './query-keys';

/** The BE defaults to 50 and caps at 200. */
export const DEFAULT_WHATSAPP_MESSAGES_LIMIT = 50;

/**
 * GET /admin/whatsapp/conversations/:phone — one number's transcript, both
 * directions. Page 1 is the newest slice; each page comes back oldest-first.
 * The identity block rides along, so a deep link to a number works on its own.
 */
export const useWhatsappConversation = (
  phoneNumber: string | null,
  page = 1,
  limit = DEFAULT_WHATSAPP_MESSAGES_LIMIT,
) =>
  useQuery({
    queryKey: whatsappKeys.conversation(phoneNumber ?? '', page, limit),
    // Nothing to fetch until a contact is picked; the pane shows its empty state.
    enabled: !!phoneNumber,
    queryFn: () =>
      apiGet(
        `/admin/whatsapp/conversations/${encodeURIComponent(phoneNumber ?? '')}`,
        WhatsappConversationSchema,
        { params: { page, limit } },
      ),
  });
