"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Loader2, UserPlus } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAssociateManagers } from "../../hooks/use-associate-managers";
import { useReassignPro } from "../../hooks/use-reassign-pro";
import { managerDisplayName } from "../../schemas/associate-manager.schema";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pro: { id: string; name: string; email: string } | null;
  /** Admin id of the Pro's current manager. Null = unassigned. */
  currentManagerId: string | null;
}


export function ReassignProDialog({
  open,
  onOpenChange,
  pro,
  currentManagerId,
}: Props) {
  const [targetManagerId, setTargetManagerId] = useState<string>("");
  const { data: managersList } = useAssociateManagers({ page: 1, limit: 200 });
  const { mutateAsync, isPending } = useReassignPro();

  useEffect(() => {
    if (open) setTargetManagerId("");
  }, [open]);

  const allManagers = managersList?.items ?? [];

  const currentManager = useMemo(
    () => allManagers.find((m) => m.manager_id === currentManagerId) ?? null,
    [allManagers, currentManagerId]
  );

  const availableManagers = useMemo(
    () =>
      currentManagerId
        ? allManagers.filter((m) => m.manager_id !== currentManagerId)
        : allManagers,
    [allManagers, currentManagerId]
  );

  if (!pro) return null;

  const isAssign = !currentManagerId;
  const title = isAssign ? "Assign Manager" : "Reassign Manager";
  const icon = isAssign ? (
    <UserPlus className="h-5 w-5 text-[#00695C]" />
  ) : (
    <ArrowRight className="h-5 w-5 text-[#00695C]" />
  );

  const handleSubmit = async () => {
    if (!targetManagerId) return;
    try {
      await mutateAsync({
        proId: pro.id,
        toManagerId: targetManagerId,
      });
      toast.success(
        isAssign ? `${pro.name} assigned` : `${pro.name} reassigned`
      );
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to reassign Pro"
      );
    }
  };

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
            <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
              Associate Pro
            </p>
            <p className="text-sm font-medium text-gray-900">{pro.name}</p>
            <p className="text-xs text-gray-500">{pro.email}</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 rounded-lg border border-gray-200 p-3">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                From
              </p>
              {currentManager ? (
                <>
                  <p className="text-sm font-medium text-gray-900">
                    {managerDisplayName(currentManager)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {currentManager.roster_size} Pros
                  </p>
                </>
              ) : (
                <p className="text-sm font-medium text-amber-700">Unassigned</p>
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
                      const id = m.manager_id;
                      return (
                        <SelectItem key={id} value={id}>
                          {managerDisplayName(m)} · {m.roster_size}{" "}
                          Pros
                        </SelectItem>
                      );
                    })
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
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
            {isAssign ? "Assign" : "Reassign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
