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

import { useAssetOptions } from "../../hooks/use-asset-options";

interface AssetPickerProps {
  value: string;
  onChange: (assetId: string) => void;
  disabled?: boolean;
  /** Shown when `value` is set but the asset isn't in the current result page. */
  fallbackLabel?: string | null;
}

export function AssetPicker({ value, onChange, disabled, fallbackLabel }: AssetPickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const { data: options, isFetching } = useAssetOptions(debouncedSearch);

  const selected = options?.find((option) => option.id === value);
  // An edit opens with an id whose asset may not be in the default page, so
  // fall back to the name carried on the row, then to the raw id.
  const label = selected?.label ?? fallbackLabel ?? (value ? value : "Select an asset");

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
        {/* The backend regex-searches name and location, so filtering is
            server-side; shouldFilter={false} stops cmdk filtering it again. */}
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search assets…"
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {isFetching ? (
              <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Searching…
              </div>
            ) : (
              <CommandEmpty>No assets found.</CommandEmpty>
            )}

            {options?.map((option) => (
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
                <span className="truncate">{option.label}</span>
              </CommandItem>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
