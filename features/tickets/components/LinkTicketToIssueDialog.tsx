"use client";

import { useState } from "react";
import { Link2, Loader2, Plus, Search } from "lucide-react";
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
import { useIssues } from "../hooks/use-issues";
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

  const results = data?.results ?? [];

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
      toast.success("Ticket linked to issue");
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
              Link
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
