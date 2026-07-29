"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Loader2, Users } from "lucide-react";
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
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAssociateManagers } from "../../hooks/use-associate-managers";
import { useBulkAssignPros } from "../../hooks/use-bulk-assign-pros";
import type { AssociatePro } from "../../mock-data";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pros: AssociatePro[];
  /** Admin id of the source manager (null for Unassigned Pool). */
  sourceManagerId: string | null;
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

export function BulkReassignDialog({
  open,
  onOpenChange,
  pros,
  sourceManagerId,
}: Props) {
  const [targetManagerId, setTargetManagerId] = useState<string>("");
  const { data: managersList } = useAssociateManagers({ page: 1, limit: 200 });
  const { mutateAsync, isPending } = useBulkAssignPros();

  useEffect(() => {
    if (open) setTargetManagerId("");
  }, [open]);

  const allManagers = managersList?.results ?? [];

  const sourceManager = useMemo(
    () => allManagers.find((m) => m.manager?._id === sourceManagerId) ?? null,
    [allManagers, sourceManagerId]
  );

  const availableManagers = useMemo(
    () =>
      sourceManagerId
        ? allManagers.filter((m) => m.manager?._id !== sourceManagerId)
        : allManagers,
    [allManagers, sourceManagerId]
  );

  const target = useMemo(
    () => allManagers.find((m) => m.manager?._id === targetManagerId) ?? null,
    [allManagers, targetManagerId]
  );

  if (pros.length === 0) return null;

  const handleSubmit = async () => {
    if (!targetManagerId) return;
    try {
      await mutateAsync({
        managerId: targetManagerId,
        associateProIds: pros.map((p) => p.id),
      });
      toast.success(
        `Reassigned ${pros.length} ${pros.length === 1 ? "Pro" : "Pros"}`
      );
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to reassign");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-[#00695C]" />
            Reassign {pros.length} Associate {pros.length === 1 ? "Pro" : "Pros"}
          </DialogTitle>
          <DialogDescription>
            Move the selected Pros to a different manager. Changes take effect
            immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-lg border border-gray-200 p-3">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                From
              </p>
              {sourceManager ? (
                <>
                  <p className="text-sm font-medium text-gray-900">
                    {fullName(sourceManager.manager)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {sourceManager.manager?.email}
                  </p>
                </>
              ) : (
                <p className="text-sm font-medium text-amber-700">
                  Unassigned Pool
                </p>
              )}
            </div>
            <ArrowRight className="h-4 w-4 text-gray-400 shrink-0" />
            <div className="flex-1 space-y-1">
              <Label className="text-xs uppercase tracking-wide text-gray-500">
                To
              </Label>
              <Select
                value={targetManagerId}
                onValueChange={setTargetManagerId}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select manager..." />
                </SelectTrigger>
                <SelectContent>
                  {availableManagers.length === 0 ? (
                    <div className="px-2 py-1.5 text-sm text-gray-500">
                      No other managers
                    </div>
                  ) : (
                    availableManagers.map((m) => {
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

          <div>
            <Label className="text-xs uppercase tracking-wide text-gray-500">
              Pros being moved
            </Label>
            <ScrollArea className="mt-1 max-h-48 rounded-md border border-gray-200 bg-white">
              <div className="divide-y divide-gray-100">
                {pros.map((p) => (
                  <div
                    key={p.id}
                    className="px-3 py-2 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {p.name}
                      </p>
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
              <span className="font-medium text-gray-700">
                {fullName(target.manager)}
              </span>{" "}
              will go from {target.associate_pros_count ?? 0} to{" "}
              {(target.associate_pros_count ?? 0) + pros.length} Pros assigned.
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button disabled={!targetManagerId || isPending} onClick={handleSubmit}>
            {isPending && (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            )}
            Reassign {pros.length} {pros.length === 1 ? "Pro" : "Pros"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
