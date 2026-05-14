"use client";

import { useRoles, useAdminsWithRoles } from "@/features/roles-permissions";
import { RolesGrid } from "@/features/roles-permissions";
import { AdminsTable } from "@/features/roles-permissions";

export default function RolesPage() {
  const { data: roles, isLoading: loadingRoles, error: rolesError } = useRoles();
  const { data: admins, isLoading: loadingAdmins, error: adminsError } = useAdminsWithRoles();

  if (rolesError || adminsError) {
    return (
      <div className="mx-auto w-full min-w-0 max-w-[1600px] px-3 sm:px-4">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
          <h3 className="font-bold">Error loading roles & permissions</h3>
          <p>{(rolesError as Error)?.message || (adminsError as Error)?.message || "An unexpected error occurred."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto mt-4 w-full min-w-0 max-w-[1600px] space-y-8 px-3 pb-16 sm:px-4 sm:pb-20">
      <RolesGrid roles={roles} isLoading={loadingRoles} />
      <AdminsTable admins={admins} isLoading={loadingAdmins} />
    </div>
  );
}
