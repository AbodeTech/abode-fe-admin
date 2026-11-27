"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MoreVertical, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CreateRoleDialog } from "./CreateRoleDialog";
import { DeleteRoleDialog } from "./DeleteRoleDialog";
import { EditRoleDialog } from "./EditRoleDialog";
import { useHasPermission } from "@/hooks/use-admin-permission";
import { landingLabel } from "@/lib/rbac";
import { Skeleton } from "@/components/ui/skeleton";
import type { Role } from "../schemas/role.schema";

/**
 * Edit and Delete for one role card. Both take `manage_roles`; the backend refuses to edit the
 * super-admin role and to delete a system or super-admin role, so those entries say why they are
 * off. A role that still has admins can be opened to see them, and is only refused at the delete.
 */
function RoleCardActions({ role }: { role: Role }) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const deleteBlocked = role.is_super_admin ? "Super admin roles can't be deleted" : role.is_system ? "System roles can't be deleted" : null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="-mr-2 -mt-1 h-8 w-8 shrink-0" aria-label={`Actions for ${role.name}`}>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem disabled={role.is_super_admin} onSelect={() => setEditOpen(true)}>
            {role.is_super_admin ? "Edit role (not allowed for super admin)" : "Edit role"}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!!deleteBlocked}
            className="text-red-600 focus:text-red-600"
            onSelect={() => setDeleteOpen(true)}
          >
            {deleteBlocked ? `Delete role (${deleteBlocked.toLowerCase()})` : "Delete role"}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {!role.is_super_admin && <EditRoleDialog role={role} open={editOpen} onOpenChange={setEditOpen} />}
      {!deleteBlocked && <DeleteRoleDialog role={role} open={deleteOpen} onOpenChange={setDeleteOpen} />}
    </>
  );
}

interface RolesGridProps {
  roles?: Role[] | null;
  isLoading?: boolean;
}

export function RolesGrid({ roles, isLoading }: RolesGridProps) {
  // POST, PATCH and DELETE /admin/roles are all guarded by manage_roles.
  const canManageRoles = useHasPermission("manage_roles");
  const canCreateRole = canManageRoles;

  if (isLoading) {
    return (
      <Card className="min-w-0 border-border bg-card">
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Roles Management</CardTitle>
          </div>
          <Skeleton className="h-9 w-32" />
        </CardHeader>
        <CardContent className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <Skeleton key={idx} className="h-32 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const safeRoles = roles ?? [];

  return (
    <section className="min-w-0 space-y-4">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <Shield className="h-5 w-5 shrink-0 text-muted-foreground" />
          <h2 className="min-w-0 text-2xl font-semibold text-foreground">Roles Management</h2>
        </div>
        {canCreateRole && (
          <div className="w-full sm:ml-auto sm:w-auto">
            <CreateRoleDialog />
          </div>
        )}
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {safeRoles.map((role) => (
          <Card key={role.id} className="min-w-0 border-border bg-card transition hover:shadow-sm">
            <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
              <div className="min-w-0">
                <CardTitle className="flex flex-wrap items-center gap-2 text-lg font-semibold text-foreground">
                  {role.name}
                  {role.is_system ? (
                    <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                      System
                    </Badge>
                  ) : null}
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">{role.description}</p>
              </div>
              {canManageRoles && <RoleCardActions role={role} />}
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">
                {role.permissions.length} permission{role.permissions.length === 1 ? "" : "s"} ·{" "}
                {role.admin_count} admin{role.admin_count === 1 ? "" : "s"}
              </p>
              <p className="text-xs text-muted-foreground">
                Starts on <span className="font-medium text-foreground">{landingLabel(role.default_landing_page)}</span>
              </p>
              <div className="flex flex-wrap gap-1">
                {role.permissions.slice(0, 3).map((perm) => (
                  <Badge key={`${role.id}-${perm}`} variant="outline" className="text-xs bg-muted/30 border-border">
                    {perm}
                  </Badge>
                ))}
                {role.permissions.length > 3 && (
                  <Badge variant="outline" className="text-xs bg-muted/30 border-border">
                    +{role.permissions.length - 3} more
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {safeRoles.length === 0 && (
          <div className="text-sm text-muted-foreground">No roles found.</div>
        )}
      </div>
    </section>
  );
}
