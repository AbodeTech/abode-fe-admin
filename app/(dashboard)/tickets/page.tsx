"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Pagination } from "@/components/shared/Pagination";
import { useDebounce } from "@/hooks/use-debounce";
import {
  TicketChannel,
  TicketFilter,
  TicketSort,
} from "@/lib/gql/graphql";
import {
  TicketFilterChips,
  TicketsToolbar,
  TicketsTable,
  TicketDetailDrawer,
  CreateTicketDialog,
  useTickets,
  DEFAULT_TICKETS_LIMIT,
} from "@/features/tickets";

/**
 * Support ticket queue.
 *
 * Filter chip + toolbar + table + slide-in drawer. URL-driven filter
 * state so pagination and shareable views work without extra plumbing
 * (filter, sort, channel, q, page, ticket).
 */

const parseFilter = (v: string | null): TicketFilter => {
  if (!v) return TicketFilter.All;
  const values = Object.values(TicketFilter) as string[];
  return (values.includes(v) ? v : TicketFilter.All) as TicketFilter;
};

const parseSort = (v: string | null): TicketSort => {
  if (!v) return TicketSort.OldestFirst;
  const values = Object.values(TicketSort) as string[];
  return (values.includes(v) ? v : TicketSort.OldestFirst) as TicketSort;
};

const parseChannel = (v: string | null): TicketChannel | null => {
  if (!v) return null;
  const values = Object.values(TicketChannel) as string[];
  return values.includes(v) ? (v as TicketChannel) : null;
};

function TicketsContent() {
  const router = useRouter();
  const search = useSearchParams();

  const filter = parseFilter(search.get("filter"));
  const sort = parseSort(search.get("sort"));
  const channel = parseChannel(search.get("channel"));
  const page = Math.max(1, Number(search.get("page") ?? "1") || 1);
  const activeTicketId = search.get("ticket");

  const [q, setQ] = useState(search.get("q") ?? "");
  const debouncedQ = useDebounce(q);
  const [createOpen, setCreateOpen] = useState(false);

  const updateParams = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(search);
    for (const [k, v] of Object.entries(patch)) {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    }
    // Any filter change (except page/ticket) resets pagination.
    if (!("page" in patch) && !("ticket" in patch)) next.delete("page");
    router.replace(`?${next.toString()}`, { scroll: false });
  };

  const { data, isLoading, isError, error } = useTickets({
    page,
    limit: DEFAULT_TICKETS_LIMIT,
    filter: {
      filter,
      sort,
      channel,
      search: debouncedQ || null,
    },
  });

  const rows = data?.results ?? [];
  const totalCount = data?.count ?? 0;

  return (
    <div className="space-y-5 py-2">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Tickets</h1>
          <p className="text-sm text-gray-500 mt-1">
            Complaint log across every channel. One inbound message is one
            ticket — follow-ups merge in rather than thread.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          New ticket
        </Button>
      </div>

      <TicketFilterChips
        active={filter}
        onChange={(v) => updateParams({ filter: v === TicketFilter.All ? null : v })}
        counts={data?.filterCounts}
      />

      <TicketsToolbar
        search={q}
        onSearchChange={(v) => {
          setQ(v);
          updateParams({ q: v || null });
        }}
        sort={sort}
        onSortChange={(v) =>
          updateParams({ sort: v === TicketSort.OldestFirst ? null : v })
        }
        channel={channel}
        onChannelChange={(v) => updateParams({ channel: v })}
      />

      <TicketsTable
        rows={rows}
        activeTicketId={activeTicketId}
        onRowClick={(row) => updateParams({ ticket: row._id })}
        isLoading={isLoading}
        isError={isError}
        errorMessage={error instanceof Error ? error.message : undefined}
      />

      {totalCount > DEFAULT_TICKETS_LIMIT && (
        <Pagination
          count={totalCount}
          currentIdx={page}
          limit={DEFAULT_TICKETS_LIMIT}
        />
      )}

      <TicketDetailDrawer
        ticketId={activeTicketId}
        onClose={() => updateParams({ ticket: null })}
      />

      <CreateTicketDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(id) => updateParams({ ticket: id })}
      />
    </div>
  );
}

export default function TicketsPage() {
  return (
    <Suspense fallback={null}>
      <TicketsContent />
    </Suspense>
  );
}
