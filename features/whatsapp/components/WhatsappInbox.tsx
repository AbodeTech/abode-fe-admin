"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import {
  DEFAULT_WHATSAPP_CONTACTS_LIMIT,
  useWhatsappContacts,
} from "../hooks/use-whatsapp-contacts";
import {
  DEFAULT_WHATSAPP_MESSAGES_LIMIT,
  useWhatsappConversation,
} from "../hooks/use-whatsapp-conversation";
import { WhatsappContactList } from "./WhatsappContactList";
import { WhatsappConversation } from "./WhatsappConversation";

/**
 * Which conversation is open lives in the url (`?phone=`), matching the rest of
 * the dashboard and making a conversation linkable — support hands these round.
 * The search box does not: it changes on every keystroke, and pushing a route
 * per character fills the back button with noise.
 */
export function WhatsappInbox() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = Number(searchParams.get("page")) || 1;
  const selected = searchParams.get("phone");

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const [unresolvedOnly, setUnresolvedOnly] = useState(false);

  /**
   * Paired with the conversation it belongs to rather than reset on selection
   * change. Opening a different contact must start at their newest messages, and
   * the selection can change from the url — a back button, a pasted link — not
   * only from a click here, so deriving it beats resetting it.
   */
  const [messagePageFor, setMessagePageFor] = useState<{
    phone: string | null;
    page: number;
  }>({ phone: null, page: 1 });

  const messagePage =
    messagePageFor.phone === selected ? messagePageFor.page : 1;
  const setMessagePage = (page: number) =>
    setMessagePageFor({ phone: selected, page });

  const contactsQuery = useWhatsappContacts({
    page,
    limit: DEFAULT_WHATSAPP_CONTACTS_LIMIT,
    // The BE matches the stored digits, so "+234 803…" has to arrive as
    // "234803…" to find anything.
    q: debouncedSearch.replace(/\D/g, ""),
    unresolved: unresolvedOnly,
  });

  const conversationQuery = useWhatsappConversation(selected, messagePage);

  const setParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) params.delete(key);
      else params.set(key, value);
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const contacts = contactsQuery.data?.items ?? [];
  const count = contactsQuery.data?.meta.total ?? 0;

  if (contactsQuery.error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-[#AD1F2A]">
        <h3 className="font-semibold">
          Couldn&apos;t load WhatsApp conversations.
        </h3>
        <p className="mt-1 text-xs text-red-800">
          {contactsQuery.error.message}
        </p>
      </div>
    );
  }

  /**
   * Laid out like the customer-side Amaris page: the list is a quiet column
   * on the page background, and only the transcript is a card, running the
   * full height. On mobile the two share the space — an open conversation
   * replaces the list, and the back arrow brings it back.
   */
  return (
    <div className="flex h-[calc(100dvh-9.5rem)] min-h-[32rem] gap-6">
      <aside
        aria-label="Conversations"
        className={cn(
          "min-h-0 w-full shrink-0 flex-col lg:flex lg:w-[320px]",
          selected ? "hidden" : "flex",
        )}
      >
        <WhatsappContactList
          contacts={contacts}
          selected={selected}
          onSelect={(phoneNumber) => setParams({ phone: phoneNumber })}
          search={search}
          onSearchChange={(value) => {
            setSearch(value);
            if (page !== 1) setParams({ page: null });
          }}
          unresolvedOnly={unresolvedOnly}
          onUnresolvedOnlyChange={(value) => {
            setUnresolvedOnly(value);
            if (page !== 1) setParams({ page: null });
          }}
          page={page}
          limit={DEFAULT_WHATSAPP_CONTACTS_LIMIT}
          total={count}
          onPageChange={(next) =>
            setParams({ page: next > 1 ? String(next) : null })
          }
          isLoading={contactsQuery.isLoading}
          isFetching={contactsQuery.isFetching}
        />
      </aside>

      <section
        aria-label="Conversation"
        className={cn(
          "min-h-0 min-w-0 flex-1 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm",
          !selected && "hidden lg:block",
        )}
      >
        <WhatsappConversation
          contact={selected ? (conversationQuery.data?.contact ?? null) : null}
          messages={conversationQuery.data?.messages ?? []}
          totalCount={conversationQuery.data?.meta.total ?? 0}
          page={messagePage}
          limit={DEFAULT_WHATSAPP_MESSAGES_LIMIT}
          onPageChange={setMessagePage}
          onBack={() => setParams({ phone: null })}
          isLoading={conversationQuery.isLoading && !!selected}
          error={selected ? conversationQuery.error : null}
        />
      </section>
    </div>
  );
}
