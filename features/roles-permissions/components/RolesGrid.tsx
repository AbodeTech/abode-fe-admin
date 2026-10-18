"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Trash2 } from "lucide-react";
import { CreateRoleDialog } from "./CreateRoleDialog";
import { Skeleton } from "@/components/ui/skeleton";
import type { Role } from "../schemas/role.schema";

interface RolesGridProps {
  roles?: Role[] | null;
  isLoading?: boolean;
}

export function RolesGrid({ roles, isLoading }: RolesGridProps) {
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
        <div className="w-full sm:ml-auto sm:w-auto">
          <CreateRoleDialog />
        </div>
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
              {/*
                DELETE /admin/roles/:id exists now, but wiring it needs more than
                a button: the BE refuses system roles outright, and refuses any
                role that still has admins — returning them in the 400 so they
                can be reassigned first. That reassignment flow is the real work.
              */}
              <Button
                variant="ghost"
                size="icon"
                className="text-destructive"
                disabled
                title={
                  role.is_system
                    ? "System roles cannot be deleted"
                    : "Deleting roles isn't wired up yet"
                }
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">
                {role.permissions.length} permission{role.permissions.length === 1 ? "" : "s"} ·{" "}
                {role.admin_count} admin{role.admin_count === 1 ? "" : "s"}
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
