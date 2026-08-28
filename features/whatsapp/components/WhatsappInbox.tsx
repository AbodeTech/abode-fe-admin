"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/shared/Pagination";
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
  const [debouncedSearch, setDebouncedSearch] = useState("");
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

  const messagePage = messagePageFor.phone === selected ? messagePageFor.page : 1;
  const setMessagePage = (page: number) =>
    setMessagePageFor({ phone: selected, page });

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const contactsQuery = useWhatsappContacts({
    page,
    limit: DEFAULT_WHATSAPP_CONTACTS_LIMIT,
    search: debouncedSearch,
    unresolvedOnly,
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

  const contacts = contactsQuery.data?.data ?? [];
  const count = contactsQuery.data?.count ?? 0;

  if (contactsQuery.error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-600">
        <h3 className="font-bold">Error loading WhatsApp conversations</h3>
        <p>{(contactsQuery.error as Error).message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden p-0">
        <div className="grid h-[calc(100vh-16rem)] min-h-[28rem] grid-cols-1 grid-rows-[minmax(0,1fr)] lg:grid-cols-[22rem_1fr]">
          {/* On mobile the two panes share the space, so only one shows at a
              time — an open conversation hides the list. */}
          <div
            className={cn(
              "min-h-0 overflow-hidden border-r border-border",
              selected && "hidden lg:block"
            )}
          >
            <WhatsappContactList
              contacts={contacts}
              selected={selected}
              onSelect={(phoneNumber) => setParams({ phone: phoneNumber })}
              search={search}
              onSearchChange={(value) => {
                setSearch(value);
                if (page !== 1) setParams({ page: "1" });
              }}
              unresolvedOnly={unresolvedOnly}
              onUnresolvedOnlyChange={(value) => {
                setUnresolvedOnly(value);
                if (page !== 1) setParams({ page: "1" });
              }}
              isLoading={contactsQuery.isLoading}
              isFetching={contactsQuery.isFetching}
              count={count}
            />
          </div>

          <div
            className={cn(
              "min-h-0 min-w-0 overflow-hidden",
              !selected && "hidden lg:block"
            )}
          >
            <WhatsappConversation
              contact={conversationQuery.data?.contact ?? null}
              messages={conversationQuery.data?.messages ?? []}
              totalCount={conversationQuery.data?.count ?? 0}
              page={messagePage}
              limit={DEFAULT_WHATSAPP_MESSAGES_LIMIT}
              onPageChange={setMessagePage}
              onBack={() => setParams({ phone: null })}
              isLoading={conversationQuery.isLoading && !!selected}
              error={conversationQuery.error as Error | null}
            />
          </div>
        </div>
      </Card>

      <Pagination
        count={count}
        currentIdx={page}
        limit={DEFAULT_WHATSAPP_CONTACTS_LIMIT}
      />
    </div>
  );
}
