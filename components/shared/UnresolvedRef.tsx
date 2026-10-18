"use client";

import { useState } from "react";
import Link from "next/link";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

/* ============================================================
 * A reference that may or may not be resolved.
 *
 * Admin list endpoints return references either populated or as a bare
 * ObjectId, depending on the endpoint (tickets 9a and 13). This renders both
 * states from the same call site, so a screen doesn't need rewriting when the
 * backend starts populating — `name` simply stops being null.
 *
 * Unresolved: an em-dash rather than an invented value or a raw hex string,
 * with the id one hover away so nothing is discarded — an admin chasing
 * something in a support ticket still has an identifier.
 *
 * Resolved: the name, linked when `href` is given. An unresolved ref is never
 * linked, because a link whose only label is "—" is not a target anyone can
 * aim at.
 * ============================================================ */

interface UnresolvedRefProps {
  /** The resolved name. When present this renders normally. */
  name?: string | null;
  /** The ObjectId we do have. */
  id?: string | null;
  /** What kind of thing it is, for the tooltip: "referrer", "buyer", "admin". */
  kind?: string;
  /** Where the resolved name links to. Ignored while the ref is unresolved. */
  href?: string | null;
  className?: string;
}

export function UnresolvedRef({ name, id, kind = "record", href, className }: UnresolvedRefProps) {
  const [copied, setCopied] = useState(false);

  if (name) {
    if (href) {
      return (
        <Link
          href={href}
          className={cn(
            "wrap-break-word font-medium text-foreground transition-colors hover:text-primary hover:underline",
            className
          )}
        >
          {name}
        </Link>
      );
    }
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
