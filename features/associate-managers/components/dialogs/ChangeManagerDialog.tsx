"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRightLeft, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
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
import { useAssociateManagers } from "../../hooks/use-associate-managers";
import { useAssociateManager } from "../../hooks/use-associate-managers";
import { useBulkAssignPros } from "../../hooks/use-bulk-assign-pros";
import { useUnassignedPros } from "../../hooks/use-unassigned-pros";

const UNASSIGNED_POOL_ID = "__unassigned__";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Admin id of the manager to pre-select as source. Optional. */
  fromManagerId?: string | null;
  /** Pre-select the Unassigned Pool as the source. */
  startFromUnassigned?: boolean;
}

const fullName = (m?: {
  firstName?: string | null;
  lastName?: string | null;
  userName?: string | null;
  email?: string | null;
} | null) =>
  `${m?.lastName ?? ""} ${m?.firstName ?? ""}`.trim() ||
  m?.userName ||
  m?.email ||
  "Manager";

export function ChangeManagerDialog({
  open,
  onOpenChange,
  fromManagerId,
  startFromUnassigned,
}: Props) {
  const initialSource = startFromUnassigned
    ? UNASSIGNED_POOL_ID
    : fromManagerId ?? "";

  const [sourceId, setSourceId] = useState<string>(initialSource);
  const [targetManagerId, setTargetManagerId] = useState<string>("");
  const [selectedPros, setSelectedPros] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  const { data: managersList } = useAssociateManagers({ page: 1, limit: 200 });
  const allManagers = managersList?.results ?? [];

  const isUnassignedSource = sourceId === UNASSIGNED_POOL_ID;

  const { data: managerDoc } = useAssociateManager(
    isUnassignedSource || !sourceId ? null : sourceId
  );
  const { data: unassignedData } = useUnassignedPros({
    page: 1,
    limit: 200,
    searchQuery: isUnassignedSource ? search || null : null,
  });

  const { mutateAsync, isPending } = useBulkAssignPros();

  useEffect(() => {
    if (open) {
      setSourceId(
        startFromUnassigned ? UNASSIGNED_POOL_ID : fromManagerId ?? ""
      );
      setTargetManagerId("");
      setSelectedPros(new Set());
      setSearch("");
    }
  }, [open, fromManagerId, startFromUnassigned]);

  const sourcePros = useMemo(() => {
    if (isUnassignedSource) {
      return (unassignedData?.results ?? []).map((p) => ({
        id: p._id,
        firstName: p.firstName ?? "",
        lastName: p.lastName ?? "",
        email: p.email ?? "",
      }));
    }
    if (managerDoc?.associate_pros) {
      return managerDoc.associate_pros.map((p) => ({
        id: p._id,
        firstName: p.firstName ?? "",
        lastName: p.lastName ?? "",
        email: p.email ?? "",
      }));
    }
    return [];
  }, [isUnassignedSource, unassignedData?.results, managerDoc?.associate_pros]);

  const filteredPros = sourcePros.filter((p) => {
    const term = search.toLowerCase();
    return (
      `${p.lastName} ${p.firstName}`.toLowerCase().includes(term) ||
      p.email.toLowerCase().includes(term)
    );
  });

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

  const otherManagers = allManagers.filter(
    (m) => m.manager?._id !== sourceId
  );

  const canSubmit =
    !!sourceId && !!targetManagerId && selectedPros.size > 0 && !isPending;

  const handleSubmit = async () => {
    if (!targetManagerId || selectedPros.size === 0) return;
    try {
      await mutateAsync({
        managerId: targetManagerId,
        associateProIds: Array.from(selectedPros),
      });
      toast.success(
        `Moved ${selectedPros.size} ${selectedPros.size === 1 ? "Pro" : "Pros"}`
      );
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to reassign");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-[#00695C]" />
            Bulk Reassign Associate Pros
          </DialogTitle>
          <DialogDescription>
            Move one or more Associate Pros between managers, or pull them out of
            the unassigned pool.
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
                  Unassigned Pool
                </SelectItem>
                <SelectSeparator />
                {allManagers.map((m) => {
                  const id = m.manager?._id;
                  if (!id) return null;
                  return (
                    <SelectItem key={id} value={id}>
                      {fullName(m.manager)} · {m.associate_pros_count ?? 0} Pros
                    </SelectItem>
                  );
                })}
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
                {otherManagers.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-gray-500">
                    No other managers
                  </div>
                ) : (
                  otherManagers.map((m) => {
                    const id = m.manager?._id;
                    if (!id) return null;
                    return (
                      <SelectItem key={id} value={id}>
                        {fullName(m.manager)} · {m.associate_pros_count ?? 0}{" "}
                        Pros
                      </SelectItem>
                    );
                  })
                )}
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
                      <p className="text-sm font-medium text-gray-900">
                        {`${pro.lastName} ${pro.firstName}`.trim() || pro.email}
                      </p>
                      <p className="text-xs text-gray-500">{pro.email}</p>
                    </div>
                  </label>
                ))
              )}
            </div>
          </ScrollArea>

          <p className="text-xs text-gray-500">
            {selectedPros.size} of {sourcePros.length} Pros selected · Changes
            take effect immediately.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button disabled={!canSubmit} onClick={handleSubmit}>
            {isPending && (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            )}
            Move {selectedPros.size > 0 ? selectedPros.size : ""} Pro
            {selectedPros.size === 1 ? "" : "s"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
