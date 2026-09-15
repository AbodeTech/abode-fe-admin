"use client";

import { useState } from "react";
import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface PickupLocationInputProps {
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
}

/**
 * Free-text chip input for pickup-point names. Unlike `components/ui/multi-select.tsx`
 * (a combobox over a fixed option list), the admin here types arbitrary
 * location names — Enter or "Add" commits the current input as a removable
 * badge, backed by local `string[]` state until the surrounding form submits.
 */
export function PickupLocationInput({ value, onChange, placeholder = "e.g. Ikeja bus park", className }: PickupLocationInputProps) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    const name = draft.trim();
    if (!name) return;
    if (value.some((existing) => existing.toLowerCase() === name.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...value, name]);
    setDraft("");
  };

  const remove = (name: string) => {
    onChange(value.filter((item) => item !== name));
  };

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex gap-2">
        <Input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commit();
            }
          }}
          placeholder={placeholder}
          className="min-w-0"
        />
        <Button type="button" variant="outline" onClick={commit} disabled={!draft.trim()}>
          Add
        </Button>
      </div>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((name) => (
            <Badge variant="secondary" key={name} className="gap-1 py-1 pl-2.5 pr-1.5">
              {name}
              <button
                type="button"
                className="ml-1 rounded-full outline-none ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2"
                onClick={() => remove(name)}
                aria-label={`Remove ${name}`}
              >
                <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
