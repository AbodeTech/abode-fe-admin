"use client";

import { Loader2 } from "lucide-react";
import { useRoles, useAdminsWithRoles } from "@/features/roles-permissions";
import { RolesGrid } from "@/features/roles-permissions";
import { AdminsTable } from "@/features/roles-permissions";

export default function RolesPage() {
  const { data: roles, isLoading: loadingRoles, error: rolesError } = useRoles();
  const { data: admins, isLoading: loadingAdmins, error: adminsError } = useAdminsWithRoles();

  const isLoading = loadingRoles || loadingAdmins;

  if (rolesError || adminsError) {
    return (
      <div className="p-4 rounded-md bg-red-50 text-red-500 border border-red-200">
        <h3 className="font-bold">Error loading roles & permissions</h3>
        <p>{(rolesError as Error)?.message || (adminsError as Error)?.message || "An unexpected error occurred."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {(isLoading) && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading roles & admins...
        </div>
      )}

      <RolesGrid roles={roles} isLoading={loadingRoles} />
      <AdminsTable admins={admins} isLoading={loadingAdmins} />
    </div>
  );
}
