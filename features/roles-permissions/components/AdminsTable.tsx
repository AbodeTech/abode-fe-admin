"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Users } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ChangeAdminAccessDialog } from "@/features/roles-permissions/components/ChangeAdminAccessDialog";
import { InviteAdminDialog } from "@/features/roles-permissions/components/InviteAdminDialog";
import { useHasPermission } from "@/hooks/use-admin-permission";
import {
  AdminDesktopTableWrap,
  AdminMobileCard,
  AdminMobileField,
  AdminMobileStack,
} from "@/components/shared/admin-responsive-table";
import { landingLabel } from "@/lib/rbac";
import type { AdminWithRole } from "../schemas/role.schema";

interface AdminsTableProps {
  admins?: AdminWithRole[] | null;
  isLoading?: boolean;
}

/** Every role the person holds, primary first. */
function RoleBadges({ admin }: { admin: AdminWithRole }) {
  return (
    <div className="flex min-w-0 flex-wrap gap-1">
      <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">{admin.role_name}</Badge>
      {admin.additional_roles.map((role) => (
        <Badge key={role.id} variant="outline" className="border-border bg-muted/30">
          {role.name}
        </Badge>
      ))}
    </div>
  );
}

/** The single permissions granted on top of the roles, or "None". */
function ExtraPermissions({ admin }: { admin: AdminWithRole }) {
  if (admin.extra_permissions.length === 0) {
    return <span className="text-sm text-muted-foreground">None</span>;
  }
  const shown = admin.extra_permissions.slice(0, 2);
  const more = admin.extra_permissions.length - shown.length;
  return (
    <div className="flex min-w-0 flex-wrap gap-1">
      {shown.map((permission) => (
        <Badge key={permission} variant="outline" className="border-border bg-muted/30 font-mono text-xs">
          {permission}
        </Badge>
      ))}
      {more > 0 && (
        <Badge variant="outline" className="border-border bg-muted/30 text-xs">
          +{more} more
        </Badge>
      )}
    </div>
  );
}

/** The person's own choice, or the primary role's page when they have made none. */
function StartsOn({ admin }: { admin: AdminWithRole }) {
  if (admin.start_page_choice) {
    return <span className="text-sm">{landingLabel(admin.start_page_choice)}</span>;
  }
  return (
    <span className="text-sm text-muted-foreground" title="The primary role's page">
      {landingLabel(admin.primary_landing)}
    </span>
  );
}

export function AdminsTable({ admins, isLoading }: AdminsTableProps) {
  // POST /admin/invite is guarded by manage_admins.
  const canInvite = useHasPermission("manage_admins");

  if (isLoading) {
    return (
      <Card className="min-w-0 border-border bg-card">
        <div className="p-4 sm:flex sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <h2 className="text-xl font-semibold">Admin Management</h2>
          </div>
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="space-y-2 p-4">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Skeleton key={idx} className="h-10 w-full" />
          ))}
        </div>
      </Card>
    );
  }

  const rows = admins ?? [];

  return (
    <section className="min-w-0 space-y-3">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-2">
          <Users className="h-5 w-5 shrink-0 text-muted-foreground" />
          <h2 className="min-w-0 text-2xl font-semibold text-foreground">Admin Management</h2>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {rows.length} total admins
          </span>
          {canInvite && <InviteAdminDialog variant="outline" />}
        </div>
      </div>
      <AdminMobileStack>
        {rows.map((admin, idx) => {
          return (
            <AdminMobileCard key={admin.id || idx} title={admin.name} subtitle={admin.email}>
              <AdminMobileField label="Roles" value={<RoleBadges admin={admin} />} />
              <AdminMobileField label="Extra permissions" value={<ExtraPermissions admin={admin} />} />
              <AdminMobileField label="Starts on" value={<StartsOn admin={admin} />} />
              <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                <ChangeAdminAccessDialog admin={admin} />
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/security/roles/${admin.id}`}>View</Link>
                </Button>
              </div>
            </AdminMobileCard>
          );
        })}
      </AdminMobileStack>

      <AdminDesktopTableWrap>
      <Card className="min-w-0 overflow-hidden border-border bg-card">
        <div className="min-w-0 overflow-x-auto">
          <Table className="min-w-[860px]">
          <TableHeader>
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="font-semibold text-foreground">Admin</TableHead>
              <TableHead className="font-semibold text-foreground">Roles</TableHead>
              <TableHead className="font-semibold text-foreground">Extra permissions</TableHead>
              <TableHead className="font-semibold text-foreground">Starts on</TableHead>
              <TableHead className="font-semibold text-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                  No admins found.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((admin, idx) => {
                return (
                  <TableRow key={admin.id || idx}>
                    <TableCell className="max-w-[220px] whitespace-normal wrap-break-word align-top">
                      <div className="font-medium">{admin.name}</div>
                      <div className="break-all text-xs text-muted-foreground">{admin.email}</div>
                    </TableCell>
                    <TableCell className="align-top">
                      <RoleBadges admin={admin} />
                    </TableCell>
                    <TableCell className="align-top">
                      <ExtraPermissions admin={admin} />
                    </TableCell>
                    <TableCell className="align-top">
                      <StartsOn admin={admin} />
                    </TableCell>
                    <TableCell className="align-top">
                      <div className="flex min-w-0 flex-wrap items-center gap-2">
                        <ChangeAdminAccessDialog admin={admin} />
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/security/roles/${admin.id}`}>View</Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        </div>
      </Card>
      </AdminDesktopTableWrap>
    </section>
  );
}
