import { useQuery } from '@tanstack/react-query';
import { executeRaw } from '@/lib/graphql-client';
import { whatsappKeys } from './query-keys';

// Raw query strings rather than the `graphql()` codegen tag: codegen runs against
// the deployed schema, so a query naming types the live API does not have yet
// fails to generate. Worth migrating once these types ship.
const WHATSAPP_CONTACTS_QUERY = `
  query WhatsappContacts($page: Int, $limit: Int, $filters: WhatsappContactFilters) {
    whatsappContacts(page: $page, limit: $limit, filters: $filters) {
      count
      data {
        phoneNumber
        e164
        userId
        firstName
        lastName
        email
        referralStatus
        isSuspended
        optedOut
        firstMessageAt
        lastMessageAt
        messageCount
        inboundCount
        outboundCount
        failedCount
        lastMessagePreview
        lastMessageDirection
        lastMessageStatus
        conversationStep
      }
    }
  }
`;

export type WhatsappDirection = 'inbound' | 'outbound';

export interface WhatsappContact {
  phoneNumber: string;
  e164: string | null;
  userId: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  referralStatus: string | null;
  isSuspended: boolean;
  optedOut: boolean;
  firstMessageAt: string | null;
  lastMessageAt: string | null;
  messageCount: number;
  inboundCount: number;
  outboundCount: number;
  failedCount: number;
  lastMessagePreview: string | null;
  lastMessageDirection: WhatsappDirection;
  lastMessageStatus: string | null;
  conversationStep: string | null;
}

interface ContactsResponse {
  whatsappContacts: {
    count: number;
    data: WhatsappContact[];
  };
}

export interface WhatsappContactFilters {
  page?: number;
  limit?: number;
  search?: string | null;
  unresolvedOnly?: boolean;
}

export const DEFAULT_WHATSAPP_CONTACTS_LIMIT = 25;

export const useWhatsappContacts = (filters: WhatsappContactFilters) => {
  const {
    page = 1,
    limit = DEFAULT_WHATSAPP_CONTACTS_LIMIT,
    search,
    unresolvedOnly,
  } = filters;

  return useQuery({
    queryKey: whatsappKeys.contacts({ page, limit, search, unresolvedOnly }),
    queryFn: () =>
      executeRaw<ContactsResponse>(WHATSAPP_CONTACTS_QUERY, {
        page,
        limit,
        filters: {
          search: search || undefined,
          unresolvedOnly: unresolvedOnly || undefined,
        },
      }),
    select: (data) => data.whatsappContacts,
  });
};
