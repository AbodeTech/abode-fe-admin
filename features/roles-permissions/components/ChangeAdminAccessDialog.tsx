"use client";

import { useMemo, useState } from "react";
import { Link2Off, Loader2, Lock, Search, ShieldCheck } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAdminPermissions, useIsSuperAdmin } from "@/hooks/use-admin-permission";
import {
  SUPER_ADMIN_GRANT_ONLY_PERMISSIONS,
  isAdminPermission,
  isLandingPage,
  landingLabel,
} from "@/lib/rbac";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";

import { useSetAdminExtraPermissions, useSetAdminStartPage } from "../hooks/use-admin-access";
import {
  useAssociateProSearch,
  useLinkedAssociatePro,
  useSetAdminAssociatePro,
} from "../hooks/use-associate-pro-link";
import { usePermissions } from "../hooks/use-permissions";
import { useRoles } from "../hooks/use-roles";
import { useUpdateAdminRole } from "../hooks/use-update-admin-role";
import { associateProUserName } from "../schemas/admin-access.schema";
import type { AdminWithRole } from "../schemas/role.schema";

const VERBS = new Set([
  'view', 'manage', 'export', 'approve', 'edit', 'create', 'delete', 'update', 'run', 'send',
  'adjust', 'suspend', 'unsuspend', 'reassign', 'allocate', 'deallocate', 'modify', 'verify',
  'assign', 'add', 'remove', 'override', 'close', 'buy', 'generate', 'keep', 'route',
]);

/** `view_coupons` → "Coupons", `approve_purchase_confirmation` → "Purchase Confirmation": what the key is about. */
function areaOf(key: string): string {
  const parts = key.split('_');
  const rest = VERBS.has(parts[0]) && parts.length > 1 ? parts.slice(1) : parts;
  return rest.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}

const sameList = (a: string[], b: string[]) => a.length === b.length && a.every((v, i) => v === b[i]);
const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((v) => b.includes(v));

/**
 * Change what one person can do: which roles they hold (first = primary), any
 * single permissions on top, and where they start after sign-in. They get the
 * union of everything.
 *
 * Three endpoints, three keys, so each tab follows its own:
 *   roles           PATCH /admin/admins/:id/role              manage_roles
 *   extras          PUT   /admin/admins/:id/extra-permissions manage_admins
 *   starts on       PATCH /admin/admins/:id/start-page        manage_admins
 *   associate pro   PATCH|DELETE /admin/admins/:id/associate-pro manage_admins
 * The BE also refuses editing yourself, granting a key you do not hold, and any
 * super-admin-only key or role from a non-super admin. This dialog shows those
 * rows locked rather than letting the click fail, and still reports the BE's own
 * message if one slips through.
 */
