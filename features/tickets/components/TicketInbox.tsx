"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/shared/Pagination";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";
import { TicketChannel, TicketFilter, TicketSort } from "@/lib/gql/graphql";
import { useTickets, DEFAULT_TICKETS_LIMIT } from "../hooks/use-tickets";
import { TicketFilterChips } from "./TicketFilterChips";
import { TicketsToolbar } from "./TicketsToolbar";
import { TicketList } from "./TicketList";
import { TicketThread } from "./TicketThread";
import { CreateTicketDialog } from "./CreateTicketDialog";

/**
 * The support queue as an inbox.
 *
 * Filter state stays in the url (`filter`, `sort`, `channel`, `q`, `page`,
 * `ticket`) so a view is shareable — support hands these round — and so the
 * `?ticket=` deep links from an issue's linked-ticket table keep working.
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

export function TicketInbox() {
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

  const { data, isLoading, isFetching, isError, error } = useTickets({
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
    <div className="space-y-4 py-2">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Tickets</h1>
          <p className="text-sm text-gray-500 mt-1">
            Every complaint, and the conversation on it.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-1.5" />
          New ticket
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <TicketFilterChips
          active={filter}
          onChange={(v) =>
            updateParams({ filter: v === TicketFilter.All ? null : v })
          }
          counts={data?.filterCounts}
        />
        <TicketsToolbar
          sort={sort}
          onSortChange={(v) =>
            updateParams({ sort: v === TicketSort.OldestFirst ? null : v })
          }
          channel={channel}
          onChannelChange={(v) => updateParams({ channel: v })}
        />
      </div>

      <Card className="overflow-hidden p-0">
        <div className="grid h-[calc(100vh-19rem)] min-h-[30rem] grid-cols-1 grid-rows-[minmax(0,1fr)] lg:grid-cols-[22rem_1fr]">
          {/* On mobile the panes share the space — an open ticket hides the list. */}
          <div
            className={cn(
              "min-h-0 overflow-hidden border-r border-gray-200",
              activeTicketId && "hidden lg:block"
            )}
          >
            <TicketList
              rows={rows}
              activeTicketId={activeTicketId}
              onSelect={(row) => updateParams({ ticket: row._id })}
              search={q}
              onSearchChange={(v) => {
                setQ(v);
                updateParams({ q: v || null });
              }}
              isLoading={isLoading}
              isFetching={isFetching}
              isError={isError}
              errorMessage={error instanceof Error ? error.message : undefined}
            />
          </div>

          <div
            className={cn(
              "min-h-0 min-w-0 overflow-hidden",
              !activeTicketId && "hidden lg:block"
            )}
          >
            <TicketThread
              ticketId={activeTicketId}
              onBack={() => updateParams({ ticket: null })}
            />
          </div>
        </div>
      </Card>

      {totalCount > DEFAULT_TICKETS_LIMIT && (
        <Pagination
          count={totalCount}
          currentIdx={page}
          limit={DEFAULT_TICKETS_LIMIT}
        />
      )}

      <CreateTicketDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(id) => updateParams({ ticket: id })}
      />
    </div>
  );
}
