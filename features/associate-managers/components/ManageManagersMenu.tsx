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
import type { AssociateManagerListItem } from "@/lib/gql/graphql";

interface Props {
  /** The currently-selected manager from the page dropdown. Drives Remove/Change. */
  activeManager: AssociateManagerListItem | null;
}

const fullName = (m?: AssociateManagerListItem["manager"] | null) =>
  `${m?.firstName ?? ""} ${m?.lastName ?? ""}`.trim() ||
  m?.userName ||
  m?.email ||
  "Manager";

const initialsOf = (m?: AssociateManagerListItem["manager"] | null) =>
  ((m?.firstName?.[0] ?? "") + (m?.lastName?.[0] ?? "")).toUpperCase() || "?";

const toManagerDisplay = (
  item: AssociateManagerListItem | null
): ManagerDisplay | undefined => {
  const id = item?.manager?._id;
  if (!id) return undefined;
  return {
    id,
    name: fullName(item.manager),
    email: item.manager?.email ?? "",
    avatarInitials: initialsOf(item.manager),
    assignedProsCount: item.associate_pros_count ?? 0,
  };
};

export function ManageManagersMenu({ activeManager }: Props) {
  const [openDialog, setOpenDialog] = useState<
    "add" | "remove" | "change" | null
  >(null);

  const display = toManagerDisplay(activeManager);
  const activeManagerId = activeManager?.manager?._id ?? null;

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
