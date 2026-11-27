"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { PermissionOption } from "../schemas/role.schema";

/**
 * The permission checklist a role is made of: search, one row per key with its description,
 * and a running count. Selection is by permission NAME, because the backend validates names
 * against its pool and `GET /admin/permissions` returns no ids.
 *
 * Shared by Create role and Edit role so the two cannot drift apart.
 */
export function RolePermissionPicker({
  permissions,
  selected,
  onToggle,
  loading,
  disabled,
}: {
  permissions: PermissionOption[];
  selected: string[];
  onToggle: (name: string, checked: boolean) => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return permissions;
    return permissions.filter(
      (permission) =>
        permission.name.toLowerCase().includes(needle) || permission.description.toLowerCase().includes(needle),
    );
  }, [permissions, query]);

  return (
    <div className="min-w-0">
      <Label className="text-base font-semibold">Permissions</Label>
      <div className="relative mt-3">
        <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search permissions"
          className="pl-9"
          aria-label="Search permissions"
        />
      </div>
      {/* `relative` is load-bearing: inside a form each Radix checkbox adds a hidden absolutely-positioned
          input. Without a positioned ancestor here, those inputs escape this list's clipping and stretch the
          dialog's own scroll area by the height of the whole list (157 rows of blank scroll). */}
      <div className="relative mt-2 max-h-60 space-y-3 overflow-y-auto rounded-lg border border-border p-4">
        {loading ? (
          <div className="text-sm text-muted-foreground">Loading permissions...</div>
        ) : visible.length === 0 ? (
          <div className="text-sm text-muted-foreground">No permission matches.</div>
        ) : (
          visible.map((permission) => (
            <div key={permission.name} className="flex items-start space-x-3">
              <Checkbox
                id={`perm-${permission.name}`}
                checked={selected.includes(permission.name)}
                onCheckedChange={(checked) => onToggle(permission.name, Boolean(checked))}
                disabled={disabled}
              />
              <div className="min-w-0 flex-1">
                <Label htmlFor={`perm-${permission.name}`} className="cursor-pointer break-all text-sm font-medium">
                  {permission.name}
                </Label>
                <p className="mt-1 text-xs text-muted-foreground">{permission.description}</p>
              </div>
            </div>
          ))
        )}
      </div>
      {permissions.length > 0 && (
        <div className="mt-2 text-sm text-muted-foreground">
          {selected.length} of {permissions.length} selected
        </div>
      )}
    </div>
  );
}
