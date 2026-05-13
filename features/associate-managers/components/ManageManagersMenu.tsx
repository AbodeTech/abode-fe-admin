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
import { RemoveManagerDialog } from "./dialogs/RemoveManagerDialog";
import { ChangeManagerDialog } from "./dialogs/ChangeManagerDialog";
import type { AssociateManager } from "../mock-data";

interface Props {
  activeManager?: AssociateManager;
}

export function ManageManagersMenu({ activeManager }: Props) {
  const [openDialog, setOpenDialog] = useState<"add" | "remove" | "change" | null>(null);

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
          <DropdownMenuItem onSelect={() => setOpenDialog("change")}>
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Change Associate Manager
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => setOpenDialog("remove")}
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
        manager={activeManager}
      />
      <ChangeManagerDialog
        open={openDialog === "change"}
        onOpenChange={(o) => !o && setOpenDialog(null)}
        fromManager={activeManager}
      />
    </>
  );
}
