"use client";

import { useState } from "react";
import { AlertCircle, Pencil, UserPlus, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReassignProDialog } from "./dialogs/ReassignProDialog";
import { getMockManagerForUser } from "../mock-data";

interface Props {
  user: {
    _id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    referral_status?: string | null;
  };
}

/**
 * Shown on the User Details page when the user is an Associate Pro.
 * Surfaces the user's assigned manager + a single-click reassign / assign action.
 *
 * Design-time only: uses `getMockManagerForUser(user._id)` to pretend a manager
 * is attached to the user. Replace with real data when the backend exposes
 * `assignedManager` on the user resource.
 */
export function ManagerAssignmentCard({ user }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);

  // Only render for Associate Pros.
  if (user.referral_status !== "associate-pro") return null;

  const currentManager = getMockManagerForUser(user._id);
  const proFullName = `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim() || "Associate Pro";

  return (
    <>
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#E0F2F1]">
              <UserCog className="h-5 w-5 text-[#00695C]" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Assigned Manager</p>
              {currentManager ? (
                <div className="mt-0.5">
                  <p className="text-base font-semibold text-gray-900">{currentManager.name}</p>
                  <p className="text-xs text-gray-500">{currentManager.email}</p>
                </div>
              ) : (
                <div className="mt-0.5 flex items-center gap-1.5 text-amber-700">
                  <AlertCircle className="h-4 w-4" />
                  <p className="text-sm font-medium">Unassigned</p>
                </div>
              )}
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={() => setDialogOpen(true)}>
            {currentManager ? (
              <>
                <Pencil className="h-3.5 w-3.5 mr-2" />
                Change
              </>
            ) : (
              <>
                <UserPlus className="h-3.5 w-3.5 mr-2" />
                Assign
              </>
            )}
          </Button>
        </div>
      </div>

      <ReassignProDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        pro={{
          id: user._id,
          name: proFullName,
          email: user.email ?? "",
        }}
        currentManager={currentManager}
      />
    </>
  );
}
