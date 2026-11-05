"use client";

import { useLayoutEffect, useRef } from "react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/**
 * Money input in fixed-point notation with thousands separators: typing
 * "1234567.5" shows "1,234,567.5", and leaving the field settles it to
 * "1,234,567.50".
 *
 * Works on strings — `value` and `onChange` carry the formatted text, so the
 * caller strips commas before turning it into a number (`Number(v.replace(/,/g, ""))`).
 *
 * Renders `type="text"` + `inputMode="decimal"`: a `type="number"` input can't
 * hold commas. Adding/removing commas would move the caret, so its position is
 * tracked by digits-before-caret and restored after each re-render.
 */

const DECIMALS = 2;

/** Digits and one decimal point, at most two decimals, no leading zeros. */
function sanitize(raw: string): string {
  let cleaned = raw.replace(/[^0-9.]/g, "");
  const dot = cleaned.indexOf(".");
  if (dot !== -1) {
    cleaned =
      cleaned.slice(0, dot + 1) + cleaned.slice(dot + 1).replace(/\./g, "").slice(0, DECIMALS);
  }
  cleaned = cleaned.replace(/^0+(?=\d)/, "");
  return cleaned.startsWith(".") ? `0${cleaned}` : cleaned;
}

function group(cleaned: string): string {
  if (cleaned === "") return "";
  const [intPart, decPart] = cleaned.split(".");
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decPart === undefined ? grouped : `${grouped}.${decPart}`;
}

/** Formats any money string or number as fixed-point with separators: 1500 → "1,500.00". */
export function formatMoneyInput(value: string | number): string {
  const cleaned = sanitize(String(value));
  if (cleaned === "") return "";
  const [intPart, decPart = ""] = cleaned.split(".");
  return group(`${intPart || "0"}.${decPart.padEnd(DECIMALS, "0")}`);
}

function digitsBefore(value: string, index: number): number {
  let count = 0;
  for (let i = 0; i < index && i < value.length; i++) if (value[i] !== ",") count++;
  return count;
}

function positionAfterDigits(formatted: string, digits: number): number {
  let count = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (count === digits) return i;
    if (formatted[i] !== ",") count++;
  }
  return formatted.length;
}

type MoneyInputProps = {
  value: string;
  onChange: (value: string) => void;
  /** Shown inside the field on the left. Defaults to "₦"; pass "" for none. */
  prefix?: string;
} & Omit<React.ComponentPropsWithoutRef<"input">, "value" | "onChange" | "type" | "prefix">;

export function MoneyInput({
  value,
  onChange,
  prefix = "₦",
  className,
  onBlur,
  ...props
}: MoneyInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingCaret = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (pendingCaret.current !== null && inputRef.current) {
      inputRef.current.setSelectionRange(pendingCaret.current, pendingCaret.current);
      pendingCaret.current = null;
    }
  }, [value]);

  return (
    <div className="relative">
      {prefix ? (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
          {prefix}
        </span>
      ) : null}
      <Input
        {...props}
        ref={inputRef}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        placeholder={props.placeholder ?? "0.00"}
        className={cn(prefix && "pl-7", "tabular-nums", className)}
        value={value}
        onChange={(event) => {
          const raw = event.target.value;
          const caretDigits = digitsBefore(raw, event.target.selectionStart ?? raw.length);
          const formatted = group(sanitize(raw));
          pendingCaret.current = positionAfterDigits(formatted, caretDigits);
          onChange(formatted);
        }}
        onBlur={(event) => {
          const settled = formatMoneyInput(value);
          if (settled !== value) onChange(settled);
          onBlur?.(event);
        }}
      />
    </div>
  );
}
