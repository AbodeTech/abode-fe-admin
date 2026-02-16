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
      <Card className="border border-gray-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            <CardTitle>Roles Management</CardTitle>
          </div>
          <Skeleton className="h-9 w-32" />
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-gray-700" />
          <h2 className="text-2xl font-semibold text-gray-900">Roles Management</h2>
        </div>
        <CreateRoleDialog />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {safeRoles.map((role) => {
          const data = getFragmentData(RoleCardFragment, role);
          return (
            <Card key={data._id} className="border border-gray-200 hover:shadow-sm transition">
              <CardHeader className="pb-3 flex flex-row items-start justify-between">
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">
                    {data.name}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{data.description}</p>
                </div>
                <Button variant="ghost" size="icon" className="text-red-500" disabled>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm font-medium text-gray-700">
                  Permissions ({data.permissions?.length || 0})
                </p>
                <div className="flex flex-wrap gap-1">
                  {(data.permissions || []).slice(0, 3).map((perm, idx) => (
                    <Badge key={`${data._id}-${idx}`} variant="outline" className="text-xs bg-gray-50 border-gray-300">
                      {perm}
                    </Badge>
                  ))}
                  {data.permissions && data.permissions.length > 3 && (
                    <Badge variant="outline" className="text-xs bg-gray-50 border-gray-300">
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
