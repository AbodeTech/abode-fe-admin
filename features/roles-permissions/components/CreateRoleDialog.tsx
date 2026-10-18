"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Loader2 } from "lucide-react";
import { usePermissions } from "../hooks/use-permissions";
import { useCreateRole } from "../hooks/use-create-role";
import { toast } from "sonner";

export function CreateRoleDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const { data: permissionsData, isLoading } = usePermissions();
  const { mutateAsync: createRole, isPending } = useCreateRole();

  const permissions = permissionsData ?? [];

  // Selection is by permission NAME, not by id. `POST /admin/roles` validates
  // the names against the code-defined pool, and `GET /admin/permissions`
  // returns no id to send instead — v1 sent Permission document ids here.
  const toggle = (name: string, checked: boolean) => {
    setSelected((prev) =>
      checked ? [...prev, name] : prev.filter((item) => item !== name)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createRole({
        name: name.trim(),
        description: description.trim(),
        permissions: selected,
      });
      toast.success("Role created");
      setName("");
      setDescription("");
      setSelected([]);
      setOpen(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create role");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="w-full bg-black text-white hover:bg-gray-800 sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Create Role
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto sm:w-full">
        <DialogHeader>
          <DialogTitle>Create New Role</DialogTitle>
          <DialogDescription>Define a role and assign permissions.</DialogDescription>
        </DialogHeader>

        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="name">Role name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              disabled={isPending}
            />
          </div>

          <div>
            <Label className="text-base font-semibold">Permissions</Label>
            <div className="mt-3 border border-gray-200 rounded-lg p-4 max-h-60 overflow-y-auto space-y-3">
              {isLoading ? (
                <div className="text-sm text-muted-foreground">Loading permissions...</div>
              ) : (
                permissions.map((perm) => (
                  <div key={perm.name} className="flex items-start space-x-3">
                    <Checkbox
                      id={perm.name}
                      checked={selected.includes(perm.name)}
                      onCheckedChange={(checked) =>
                        toggle(perm.name, Boolean(checked))
                      }
                      disabled={isPending}
                    />
                    <div className="flex-1">
                      <Label htmlFor={perm.name} className="text-sm font-medium cursor-pointer">
                        {perm.name}
                      </Label>
                      <p className="text-xs text-gray-600 mt-1">
                        {perm.description}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            {permissions.length > 0 && (
              <div className="mt-2 text-sm text-gray-500">
                {selected.length} of {permissions.length} selected
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name.trim() || !description.trim()}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