export function ChangeAdminAccessDialog({ admin }: { admin: AdminWithRole }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-card text-foreground border-border hover:bg-muted"
        >
          <ShieldCheck className="h-3 w-3 mr-1" />
          Change access
        </Button>
      </DialogTrigger>
      {/* max-h + overflow: on a short screen the dialog scrolls instead of running off it. */}
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto bg-card border-border">
        {/* Mounted only while open, so every opening starts from the saved state. */}
        <AccessForm admin={admin} onDone={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

function AccessForm({ admin, onDone }: { admin: AdminWithRole; onDone: () => void }) {
  const me = useAuthStore((state) => state.user);
  const { has } = useAdminPermissions();
  const isSuperAdmin = useIsSuperAdmin();

  const { data: rolesData, isLoading: rolesLoading } = useRoles();
  const { data: poolData, isLoading: poolLoading } = usePermissions();
  const roles = useMemo(() => rolesData ?? [], [rolesData]);
  const pool = useMemo(() => poolData ?? [], [poolData]);

  const updateRoles = useUpdateAdminRole();
  const setStart = useSetAdminStartPage();
  const setExtras = useSetAdminExtraPermissions();
  const setPro = useSetAdminAssociatePro();
  const saving = updateRoles.isPending || setStart.isPending || setExtras.isPending || setPro.isPending;

  const originalRoleIds = useMemo(
    () => [admin.role_id, ...admin.additional_roles.map((role) => role.id)],
    [admin],
  );

  const [tab, setTab] = useState("roles");
  const [roleIds, setRoleIds] = useState<string[]>(originalRoleIds);
  const [extra, setExtra] = useState<string[]>(admin.extra_permissions);
  const [start, setStart_] = useState<string | null>(admin.start_page_choice);
  const [query, setQuery] = useState("");
  // The Associate Pro link: the user id to save (null = unlinked), and the search box for picking one.
  const [proId, setProId] = useState<string | null>(admin.associate_pro_user_id);
  const [proQuery, setProQuery] = useState("");

  // Each right follows its own key, and nobody edits themselves (the BE refuses).
  const isSelf = !!me && me.id === admin.id;
  const canEditRoles = has("manage_roles") && !isSelf;
  const canEditAccess = has("manage_admins") && !isSelf;

  // The roles they hold when the dialog opens come first, so they are not buried in a
  // long list. Ordered by the SAVED roles, not the live ticks: rows must not jump
  // while someone is clicking.
  const orderedRoles = useMemo(() => {
    const held = originalRoleIds
      .map((id) => roles.find((role) => role.id === id))
      .filter((role): role is NonNullable<typeof role> => !!role);
    return [...held, ...roles.filter((role) => !originalRoleIds.includes(role.id))];
  }, [roles, originalRoleIds]);

  const selectedRoles = roleIds
    .map((id) => roles.find((role) => role.id === id))
    .filter((role): role is NonNullable<typeof role> => !!role);

  // A permission a selected role already grants, and which role gives it first.
  const lockedBy = useMemo(() => {
    const map = new Map<string, string>();
    for (const role of selectedRoles) {
      for (const key of role.permissions) if (!map.has(key)) map.set(key, role.name);
    }
    return map;
  }, [selectedRoles]);

  const extraOnly = extra.filter((key) => !lockedBy.has(key));
  const effectiveCount = new Set([...lockedBy.keys(), ...extraOnly]).size;

  // The pages the selected roles can start on, primary role's first.
  const landings = [
    ...new Set(selectedRoles.map((role) => role.default_landing_page).filter(isLandingPage)),
  ];
  // Choosing the primary role's own page is the same as having no choice: null, so it follows
  // the primary role if that ever changes.
  const startToSend = start && start !== landings[0] && (landings as string[]).includes(start) ? start : null;

  // Which held roles each start page comes from, for the option labels.
  const rolesForLanding = (landing: string) =>
    selectedRoles.filter((role) => role.default_landing_page === landing).map((role) => role.name);

  const rolesChanged = !sameList(roleIds, originalRoleIds);
  const startChanged = startToSend !== (admin.start_page_choice ?? null);
  const extrasChanged = !sameSet(extraOnly, admin.extra_permissions);
  const proChanged = proId !== admin.associate_pro_user_id;
  const dirty = rolesChanged || startChanged || extrasChanged || proChanged;

  // Searching needs the Users list permission; showing who is linked needs a single user's.
  const canSearchUsers = has("view_users");
  const proSearch = useAssociateProSearch(proQuery.trim(), canSearchUsers && tab === "pro" && canEditAccess);
  const linkedUser = useLinkedAssociatePro(proId);

  /* ---------- roles ---------- */

  const toggleRole = (id: string, on: boolean) =>
    setRoleIds((prev) => (on ? [...prev, id] : prev.filter((existing) => existing !== id)));
  const makePrimary = (id: string) => setRoleIds((prev) => [id, ...prev.filter((x) => x !== id)]);

  /* ---------- extras ---------- */

  const toggleExtra = (key: string, on: boolean) =>
    setExtra((prev) => (on ? [...prev, key] : prev.filter((existing) => existing !== key)));

  const rowState = (key: string) => {
    const from = lockedBy.get(key);
    if (from) return { locked: true, tag: `From ${from}` };
    const isOn = extra.includes(key);
    const superOnly = SUPER_ADMIN_GRANT_ONLY_PERMISSIONS.has(key);
    // To ADD a key you must hold it; a super-admin-only key needs a super admin to add or remove.
    if (superOnly && !isSuperAdmin) return { locked: true, tag: "Super admin only" };
    if (!isOn && isAdminPermission(key) && !has(key)) return { locked: true, tag: "You don't hold this" };
    return { locked: false, tag: null as string | null };
  };

  const needle = query.trim().toLowerCase();
  const visiblePool = pool.filter(
    (permission) =>
      !needle ||
      permission.name.toLowerCase().includes(needle) ||
      permission.description.toLowerCase().includes(needle),
  );

  /* ---------- save ---------- */

  const handleSave = async () => {
    const failures: string[] = [];
    const message = (error: unknown, fallback: string) =>
      error instanceof Error && error.message ? error.message : fallback;

    // Roles first: which start pages are valid depends on them.
    let rolesOk = true;
    if (rolesChanged) {
      try {
        await updateRoles.mutateAsync({ adminId: admin.id, roleIds });
      } catch (error) {
        rolesOk = false;
        failures.push(`Roles: ${message(error, "could not be changed")}`);
      }
    }

    if (startChanged && rolesOk) {
      try {
        await setStart.mutateAsync({
          adminId: admin.id,
          start_page: startToSend && isLandingPage(startToSend) ? startToSend : null,
        });
      } catch (error) {
        failures.push(`Starts on: ${message(error, "could not be changed")}`);
      }
    }

    if (extrasChanged) {
      try {
        await setExtras.mutateAsync({ adminId: admin.id, permissions: extraOnly });
      } catch (error) {
        failures.push(`Extra permissions: ${message(error, "could not be changed")}`);
      }
    }

    if (proChanged) {
      try {
        await setPro.mutateAsync({ adminId: admin.id, userId: proId });
      } catch (error) {
        failures.push(`Associate Pro link: ${message(error, "could not be changed")}`);
      }
    }

    if (failures.length === 0) {
      toast.success(`Access updated for ${admin.name}.`);
      onDone();
      return;
    }
    // Stay open so nothing the person typed is lost; what did save is already refreshed.
    failures.forEach((failure) => toast.error(failure));
  };

  const loading = rolesLoading || poolLoading;

  // One min-w-0 wrapper: the dialog is a CSS grid, whose items refuse to shrink below their
  // widest unwrapped text, which pushed the whole dialog wider than a phone.
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <DialogHeader>
        <DialogTitle className="text-foreground">Change admin access</DialogTitle>
        <DialogDescription>
          Give a person several roles, and any single permissions on top. They get the union of
          everything below.
        </DialogDescription>
      </DialogHeader>

      <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted/30 p-3">
        <div className="min-w-0">
          <p className="font-medium text-foreground">{admin.name}</p>
          <p className="break-all text-sm text-muted-foreground">{admin.email}</p>
        </div>
        <div className="flex flex-wrap gap-1">
          {originalRoleIds.map((id, index) => (
            <Badge key={id} className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10">
              {index === 0 ? admin.role_name : admin.additional_roles[index - 1]?.name}
            </Badge>
          ))}
        </div>
      </div>

      {isSelf && (
        <div role="note" className="flex items-start gap-2 rounded-md border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-amber-700">
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          You can&apos;t change your own access. Ask another admin.
        </div>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        {/* Three tabs with their counts are wider than a phone: the bar fills the dialog and each label wraps inside its own tab, so nothing widens the dialog or overlaps what is below. */}
        <TabsList className="h-auto w-full items-stretch">
          <TabsTrigger value="roles" className="h-auto min-w-0 whitespace-normal px-1.5 py-1.5 text-xs sm:px-2 sm:text-sm">
            Roles <span className="ml-1 rounded-full bg-muted px-2 text-xs">{roleIds.length}</span>
          </TabsTrigger>
          <TabsTrigger value="extra" className="h-auto min-w-0 whitespace-normal px-1.5 py-1.5 text-xs sm:px-2 sm:text-sm">
            Extra permissions <span className="ml-1 rounded-full bg-muted px-2 text-xs">{extraOnly.length}</span>
          </TabsTrigger>
          <TabsTrigger value="pro" className="h-auto min-w-0 whitespace-normal px-1.5 py-1.5 text-xs sm:px-2 sm:text-sm">
            Associate Pro <span className="ml-1 rounded-full bg-muted px-2 text-xs">{proId ? "Linked" : "None"}</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="roles" className="space-y-2">
          {!has("manage_roles") && (
            <p className="text-xs text-muted-foreground">Changing roles needs the manage roles permission.</p>
          )}
          <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading roles…</p>
            ) : (
              orderedRoles.map((role) => {
                const on = roleIds.includes(role.id);
                const isPrimary = roleIds[0] === role.id;
                // The BE refuses a super-admin role from anyone who is not a super admin.
                const lockedRole = role.is_super_admin && !isSuperAdmin;
                const onlyOne = on && roleIds.length === 1;
                const disabled = !canEditRoles || saving || lockedRole || onlyOne;
                return (
                  <label
                    key={role.id}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-2",
                      disabled ? "cursor-default" : "cursor-pointer",
                      on && "border-foreground bg-muted/40",
                    )}
                  >
                    <Checkbox
                      checked={on}
                      disabled={disabled}
                      onCheckedChange={(checked) => toggleRole(role.id, checked === true)}
                      aria-label={role.name}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-foreground">{role.name}</span>
                        {isPrimary && (
                          <Badge variant="outline" className="text-[10px] uppercase">Primary</Badge>
                        )}
                        {lockedRole && (
                          <Badge variant="outline" className="text-[10px]">Super admin only</Badge>
                        )}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{role.description}</p>
                    </div>
                    {on && !isPrimary && canEditRoles && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(event) => {
                          // inside a label: do not also toggle the checkbox
                          event.preventDefault();
                          makePrimary(role.id);
                        }}
                        disabled={saving}
                      >
                        Make primary
                      </Button>
                    )}
                  </label>
                );
              })
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            The first role is the primary one: its page is where they start unless you choose another
            below.
          </p>
        </TabsContent>

        <TabsContent value="extra" className="space-y-2">
          {!has("manage_admins") && (
            <p className="text-xs text-muted-foreground">Extra permissions need the manage admins permission.</p>
          )}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search permissions"
              className="pl-9"
              aria-label="Search permissions"
            />
          </div>
          <p className="text-xs text-muted-foreground">Locked rows already come from a role.</p>
          <div className="max-h-64 space-y-1.5 overflow-y-auto pr-1">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading permissions…</p>
            ) : visiblePool.length === 0 ? (
              <p className="text-sm text-muted-foreground">No permission matches.</p>
            ) : (
              visiblePool.map((permission) => {
                const state = rowState(permission.name);
                const checked = state.locked && lockedBy.has(permission.name) ? true : extra.includes(permission.name);
                return (
                  <label
                    key={permission.name}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border border-border px-3 py-2",
                      state.locked ? "cursor-default bg-muted/40 opacity-80" : "cursor-pointer bg-card",
                      checked && !state.locked && "border-foreground bg-muted/40",
                    )}
                  >
                    <Checkbox
                      checked={checked}
                      disabled={state.locked || !canEditAccess || saving}
                      onCheckedChange={(value) => toggleExtra(permission.name, value === true)}
                      aria-label={permission.name}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-foreground">{permission.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{permission.description}</p>
                    </div>
                    {state.tag && (
                      <Badge variant="outline" className="shrink-0 text-[10px]">{state.tag}</Badge>
                    )}
                    <span className="hidden w-36 shrink-0 text-right text-xs text-muted-foreground sm:block">
                      {areaOf(permission.name)}
                    </span>
                  </label>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="pro" className="space-y-3">
          {!has("manage_admins") && (
            <p className="text-xs text-muted-foreground">Linking an Associate Pro needs the manage admins permission.</p>
          )}
          <p className="text-xs text-muted-foreground">
            Links this account to the person&apos;s own Associate Pro user, so the personal Associate Pro tracker
            shows their numbers. The user must be an Associate Pro and not linked to another admin.
          </p>

          <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-muted/30 p-3">
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Linked to</p>
              {proId ? (
                <>
                  <p className="font-medium text-foreground">
                    {linkedUser.data ? associateProUserName(linkedUser.data) : linkedUser.isLoading ? "Loading…" : "Associate Pro user"}
                  </p>
                  <p className="break-all text-xs text-muted-foreground">
                    {linkedUser.data?.email ? `${linkedUser.data.email} · ` : ""}
                    {proId}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Not linked</p>
              )}
            </div>
            {proId && canEditAccess && (
              <Button type="button" variant="outline" size="sm" disabled={saving} onClick={() => setProId(null)}>
                <Link2Off className="mr-1 h-3 w-3" />
                Remove link
              </Button>
            )}
          </div>

          {canEditAccess && (
            canSearchUsers ? (
              <>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={proQuery}
                    onChange={(event) => setProQuery(event.target.value)}
                    placeholder="Search Associate Pros by name or email"
                    className="pl-9"
                    aria-label="Search Associate Pros"
                  />
                </div>
                <div className="max-h-56 space-y-1.5 overflow-y-auto pr-1">
                  {proSearch.isLoading ? (
                    <p className="text-sm text-muted-foreground">Searching…</p>
                  ) : proSearch.isError ? (
                    <p className="text-sm text-destructive">Could not search users.</p>
                  ) : (proSearch.data ?? []).length === 0 ? (
                    <p className="text-sm text-muted-foreground">No Associate Pro matches.</p>
                  ) : (
                    (proSearch.data ?? []).map((user) => {
                      const selected = proId === user.id;
                      return (
                        <button
                          key={user.id}
                          type="button"
                          disabled={saving}
                          onClick={() => setProId(user.id)}
                          aria-pressed={selected}
                          className={cn(
                            "flex w-full items-center gap-3 rounded-lg border border-border bg-card px-3 py-2 text-left",
                            selected && "border-foreground bg-muted/40",
                          )}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium text-foreground">{associateProUserName(user)}</p>
                            <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                          </div>
                          {selected && <Badge variant="outline" className="text-[10px] uppercase">Selected</Badge>}
                        </button>
                      );
                    })
                  )}
                </div>
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Searching users needs the view users permission.</p>
            )
          )}
        </TabsContent>
      </Tabs>

      {/* Starts on: only the pages the chosen roles offer, which is all the BE accepts. */}
      <fieldset className="min-w-0 space-y-2" disabled={!canEditAccess || saving}>
        <legend className="text-sm font-medium text-foreground">Starts on</legend>
        <div className="flex flex-wrap gap-2">
          {landings.map((value, index) => (
            <StartOption
              key={value}
              checked={index === 0 ? startToSend === null : startToSend === value}
              onSelect={() => setStart_(index === 0 ? null : value)}
              label={`${rolesForLanding(value).join(" + ")} → ${landingLabel(value)}`}
              note={index === 0 ? "Default" : undefined}
            />
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          They sign in on {landingLabel(startToSend ?? landings[0])}. They can also change this
          themselves from the role chip in the header.
        </p>
      </fieldset>

      <div className="rounded-md border border-border bg-muted/30 p-3 text-sm">
        <p className="font-medium text-foreground">Effective access (what this person will actually get)</p>
        <p className="text-muted-foreground">
          {selectedRoles.map((role) => role.name).join(" + ") || "No role"} · {extraOnly.length} extra ·{" "}
          {effectiveCount} permissions in total · starts on {landingLabel(startToSend ?? landings[0])}.
          The sidebar and actions are the union of everything; nothing is taken away.
        </p>
      </div>

      <DialogFooter className="gap-2 sm:gap-2">
        <Button type="button" variant="outline" onClick={onDone} disabled={saving}>
          Cancel
        </Button>
        <Button type="button" onClick={handleSave} disabled={saving || !dirty || (!canEditRoles && !canEditAccess)}>
          {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {saving ? "Saving…" : "Save access"}
        </Button>
      </DialogFooter>
    </div>
  );
}

function StartOption({ checked, onSelect, label, note }: { checked: boolean; onSelect: () => void; label: string; note?: string }) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-full border border-border px-3 py-1 text-sm",
        checked && "border-foreground bg-muted/60 font-medium",
      )}
    >
      <input type="radio" name="starts-on" checked={checked} onChange={onSelect} className="sr-only" />
      {label}
      {note && <span className="text-xs text-muted-foreground">{note}</span>}
    </label>
  );
}
