"use client";

import { useState } from "react";
import { ChevronDown, UserMinus, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AddCSManagerDialog } from "./AddCSManagerDialog";
import { RemoveCSManagerDialog } from "./RemoveCSManagerDialog";
import type { CSManagerSummary } from "../schemas/cs-manager.schema";

interface Props {
  /** The currently-selected manager from the page dropdown. Drives Remove. */
  activeManager: CSManagerSummary | null;
}

export function ManageCSManagersMenu({ activeManager }: Props) {
  const [openDialog, setOpenDialog] = useState<"add" | "remove" | null>(null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="bg-white">
            Manage CS Managers
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Manager actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setOpenDialog("add")}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add CS Manager
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => setOpenDialog("remove")}
            disabled={!activeManager}
            className="text-[#AD1F2A] focus:text-[#AD1F2A]"
          >
            <UserMinus className="h-4 w-4 mr-2" />
            Remove CS Manager
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AddCSManagerDialog
        open={openDialog === "add"}
        onOpenChange={(o) => !o && setOpenDialog(null)}
      />
      <RemoveCSManagerDialog
        open={openDialog === "remove"}
        onOpenChange={(o) => !o && setOpenDialog(null)}
        manager={activeManager}
      />
    </>
  );
}
