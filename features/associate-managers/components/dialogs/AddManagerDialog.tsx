"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, UserPlus } from "lucide-react";
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
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAddManager } from "../../hooks/use-add-manager";
import { useAssociateManagers } from "../../hooks/use-associate-managers";
import { useBulkAssignPros } from "../../hooks/use-bulk-assign-pros";
import { useUnassignedPros } from "../../hooks/use-unassigned-pros";
// Cross-feature import: roles-permissions already exposes the admin list
// (powers the Roles & Permissions page). Reusing it here is cleaner than
// re-querying the same data.
import {
  useAdminsWithRoles,
  AdminRowFragment,
} from "@/features/roles-permissions";
import { useFragment as getFragmentData } from "@/lib/gql";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddManagerDialog({ open, onOpenChange }: Props) {
  const [selectedAdmin, setSelectedAdmin] = useState<string>("");
  const [selectedPros, setSelectedPros] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

  // Admin pool to pick from (live).
  const { data: adminsData, isLoading: adminsLoading } = useAdminsWithRoles();
  const allAdmins = (adminsData ?? [])
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .map((row) => getFragmentData(AdminRowFragment, row));

  // Filter out admins already designated as managers (BE rejects duplicates
  // anyway, hiding them is just a nicer UX).
  const { data: managersData } = useAssociateManagers({ page: 1, limit: 200 });
  const existingManagerAdminIds = new Set(
    (managersData?.results ?? [])
      .map((m) => m.manager?._id)
      .filter((id): id is string => !!id)
  );
  const eligibleAdmins = allAdmins.filter(
    (a) => a.adminId && !existingManagerAdminIds.has(a.adminId)
  );

  const { data: unassignedData } = useUnassignedPros({
    page: 1,
    limit: 200,
    searchQuery: search || null,
  });
  const unassignedPros = unassignedData?.results ?? [];

  const { mutateAsync: addManager, isPending: adding } = useAddManager();
  const { mutateAsync: bulkAssign, isPending: assigning } = useBulkAssignPros();

  useEffect(() => {
    if (open) {
      setSelectedAdmin("");
      setSelectedPros(new Set());
      setSearch("");
    }
  }, [open]);

  const togglePro = (id: string) => {
    setSelectedPros((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const isWorking = adding || assigning;

  const handleSubmit = async () => {
    if (!selectedAdmin) return;
    try {
      await addManager({ managerId: selectedAdmin });
      if (selectedPros.size > 0) {
        await bulkAssign({
          managerId: selectedAdmin,
          associateProIds: Array.from(selectedPros),
        });
      }
      toast.success("Associate Manager added");
      onOpenChange(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to add manager");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-[#00695C]" />
            Add Associate Manager
          </DialogTitle>
          <DialogDescription>
            Promote an existing admin to Associate Manager and assign Associate
            Pros to them.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          <div className="space-y-2">
            <Label htmlFor="admin">Select Admin</Label>
            <Select
              value={selectedAdmin}
              onValueChange={setSelectedAdmin}
              disabled={adminsLoading}
            >
              <SelectTrigger id="admin" className="bg-white">
                <SelectValue
                  placeholder={
                    adminsLoading ? "Loading admins..." : "Choose an existing admin..."
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {eligibleAdmins.length === 0 ? (
                  <div className="px-2 py-1.5 text-sm text-gray-500">
                    {adminsLoading
                      ? "Loading…"
                      : "Every admin is already a manager"}
                  </div>
                ) : (
                  eligibleAdmins.map((a) => (
                    <SelectItem key={a.adminId!} value={a.adminId!}>
                      <div className="flex flex-col">
                        <span>{a.adminName || a.adminEmail}</span>
                        <span className="text-xs text-gray-500">
                          {a.adminEmail} {a.role ? `· ${a.role}` : ""}
                        </span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Assign Associate Pros (optional)</Label>
              <span className="text-xs text-gray-500">
                {selectedPros.size} selected
              </span>
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search unassigned Pros..."
                className="pl-8 bg-white"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <ScrollArea className="h-56 rounded-md border border-gray-200 bg-white">
              <div className="divide-y divide-gray-100">
                {unassignedPros.length === 0 ? (
                  <p className="text-center text-sm text-gray-500 py-6">
                    {search
                      ? "No unassigned Pros match your search."
                      : "Unassigned pool is empty."}
                  </p>
                ) : (
                  unassignedPros.map((pro) => (
                    <label
                      key={pro._id}
                      className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedPros.has(pro._id)}
                        onCheckedChange={() => togglePro(pro._id)}
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {`${pro.firstName ?? ""} ${pro.lastName ?? ""}`.trim() ||
                            pro.email}
                        </p>
                        <p className="text-xs text-gray-500">{pro.email}</p>
                      </div>
                    </label>
                  ))
                )}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isWorking}
          >
            Cancel
          </Button>
          <Button disabled={!selectedAdmin || isWorking} onClick={handleSubmit}>
            {isWorking && (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            )}
            Add Manager
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
