"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRightLeft, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MOCK_MANAGERS,
  MOCK_UNASSIGNED_PROS,
  UNASSIGNED_POOL_ID,
  getProsForManager,
  type AssociateManager,
} from "../../mock-data";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fromManager?: AssociateManager;
  /** Pre-select the Unassigned Pool as the source when opening. */
  startFromUnassigned?: boolean;
}

export function ChangeManagerDialog({
  open,
  onOpenChange,
  fromManager,
  startFromUnassigned,
}: Props) {
  const initialSource = startFromUnassigned
    ? UNASSIGNED_POOL_ID
    : fromManager?.id ?? "";

  const [sourceId, setSourceId] = useState<string>(initialSource);
  const [targetManagerId, setTargetManagerId] = useState<string>("");
  const [selectedPros, setSelectedPros] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (open) {
      setSourceId(startFromUnassigned ? UNASSIGNED_POOL_ID : fromManager?.id ?? "");
      setTargetManagerId("");
      setSelectedPros(new Set());
      setSearch("");
    }
  }, [open, fromManager?.id, startFromUnassigned]);

  const sourcePros = useMemo(() => {
    if (sourceId === UNASSIGNED_POOL_ID) return MOCK_UNASSIGNED_PROS;
    if (sourceId) return getProsForManager(sourceId);
    return [];
  }, [sourceId]);

  const filteredPros = sourcePros.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.email.toLowerCase().includes(search.toLowerCase())
  );

  const togglePro = (id: string) => {
    setSelectedPros((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedPros.size === filteredPros.length) {
      setSelectedPros(new Set());
    } else {
      setSelectedPros(new Set(filteredPros.map((p) => p.id)));
    }
  };

  const otherManagers = MOCK_MANAGERS.filter((m) => m.id !== sourceId);
  const canSubmit = sourceId && targetManagerId && selectedPros.size > 0;
  const isUnassignedSource = sourceId === UNASSIGNED_POOL_ID;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-[#00695C]" />
            Bulk Reassign Associate Pros
          </DialogTitle>
          <DialogDescription>
            Move one or more Associate Pros between managers, or pull them out of the unassigned pool.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-2">
          <div className="space-y-2">
            <Label>From</Label>
            <Select
              value={sourceId}
              onValueChange={(v) => {
                setSourceId(v);
                setSelectedPros(new Set());
              }}
            >
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={UNASSIGNED_POOL_ID}>
                  Unassigned Pool · {MOCK_UNASSIGNED_PROS.length} Pros
                </SelectItem>
                <SelectSeparator />
                {MOCK_MANAGERS.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} · {m.assignedPros} Pros
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>To</Label>
            <Select value={targetManagerId} onValueChange={setTargetManagerId}>
              <SelectTrigger className="bg-white">
                <SelectValue placeholder="Target manager" />
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
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Select Pros to move</Label>
            <button
              type="button"
              onClick={toggleAll}
              disabled={filteredPros.length === 0}
              className="text-xs text-[#00695C] hover:underline disabled:text-gray-400 disabled:no-underline"
            >
              {selectedPros.size === filteredPros.length && filteredPros.length > 0
                ? "Clear all"
                : "Select all"}
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Filter by name or email..."
              className="pl-8 bg-white"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <ScrollArea className="h-56 rounded-md border border-gray-200 bg-white">
            <div className="divide-y divide-gray-100">
              {!sourceId ? (
                <p className="text-center text-sm text-gray-500 py-10">
                  Select a source to see Pros.
                </p>
              ) : filteredPros.length === 0 ? (
                <p className="text-center text-sm text-gray-500 py-10">
                  {isUnassignedSource
                    ? "Unassigned pool is empty."
                    : "No Pros match your search."}
                </p>
              ) : (
                filteredPros.map((pro) => (
                  <label
                    key={pro.id}
                    className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer"
                  >
                    <Checkbox
                      checked={selectedPros.has(pro.id)}
                      onCheckedChange={() => togglePro(pro.id)}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{pro.name}</p>
                      <p className="text-xs text-gray-500">{pro.email}</p>
                    </div>
                    <span className="text-xs text-gray-400 tabular-nums">
                      {pro.totalSales} sales
                    </span>
                  </label>
                ))
              )}
            </div>
          </ScrollArea>

          <p className="text-xs text-gray-500">
            {selectedPros.size} of {sourcePros.length} Pros selected · Changes take effect immediately.
          </p>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!canSubmit}>
            Move {selectedPros.size > 0 ? selectedPros.size : ""} Pro
            {selectedPros.size === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
