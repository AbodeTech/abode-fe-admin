import { useQuery } from '@tanstack/react-query';
import { executeRaw } from '@/lib/graphql-client';
import { whatsappKeys } from './query-keys';
import type { WhatsappDirection } from './use-whatsapp-contacts';

const WHATSAPP_CONVERSATION_QUERY = `
  query WhatsappConversation($phoneNumber: String!, $page: Int, $limit: Int) {
    whatsappConversation(phoneNumber: $phoneNumber, page: $page, limit: $limit) {
      count
      contact {
        phoneNumber
        e164
        userId
        firstName
        lastName
        email
        referralStatus
        isSuspended
        optedOut
      }
      messages {
        id
        messageId
        direction
        messageType
        text
        preview
        templateName
        conversationStep
        status
        error
        durationMs
        payload
        createdAt
      }
    }
  }
`;

export interface WhatsappMessage {
  id: string;
  messageId: string | null;
  direction: WhatsappDirection;
  messageType: string | null;
  text: string;
  preview: string | null;
  templateName: string | null;
  conversationStep: string | null;
  status: string;
  error: string | null;
  durationMs: number | null;
  /**
   * The webhook's whitelisted slice of Meta's message object. Only `media_id`
   * and `media_mime_type` are relevant here — the backend deliberately stores
   * ids, never the file — so an inbound photo can be named but not shown.
   */
  payload: WhatsappMessagePayload | null;
  createdAt: string;
}

export interface WhatsappMessagePayload {
  id?: string;
  from?: string;
  type?: string;
  timestamp?: string;
  interactive?: unknown;
  media_id?: string;
  media_mime_type?: string;
}

export interface WhatsappContactIdentity {
  phoneNumber: string;
  e164: string | null;
  userId: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  referralStatus: string | null;
  isSuspended: boolean;
  optedOut: boolean;
}

interface ConversationResponse {
  whatsappConversation: {
    count: number;
    contact: WhatsappContactIdentity;
    messages: WhatsappMessage[];
  };
}

export const DEFAULT_WHATSAPP_MESSAGES_LIMIT = 50;

export const useWhatsappConversation = (
  phoneNumber: string | null,
  page = 1,
  limit = DEFAULT_WHATSAPP_MESSAGES_LIMIT
) => {
  return useQuery({
    queryKey: whatsappKeys.conversation(phoneNumber ?? '', page),
    // Nothing to fetch until a contact is picked; the pane renders its empty
    // state instead.
    enabled: !!phoneNumber,
    queryFn: () =>
      executeRaw<ConversationResponse>(WHATSAPP_CONVERSATION_QUERY, {
        phoneNumber,
        page,
        limit,
      }),
    select: (data) => data.whatsappConversation,
  });
};
