"use client";

import { useLayoutEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";

export type NumberFieldLike = {
  value: unknown;
  onChange: (value: number | undefined) => void;
  onBlur: () => void;
  name: string;
  ref: React.Ref<HTMLInputElement>;
};

function toDisplay(value: number | undefined): string {
  return value === undefined || Number.isNaN(value) ? "" : formatWithCommas(String(value));
}

/**
 * Keeps only digits and a single decimal point, and collapses a leading zero
 * the moment another digit follows it ("0" then "5" becomes "5", not "05") —
 * see this file's own doc comment for why that matters here. Also strips any
 * commas the display formatting below has added — this is the one function
 * that turns whatever the user typed back into a plain numeric string.
 */
function sanitize(raw: string): string {
  let cleaned = raw.replace(/[^0-9.]/g, "");
  const firstDot = cleaned.indexOf(".");
  if (firstDot !== -1) {
    cleaned = cleaned.slice(0, firstDot + 1) + cleaned.slice(firstDot + 1).replace(/\./g, "");
  }
  return cleaned.replace(/^0+(?=\d)/, "");
}

/** Thousands-groups the integer part of an already-`sanitize`d numeric string. */
function formatWithCommas(cleaned: string): string {
  if (cleaned === "") return "";
  const [intPart, decPart] = cleaned.split(".");
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decPart === undefined ? grouped : `${grouped}.${decPart}`;
}

/** How many non-comma characters of `value` sit before `index` — a comma-independent cursor position. */
function digitIndexBefore(value: string, index: number): number {
  let count = 0;
  for (let i = 0; i < index && i < value.length; i++) {
    if (value[i] !== ",") count++;
  }
  return count;
}

/** The reverse of `digitIndexBefore`: where in `formatted` the `digitIndex`-th non-comma character sits. */
function positionAtDigitIndex(formatted: string, digitIndex: number): number {
  let count = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (count === digitIndex) return i;
    if (formatted[i] !== ",") count++;
  }
  return formatted.length;
}

function mergeRefs<T>(...refs: (React.Ref<T> | undefined)[]): React.RefCallback<T> {
  return (node) => {
    for (const ref of refs) {
      if (!ref) continue;
      if (typeof ref === "function") ref(node);
      else (ref as React.MutableRefObject<T | null>).current = node;
    }
  };
}

/**
 * `value` and `onChange` are replaced so an empty input yields `undefined`
 * rather than `NaN`; the rest of the field (including `ref`) is spread through
 * untouched — reading `field.ref` directly counts as accessing a ref during
 * render.
 *
 * Renders as `type="text"` with a numeric `inputMode`, not `type="number"`.
 * A controlled `type="number"` input has a well-documented browser quirk: if
 * the newly committed value parses to the same NUMBER already on screen, the
 * browser leaves the raw typed TEXT alone — so typing "5" while the field
 * shows "0" can leave "05" visibly stuck, with no way to clear just the
 * leading zero (found live against real staging data, where every amount
 * field defaults to 0). Tracking the field's own draft string in local state
 * and rendering it as plain text sidesteps that entirely; `sanitize()` above
 * still normalises it to a clean number as the user types.
 *
 * The draft is also thousands-grouped as it's typed ("1234567" → "1,234,567"),
 * since every field this feeds is either money or a sqm/unit count large
 * enough that miscounting digits is a real risk. Inserting/removing commas
 * shifts the caret unless it's explicitly restored, so every edit records the
 * caret's comma-independent position (`digitIndexBefore`) before reformatting
 * and reapplies it (`positionAtDigitIndex`) via `useLayoutEffect` once the
 * newly formatted value is committed — plain assignment inside `onChange`
 * would run before React re-renders the controlled value, so it would be
 * fighting the input's own then-still-stale text.
 *
 * Lives in its own file (rather than inline in OfferEditDialogs.tsx, where it
 * originated) so other money-field consumers can import it without pulling in
 * OfferEditDialogs.tsx's own dependency graph. OfferEditDialogs.tsx
 * re-exports it, so its many existing importers (Costs feature's money
 * fields, etc.) are unaffected.
 *
 * `...inputProps` exists specifically for `id`/`aria-describedby`/
 * `aria-invalid`/`placeholder`/`autoFocus`/`required` — shadcn's `FormControl`
 * (components/ui/form.tsx) injects the first three onto its single child via
 * Radix `Slot`, which clones props onto whatever element sits inside
 * `<FormControl>` regardless of that element's declared prop types. Without
 * forwarding them here, `<FormLabel htmlFor={formItemId}>` never matched a
 * real DOM node on any field using this component — labels and inputs were
 * visually paired but never programmatically associated, silently broken for
 * every screen reader and every `getByLabel` query across the app (found via
 * a Playwright test that couldn't locate a NumberInput field by its label at
 * all).
 */
