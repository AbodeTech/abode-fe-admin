"use client";

import { useEffect, useState } from "react";
import { ArrowRight, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MOCK_MANAGERS,
  type AssociateManager,
  type AssociatePro,
} from "../../mock-data";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pros: AssociatePro[];
  sourceManager: AssociateManager | null;
}

export function BulkReassignDialog({ open, onOpenChange, pros, sourceManager }: Props) {
  const [targetManagerId, setTargetManagerId] = useState<string>("");

  useEffect(() => {
    if (open) setTargetManagerId("");
  }, [open]);

  if (pros.length === 0) return null;

  const availableManagers = sourceManager
    ? MOCK_MANAGERS.filter((m) => m.id !== sourceManager.id)
    : MOCK_MANAGERS;

  const target = MOCK_MANAGERS.find((m) => m.id === targetManagerId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#00695C]" />
            Reassign {pros.length} Associate {pros.length === 1 ? "Pro" : "Pros"}
          </DialogTitle>
          <DialogDescription>
            Move the selected Pros to a different manager. Changes take effect immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-lg border border-gray-200 p-3">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">From</p>
              {sourceManager ? (
                <>
                  <p className="text-sm font-medium text-gray-900">{sourceManager.name}</p>
                  <p className="text-xs text-gray-500">{sourceManager.email}</p>
                </>
              ) : (
                <p className="text-sm font-medium text-amber-700">Unassigned Pool</p>
              )}
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400 shrink-0" />
            <div className="flex-1 space-y-1">
              <Label className="text-xs uppercase tracking-wide text-gray-500">To</Label>
              <Select value={targetManagerId} onValueChange={setTargetManagerId}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select manager..." />
                </SelectTrigger>
                <SelectContent>
                  {availableManagers.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name} · {m.assignedPros} Pros
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs uppercase tracking-wide text-gray-500">
              Pros being moved
            </Label>
            <ScrollArea className="mt-1 max-h-48 rounded-md border border-gray-200 bg-white">
              <div className="divide-y divide-gray-100">
                {pros.map((p) => (
                  <div key={p.id} className="px-3 py-2 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.email}</p>
                    </div>
                    <span className="text-xs text-gray-400 tabular-nums">
                      {p.totalSales} sales
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {target && (
            <p className="text-xs text-gray-500">
              <span className="font-medium text-gray-700">{target.name}</span> will go from{" "}
              {target.assignedPros} to {target.assignedPros + pros.length} Pros assigned.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!targetManagerId}>
            Reassign {pros.length} {pros.length === 1 ? "Pro" : "Pros"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
