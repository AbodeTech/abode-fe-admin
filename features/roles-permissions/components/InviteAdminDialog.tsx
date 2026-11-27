"use client";

import { useMemo, useState } from "react";
import { Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useIsSuperAdmin } from "@/hooks/use-admin-permission";
import { landingLabel } from "@/lib/rbac";
import { cn } from "@/lib/utils";

import { useInviteAdmin } from "../hooks/use-invite-admin";
import { useRoles } from "../hooks/use-roles";
import { inviteAdminSchema } from "../schemas/admin-access.schema";

/**
 * Invite a new admin: an email and one or more roles (the first is primary). The BE emails
 * them a temporary password. Needs `manage_admins`; callers decide whether to show the
 * button, the BE refuses anyone without it.
 */
export function InviteAdminDialog({ variant = "default" }: { variant?: "default" | "outline" }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite Admin
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        {/* Mounted only while open, so every opening starts empty. */}
        <InviteForm onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function InviteForm({ onDone }: { onDone: () => void }) {
  const isSuperAdmin = useIsSuperAdmin();
  const { data: rolesData, isLoading: rolesLoading, error: rolesError } = useRoles();
  const roles = useMemo(() => rolesData ?? [], [rolesData]);
  const { mutateAsync, isPending } = useInviteAdmin();

  const [email, setEmail] = useState("");
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [touched, setTouched] = useState(false);

  const parsed = inviteAdminSchema.safeParse({ email: email.trim(), role_ids: roleIds });
  const emailError = touched && !parsed.success ? parsed.error.issues.find((i) => i.path[0] === "email")?.message : undefined;
  const roleError = touched && !parsed.success ? parsed.error.issues.find((i) => i.path[0] === "role_ids")?.message : undefined;

  const toggleRole = (id: string, on: boolean) =>
    setRoleIds((prev) => (on ? [...prev, id] : prev.filter((existing) => existing !== id)));
  const makePrimary = (id: string) => setRoleIds((prev) => [id, ...prev.filter((x) => x !== id)]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setTouched(true);
    if (!parsed.success) return;
    try {
      const result = await mutateAsync(parsed.data);
      toast.success(result.message || `Invite sent to ${result.email}.`);
      onDone();
    } catch (error) {
      // The BE's own words: "Email is already registered", "Only a super admin can assign…".
      toast.error(error instanceof Error && error.message ? error.message : "Could not send the invite. Try again.");
    }
  };

  const primary = roles.find((role) => role.id === roleIds[0]);

  return (
    <form className="flex min-w-0 flex-col gap-4" onSubmit={submit} noValidate>
      <DialogHeader>
        <DialogTitle>Invite Admin</DialogTitle>
        <DialogDescription>
          They get an email with a temporary password and must change it when they first sign in.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label htmlFor="invite-email">Email</Label>
        <Input
          id="invite-email"
          type="email"
          autoComplete="off"
          placeholder="admin@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          aria-invalid={!!emailError}
          disabled={isPending}
        />
        {emailError && <p className="text-sm text-destructive">{emailError}</p>}
      </div>

      {/* min-w-0: a fieldset sizes itself to its widest unwrapped text by default, which pushed the whole dialog wider than the screen. */}
      <fieldset className="min-w-0 space-y-2" disabled={isPending}>
        <legend className="text-sm font-medium">Roles</legend>
        <p className="text-xs text-muted-foreground">
          Pick one or more. They get everything the roles grant together. The first is the primary role: its
          page is where they start{primary ? ` (${landingLabel(primary.default_landing_page)})` : ""}.
        </p>
        {/* `relative` keeps each checkbox's hidden form input inside this list's clipping. */}
        <div className="relative max-h-64 space-y-2 overflow-y-auto pr-1">
          {rolesLoading ? (
            <p className="text-sm text-muted-foreground">Loading roles…</p>
          ) : rolesError ? (
            <p className="text-sm text-destructive">
              Could not load the roles{rolesError instanceof Error && rolesError.message ? `: ${rolesError.message}` : "."}
            </p>
          ) : (
            roles.map((role) => {
              const on = roleIds.includes(role.id);
              const isPrimary = roleIds[0] === role.id;
              // The BE refuses a super-admin role from anyone who is not a super admin.
              const locked = role.is_super_admin && !isSuperAdmin;
              return (
                <label
                  key={role.id}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2",
                    locked ? "cursor-default opacity-70" : "cursor-pointer",
                    on && "border-foreground bg-muted/40",
                  )}
                >
                  <Checkbox
                    checked={on}
                    disabled={locked}
                    onCheckedChange={(checked) => toggleRole(role.id, checked === true)}
                    aria-label={role.name}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{role.name}</span>
                      {isPrimary && <Badge variant="outline" className="text-[10px] uppercase">Primary</Badge>}
                      {locked && <Badge variant="outline" className="text-[10px]">Super admin only</Badge>}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">{role.description}</p>
                  </div>
                  {on && !isPrimary && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={(event) => {
                        event.preventDefault();
                        makePrimary(role.id);
                      }}
                    >
                      Make primary
                    </Button>
                  )}
                </label>
              );
            })
          )}
        </div>
        {roleError && <p className="text-sm text-destructive">{roleError}</p>}
      </fieldset>

      <DialogFooter className="gap-2 sm:gap-2">
        <Button type="button" variant="outline" onClick={onDone} disabled={isPending}>
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isPending ? "Sending…" : "Send invite"}
        </Button>
      </DialogFooter>
    </form>
  );
}