export function NumberInput({
  field,
  prefix,
  suffix,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- accepted for API compatibility, see its own doc comment below
  min = 0,
  disabled,
  ...inputProps
}: {
  field: NumberFieldLike;
  prefix?: string;
  suffix?: string;
  /** No longer an enforced HTML attribute (this renders as `type="text"` now) — negative numbers are already unreachable since "-" isn't in the allowed character set. Kept so existing callers don't need to change. */
  min?: number;
  disabled?: boolean;
} & Pick<
  React.ComponentPropsWithoutRef<"input">,
  "id" | "aria-describedby" | "aria-invalid" | "placeholder" | "autoFocus" | "required"
>) {
  const { value, onChange, ref: fieldRef, ...rest } = field;
  const numericValue = value as number | undefined;

  const [draft, setDraft] = useState(() => toDisplay(numericValue));
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pendingCaretRef = useRef<number | null>(null);

  // React's own "adjusting state during rendering" pattern, not a `useEffect`
  // — an effect here would only add an extra render for no benefit, since
  // this check is cheap enough to run inline. Comparing what `draft` itself
  // currently PARSES to (rather than snapshotting the last numeric value)
  // matters: the user's own keystroke already updates both `draft` (in the
  // input's onChange below) and `numericValue` (via `onChange` → the form) to
  // agree with each other, so a mid-edit state like a trailing decimal point
  // ("5.") is left alone — only a genuinely external change (form.reset,
  // switching rows in a field array) ever disagrees with what `draft` parses
  // to, and that's the only case this should overwrite it for.
  //
  // One value must NOT count as an external change: the echo of a clear.
  // Emptying the field sends `undefined` up, and react-hook-form's
  // `useController` answers an `undefined` field with the value it had when
  // it mounted (its memoised `defaultValue` fallback) instead of `undefined`.
  // Without the guard below that echo was written straight back into the
  // box: deleting the last digit made the original number reappear, while
  // the form itself still held "empty" — so the field showed a figure and a
  // "required" error at the same time and the form could never be saved.
  // `mountValue` is that fallback (this input mounts with its controller),
  // so while the user has the field cleared, seeing it come back means
  // "still empty".
  const [mountValue] = useState(numericValue);
  const [cleared, setCleared] = useState(false);
  const effectiveValue = cleared && numericValue === mountValue ? undefined : numericValue;

  const parsedDraft =
    draft === "" || draft === "." ? undefined : Number(draft.replace(/,/g, ""));
  if (parsedDraft !== effectiveValue) {
    setDraft(toDisplay(effectiveValue));
    // A real external value arrived (form.reset, a row swap) — the field is
    // no longer in its cleared state.
    if (cleared) setCleared(false);
  }

  // Runs synchronously right after React commits `draft`'s new value to the
  // DOM, before paint — restoring the caret here (rather than inline in
  // `onChange`) is what makes this safe, since `onChange` fires before the
  // input's own DOM value has actually been updated to the reformatted text.
  useLayoutEffect(() => {
    if (pendingCaretRef.current !== null && inputRef.current) {
      inputRef.current.setSelectionRange(pendingCaretRef.current, pendingCaretRef.current);
      pendingCaretRef.current = null;
    }
  }, [draft]);

  return (
    <div className="relative">
      {prefix ? (
        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          {prefix}
        </span>
      ) : null}
      <Input
        {...rest}
        {...inputProps}
        ref={mergeRefs(fieldRef, inputRef)}
        type="text"
        inputMode="decimal"
        disabled={disabled}
        className={`${prefix ? "pl-6" : ""} ${suffix ? "pr-10" : ""}`}
        value={draft}
        onChange={(e) => {
          const raw = e.target.value;
          const caretDigitIndex = digitIndexBefore(raw, e.target.selectionStart ?? raw.length);
          const cleaned = sanitize(raw);
          const formatted = formatWithCommas(cleaned);
          pendingCaretRef.current = positionAtDigitIndex(formatted, caretDigitIndex);
          const empty = cleaned === "" || cleaned === ".";
          setDraft(formatted);
          setCleared(empty);
          onChange(empty ? undefined : Number(cleaned));
        }}
      />
      {suffix ? (
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
          {suffix}
        </span>
      ) : null}
    </div>
  );
}
