"use client";

import React from "react";
import { graphql } from "@/lib/gql";
import { FragmentType, useFragment as getFragmentData } from "@/lib/gql";
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

export const AdminRowFragment = graphql(`
  fragment AdminRowFragment on AdminRoles {
    adminEmail
    adminId
    adminName
    permissions
    role
    roleId
  }
`);

interface AdminsTableProps {
  admins?: (FragmentType<typeof AdminRowFragment> | null)[] | null;
  isLoading?: boolean;
}

export function AdminsTable({ admins, isLoading }: AdminsTableProps) {
  if (isLoading) {
    return (
      <Card className="border border-gray-200">
        <div className="p-4 flex items-center justify-between">
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

  const rows = (admins ?? []).filter(
    (item): item is NonNullable<typeof item> => item !== null
  );

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-gray-700" />
          <h2 className="text-2xl font-semibold text-gray-900">Admin Management</h2>
        </div>
        <div className="text-sm text-gray-600 flex items-center gap-1">
          <Users className="h-4 w-4" />
          {rows.length} total admins
        </div>
      </div>
      <Card className="border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow className="border-gray-200">
              <TableHead className="font-semibold text-black">Admin</TableHead>
              <TableHead className="font-semibold text-black">Role</TableHead>
              <TableHead className="font-semibold text-black">Permissions</TableHead>
              <TableHead className="font-semibold text-black">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                  No admins found.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row, idx) => {
                const admin = getFragmentData(AdminRowFragment, row);
                return (
                  <TableRow key={admin.adminId || idx}>
                    <TableCell>
                      <div className="font-medium">{admin.adminName}</div>
                      <div className="text-xs text-muted-foreground">{admin.adminEmail}</div>
                    </TableCell>
                    <TableCell>
                      <Badge className="bg-black text-white">{admin.role}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {(admin.permissions || []).slice(0, 3).map((perm, i) => (
                          <Badge key={`${admin.adminId}-${i}`} variant="outline" className="text-xs">
                            {perm}
                          </Badge>
                        ))}
                        {admin.permissions && admin.permissions.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{admin.permissions.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/security/roles/${admin.adminId}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </Card>
    </section>
  );
}
