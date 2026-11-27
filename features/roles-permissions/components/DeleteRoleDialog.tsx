"use client";

import Link from "next/link";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { useRoleAdmins } from "../hooks/use-roles";
import { useDeleteRole } from "../hooks/use-update-role";
import { adminOnRoleName, type Role } from "../schemas/role.schema";

/**
 * Delete a custom role. The backend only allows it for a role that is neither system nor
 * super-admin and that nobody holds. When admins still hold it, this lists them with a link to
 * each one's access page, so the role can be emptied first and then deleted: that is the
 * reassignment step the backend demands (`ROLE_HAS_ASSIGNED_ADMINS`).
 */
export function DeleteRoleDialog({
  role,
  open,
  onOpenChange,
}: {
  role: Role;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const hasAdmins = role.admin_count > 0;
  const admins = useRoleAdmins(open && hasAdmins ? role.id : null);
  const { mutateAsync, isPending } = useDeleteRole();

  const handleDelete = async () => {
    try {
      await mutateAsync(role.id);
      toast.success(`Role ${role.name} deleted`);
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error && error.message ? error.message : "Could not delete the role");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] w-[calc(100vw-2rem)] max-w-lg overflow-y-auto sm:w-full">
        <DialogHeader>
          <DialogTitle>Delete role</DialogTitle>
          <DialogDescription>
            {hasAdmins ? (
              <>
                <span className="font-mono">{role.name}</span> is still held by {role.admin_count} admin
                {role.admin_count === 1 ? "" : "s"}. Move them to another role first,
                then delete it.
              </>
            ) : (
              <>
                Delete <span className="font-mono">{role.name}</span>? Nobody holds it. This can&apos;t be undone, and the name
                can&apos;t be renamed back.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        {hasAdmins && (
          <div className="min-w-0 space-y-2">
            {admins.isLoading ? (
              <p className="text-sm text-muted-foreground">Loading admins…</p>
            ) : admins.isError ? (
              <p className="text-sm text-destructive">Could not load who holds this role.</p>
            ) : (
              <ul className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
                {(admins.data?.admins ?? []).map((admin) => (
                  <li
                    key={admin.id}
                    className="flex min-w-0 items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{adminOnRoleName(admin)}</p>
                      <p className="truncate text-xs text-muted-foreground">{admin.email}</p>
                    </div>
                    <Button asChild variant="outline" size="sm" className="shrink-0">
                      <Link href={`/security/roles/${admin.id}`} onClick={() => onOpenChange(false)}>
                        Change access
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <DialogFooter className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            {hasAdmins ? "Close" : "Cancel"}
          </Button>
          {!hasAdmins && (
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete role
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
