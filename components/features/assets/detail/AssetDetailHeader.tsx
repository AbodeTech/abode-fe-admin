"use client";

import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import Link from "next/link";
// import { usePermissionStore } from "@/store/usePermissionStore"; // TODO: Port permission store

interface AssetDetailHeaderProps {
  assetName: string;
  assetType: string;
}

export function AssetDetailHeader({ assetName, assetType }: AssetDetailHeaderProps) {
  // const { permissions } = usePermissionStore()
  // const canDisable = permissions.includes("manage_assets")
  const canDisable = true; // Mocking permissions for now matching other parts of migration

  const [showDisableDialog, setShowDisableDialog] = useState(false);

  const handleDisableAsset = () => {
    // Implement the logic to disable the asset here
    console.log("Asset disabled");
    setShowDisableDialog(false);
  };

  return (
    <header className="bg-background border-b mb-6">
      <div className="container mx-auto py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">{decodeURIComponent(assetName)}</h1>
        {canDisable && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">Asset actions</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/assets/${assetType}/edit/${encodeURIComponent(assetName)}`}>
                  Edit asset
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => setShowDisableDialog(true)}>
                Disable asset
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure you want to disable this asset?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will disable the asset and remove it from active listings.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDisableAsset}>Disable Asset</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </header>
  );
}
