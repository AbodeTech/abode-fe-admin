"use client";

import { useState } from "react";
import { Loader2, Search, ShieldCheck } from "lucide-react";
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
import { useAdminPicker, useCSManagers } from "../hooks/use-cs-managers";
import { useAddCSManager } from "../hooks/use-cs-manager-mutations";
import { pickerRowInitials, pickerRowName, type AdminPickerRow } from "../schemas/cs-manager.schema";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddCSManagerDialog({ open, onOpenChange }: Props) {
  const [query, setQuery] = useState("");
  const [pickedId, setPickedId] = useState<string | null>(null);
  const { data: admins = [], isLoading } = useAdminPicker();
  const { data: managers = [] } = useCSManagers();
  const addManager = useAddCSManager();

  const activeManagerIds = new Set(managers.map((m) => m.manager?.id).filter(Boolean));
  const q = query.trim().toLowerCase();
  const options = admins
    .filter((a) => !activeManagerIds.has(a._id))
    .filter((a) => {
      if (!q) return true;
      return pickerRowName(a).toLowerCase().includes(q) || a.email.toLowerCase().includes(q);
    });

  const handleClose = () => {
    if (addManager.isPending) return;
    setQuery("");
    setPickedId(null);
    onOpenChange(false);
  };

  const handlePromote = () => {
    if (!pickedId) return;
    addManager.mutate(pickedId, {
      onSuccess: () => {
        toast.success("CS Manager promoted");
        handleClose();
      },
      onError: (error) => toast.error(error.message || "Failed to promote admin"),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(o) : handleClose())}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Promote admin to CS Manager</DialogTitle>
          <DialogDescription>
            Pick an existing admin to grant the CS Manager role. They&apos;ll be
            able to accept assigned customers immediately after.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search admins by name or email…"
              className="pl-8"
              autoFocus
            />
          </div>

          <div className="max-h-72 overflow-y-auto rounded-md border border-gray-200 bg-gray-50/60">
            {isLoading ? (
              <div className="flex items-center justify-center py-8 text-sm text-gray-500 gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </div>
            ) : options.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">No matching admins.</div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {options.map((a: AdminPickerRow) => {
                  const picked = pickedId === a._id;
                  return (
                    <li key={a._id}>
                      <button
                        type="button"
                        onClick={() => setPickedId(a._id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
                          picked ? "bg-[#E0F2F1] text-[#00695C]" : "hover:bg-white"
                        )}
                      >
                        <div className="h-8 w-8 rounded-full bg-white border border-gray-200 text-gray-700 flex items-center justify-center text-[11px] font-semibold shrink-0">
                          {pickerRowInitials(a)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-tight">{pickerRowName(a)}</p>
                          <p className="text-xs text-gray-500 leading-tight truncate">
                            {a.email} · {a.role}
                          </p>
                        </div>
                        {picked && <ShieldCheck className="h-4 w-4 text-[#00695C]" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} disabled={addManager.isPending}>
            Cancel
          </Button>
          <Button onClick={handlePromote} disabled={!pickedId || addManager.isPending}>
            {addManager.isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
            Promote to CS Manager
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
