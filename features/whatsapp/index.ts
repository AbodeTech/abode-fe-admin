/* WhatsApp inbox — the message log read as conversations, on REST against
 * /admin/whatsapp/*. Read-only.
 *
 * Ported from main's GraphQL version. Same screens; the gains are the v2
 * delivery states (`delivered`/`read`/`undelivered`) and Meta's numeric
 * `errorCode` on a message that didn't land.
 */

export { WhatsappInbox } from './components/WhatsappInbox';
export { WhatsappContactList } from './components/WhatsappContactList';
export { WhatsappConversation } from './components/WhatsappConversation';

export {
  useWhatsappContacts,
  DEFAULT_WHATSAPP_CONTACTS_LIMIT,
} from './hooks/use-whatsapp-contacts';
export {
  useWhatsappConversation,
  DEFAULT_WHATSAPP_MESSAGES_LIMIT,
} from './hooks/use-whatsapp-conversation';
export type { WhatsappContactFilters } from './hooks/query-keys';

export type {
  WhatsappContact,
  WhatsappContactIdentity,
  WhatsappDirection,
  WhatsappMessage,
} from './schemas/whatsapp.schema';
