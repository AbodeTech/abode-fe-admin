"use client";

import React, { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { LANDING_PAGES, isLandingPage, landingLabel, type LandingPage } from "@/lib/rbac";
import { useAuthStore } from "@/store/auth-store";

import { usePermissions } from "../hooks/use-permissions";
import { useUpdateRole } from "../hooks/use-update-role";
import type { Role, UpdateRolePayload } from "../schemas/role.schema";
import { RolePermissionPicker } from "./RolePermissionPicker";

/**
 * Edit a role: its description, the page it starts on, and the permissions it grants. The name
 * is fixed (the backend has no rename). Takes `manage_roles`; the super-admin role cannot be
 * edited, so the grid does not offer this for it.
 *
 * A change reaches every admin who holds the role, so the form says how many, and spells out
 * which permissions are added and removed before anything is saved.
 */
export function EditRoleDialog({
  role,
  open,
  onOpenChange,
}: {
  role: Role;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] w-[calc(100vw-2rem)] max-w-2xl overflow-y-auto sm:w-full">
        {/* Mounted only while open, so every opening starts from the saved role. */}
        <EditRoleForm role={role} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function EditRoleForm({ role, onDone }: { role: Role; onDone: () => void }) {
  const me = useAuthStore((state) => state.user);
  const { data: poolData, isLoading: poolLoading } = usePermissions();
  const pool = useMemo(() => poolData ?? [], [poolData]);
  const { mutateAsync, isPending } = useUpdateRole();

  const [description, setDescription] = useState(role.description);
  const [landing, setLanding] = useState<string>(role.default_landing_page);
  const [selected, setSelected] = useState<string[]>(role.permissions);

  const added = selected.filter((key) => !role.permissions.includes(key));
  const removed = role.permissions.filter((key) => !selected.includes(key));
  const descriptionChanged = description.trim() !== role.description;
  const landingChanged = landing !== role.default_landing_page;
  const dirty = descriptionChanged || landingChanged || added.length > 0 || removed.length > 0;
  const valid = description.trim().length > 0 && description.trim().length <= 500;

  // Taking `manage_roles` off the role you hold yourself would lock you out of this very screen.
  const holdsThisRole = !!me && [me.role, ...(me.additional_roles ?? [])].some((held) => held?.id === role.id);
  const lockoutRisk = holdsThisRole && removed.some((key) => key === "manage_roles" || key === "manage_admins");

  const toggle = (name: string, checked: boolean) =>
    setSelected((prev) => (checked ? [...prev, name] : prev.filter((item) => item !== name)));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!dirty || !valid) return;
    // Only what changed: the backend treats an omitted field as "leave it".
    const payload: UpdateRolePayload = {};
    if (descriptionChanged) payload.description = description.trim();
    if (landingChanged && isLandingPage(landing)) payload.default_landing_page = landing;
    if (added.length > 0 || removed.length > 0) payload.permissions = selected;

    try {
      await mutateAsync({ roleId: role.id, ...payload });
      toast.success(`Role ${role.name} updated`);
      onDone();
    } catch (error) {
      // The backend's own words ("The super_admin role cannot be edited or deleted", unknown keys…).
      toast.error(error instanceof Error && error.message ? error.message : "Could not update the role");
    }
  };

  return (
    <form className="min-w-0 space-y-5" onSubmit={handleSubmit}>
      <DialogHeader>
        <DialogTitle className="flex flex-wrap items-center gap-2">
          Edit role
          <span className="font-mono text-base font-normal text-muted-foreground">{role.name}</span>
          {role.is_system && (
            <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
              System
            </Badge>
          )}
        </DialogTitle>
        <DialogDescription>
          The name can&apos;t be changed. Everything else can.
          {role.is_system ? " This is a system role: it can be edited but never deleted." : ""}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label htmlFor="edit-role-description">Description</Label>
        <Textarea
          id="edit-role-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          maxLength={500}
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="edit-role-landing">Starts on</Label>
        <Select value={landing} onValueChange={setLanding} disabled={isPending}>
          <SelectTrigger id="edit-role-landing" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {/* The role's own value stays selectable even if this app no longer lists it. */}
            {[...new Set<string>([...(LANDING_PAGES as readonly LandingPage[]), role.default_landing_page])].map((value) => (
              <SelectItem key={value} value={value}>
                {landingLabel(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          The page a person with this role sees first after signing in, unless they pick another.
        </p>
      </div>

      <RolePermissionPicker
        permissions={pool}
        selected={selected}
        onToggle={toggle}
        loading={poolLoading}
        disabled={isPending}
      />

      {dirty && (
        <div role="note" className="min-w-0 space-y-1 rounded-md border border-border bg-muted/30 p-3 text-sm">
          <p className="font-medium text-foreground">
            {role.admin_count === 0
              ? "Nobody holds this role yet."
              : `This changes access for ${role.admin_count} admin${role.admin_count === 1 ? "" : "s"} straight away.`}
          </p>
          {added.length > 0 && (
            <p className="break-words text-muted-foreground">
              <span className="font-medium text-emerald-700">Adds {added.length}:</span> {added.join(", ")}
            </p>
          )}
          {removed.length > 0 && (
            <p className="break-words text-muted-foreground">
              <span className="font-medium text-red-700">Removes {removed.length}:</span> {removed.join(", ")}
            </p>
          )}
          {landingChanged && (
            <p className="text-muted-foreground">
              Starts on {landingLabel(role.default_landing_page)} → {landingLabel(landing)}.
            </p>
          )}
          {lockoutRisk && (
            <p className="font-medium text-red-700">
              You hold this role. Removing manage roles or manage admins from it can lock you out of this page.
            </p>
          )}
        </div>
      )}

      <DialogFooter className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onDone} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending || !dirty || !valid}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save changes
        </Button>
      </DialogFooter>
    </form>
  );
}
