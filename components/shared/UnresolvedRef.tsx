"use client";

import { useState } from "react";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/* ============================================================
 * A value the backend cannot supply yet.
 *
 * Several admin list endpoints return references without populating them, so
 * the frontend holds an ObjectId where a name belongs (tickets 9a and 13).
 *
 * The house rule for that state: render an em-dash rather than an invented
 * value or a raw hex string, and keep the id one hover away so nothing is
 * discarded — an admin chasing something in a support ticket still has an
 * identifier.
 *
 * Delete the usages, not this component, when the backend populates: the
 * `name` prop simply stops being null.
 * ============================================================ */

interface UnresolvedRefProps {
  /** The resolved name. When present this renders normally. */
  name?: string | null;
  /** The ObjectId we do have. */
  id?: string | null;
  /** What kind of thing it is, for the tooltip: "referrer", "buyer", "admin". */
  kind?: string;
  className?: string;
}

export function UnresolvedRef({ name, id, kind = "record", className }: UnresolvedRefProps) {
  const [copied, setCopied] = useState(false);

  if (name) {
    return <span className={cn("wrap-break-word", className)}>{name}</span>;
  }

  if (!id) {
    return (
      <span className={cn("text-muted-foreground", className)} aria-label="Not set">
        —
      </span>
    );
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — the tooltip still shows the id
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={copy}
          className={cn(
            "cursor-pointer text-muted-foreground underline decoration-dotted underline-offset-4",
            className
          )}
          aria-label={`Name unavailable. Copy ${kind} ID.`}
        >
          —
        </button>
      </TooltipTrigger>
      <TooltipContent className="max-w-xs">
        <p>Name not available yet.</p>
        <p className="mt-1 font-mono text-[0.7rem] break-all">{id}</p>
        <p className="mt-1 opacity-80">{copied ? "Copied" : `Click to copy the ${kind} ID`}</p>
      </TooltipContent>
    </Tooltip>
  );
}
