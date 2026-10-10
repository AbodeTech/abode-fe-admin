import { type MockRoutes } from '../router';
import { PEOPLE } from './people';
import { paged } from './util';

/* ============================================================
 * WhatsApp inbox mocks — GET /admin/whatsapp/contacts and
 * /admin/whatsapp/conversations/:phone.
 *
 * One flat message log, read the way `WhatsappMessageLogRepository` reads
 * it: contacts are the log grouped by number (newest conversation first),
 * a transcript is one number's rows paged newest-first and returned
 * oldest-first. Fixtures cover a matched customer mid-receipt, an
 * undelivered template (Meta's 131047), a handler failure, an unmatched
 * number, an opted-out number and a suspended account — plus enough
 * history on one number to exercise "Older messages".
 * ============================================================ */

type MockLogRow = {
  id: string;
  phoneNumber: string;
  direction: 'inbound' | 'outbound';
  messageType: string;
  text: string;
  templateName?: string;
  conversationStep?: string;
  status: string;
  error?: string;
  errorCode?: number;
  durationMs?: number;
  payload?: Record<string, unknown>;
  minutesAgo: number;
};

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

/** Meta's form — the people fixtures store `+234…`. */
const waId = (e164: string) => e164.replace(/\D/g, '');

const RECEIPT_FLOW = waId(PEOPLE[0].phoneNumber);
const REMINDER_FAILED = waId(PEOPLE[1].phoneNumber);
const HANDLER_FAILED = waId(PEOPLE[2].phoneNumber);
const SUSPENDED = waId(PEOPLE[3].phoneNumber);
const UNMATCHED = '2348099887766';
const OPTED_OUT = '2348123456789';

const SUSPENDED_PHONES = new Set([SUSPENDED]);
const OPTED_OUT_PHONES = new Set([OPTED_OUT]);

let seq = 0;
const row = (r: Omit<MockLogRow, 'id'>): MockLogRow => ({
  id: `665fwa${String(++seq).padStart(18, '0')}`,
  ...r,
});

const LOG: MockLogRow[] = [
  // a receipt upload in progress, photo attached.
  row({ phoneNumber: RECEIPT_FLOW, direction: 'inbound', messageType: 'text', text: 'Abeg, I wan upload my receipt', conversationStep: 'IDLE', status: 'processed', durationMs: 1840, minutesAgo: 14 }),
  row({ phoneNumber: RECEIPT_FLOW, direction: 'outbound', messageType: 'interactive', text: 'Which property is this receipt for?\n1. Harmony Gardens — Plot 14\n2. Lekki Pearl — Plot 3', conversationStep: 'CHOOSING_PLAN', status: 'read', minutesAgo: 13 }),
  row({ phoneNumber: RECEIPT_FLOW, direction: 'inbound', messageType: 'interactive', text: '1', conversationStep: 'CHOOSING_PLAN', status: 'processed', durationMs: 640, minutesAgo: 12 }),
  row({ phoneNumber: RECEIPT_FLOW, direction: 'outbound', messageType: 'text', text: 'Send a clear photo of the receipt.', conversationStep: 'AWAITING_RECEIPT', status: 'delivered', minutesAgo: 12 }),
  row({ phoneNumber: RECEIPT_FLOW, direction: 'inbound', messageType: 'image', text: '', conversationStep: 'AWAITING_RECEIPT', status: 'processed', durationMs: 4210, payload: { media_id: '1203948576612093', media_mime_type: 'image/jpeg' }, minutesAgo: 10 }),
  row({ phoneNumber: RECEIPT_FLOW, direction: 'outbound', messageType: 'interactive', text: 'I read ₦250,000 paid on 8 Oct to Abode Properties. Is that right? Reply YES to submit it for review.', conversationStep: 'CONFIRMING', status: 'read', minutesAgo: 9 }),

  // a payment-reminder template Meta accepted and then dropped.
  row({ phoneNumber: REMINDER_FAILED, direction: 'outbound', messageType: 'template', text: 'Hi, your Lekki Pearl installment of ₦180,000 is due on 15 Oct.', templateName: 'payment_due_reminder', status: 'undelivered', error: 'Re-engagement message — more than 24 hours since the customer last replied', errorCode: 131047, minutesAgo: 60 * 26 }),

  // the handler threw mid-withdrawal.
  row({ phoneNumber: HANDLER_FAILED, direction: 'inbound', messageType: 'text', text: 'I want to withdraw my commission', conversationStep: 'IDLE', status: 'processed', durationMs: 1320, minutesAgo: 60 * 3 + 5 }),
  row({ phoneNumber: HANDLER_FAILED, direction: 'outbound', messageType: 'text', text: 'Enter your 4-digit withdrawal PIN.', conversationStep: 'AWAITING_PIN', status: 'read', minutesAgo: 60 * 3 + 4 }),
  row({ phoneNumber: HANDLER_FAILED, direction: 'inbound', messageType: 'text', text: '[redacted]', conversationStep: 'AWAITING_PIN', status: 'failed', error: 'Wallet service timed out after 10000ms', durationMs: 10012, minutesAgo: 60 * 3 }),

  // Suspended account asking a question.
  row({ phoneNumber: SUSPENDED, direction: 'inbound', messageType: 'text', text: 'Why can I not log in?', conversationStep: 'IDLE', status: 'processed', durationMs: 990, minutesAgo: 60 * 24 * 2 }),
  row({ phoneNumber: SUSPENDED, direction: 'outbound', messageType: 'text', text: 'Your account is currently suspended. Our support team can help — reply HELP to open a request.', status: 'delivered', minutesAgo: 60 * 24 * 2 - 1 }),

  // A number that matched no account, then hit the rate limit.
  row({ phoneNumber: UNMATCHED, direction: 'inbound', messageType: 'text', text: 'Do you have commercial plots in Abuja?', conversationStep: 'IDLE', status: 'processed', durationMs: 2110, minutesAgo: 60 * 24 * 4 }),
  row({ phoneNumber: UNMATCHED, direction: 'outbound', messageType: 'text', text: 'Abode does not list commercial plots in Abuja at the moment. Estates on sale now are listed at abode.ng/estates.', status: 'read', minutesAgo: 60 * 24 * 4 - 1 }),
  row({ phoneNumber: UNMATCHED, direction: 'inbound', messageType: 'document', text: '', status: 'rate_limited', payload: { media_id: '9981726354410022', media_mime_type: 'application/pdf' }, minutesAgo: 60 * 24 * 4 - 2 }),

  // Opted out.
  row({ phoneNumber: OPTED_OUT, direction: 'inbound', messageType: 'text', text: 'STOP', conversationStep: 'IDLE', status: 'processed', durationMs: 210, minutesAgo: 60 * 24 * 9 }),
  row({ phoneNumber: OPTED_OUT, direction: 'outbound', messageType: 'text', text: "You won't get WhatsApp messages from Abode any more. Reply START to turn them back on.", status: 'delivered', minutesAgo: 60 * 24 * 9 - 1 }),
];

