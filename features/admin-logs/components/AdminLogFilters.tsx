"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, ChevronsUpDown, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

import { ADMIN_LOG_ACTIONS, formatAdminLogAction } from "../schemas/admin-log.schema";
import { useAdminLogAdmins } from "../hooks/use-admin-logs";

/** URL keys. `admin` holds an admin's id; the old email `query` param is gone with v1. */
export const ADMIN_LOG_PARAMS = { admin: "admin", action: "action" } as const;

interface Option {
  value: string;
  label: string;
  /** Extra text cmdk matches on, e.g. the email behind a name. */
  keywords?: string;
}

function SearchSelect({
  value,
  options,
  placeholder,
  searchPlaceholder,
  allLabel,
  disabled,
  onChange,
}: {
  value: string | null;
  options: Option[];
  placeholder: string;
  searchPlaceholder: string;
  allLabel: string;
  disabled?: boolean;
  onChange: (value: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="h-10 w-full min-w-0 justify-between bg-white font-normal sm:h-9 sm:w-64"
        >
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected?.label ?? placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) min-w-64 p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>Nothing matches.</CommandEmpty>
            <CommandItem
              value={`__all__ ${allLabel}`}
              onSelect={() => {
                onChange(null);
                setOpen(false);
              }}
            >
              <Check className={cn("mr-2 h-4 w-4", value ? "opacity-0" : "opacity-100")} />
              {allLabel}
            </CommandItem>
            {options.map((option) => (
              <CommandItem
                key={option.value}
                value={`${option.label} ${option.keywords ?? ""} ${option.value}`}
                onSelect={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn("mr-2 h-4 w-4", option.value === value ? "opacity-100" : "opacity-0")}
                />
                <span className="truncate">{option.label}</span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

const ACTION_OPTIONS: Option[] = [...ADMIN_LOG_ACTIONS]
  .map((action) => ({ value: action, label: formatAdminLogAction(action) }))
  .sort((a, b) => a.label.localeCompare(b.label));

export function AdminLogFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const adminId = searchParams.get(ADMIN_LOG_PARAMS.admin);
  const action = searchParams.get(ADMIN_LOG_PARAMS.action);

  const admins = useAdminLogAdmins();

  const adminOptions = useMemo<Option[]>(
    () =>
      (admins.data ?? [])
        .map((a) => {
          const name = [a.firstName, a.lastName].filter(Boolean).join(" ").trim();
          return {
            value: a._id,
            label: name ? `${name} (${a.email})` : a.email,
            keywords: a.email,
          };
        })
        .sort((a, b) => a.label.localeCompare(b.label)),
    [admins.data]
  );

  const setParam = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.set("page", "1");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const clearAll = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(ADMIN_LOG_PARAMS.admin);
    params.delete(ADMIN_LOG_PARAMS.action);
    params.set("page", "1");
    router.push(`?${params.toString()}`, { scroll: false });
  };

  const adminsUnavailable = Boolean(admins.error);

  return (
    <div className="space-y-2">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <SearchSelect
          value={adminId}
          options={adminOptions}
          placeholder={admins.isLoading ? "Loading admins…" : "All admins"}
          searchPlaceholder="Search name or email…"
          allLabel="All admins"
          disabled={admins.isLoading || adminsUnavailable}
          onChange={(v) => setParam(ADMIN_LOG_PARAMS.admin, v)}
        />
        <SearchSelect
          value={action}
          options={ACTION_OPTIONS}
          placeholder="All actions"
          searchPlaceholder="Search actions…"
          allLabel="All actions"
          onChange={(v) => setParam(ADMIN_LOG_PARAMS.action, v)}
        />
        {(adminId || action) && (
          <Button type="button" variant="ghost" size="sm" className="w-full sm:w-auto" onClick={clearAll}>
            <X className="mr-1 h-4 w-4" /> Clear filters
          </Button>
        )}
      </div>
      {adminsUnavailable && (
        <p className="text-xs text-muted-foreground">
          Filtering by admin needs permission to view admins. You can still filter by action.
        </p>
      )}
    </div>
  );
}
