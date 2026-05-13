"use client";

import { useEffect, useState } from "react";
import { ArrowRight, UserPlus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MOCK_MANAGERS, type AssociateManager } from "../../mock-data";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pro: { id: string; name: string; email: string } | null;
  currentManager: AssociateManager | null;
}

export function ReassignProDialog({ open, onOpenChange, pro, currentManager }: Props) {
  const [targetManagerId, setTargetManagerId] = useState<string>("");

  useEffect(() => {
    if (open) setTargetManagerId("");
  }, [open]);

  if (!pro) return null;

  const availableManagers = currentManager
    ? MOCK_MANAGERS.filter((m) => m.id !== currentManager.id)
    : MOCK_MANAGERS;

  const isAssign = !currentManager;
  const title = isAssign ? "Assign Manager" : "Reassign Manager";
  const icon = isAssign ? (
    <UserPlus className="h-5 w-5 text-[#00695C]" />
  ) : (
    <ArrowRight className="h-5 w-5 text-[#00695C]" />
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {icon}
            {title}
          </DialogTitle>
          <DialogDescription>
            {isAssign
              ? "Assign this Associate Pro to a manager."
              : "Move this Associate Pro to a different manager."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Associate Pro</p>
            <p className="text-sm font-medium text-gray-900">{pro.name}</p>
            <p className="text-xs text-gray-500">{pro.email}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-lg border border-gray-200 p-3">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">From</p>
              {currentManager ? (
                <>
                  <p className="text-sm font-medium text-gray-900">{currentManager.name}</p>
                  <p className="text-xs text-gray-500">{currentManager.email}</p>
                </>
              ) : (
                <p className="text-sm font-medium text-amber-700">Unassigned</p>
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!targetManagerId}>
            {isAssign ? "Assign" : "Reassign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