// Enough older history on the reminder number to page past 50.
for (let day = 3; day < 33; day++) {
  LOG.push(
    row({ phoneNumber: REMINDER_FAILED, direction: 'inbound', messageType: 'text', text: `When is my next payment? (${day})`, conversationStep: 'IDLE', status: 'processed', durationMs: 1500, minutesAgo: 60 * 24 * day }),
    row({ phoneNumber: REMINDER_FAILED, direction: 'outbound', messageType: 'text', text: 'Your next Lekki Pearl installment is ₦180,000, due on 15 Oct.', status: 'read', minutesAgo: 60 * 24 * day - 1 })
  );
}

const FAILED = new Set(['failed', 'rate_limited', 'undelivered']);

const preview = (r: MockLogRow) => r.text || `[${r.messageType}]`;

function identity(phone: string) {
  const person = PEOPLE.find((p) => waId(p.phoneNumber) === phone);
  return {
    e164: `+${phone}`,
    userId: person?._id ?? null,
    firstName: person?.firstName ?? null,
    lastName: person?.lastName ?? null,
    email: person?.email ?? null,
    referralStatus: person?.referral_status ?? null,
    isSuspended: SUSPENDED_PHONES.has(phone),
    optedOut: OPTED_OUT_PHONES.has(phone),
  };
}

function toMessage(r: MockLogRow) {
  return {
    id: r.id,
    messageId: r.status === 'rejected' ? null : `wamid.${r.id}`,
    direction: r.direction,
    messageType: r.messageType,
    text: r.text,
    preview: preview(r),
    templateName: r.templateName ?? null,
    conversationStep: r.conversationStep ?? null,
    status: r.status,
    error: r.error ?? null,
    errorCode: r.errorCode ?? null,
    durationMs: r.durationMs ?? null,
    payload: r.payload ?? null,
    createdAt: minutesAgo(r.minutesAgo),
  };
}

function contacts() {
  const byPhone = new Map<string, MockLogRow[]>();
  for (const r of LOG) byPhone.set(r.phoneNumber, [...(byPhone.get(r.phoneNumber) ?? []), r]);

  return [...byPhone.entries()]
    .map(([phone, rows]) => {
      const sorted = [...rows].sort((a, b) => b.minutesAgo - a.minutesAgo); // oldest first
      const last = sorted[sorted.length - 1];
      return {
        phoneNumber: phone,
        lastMessageAt: minutesAgo(last.minutesAgo),
        firstMessageAt: minutesAgo(sorted[0].minutesAgo),
        messageCount: rows.length,
        inboundCount: rows.filter((r) => r.direction === 'inbound').length,
        outboundCount: rows.filter((r) => r.direction === 'outbound').length,
        failedCount: rows.filter((r) => FAILED.has(r.status)).length,
        lastMessagePreview: preview(last),
        lastMessageDirection: last.direction,
        lastMessageStatus: last.status,
        conversationStep: last.conversationStep ?? null,
        ...identity(phone),
      };
    })
    .sort((a, b) => b.lastMessageAt.localeCompare(a.lastMessageAt));
}

export const whatsappRoutes: MockRoutes = {
  'GET /admin/whatsapp/contacts': ({ query }) => {
    let rows = contacts();
    const q = String(query.q ?? '').replace(/\D/g, '');
    if (q) rows = rows.filter((row) => row.phoneNumber.includes(q));
    if (String(query.unresolved ?? '') === 'true') rows = rows.filter((row) => row.failedCount > 0);
    return paged(rows, query, 25);
  },

  'GET /admin/whatsapp/conversations/:phone': ({ params, query }) => {
    const phone = params.phone.replace(/\D/g, '');
    const page = Math.max(1, Number(query.page ?? 1) || 1);
    const limit = Math.min(200, Math.max(1, Number(query.limit ?? 50) || 50));

    const rows = LOG.filter((r) => r.phoneNumber === phone).sort((a, b) => a.minutesAgo - b.minutesAgo); // newest first
    const slice = rows.slice((page - 1) * limit, page * limit).reverse();
    const meta = { total: rows.length, page, limit, totalPages: Math.ceil(rows.length / limit) };

    return {
      messages: slice.map(toMessage),
      contact: { phoneNumber: phone, ...identity(phone) },
      meta,
    };
  },
};
