"use client";

import { useMemo, useState } from "react";
import { AlertCircle, GripVertical, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";

import { useStandingConfig, useUpdateStandingConfig } from "../hooks/use-standing";
import { hectares, type StandingCheckpoint } from "../schemas/standing.schema";

type Draft = {
  key: string;
  name: string;
  min_sqm: string;
  tagline: string;
  benefits: { label: string; enabled: boolean }[];
};

const toDraft = (c: StandingCheckpoint): Draft => ({
  key: c.key,
  name: c.name,
  min_sqm: String(c.min_sqm),
  tagline: c.tagline ?? "",
  benefits: c.benefits ?? [],
});

/**
 * A key the buyer app and admin filters both address a tier by, so it cannot
 * carry spaces or punctuation. Derived from the name on a new row and then left
 * alone — renaming "Land Banker" must not silently orphan everyone filed under
 * `land_banker`.
 */
const keyFromName = (name: string): string =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);

/**
 * Validated here as well as on the server, because the server's rejection is a
 * toast after a round trip while this is a message beside the field that caused
 * it. The rules are the server's, restated — not invented:
 * unique keys, unique thresholds, and an entry rung at 0 sqm so that every
 * owner has a standing.
 */
function validate(rows: Draft[]): string | null {
  if (rows.length === 0) return "A ladder needs at least one tier.";

  const keys = new Set<string>();
  const thresholds = new Set<number>();

  for (const row of rows) {
    if (!row.name.trim()) return "Every tier needs a name.";
    if (!row.key.trim()) return `"${row.name}" needs a key.`;
    if (!/^[a-z0-9_]+$/.test(row.key)) {
      return `"${row.key}" can only use lowercase letters, numbers and underscores.`;
    }
    if (keys.has(row.key)) return `Two tiers share the key "${row.key}".`;
    keys.add(row.key);

    const sqm = Number(row.min_sqm);
    if (!Number.isFinite(sqm) || sqm < 0 || !Number.isInteger(sqm)) {
      return `"${row.name}" needs a whole number of square metres.`;
    }
    if (thresholds.has(sqm)) {
      return `Two tiers start at ${sqm.toLocaleString()} sqm. A buyer would be on both and neither.`;
    }
    thresholds.add(sqm);
  }

  if (!thresholds.has(0)) {
    return "The lowest tier must start at 0 sqm, or someone who owns a small plot has no standing at all.";
  }
  return null;
}

