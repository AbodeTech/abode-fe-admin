"use client";

import { useState } from "react";
import { Loader2, Search, Sparkles, UserCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  useTicketUserSearch,
  type TicketUserOption,
} from "../hooks/use-ticket-pickers";
import { useTicketUserSuggestions } from "../hooks/use-tickets";
import { useUpdateTicket } from "../hooks/use-ticket-mutations";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: string;
  currentUserId?: string | null;
  onAssigned?: () => void;
}

const initialsOf = (u: TicketUserOption) =>
  ((u.lastName?.[0] ?? "") + (u.firstName?.[0] ?? "")).toUpperCase() ||
  u.email[0].toUpperCase();

const fullName = (u: TicketUserOption) =>
  `${u.lastName ?? ""} ${u.firstName ?? ""}`.trim() || u.email;

const CONFIDENCE_CLASS: Record<string, string> = {
  high: "bg-[#00695C] text-white",
  medium: "bg-amber-100 text-amber-800",
  low: "bg-gray-100 text-gray-700",
};

/**
 * Two panels: BE-ranked user suggestions on top, manual search below.
 * BE never auto-applies — every link happens through this deliberate
 * pick (see AssistantQuestion / suggestUsersForTicket).
 */
export function AssignAffectedUserDialog({
  open,
  onOpenChange,
  ticketId,
  currentUserId,
  onAssigned,
}: Props) {
  const [query, setQuery] = useState("");
  const [pickedId, setPickedId] = useState<string | null>(
    currentUserId ?? null
  );
  const { data: suggestions = [], isLoading: sLoading } =
    useTicketUserSuggestions(ticketId, open);
  const { data: searchResults = [], isLoading: qLoading } =
    useTicketUserSearch(query);
  const update = useUpdateTicket();

  const handleClose = () => {
    if (update.isPending) return;
    setQuery("");
    setPickedId(currentUserId ?? null);
    onOpenChange(false);
  };

  const handleAssign = async () => {
    if (!pickedId) return;
    try {
      await update.mutateAsync({ ticketId, userAffectedId: pickedId });
      toast.success("Affected user linked");
      onAssigned?.();
      handleClose();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to link affected user"
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(o) : handleClose())}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Link affected user</DialogTitle>
          <DialogDescription>
            Whose account this ticket concerns. Suggestions come from the
            sender's address and other signals — always confirm before applying.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {open && suggestions.length > 0 && (
            <section className="space-y-1.5">
              <p className="text-[11px] uppercase tracking-wide text-gray-500 font-medium flex items-center gap-1.5">
                <Sparkles className="h-3 w-3" />
                Suggestions
              </p>
              <ul className="rounded-md border border-gray-200 divide-y divide-gray-100">
                {suggestions.map((s) => {
                  const picked = pickedId === s.user._id;
                  return (
                    <li key={s.user._id}>
                      <button
                        type="button"
                        onClick={() => setPickedId(s.user._id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
                          picked ? "bg-[#E0F2F1]" : "hover:bg-gray-50"
                        )}
                      >
                        <div className="h-8 w-8 rounded-full bg-white border border-gray-200 text-gray-700 flex items-center justify-center text-[11px] font-semibold shrink-0">
                          {initialsOf(s.user as TicketUserOption)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-tight">
                            {fullName(s.user as TicketUserOption)}
                          </p>
                          <p className="text-xs text-gray-500 leading-tight truncate">
                            {s.user.email}
                          </p>
                          <p className="text-[11px] text-gray-500 mt-0.5 leading-tight">
                            {s.reason}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                            CONFIDENCE_CLASS[s.confidence] ??
                              "bg-gray-100 text-gray-700"
                          )}
                        >
                          {s.confidence}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
          {open && sLoading && suggestions.length === 0 && (
            <div className="text-xs text-gray-500 py-2 flex items-center gap-1.5">
              <Loader2 className="h-3 w-3 animate-spin" /> Finding suggestions…
            </div>
          )}

          <section className="space-y-1.5">
            <p className="text-[11px] uppercase tracking-wide text-gray-500 font-medium">
              Search users
            </p>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Name, email or phone…"
                className="pl-8"
              />
            </div>
            <div className="max-h-56 overflow-y-auto rounded-md border border-gray-200 bg-gray-50/60">
              {query.trim().length < 2 ? (
                <div className="py-6 text-center text-xs text-gray-400">
                  Type at least 2 characters
                </div>
              ) : qLoading ? (
                <div className="flex items-center justify-center py-6 text-sm text-gray-500 gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Searching…
                </div>
              ) : searchResults.length === 0 ? (
                <div className="py-6 text-center text-sm text-gray-500">
                  No matching users.
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {searchResults.map((u) => {
                    const picked = pickedId === u._id;
                    return (
                      <li key={u._id}>
                        <button
                          type="button"
                          onClick={() => setPickedId(u._id)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 text-left transition-colors",
                            picked ? "bg-[#E0F2F1]" : "hover:bg-white"
                          )}
                        >
                          <div className="h-7 w-7 rounded-full bg-white border border-gray-200 text-gray-700 flex items-center justify-center text-[11px] font-semibold shrink-0">
                            {initialsOf(u)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium leading-tight">
                              {fullName(u)}
                            </p>
                            <p className="text-xs text-gray-500 leading-tight truncate">
                              {u.email}
                              {u.phoneNumber && ` · ${u.phoneNumber}`}
                            </p>
                          </div>
                          {picked && <UserCheck className="h-4 w-4 text-[#00695C]" />}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} disabled={update.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!pickedId || update.isPending || pickedId === currentUserId}
          >
            {update.isPending && (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            )}
            {currentUserId ? "Change" : "Link"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
