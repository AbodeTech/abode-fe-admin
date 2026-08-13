"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useDebounce } from "@/hooks/use-debounce";
import { useUserOptions, type UserOption } from "@/hooks/use-user-options";
import { cn } from "@/lib/utils";

/* ============================================================
 * Pick a user by name or email.
 *
 * Shared because two features identify users this way — commission override
 * subjects and the upgrade queue's manual upgrade. Search runs server-side
 * against `GET /admin/users`; pasting a 24-character ObjectId is kept as a
 * convenience for an admin arriving from a user's page with the id in hand.
 * ============================================================ */

/** A 24-character hex string — a Mongo ObjectId. */
const OBJECT_ID = /^[a-f\d]{24}$/i;

interface UserPickerProps {
  value: string;
  onChange: (userId: string, option?: UserOption) => void;
  disabled?: boolean;
  /** Shown when `value` is set but the user isn't in the current results. */
  fallbackLabel?: string | null;
  /** Empty-state label on the trigger. */
  placeholder?: string;
}

export function UserPicker({
  value,
  onChange,
  disabled,
  fallbackLabel,
  placeholder = "Select a user",
}: UserPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const { data: options, isFetching, isError } = useUserOptions(debouncedSearch, open);

  const selected = options?.find((option) => option.id === value);
  const label = selected?.label ?? fallbackLabel ?? (value || placeholder);

  const searchLooksLikeId = OBJECT_ID.test(search.trim());
  const useTypedId = () => {
    onChange(search.trim());
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className="w-full justify-between font-normal"
        >
          <span className={cn("truncate", !value && "text-muted-foreground")}>{label}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search by name or email, or paste a user ID…"
            value={search}
            onValueChange={setSearch}
          />
          {/* Tablet through 1024px: horizontal scroll so long names aren't clipped. */}
          <CommandList className="overflow-x-hidden md:max-[1024px]:overflow-x-auto">
            {isFetching ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching…
              </div>
            ) : null}

            {!isFetching && searchLooksLikeId ? (
              <CommandItem value={search} onSelect={useTypedId}>
                <Check className="mr-2 h-4 w-4 opacity-0" />
                Use ID <span className="ml-1 font-mono text-xs">{search.trim()}</span>
              </CommandItem>
            ) : null}

            {!isFetching && !searchLooksLikeId && (isError || (options?.length ?? 0) === 0) ? (
              <CommandEmpty>
                {isError
                  ? "User search failed. You can paste a user ID instead."
                  : search
                    ? "No users match that. You can paste a user ID instead."
                    : "Type a name or email to search."}
              </CommandEmpty>
            ) : null}

            {!isFetching &&
              options?.map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.id}
                  className="md:max-[1024px]:w-max"
                  onSelect={() => {
                    onChange(option.id, option);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      option.id === value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="min-w-0 truncate md:max-[1024px]:min-w-max">
                    {option.label}
                  </span>
                  {option.hint ? (
                    <span className="ml-2 shrink-0 truncate text-xs text-muted-foreground md:max-[1024px]:min-w-max">
                      {option.hint}
                    </span>
                  ) : null}
                </CommandItem>
              ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