export function StandingLadderEditor() {
  const { data, isLoading, isError } = useStandingConfig();
  const save = useUpdateStandingConfig();

  /**
   * Null means "not edited yet", so the saved ladder shows through.
   *
   * Deliberately not an effect syncing server data into state: that fires a
   * second render on every fetch, and — worse here — would overwrite whatever
   * the admin had half-typed the moment a refetch landed.
   */
  const [draft, setDraft] = useState<Draft[] | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const saved = useMemo(() => (data?.checkpoints ?? []).map(toDraft), [data]);
  const rows = draft ?? saved;

  const sorted = useMemo(
    () => [...rows].sort((a, b) => Number(a.min_sqm) - Number(b.min_sqm)),
    [rows]
  );
  const problem = useMemo(() => validate(rows), [rows]);
  const dirty = useMemo(
    () => draft !== null && JSON.stringify(saved) !== JSON.stringify(draft),
    [saved, draft]
  );

  const edit = (next: (prev: Draft[]) => Draft[]) => setDraft((prev) => next(prev ?? saved));

  const patch = (index: number, changes: Partial<Draft>) =>
    edit((prev) => prev.map((row, i) => (i === index ? { ...row, ...changes } : row)));

  const addRow = () =>
    edit((prev) => [...prev, { key: "", name: "", min_sqm: "", tagline: "", benefits: [] }]);

  const removeRow = (index: number) => edit((prev) => prev.filter((_, i) => i !== index));

  const onSave = () => {
    if (problem) return;
    save.mutate(
      {
        checkpoints: rows.map((row) => ({
          key: row.key,
          name: row.name.trim(),
          min_sqm: Number(row.min_sqm),
          tagline: row.tagline.trim(),
          benefits: row.benefits,
        })),
      },
      {
        onSuccess: () => {
          toast.success("Standing ladder saved");
          setConfirmOpen(false);
          // Back to showing the server's copy, so what is on screen is what
          // was actually stored rather than what was typed.
          setDraft(null);
        },
        onError: (err) =>
          toast.error(err.message || "Couldn't save the ladder. Try again."),
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 py-10">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading the ladder…
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
        Couldn&apos;t load the standing ladder. Refresh and try again.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 flex gap-2.5">
        <AlertCircle className="h-4 w-4 text-blue-700 mt-0.5 shrink-0" />
        <p className="text-xs text-blue-900">
          Standing is measured in <strong>total land held</strong> — plot size × units, added up
          across a buyer&apos;s live plans. Cancelled and closed plans don&apos;t count, and paying
          a plan off never moves anyone down. Changing a threshold moves real buyers between
          tiers as soon as you save.
        </p>
      </div>

      <div className="space-y-3">
        {sorted.map((row) => {
          const index = rows.indexOf(row);
          const sqm = Number(row.min_sqm);
          return (
            <div
              key={index}
              className="rounded-lg border border-gray-200 bg-white p-4 space-y-3"
            >
              <div className="flex items-start gap-3">
                <GripVertical className="h-4 w-4 text-gray-300 mt-2.5 shrink-0" aria-hidden />

                <div className="grid grid-cols-1 sm:grid-cols-[1fr_170px] gap-3 flex-1">
                  <div className="space-y-1.5">
                    <Label htmlFor={`name-${index}`}>Tier name</Label>
                    <Input
                      id={`name-${index}`}
                      value={row.name}
                      placeholder="Landholder"
                      className="bg-white"
                      onChange={(e) => {
                        const name = e.target.value;
                        // The key follows the name only while the row is new.
                        // Once saved it is an address other things point at.
                        patch(index, {
                          name,
                          ...(row.key === "" || row.key === keyFromName(row.name)
                            ? { key: keyFromName(name) }
                            : {}),
                        });
                      }}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor={`sqm-${index}`}>Starts at (sqm)</Label>
                    <Input
                      id={`sqm-${index}`}
                      type="number"
                      min={0}
                      value={row.min_sqm}
                      placeholder="1000"
                      className="bg-white tabular-nums"
                      onChange={(e) => patch(index, { min_sqm: e.target.value })}
                    />
                    {Number.isFinite(sqm) && sqm >= 10_000 && (
                      <p className="text-[11px] text-gray-500">{hectares(sqm)} hectares</p>
                    )}
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="text-gray-400 hover:text-red-600 mt-6 shrink-0"
                  onClick={() => removeRow(index)}
                  aria-label={`Remove ${row.name || "this tier"}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="space-y-1.5 pl-7">
                <Label htmlFor={`tagline-${index}`}>
                  What it means <span className="text-gray-400">(shown to the buyer)</span>
                </Label>
                <Input
                  id={`tagline-${index}`}
                  value={row.tagline}
                  placeholder="A thousand square metres held across your plans."
                  className="bg-white"
                  onChange={(e) => patch(index, { tagline: e.target.value })}
                />
                <p className="text-[11px] text-gray-500">
                  Say what the standing <em>is</em>, not what it earns — benefits are separate,
                  and each one shows to buyers only once you switch it on.
                </p>
              </div>

              <BenefitsEditor
                benefits={row.benefits}
                onChange={(benefits) => patch(index, { benefits })}
              />

              <p className="pl-7 text-[11px] text-gray-400 font-mono">key: {row.key || "—"}</p>
            </div>
          );
        })}
      </div>

      <Button variant="outline" size="sm" onClick={addRow}>
        <Plus className="h-3.5 w-3.5 mr-1.5" />
        Add a tier
      </Button>

      {problem && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex gap-2.5">
          <AlertCircle className="h-4 w-4 text-amber-700 mt-0.5 shrink-0" />
          <p className="text-xs text-amber-900">{problem}</p>
        </div>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-gray-200 pt-4">
        {dirty && !problem && (
          <p className="text-xs text-gray-500 mr-auto">Unsaved changes</p>
        )}
        <Button
          variant="ghost"
          size="sm"
          disabled={!dirty || save.isPending}
          onClick={() => setDraft(null)}
        >
          Discard
        </Button>
        <Button
          size="sm"
          disabled={!dirty || !!problem || save.isPending}
          onClick={() => setConfirmOpen(true)}
        >
          {save.isPending && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
          Save ladder
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Save the standing ladder?"
        description={
          `This replaces the whole ladder with ${rows.length} tier${rows.length === 1 ? "" : "s"}. ` +
          "Buyers move between tiers as soon as it saves, and anyone whose standing changes will " +
          "see it on their portfolio the next time they open it."
        }
        confirmLabel="Save ladder"
        // Not destructive-red: this is a routine settings save, and colouring
        // every confirm as a warning teaches people to click through them.
        destructive={false}
        onConfirm={onSave}
      />
    </div>
  );
}

/**
 * Benefits are written first and switched on later, deliberately: the copy has
 * to be agreed before it is a promise anyone has to keep.
 */
function BenefitsEditor({
  benefits,
  onChange,
}: {
  benefits: { label: string; enabled: boolean }[];
  onChange: (next: { label: string; enabled: boolean }[]) => void;
}) {
  return (
    <div className="pl-7 space-y-2">
      <Label>Benefits</Label>
      {benefits.length === 0 && (
        <p className="text-[11px] text-gray-500">
          None yet. Buyers see &ldquo;Benefits for each standing are being finalised&rdquo; until
          one is added and switched on.
        </p>
      )}
      {benefits.map((benefit, i) => (
        <div key={i} className="flex items-center gap-2">
          <Checkbox
            checked={benefit.enabled}
            onCheckedChange={(checked) =>
              onChange(
                benefits.map((b, j) => (j === i ? { ...b, enabled: checked === true } : b))
              )
            }
            aria-label={`Show "${benefit.label}" to buyers`}
          />
          <Input
            value={benefit.label}
            placeholder="72-hour first look at new estates"
            className="bg-white h-8 text-sm"
            onChange={(e) =>
              onChange(benefits.map((b, j) => (j === i ? { ...b, label: e.target.value } : b)))
            }
          />
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-400 hover:text-red-600 shrink-0"
            onClick={() => onChange(benefits.filter((_, j) => j !== i))}
            aria-label="Remove benefit"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="text-xs"
        onClick={() => onChange([...benefits, { label: "", enabled: false }])}
      >
        <Plus className="h-3 w-3 mr-1" />
        Add benefit
      </Button>
      {benefits.some((b) => !b.enabled) && (
        <p className="text-[11px] text-gray-500">
          Unticked benefits are saved but hidden from buyers.
        </p>
      )}
    </div>
  );
}
