"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Pagination } from "@/components/shared/Pagination";
import { useDebounce } from "@/hooks/use-debounce";
import { useAdminSession } from "@/hooks/use-admin-session";
import {
  TicketChannel,
  TicketFilter,
  TicketSort,
  TicketType,
} from "@/lib/gql/graphql";
import { useTickets, DEFAULT_TICKETS_LIMIT } from "../hooks/use-tickets";
import { TicketFilterChips } from "./TicketFilterChips";
import { TicketQueueStrip } from "./TicketQueueStrip";
import { TicketsToolbar } from "./TicketsToolbar";
import { TicketsTable } from "./TicketsTable";
import { TicketMailView } from "./TicketMailView";
import { CreateTicketDialog } from "./CreateTicketDialog";

/**
 * The support queue, in two views over one list.
 *
 * The table is where you decide what to work on; the mail view is where you
 * work it. `?ticket=` is the whole difference between them, which keeps every
 * deep link that already existed working and means the mail view's rail is the
 * same query the table just ran — switching tickets costs nothing.
 *
 * Filter state stays in the url (`filter`, `sort`, `channel`, `type`,
 * `category`, `q`, `page`, `ticket`) so a view is shareable; support hands
 * these round.
 *
 * Who sees what: everyone reads the tickets they are party to; the router — a
 * CS Manager whose role is "admin" — also reads the unassigned pool, because
 * handing it out is their job; a super admin reads and acts on the whole book.
 * What is narrowed here is narrowed for legibility only: the BE applies the
 * same scope to the list, the counts and the stats, and re-checks every gate
 * before it acts. See viewerScope and requireCsManager in
 * services/admin/ticket/access.ts.
 */

const parseEnum = <T extends string>(
  v: string | null,
  values: readonly string[]
): T | null => (v && values.includes(v) ? (v as T) : null);

const parseFilter = (v: string | null): TicketFilter =>
  parseEnum<TicketFilter>(v, Object.values(TicketFilter)) ?? TicketFilter.All;

const parseSort = (v: string | null): TicketSort =>
  parseEnum<TicketSort>(v, Object.values(TicketSort)) ?? TicketSort.OldestFirst;

export function TicketInbox() {
  const router = useRouter();
  const search = useSearchParams();
  const { canRouteTickets, canManageAllTickets } = useAdminSession();

  const filter = parseFilter(search.get("filter"));
  const sort = parseSort(search.get("sort"));
  const channel = parseEnum<TicketChannel>(
    search.get("channel"),
    Object.values(TicketChannel)
  );
  const type = parseEnum<TicketType>(
    search.get("type"),
    Object.values(TicketType)
  );
  const category = search.get("category");
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
      type,
      category,
      search: debouncedQ || null,
    },
  });

  const rows = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const errorMessage = error instanceof Error ? error.message : undefined;

  return (
    <div className="space-y-4 py-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Tickets</h1>
          <p className="mt-1 text-sm text-gray-500">
            {canManageAllTickets
              ? "Every complaint, and the conversation on it."
              : canRouteTickets
                ? "Your tickets, and everything still waiting to be assigned."
                : "Tickets assigned to you, and the ones you've been pulled onto."}
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          New ticket
        </Button>
      </div>

      {activeTicketId ? (
        <TicketMailView
          rows={rows}
          activeTicketId={activeTicketId}
          onSelect={(row) => updateParams({ ticket: row._id })}
          onBackToTable={() => updateParams({ ticket: null })}
          search={q}
          onSearchChange={(v) => {
            setQ(v);
            updateParams({ q: v || null });
          }}
          isLoading={isLoading}
          isFetching={isFetching}
          isError={isError}
          errorMessage={errorMessage}
        />
      ) : (
        <>
          <TicketQueueStrip />

          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <TicketFilterChips
              active={filter}
              onChange={(v) =>
                updateParams({ filter: v === TicketFilter.All ? null : v })
              }
              counts={data?.filterCounts}
              canRoute={canRouteTickets}
            />
          </div>

          <TicketsToolbar
            sort={sort}
            onSortChange={(v) =>
              updateParams({ sort: v === TicketSort.OldestFirst ? null : v })
            }
            channel={channel}
            onChannelChange={(v) => updateParams({ channel: v })}
            search={q}
            onSearchChange={(v) => {
              setQ(v);
              updateParams({ q: v || null });
            }}
            type={type}
            onTypeChange={(v) => updateParams({ type: v })}
            category={category}
            onCategoryChange={(v) => updateParams({ category: v })}
            isFetching={isFetching}
          />

          <Card className="overflow-hidden p-0">
            <TicketsTable
              rows={rows}
              onOpen={(row) => updateParams({ ticket: row._id })}
              isLoading={isLoading}
              isError={isError}
              errorMessage={errorMessage}
              canRoute={canRouteTickets}
              canManageAll={canManageAllTickets}
            />
          </Card>

          {totalCount > DEFAULT_TICKETS_LIMIT && (
            <Pagination
              count={totalCount}
              currentIdx={page}
              limit={DEFAULT_TICKETS_LIMIT}
            />
          )}
        </>
      )}

      <CreateTicketDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={(id) => updateParams({ ticket: id })}
      />
    </div>
  );
}
