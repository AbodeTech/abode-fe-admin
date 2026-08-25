"use client";

import { useState } from "react";
import { Link2, Loader2, Plus, RotateCcw, Search, Sparkles } from "lucide-react";
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
import { IssueStatus } from "@/lib/gql/graphql";
import { useIssues } from "../hooks/use-issues";
import { useTicketIssueSuggestions } from "../hooks/use-tickets";
import { useLinkTicketToIssue } from "../hooks/use-ticket-mutations";
import { useDebounce } from "@/hooks/use-debounce";
import {
  ISSUE_STATUS_LABELS,
  ISSUE_STATUS_PILL_CLASS,
} from "../lib/ticket-display";
import { CreateIssueDialog } from "./CreateIssueDialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ticketId: string;
  onLinked?: () => void;
}

/** Search existing issues + pick one, or promote to a brand-new issue.
 * The "New issue" path opens CreateIssueDialog with fromTicketId set so
 * the link happens in the same BE call. */
export function LinkTicketToIssueDialog({
  open,
  onOpenChange,
  ticketId,
  onLinked,
}: Props) {
  const [query, setQuery] = useState("");
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const debouncedQ = useDebounce(query);

  const { data, isLoading } = useIssues({
    search: debouncedQ || null,
    limit: 15,
    enabled: open,
  });
  const link = useLinkTicketToIssue();
  // Keyword-overlap candidates from the BE. Suggestion only — nothing is
  // linked until the operator picks. Hidden once they start searching, since
  // the search results are then the better list.
  const { data: suggestions = [] } = useTicketIssueSuggestions(
    ticketId,
    open && !debouncedQ
  );

  const results = data?.results ?? [];
  // A pick can come from either list. The search rows are full Issues; the
  // suggestion rows are TicketIssueRef, which carries no ticketCount — so the
  // count is only quoted when we actually have it, never guessed.
  const pickedFromResults = results.find((r) => r._id === pickedId) ?? null;
  const picked =
    pickedFromResults ??
    suggestions.find((sg) => sg.issue._id === pickedId)?.issue ??
    null;
  const pickedTicketCount = pickedFromResults?.ticketCount ?? null;

  /**
   * Linking a fault onto a RESOLVED incident silently reopens it BE-side
   * (issueService.linkTicketToIssue -> reopenIssue), bumping reopen_count and
   * leaving everyone closed by the last resolution holding a promise that is no
   * longer true. The BE only records that in an AdminLog, so this is the one
   * place the person doing it can be told.
   */
  const willReopen = picked?.status === IssueStatus.Resolved;

  const handleClose = () => {
    if (link.isPending) return;
    setQuery("");
    setPickedId(null);
    onOpenChange(false);
  };

  const handleLink = async () => {
    if (!pickedId) return;
    try {
      await link.mutateAsync({ ticketId, issueId: pickedId });
      toast.success(
        willReopen
          ? `Linked · ${picked?.issue_ref} reopened as a recurrence`
          : "Ticket linked to issue"
      );
      onLinked?.();
      handleClose();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to link");
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(o) : handleClose())}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Link to issue</DialogTitle>
            <DialogDescription>
              Group this ticket under an existing root-cause issue, or
              promote it to a new one.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search issues by title, ref or description…"
                className="pl-8"
                autoFocus
              />
            </div>
            {suggestions.length > 0 && (
              <div className="rounded-md border border-violet-200 bg-violet-50/60 p-2 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[11px] font-medium text-violet-900">
                  <Sparkles className="h-3 w-3" />
                  Suggested by keyword overlap
                </div>
                <ul className="space-y-1">
                  {suggestions.map((sg) => {
                    const isPicked = pickedId === sg.issue._id;
                    return (
                      <li key={sg.issue._id}>
                        <button
                          type="button"
                          onClick={() => setPickedId(sg.issue._id)}
                          className={cn(
                            "w-full text-left rounded px-2 py-1.5 transition-colors",
                            isPicked ? "bg-[#E0F2F1]" : "hover:bg-white"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-gray-500 tabular-nums font-medium">
                              {sg.issue.issue_ref}
                            </span>
                            <span className="text-xs font-medium truncate">
                              {sg.issue.title}
                            </span>
                            <span
                              className={cn(
                                "ml-auto shrink-0 inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                                ISSUE_STATUS_PILL_CLASS[sg.issue.status]
                              )}
                            >
                              {ISSUE_STATUS_LABELS[sg.issue.status]}
                            </span>
                          </div>
                          {sg.matchedTerms.length > 0 && (
                            <p className="text-[10px] text-violet-800 mt-0.5">
                              matched: {sg.matchedTerms.join(", ")}
                            </p>
                          )}
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
            <div className="max-h-64 overflow-y-auto rounded-md border border-gray-200 bg-gray-50/60">
              {isLoading ? (
                <div className="flex items-center justify-center py-8 text-sm text-gray-500 gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" /> Searching…
                </div>
              ) : results.length === 0 ? (
                <div className="py-8 text-center text-sm text-gray-500">
                  {debouncedQ
                    ? "No issues match — promote this ticket to a new one?"
                    : "No issues yet."}
                </div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {results.map((r) => {
                    const picked = pickedId === r._id;
                    return (
                      <li key={r._id}>
                        <button
                          type="button"
                          onClick={() => setPickedId(r._id)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
                            picked ? "bg-[#E0F2F1]" : "hover:bg-white"
                          )}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-500 tabular-nums font-medium">
                                {r.issue_ref}
                              </span>
                              <p className="text-sm font-medium leading-tight truncate">
                                {r.title}
                              </p>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-0.5">
                              {(r.ticketCount ?? 0)} linked ticket
                              {(r.ticketCount ?? 0) === 1 ? "" : "s"}
                              {r.owner ? ` · owned by ${r.owner.userName}` : ""}
                            </p>
                          </div>
                          <span
                            className={cn(
                              "shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                              ISSUE_STATUS_PILL_CLASS[r.status]
                            )}
                          >
                            {ISSUE_STATUS_LABELS[r.status]}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            {willReopen && (
              <div className="rounded-md border border-amber-300 bg-amber-50 p-2.5 flex gap-2">
                <RotateCcw className="h-3.5 w-3.5 text-amber-700 mt-0.5 shrink-0" />
                <div className="text-[11px] text-amber-900 space-y-0.5">
                  <p className="font-medium">
                    {picked?.issue_ref} is resolved — linking will reopen it.
                  </p>
                  <p>
                    A new fault on a closed incident is a recurrence.
                    {pickedTicketCount != null ? (
                      <>
                        {" "}
                        The {pickedTicketCount} customer
                        {pickedTicketCount === 1 ? "" : "s"} already linked{" "}
                        {pickedTicketCount === 1 ? "was" : "were"} told it was
                        fixed, and nothing is sent automatically.
                      </>
                    ) : (
                      <>
                        {" "}
                        Everyone closed by the last resolution was told it was
                        fixed, and nothing is sent automatically.
                      </>
                    )}
                  </p>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="w-full flex items-center justify-center gap-1.5 rounded-md border border-dashed border-gray-300 px-3 py-2 text-xs text-gray-600 hover:border-gray-400 hover:text-gray-800"
            >
              <Plus className="h-3.5 w-3.5" />
              Promote to new issue
            </button>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={handleClose} disabled={link.isPending}>
              Cancel
            </Button>
            <Button onClick={handleLink} disabled={!pickedId || link.isPending}>
              {link.isPending ? (
                <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
              ) : (
                <Link2 className="h-3.5 w-3.5 mr-1.5" />
              )}
              {willReopen ? "Link & reopen" : "Link"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateIssueDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        fromTicketId={ticketId}
        onCreated={() => {
          onLinked?.();
          onOpenChange(false);
        }}
      />
    </>
  );
}
