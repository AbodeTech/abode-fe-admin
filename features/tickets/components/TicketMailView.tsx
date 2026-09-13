"use client";

import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TicketList } from "./TicketList";
import { TicketThread } from "./TicketThread";
import type { GetTicketsQuery } from "@/lib/gql/graphql";

type Row = GetTicketsQuery["getTickets"]["results"][number];

interface Props {
  rows: Row[];
  activeTicketId: string;
  onSelect: (row: Row) => void;
  onBackToTable: () => void;
  search: string;
  onSearchChange: (value: string) => void;
  isLoading: boolean;
  isFetching?: boolean;
  isError: boolean;
  errorMessage?: string;
}

/**
 * One ticket, read as the conversation it is — with the rest of the queue
 * still to hand.
 *
 * The rail is not decoration: working a queue means answering one and moving to
 * the next, and sending the reader back to the table between every ticket makes
 * that four clicks instead of one. It carries the same rows the table does,
 * under the same filters, so "next" means what it looked like it meant.
 *
 * On a narrow screen the two panes share the space and the thread wins — the
 * rail is how you got here, not what you came for.
 */
export function TicketMailView({
  rows,
  activeTicketId,
  onSelect,
  onBackToTable,
  search,
  onSearchChange,
  isLoading,
  isFetching,
  isError,
  errorMessage,
}: Props) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center gap-2 border-b border-gray-200 px-2.5 py-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBackToTable}
          className="h-8 gap-1.5 px-2 text-sm text-gray-600"
        >
          <ArrowLeft className="h-4 w-4" />
          All tickets
        </Button>
        <span className="text-xs text-gray-400">
          {rows.length > 1 && "Pick another from the list to switch"}
        </span>
      </div>

      <div className="grid h-[calc(100vh-19rem)] min-h-[30rem] grid-cols-1 grid-rows-[minmax(0,1fr)] lg:grid-cols-[22rem_1fr]">
        <div
          className={cn(
            "hidden min-h-0 overflow-hidden border-r border-gray-200 lg:block"
          )}
        >
          <TicketList
            rows={rows}
            activeTicketId={activeTicketId}
            onSelect={onSelect}
            search={search}
            onSearchChange={onSearchChange}
            isLoading={isLoading}
            isFetching={isFetching}
            isError={isError}
            errorMessage={errorMessage}
          />
        </div>

        <div className="min-h-0 min-w-0 overflow-hidden">
          <TicketThread ticketId={activeTicketId} onBack={onBackToTable} />
        </div>
      </div>
    </Card>
  );
}
