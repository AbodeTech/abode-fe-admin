"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateIssue } from "../hooks/use-issues";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When provided, the issue is created linked to this ticket in the
   * same call (BE's fromTicketId promotion path). */
  fromTicketId?: string | null;
  onCreated?: (issue: { _id: string; issue_ref: string }) => void;
}

export function CreateIssueDialog({
  open,
  onOpenChange,
  fromTicketId,
  onCreated,
}: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const create = useCreateIssue();

  const reset = () => {
    setTitle("");
    setDescription("");
  };

  const handleClose = () => {
    if (create.isPending) return;
    reset();
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!title.trim()) return;
    try {
      const res = await create.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        fromTicketId: fromTicketId ?? undefined,
      });
      toast.success(
        fromTicketId
          ? `Issue ${res.createIssue.issue_ref} created — ticket linked`
          : `Issue ${res.createIssue.issue_ref} created`
      );
      onCreated?.(res.createIssue);
      reset();
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create issue"
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(o) : handleClose())}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {fromTicketId ? "Promote to issue" : "New issue"}
          </DialogTitle>
          <DialogDescription>
            {fromTicketId
              ? "Group similar tickets under a shared root cause. This ticket links to the new issue automatically."
              : "Group similar tickets under a shared root cause. Link tickets to it as they come in."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Paystack webhook delays on Flex plans"
              className="bg-white"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">
              Description
              <span className="text-xs text-gray-400 ml-1">optional</span>
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's happening, what's the impact, what's known so far"
              rows={4}
              className="bg-white text-sm resize-none"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} disabled={create.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title.trim() || create.isPending}>
            {create.isPending && (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            )}
            {fromTicketId ? "Create + link" : "Create issue"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
