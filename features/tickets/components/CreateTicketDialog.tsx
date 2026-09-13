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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TicketChannel } from "@/lib/gql/graphql";
import { CHANNEL_OPTIONS } from "../lib/ticket-display";
import { useCreateTicket } from "../hooks/use-ticket-mutations";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (ticketId: string) => void;
}

/** Minimal "log a new ticket" form.
 * userAffected / sender / attachments are deliberately out of scope for
 * v1 — the primary path is a support admin typing a customer email
 * into a raised complaint. Linking to a user happens on the detail
 * drawer via user suggestions. */
export function CreateTicketDialog({ open, onOpenChange, onCreated }: Props) {
  const [channel, setChannel] = useState<TicketChannel>(TicketChannel.Email);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sourceRef, setSourceRef] = useState("");
  const [category, setCategory] = useState("");

  const create = useCreateTicket();

  const reset = () => {
    setChannel(TicketChannel.Email);
    setSubject("");
    setBody("");
    setSourceRef("");
    setCategory("");
  };

  const handleClose = () => {
    if (create.isPending) return;
    reset();
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!subject.trim()) return;
    try {
      const res = await create.mutateAsync({
        channel,
        subject: subject.trim(),
        body: body.trim() || undefined,
        sourceReference: sourceRef.trim() || undefined,
        category: category.trim() || undefined,
      });
      toast.success(`Ticket ${res.createTicket.ticket_ref} created`);
      onCreated?.(res.createTicket._id);
      reset();
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create ticket"
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(o) : handleClose())}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New ticket</DialogTitle>
          <DialogDescription>
            Log an inbound complaint. Link to a user from the detail
            drawer after creation.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="channel">Channel</Label>
              <Select
                value={channel}
                onValueChange={(v) => setChannel(v as TicketChannel)}
              >
                <SelectTrigger id="channel" className="bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CHANNEL_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="source">
                Source
                <span className="text-xs text-gray-400 ml-1">optional</span>
              </Label>
              <Input
                id="source"
                value={sourceRef}
                onChange={(e) => setSourceRef(e.target.value)}
                placeholder="Email or phone"
                className="bg-white"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Short summary"
              className="bg-white"
              autoFocus
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="body">
              Details
              <span className="text-xs text-gray-400 ml-1">optional</span>
            </Label>
            <Textarea
              id="body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Paste the message or describe the problem"
              rows={4}
              className="bg-white text-sm resize-none"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="category">
              Category
              <span className="text-xs text-gray-400 ml-1">optional</span>
            </Label>
            <Input
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. payment, allocation, doc"
              className="bg-white"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} disabled={create.isPending}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!subject.trim() || create.isPending}
          >
            {create.isPending && (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            )}
            Create ticket
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
