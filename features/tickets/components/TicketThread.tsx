"use client";

import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  MessageSquare,
  PanelRight,
  Phone,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { TicketChannel, TicketStatus } from "@/lib/gql/graphql";
import { useTicket } from "../hooks/use-tickets";
import {
  useResolveTicket,
  useUpdateTicket,
} from "../hooks/use-ticket-mutations";
import { TicketTimeline } from "./TicketTimeline";
import { TicketComposer } from "./TicketComposer";
import { TicketContextPanel } from "./TicketContextPanel";
import {
  STATUS_LABELS,
  STATUS_OPTIONS,
  STATUS_PILL_CLASS,
} from "../lib/ticket-display";

interface Props {
  ticketId: string | null;
  onBack: () => void;
}

const CHANNEL_ICON: Record<TicketChannel, React.ElementType> = {
  email: Mail,
  phone: Phone,
  whatsapp: MessageCircle,
  in_person: MapPin,
  other: Circle,
};

/**
 * One ticket, read as the conversation it is.
 *
 * The context rail sits alongside on a wide screen and behind a control below
 * that — the thread is what the operator came for, and it keeps the width.
 */
export function TicketThread({ ticketId, onBack }: Props) {
  const { data, isLoading, isError, error } = useTicket(ticketId);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolutionText, setResolutionText] = useState("");
  const [contextOpen, setContextOpen] = useState(false);

  const updateTicket = useUpdateTicket();
  const resolveTicket = useResolveTicket();

  const ticket = data?.ticket;

  const handleResolve = async () => {
    if (!resolutionText.trim() || !ticketId) return;
    try {
      await resolveTicket.mutateAsync({
        ticketId,
        resolution: resolutionText.trim(),
      });
      setResolveOpen(false);
      setResolutionText("");
      toast.success("Ticket resolved");
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to resolve ticket"
      );
    }
  };

  const handleStatusChange = async (next: TicketStatus) => {
    if (!ticketId || !ticket || next === ticket.status) return;
    if (next === TicketStatus.Resolved) {
      setResolveOpen(true);
      return;
    }
    try {
      await updateTicket.mutateAsync({ ticketId, status: next });
      toast.success(`Marked ${STATUS_LABELS[next]}`);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update status"
      );
    }
  };

  if (!ticketId) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center">
        <MessageSquare className="h-8 w-8 text-gray-300" />
        <p className="text-sm text-gray-500">Pick a ticket to read it.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center gap-2 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading ticket…
      </div>
    );
  }

  if (isError || !ticket) {
    return (
      <div className="p-6">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-[#AD1F2A]">
          <h3 className="font-semibold">Couldn&apos;t load this ticket.</h3>
          {error instanceof Error && (
            <p className="mt-1 text-xs text-red-800">{error.message}</p>
          )}
        </div>
      </div>
    );
  }

  const Icon = CHANNEL_ICON[ticket.channel];
  const isResolved = ticket.status === TicketStatus.Resolved;

  return (
    <div className="flex h-full min-h-0">
      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex items-start gap-3 border-b border-gray-200 p-3 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="lg:hidden shrink-0"
            aria-label="Back to tickets"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-gray-500 tabular-nums">
                {ticket.ticket_ref}
              </span>
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium",
                  STATUS_PILL_CLASS[ticket.status]
                )}
              >
                {STATUS_LABELS[ticket.status]}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 text-gray-700 px-2 py-0.5 text-[11px]">
                <Icon className="h-3 w-3" />
                {ticket.channel.replace("_", "-")}
              </span>
              {ticket.merged_into && (
                <span className="text-[10px] uppercase tracking-wide text-gray-400">
                  merged
                </span>
              )}
            </div>
            <h2 className="text-sm font-semibold text-gray-900 leading-snug mt-1 truncate">
              {ticket.subject}
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isResolved && (
              <>
                <select
                  value={ticket.status}
                  onChange={(e) =>
                    handleStatusChange(e.target.value as TicketStatus)
                  }
                  className="hidden sm:block text-xs border border-gray-200 rounded-md px-2 py-1 bg-white"
                  disabled={updateTicket.isPending}
                  aria-label="Ticket status"
                >
                  {STATUS_OPTIONS.filter(
                    (o) => o.value !== TicketStatus.Resolved
                  ).map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                  <option value={TicketStatus.Resolved}>Resolved…</option>
                </select>
                <Button size="sm" onClick={() => setResolveOpen(true)}>
                  <CheckCircle2 className="h-3.5 w-3.5 sm:mr-1.5" />
                  <span className="hidden sm:inline">Resolve</span>
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setContextOpen(true)}
              className="xl:hidden"
              aria-label="Ticket details"
            >
              <PanelRight className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <TicketTimeline
          ticketId={ticket._id}
          messages={data.messages}
          notes={data.notes}
          fallbackBody={ticket.body}
          fallbackAt={ticket.createdAt}
          fallbackFrom={ticket.source_reference}
        />

        {/* Keyed on the ticket so switching tickets remounts a clean composer.
            Without it React reuses the instance and an unsent draft follows you
            onto the next ticket — one customer's words, addressed to another. */}
        <TicketComposer
          key={ticket._id}
          ticketId={ticket._id}
          channel={ticket.channel}
          mergedInto={ticket.merged_into}
        />
      </div>

      <aside className="hidden xl:block w-80 shrink-0 border-l border-gray-200 bg-gray-50/30">
        <TicketContextPanel detail={data} />
      </aside>

      <Sheet open={contextOpen} onOpenChange={setContextOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 gap-0">
          <SheetHeader className="border-b border-gray-200 px-4 py-3">
            <SheetTitle className="text-sm">
              {ticket.ticket_ref} · details
            </SheetTitle>
          </SheetHeader>
          <div className="h-[calc(100%-3.25rem)]">
            <TicketContextPanel detail={data} />
          </div>
        </SheetContent>
      </Sheet>

      <Dialog open={resolveOpen} onOpenChange={setResolveOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Resolve ticket</DialogTitle>
            <DialogDescription>
              A short note explaining how it was resolved — kept on the record
              for future reference.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={resolutionText}
            onChange={(e) => setResolutionText(e.target.value)}
            placeholder="e.g. Refund issued via Paystack (ref: …)"
            className="text-sm"
            autoFocus
          />
          <DialogFooter>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setResolveOpen(false)}
              disabled={resolveTicket.isPending}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleResolve}
              disabled={!resolutionText.trim() || resolveTicket.isPending}
            >
              {resolveTicket.isPending && (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              )}
              Confirm resolution
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
