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
import { AddFinancialOfficerDialog } from "./AddFinancialOfficerDialog";
import { RemoveFinancialOfficerDialog } from "./RemoveFinancialOfficerDialog";
import type { FinancialOfficerSummary } from "../schemas/financial-officer.schema";

interface Props {
  /** The officer selected in the page picker. Drives Remove; null in the team view. */
  activeOfficer: FinancialOfficerSummary | null;
}

export function ManageFinancialOfficersMenu({ activeOfficer }: Props) {
  const [openDialog, setOpenDialog] = useState<"add" | "remove" | null>(null);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="bg-white">
            Manage officers
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Officer actions</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setOpenDialog("add")}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Financial Officer
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onSelect={() => setOpenDialog("remove")}
            disabled={!activeOfficer}
            className="text-[#AD1F2A] focus:text-[#AD1F2A]"
          >
            <UserMinus className="h-4 w-4 mr-2" />
            Remove Financial Officer
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AddFinancialOfficerDialog
        open={openDialog === "add"}
        onOpenChange={(o) => !o && setOpenDialog(null)}
      />
      <RemoveFinancialOfficerDialog
        open={openDialog === "remove"}
        onOpenChange={(o) => !o && setOpenDialog(null)}
        officer={activeOfficer}
      />
    </>
  );
}
