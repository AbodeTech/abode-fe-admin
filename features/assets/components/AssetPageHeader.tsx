"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
// Importing permission store if it exists, otherwise defaulting to true for now
// import { usePermissionStore } from "@/store/store/admin/usePermissionsStore";

export function AssetPageHeader() {
  // const { permissions } = usePermissionStore();
  // const canCreate = permissions.includes("manage_assets");
  const canCreate = true; // Temporary default until permission store is ported

  return (
    <div className="mb-6 flex min-w-0 flex-col gap-3 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Assets</h1>
      {canCreate && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full shrink-0 sm:w-auto">
              Create Asset <PlusCircle className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem>
              <Link href="/assets/create-flex" className="w-full">
                Create Flex Asset
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Link href="/assets/create-full-ownership" className="w-full">
                Create Full Ownership Asset
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}
