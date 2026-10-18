"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Free-text list input — type a value, press Enter, get a removable chip.
 *
 * Used for fields the backend types as `string[]` (`amenities`, `landmark`).
 * The obvious alternative is one text box split on commas at submit, which is
 * what this replaced: it can't represent a value containing a comma, shows no
 * feedback until after a save, and turns a mistyped separator into one long
 * entry without complaint.
 *
 * `multi-select.tsx` is the wrong tool here — it picks from a fixed option
 * list, and these are open vocabularies.
 */
export function TagInput({
  value,
  onChange,
  onBlur,
  placeholder,
  disabled,
  id,
  "aria-describedby": describedBy,
  "aria-invalid": invalid,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  onBlur?: () => void;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const commit = (raw: string) => {
    const next = raw.trim();
    setDraft("");
    // Silently ignore duplicates rather than erroring — re-typing an existing
    // amenity is a slip, not something worth a validation message.
    if (!next || value.includes(next)) return;
    onChange([...value, next]);
  };

  const removeAt = (index: number) => onChange(value.filter((_, i) => i !== index));

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // Comma is accepted as a separator too, so pasted or habitually
    // comma-typed input still works.
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      commit(draft);
      return;
    }
    if (event.key === "Backspace" && draft === "" && value.length > 0) {
      event.preventDefault();
      removeAt(value.length - 1);
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const text = event.clipboardData.getData("text");
    if (!text.includes(",")) return;
    event.preventDefault();
    const items = text
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item && !value.includes(item));
    if (items.length) onChange([...value, ...new Set(items)]);
  };

  return (
    <div
      className={cn(
        "border-input flex min-h-9 w-full flex-wrap items-center gap-1.5 rounded-md border bg-transparent px-2 py-1.5 text-sm shadow-xs transition-[color,box-shadow]",
        "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
        invalid && "border-destructive ring-destructive/20",
        disabled && "pointer-events-none opacity-50"
      )}
      onClick={() => inputRef.current?.focus()}
    >
      {value.map((tag, index) => (
        <span
          key={tag}
          className="flex max-w-full items-center gap-1 rounded bg-muted py-0.5 pl-2 pr-1 text-xs font-medium"
        >
          <span className="truncate">{tag}</span>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              removeAt(index);
            }}
            disabled={disabled}
            aria-label={`Remove ${tag}`}
            className="rounded-sm p-0.5 text-muted-foreground hover:bg-background hover:text-foreground"
          >
            <X className="h-3 w-3" aria-hidden />
          </button>
        </span>
      ))}

      <input
        ref={inputRef}
        id={id}
        type="text"
        value={draft}
        disabled={disabled}
        aria-describedby={describedBy}
        aria-invalid={invalid}
        placeholder={value.length === 0 ? placeholder : undefined}
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={handleKeyDown}
        onPaste={handlePaste}
        // Commit whatever is half-typed. Blur fires before a Save button's
        // click, so a value the admin typed but never pressed Enter on is kept
        // instead of silently vanishing on submit.
        onBlur={() => {
          commit(draft);
          onBlur?.();
        }}
        className="placeholder:text-muted-foreground min-w-[8rem] flex-1 bg-transparent py-0.5 outline-none"
      />
    </div>
  );
}
