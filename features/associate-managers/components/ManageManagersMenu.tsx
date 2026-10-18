"use client";

import { useState } from "react";
import { ChevronDown, UserPlus, UserMinus, ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { AddManagerDialog } from "./dialogs/AddManagerDialog";
import {
  RemoveManagerDialog,
  type ManagerDisplay,
} from "./dialogs/RemoveManagerDialog";
import { ChangeManagerDialog } from "./dialogs/ChangeManagerDialog";
import {
  managerDisplayName,
  managerInitials,
  type ManagerListItem,
} from "../schemas/associate-manager.schema";

interface Props {
  /** The currently-selected manager from the page dropdown. Drives Remove/Change. */
  activeManager: ManagerListItem | null;
}

const toManagerDisplay = (item: ManagerListItem | null): ManagerDisplay | undefined => {
  if (!item) return undefined;
  return {
    id: item.manager_id,
    name: managerDisplayName(item),
    // The payload carries no admin email — see `managerDisplayName`.
    email: "",
    avatarInitials: managerInitials(item),
    assignedProsCount: item.roster_size,
  };
};

export function ManageManagersMenu({ activeManager }: Props) {
  const [openDialog, setOpenDialog] = useState<
    "add" | "remove" | "change" | null
  >(null);

  const display = toManagerDisplay(activeManager);
  const activeManagerId = activeManager?.manager_id ?? null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="bg-white">
            Manage Managers
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Manager actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setOpenDialog("add")}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Associate Manager
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => setOpenDialog("change")}
            disabled={!activeManagerId}
          >
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Change Associate Manager
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => setOpenDialog("remove")}
            disabled={!display}
            className="text-[#AD1F2A] focus:text-[#AD1F2A]"
          >
            <UserMinus className="h-4 w-4 mr-2" />
            Remove Associate Manager
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AddManagerDialog
        open={openDialog === "add"}
        onOpenChange={(o) => !o && setOpenDialog(null)}
      />
      <RemoveManagerDialog
        open={openDialog === "remove"}
        onOpenChange={(o) => !o && setOpenDialog(null)}
        manager={display}
      />
      <ChangeManagerDialog
        open={openDialog === "change"}
        onOpenChange={(o) => !o && setOpenDialog(null)}
        fromManagerId={activeManagerId}
      />
    </>
  );
}
