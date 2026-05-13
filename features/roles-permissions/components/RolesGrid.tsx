"use client";

import React from "react";
import { graphql } from "@/lib/gql";
import { FragmentType, useFragment as getFragmentData } from "@/lib/gql";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Trash2 } from "lucide-react";
import { CreateRoleDialog } from "./CreateRoleDialog";
import { Skeleton } from "@/components/ui/skeleton";

export const RoleCardFragment = graphql(`
  fragment RoleCardFragment on Role {
    _id
    name
    description
    permissions
  }
`);

interface RolesGridProps {
  roles?: (FragmentType<typeof RoleCardFragment> | null)[] | null;
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

  const safeRoles = (roles ?? []).filter(
    (item): item is NonNullable<typeof item> => item !== null
  );

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
        {safeRoles.map((role) => {
          const data = getFragmentData(RoleCardFragment, role);
          return (
            <Card key={data._id} className="min-w-0 border-border bg-card transition hover:shadow-sm">
              <CardHeader className="flex flex-row items-start justify-between gap-2 pb-3">
                <div className="min-w-0">
                  <CardTitle className="text-lg font-semibold text-foreground">
                    {data.name}
                  </CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">{data.description}</p>
                </div>
                <Button variant="ghost" size="icon" className="text-destructive" disabled>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">
                  Permissions ({data.permissions?.length || 0})
                </p>
                <div className="flex flex-wrap gap-1">
                  {(data.permissions || []).slice(0, 3).map((perm, idx) => (
                    <Badge key={`${data._id}-${idx}`} variant="outline" className="text-xs bg-muted/30 border-border">
                      {perm}
                    </Badge>
                  ))}
                  {data.permissions && data.permissions.length > 3 && (
                    <Badge variant="outline" className="text-xs bg-muted/30 border-border">
                      +{data.permissions.length - 3} more
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
        {safeRoles.length === 0 && (
          <div className="text-sm text-muted-foreground">No roles found.</div>
        )}
      </div>
    </section>
  );
}
