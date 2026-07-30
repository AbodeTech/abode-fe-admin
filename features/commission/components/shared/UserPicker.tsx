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
import { cn } from "@/lib/utils";

import { useUserOptions } from "../../hooks/use-user-options";

/** A 24-character hex string — a Mongo ObjectId. */
const OBJECT_ID = /^[a-f\d]{24}$/i;

interface UserPickerProps {
  value: string;
  onChange: (userId: string) => void;
  disabled?: boolean;
  /** Shown when `value` is set but the user isn't in the current results. */
  fallbackLabel?: string | null;
}

export function UserPicker({ value, onChange, disabled, fallbackLabel }: UserPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const { data: options, isFetching, isError } = useUserOptions(debouncedSearch, open);

  const selected = options?.find((option) => option.id === value);
  const label = selected?.label ?? fallbackLabel ?? (value || "Select a referrer");

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
          <CommandList>
            {isFetching ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching…
              </div>
            ) : null}

            {/*
              User search is unavailable until the backend's /admin/users
              handler is implemented (⛔ ticket 2). Rather than blocking the
              whole override, an admin who already has the id can use it.
            */}
            {!isFetching && searchLooksLikeId ? (
              <CommandItem value={search} onSelect={useTypedId}>
                <Check className="mr-2 h-4 w-4 opacity-0" />
                Use ID <span className="ml-1 font-mono text-xs">{search.trim()}</span>
              </CommandItem>
            ) : null}

            {!isFetching && !searchLooksLikeId && (isError || (options?.length ?? 0) === 0) ? (
              <CommandEmpty>
                {isError
                  ? "Referrer search is unavailable. Paste a user ID instead."
                  : "No referrers found. You can paste a user ID instead."}
              </CommandEmpty>
            ) : null}

            {!isFetching &&
              options?.map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.id}
                  onSelect={() => {
                    onChange(option.id);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      option.id === value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <span className="min-w-0 truncate">{option.label}</span>
                  {option.hint ? (
                    <span className="ml-2 shrink-0 truncate text-xs text-muted-foreground">
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
