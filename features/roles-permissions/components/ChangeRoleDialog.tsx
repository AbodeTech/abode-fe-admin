import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Edit, Loader2 } from "lucide-react";
import { AdminRowFragmentFragment } from "@/lib/gql/graphql";
import { useRoles } from "../hooks/use-roles";
import { useUpdateAdminRole } from "../hooks/use-update-admin-role";
import { FragmentType, useFragment as getFragmentData } from "@/lib/gql";
import { RoleCardFragment } from "@/features/roles-permissions/components/RolesGrid";
import { toast } from "sonner";

interface ChangeRoleDialogProps {
  admin: AdminRowFragmentFragment;
}

export function ChangeRoleDialog({ admin }: ChangeRoleDialogProps) {
  const [open, setOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState(admin.roleId || "");

  const { data: rolesData, isLoading: rolesLoading } = useRoles();
  const { mutate: updateAdminRole, isPending } = useUpdateAdminRole();

  const roles = (rolesData || []).map(r => getFragmentData(RoleCardFragment, r));
  const selectedRole = roles.find((role) => role?._id === selectedRoleId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRoleId) {
      toast.error("Please select a role");
      return;
    }

    if (selectedRoleId === admin.roleId) {
      toast.info("No changes made - same role selected");
      setOpen(false);
      return;
    }

    if (!admin.adminId) {
      toast.error("Cannot change role. Admin ID is missing");
      return;
    }

    updateAdminRole(
      { id: admin.adminId, role: selectedRoleId },
      {
        onSuccess: () => {
          setOpen(false);
          toast.success("Admin role updated successfully");
        },
      }
    );
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!isPending) {
      setOpen(newOpen);
      if (!newOpen) {
        // Reset selected role when dialog closes
        setSelectedRoleId(admin.roleId || "");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-card text-foreground border-border hover:bg-muted"
          disabled={isPending}
        >
          <Edit className="h-3 w-3 mr-1" />
          Change Role
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-foreground">Change Admin Role</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Admin Info */}
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Admin
              </Label>
              <div className="mt-1 p-3 bg-muted/30 rounded-md border border-border">
                <p className="font-medium text-foreground">{admin.adminName}</p>
                <p className="text-sm text-muted-foreground">
                  {admin.adminEmail}
                </p>
              </div>
            </div>

            {/* Current Role */}
            <div>
              <Label className="text-sm font-medium text-muted-foreground">
                Current Role
              </Label>
              <div className="mt-1 p-3 bg-muted/30 rounded-md border border-border">
                <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                  {admin.role}
                </Badge>
              </div>
            </div>

            {/* New Role Selection */}
            <div>
              <Label htmlFor="role" className="text-foreground">
                New Role
              </Label>
              <Select
                value={selectedRoleId}
                onValueChange={setSelectedRoleId}
                disabled={rolesLoading || isPending}
              >
                <SelectTrigger className="mt-1 border-border bg-card">
                  <SelectValue
                    placeholder={
                      rolesLoading ? "Loading roles..." : "Select a role"
                    }
                  />
                </SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {roles.map((role) => (
                    <SelectItem
                      key={role?._id}
                      value={role?._id || ""}
                      className="hover:bg-muted/50 focus:bg-muted"
                    >
                      <div className="flex flex-col text-left">
                        <span className="font-medium">{role?.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {role?.description}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Preview New Permissions */}
            {selectedRole && selectedRole._id !== admin.roleId && (
              <div>
                <Label className="text-sm font-medium text-muted-foreground">
                  New Permissions
                </Label>
                <div className="mt-2 p-3 bg-primary/5 rounded-md border border-primary/10">
                  {selectedRole.permissions &&
                    selectedRole.permissions.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {selectedRole.permissions.map((permission: any, index: number) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="text-xs bg-card border-border text-foreground"
                        >
                          {String(permission)}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      No permissions available
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Warning for same role */}
            {selectedRoleId === admin.roleId && selectedRoleId && (
              <div className="p-3 bg-amber-500/10 rounded-md border border-amber-500/20">
                <p className="text-sm text-amber-600 dark:text-amber-400">
                  This admin already has the selected role.
                </p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isPending}
              className="border-border text-foreground hover:bg-muted"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={
                isPending || !selectedRoleId || selectedRoleId === admin.roleId
              }
            >
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? "Updating..." : "Change Role"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
