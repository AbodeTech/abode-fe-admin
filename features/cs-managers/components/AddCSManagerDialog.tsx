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
import { useAdminOptions } from "../hooks/use-cs-managers-list";
import { useAddCSManager } from "../hooks/use-cs-manager-mutations";
import type { AdminOption } from "../types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPromoted?: () => void;
}

const initialsOf = (a: AdminOption) =>
  ((a.lastName?.[0] ?? "") + (a.firstName?.[0] ?? "")).toUpperCase() ||
  a.email[0].toUpperCase();

const fullName = (a: AdminOption) =>
  `${a.lastName ?? ""} ${a.firstName ?? ""}`.trim() || a.email;

export function AddCSManagerDialog({
  open,
  onOpenChange,
  onPromoted,
}: Props) {
  const [query, setQuery] = useState("");
  const [pickedId, setPickedId] = useState<string | null>(null);
  const { data: options = [], isLoading } = useAdminOptions(query, {
    excludeCSManagers: true,
  });
  const { mutateAsync, isPending } = useAddCSManager();

  const handleClose = () => {
    if (isPending) return;
    setQuery("");
    setPickedId(null);
    onOpenChange(false);
  };

  const handlePromote = async () => {
    if (!pickedId) return;
    try {
      await mutateAsync(pickedId);
      toast.success("CS Manager promoted");
      onPromoted?.();
      handleClose();
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : "Failed to promote admin"
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(o) : handleClose())}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Promote admin to CS Manager</DialogTitle>
          <DialogDescription>
            Pick an existing admin to grant the CS Manager role. They'll be
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
                <Loader2 className="h-4 w-4 animate-spin" /> Searching…
              </div>
            ) : options.length === 0 ? (
              <div className="py-8 text-center text-sm text-gray-500">
                No matching admins.
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {options.map((a) => {
                  const picked = pickedId === a._id;
                  return (
                    <li key={a._id}>
                      <button
                        type="button"
                        onClick={() => setPickedId(a._id)}
                        className={cn(
                          "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
                          picked
                            ? "bg-[#E0F2F1] text-[#00695C]"
                            : "hover:bg-white"
                        )}
                      >
                        <div className="h-8 w-8 rounded-full bg-white border border-gray-200 text-gray-700 flex items-center justify-center text-[11px] font-semibold shrink-0">
                          {initialsOf(a)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-tight">
                            {fullName(a)}
                          </p>
                          <p className="text-xs text-gray-500 leading-tight truncate">
                            {a.email} · {a.role}
                          </p>
                        </div>
                        {picked && (
                          <ShieldCheck className="h-4 w-4 text-[#00695C]" />
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={handleClose} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handlePromote} disabled={!pickedId || isPending}>
            {isPending && (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            )}
            Promote to CS Manager
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
