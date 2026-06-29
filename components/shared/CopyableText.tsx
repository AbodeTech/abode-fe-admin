"use client";

import React from "react";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

interface CopyableTextProps {
  /** The text shown to the user. */
  text: string;
  /** The value copied to the clipboard. Defaults to `text`. */
  value?: string;
  className?: string;
}

/**
 * Inline text with a copy-to-clipboard button. The button only renders when
 * there is a real value to copy (skips placeholders like "N/A" / "—").
 */
export function CopyableText({ text, value, className }: CopyableTextProps) {
  const [copied, setCopied] = React.useState(false);
  const copyValue = value ?? text;
  const canCopy = Boolean(copyValue) && copyValue !== "N/A" && copyValue !== "—";

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(copyValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable — silently ignore
    }
  };

  return (
    <span className={cn("group inline-flex min-w-0 items-center gap-1", className)}>
      <span className="wrap-break-word">{text}</span>
      {canCopy && (
        <button
          type="button"
          onClick={handleCopy}
          aria-label={copied ? "Copied" : "Copy"}
          title={copied ? "Copied" : "Copy"}
          className="shrink-0 rounded p-0.5 text-gray-400 transition-colors hover:text-gray-700"
        >
          {copied ? (
            <Check className="h-3 w-3 text-emerald-600" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </button>
      )}
    </span>
  );
}
