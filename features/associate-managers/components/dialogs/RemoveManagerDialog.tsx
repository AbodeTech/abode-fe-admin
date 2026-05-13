"use client";

import { useState } from "react";
import { UserMinus, AlertTriangle } from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
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
  manager?: AssociateManager;
}

type ReassignMode = "transfer" | "unassign";

export function RemoveManagerDialog({ open, onOpenChange, manager }: Props) {
  const [mode, setMode] = useState<ReassignMode>("transfer");
  const [targetManager, setTargetManager] = useState<string>("");

  if (!manager) return null;

  const otherManagers = MOCK_MANAGERS.filter((m) => m.id !== manager.id);
  const canSubmit = mode === "unassign" || (mode === "transfer" && targetManager);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#AD1F2A]">
            <UserMinus className="h-5 w-5" />
            Remove Associate Manager
          </DialogTitle>
          <DialogDescription>
            Removing this manager will require their {manager.assignedPros} Associate Pros to be reassigned.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-[#E0F2F1] text-[#00695C] flex items-center justify-center font-semibold text-sm">
              {manager.avatarInitials}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{manager.name}</p>
              <p className="text-xs text-gray-500">{manager.email}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xs uppercase tracking-wide text-gray-500">Pros</p>
              <p className="text-lg font-semibold text-gray-900">{manager.assignedPros}</p>
            </div>
          </div>

          <div className="space-y-3">
            <Label>What should happen to their Associate Pros?</Label>

            <RadioGroup value={mode} onValueChange={(v) => setMode(v as ReassignMode)} className="space-y-2">
              <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="transfer" className="mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Transfer to another manager</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    All Pros will be moved to the selected manager immediately.
                  </p>

                  {mode === "transfer" && (
                    <div className="mt-3">
                      <Select value={targetManager} onValueChange={setTargetManager}>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Select target manager..." />
                        </SelectTrigger>
                        <SelectContent>
                          {otherManagers.map((m) => (
                            <SelectItem key={m.id} value={m.id}>
                              {m.name} · {m.assignedPros} Pros
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </label>

              <label className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                <RadioGroupItem value="unassign" className="mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Leave unassigned</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Pros will sit in the unassigned pool until a manager picks them up.
                  </p>
                </div>
              </label>
            </RadioGroup>
          </div>

          <div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
            <p>
              The manager will lose the Associate Manager role immediately. Their wallet balance and historical metrics are preserved.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!canSubmit}
            className="bg-[#AD1F2A] hover:bg-[#8c1721] text-white"
          >
            Remove Manager
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
