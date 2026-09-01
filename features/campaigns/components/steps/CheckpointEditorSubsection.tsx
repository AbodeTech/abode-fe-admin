"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

import type { CreateCampaignDto } from "../../schemas/create-campaign.schema";

type CheckpointFormValues = Pick<CreateCampaignDto, "checkpoints">;

const EMPTY_CHECKPOINT = {
  key: "",
  label: "",
  prize: "",
  sqm_required: Number.NaN,
  prize_media_url: "",
};

function CheckpointRow({
  index,
  readOnly,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onRemove,
}: {
  index: number;
  readOnly?: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}) {
  const form = useFormContext<CheckpointFormValues>();

  return (
    <div className="space-y-3 rounded-md border p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField
          control={form.control}
          name={`checkpoints.${index}.key`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Key</FormLabel>
              <FormControl>
                <Input {...field} disabled={readOnly} placeholder="bronze-tier" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`checkpoints.${index}.label`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Label</FormLabel>
              <FormControl>
                <Input {...field} disabled={readOnly} placeholder="Bronze" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`checkpoints.${index}.prize`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prize</FormLabel>
              <FormControl>
                <Input {...field} disabled={readOnly} placeholder="Branded hamper" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`checkpoints.${index}.sqm_required`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sqm required</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  min={1}
                  disabled={readOnly}
                  value={Number.isNaN(field.value) ? "" : field.value}
                  onChange={(event) =>
                    field.onChange(event.target.value === "" ? Number.NaN : Number(event.target.value))
                  }
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`checkpoints.${index}.prize_media_url`}
          render={({ field }) => (
            <FormItem className="sm:col-span-2">
              <FormLabel>Prize media URL (optional)</FormLabel>
              <FormControl>
                <Input {...field} value={field.value ?? ""} disabled={readOnly} placeholder="https://" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      {readOnly ? null : (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" disabled={!canMoveUp} onClick={onMoveUp}>
            <ArrowUp className="mr-1 h-3.5 w-3.5" />
            Up
          </Button>
          <Button type="button" variant="outline" size="sm" disabled={!canMoveDown} onClick={onMoveDown}>
            <ArrowDown className="mr-1 h-3.5 w-3.5" />
            Down
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            <Trash2 className="mr-1 h-3.5 w-3.5" />
            Remove
          </Button>
        </div>
      )}
    </div>
  );
}

export function CheckpointEditorSubsection({ readOnly = false }: { readOnly?: boolean }) {
  const form = useFormContext<CheckpointFormValues>();
  const { fields, append, remove, move } = useFieldArray({ control: form.control, name: "checkpoints" });

  return (
    <section className="space-y-3">
      <div>
        <h3 className="font-medium">Milestone checkpoints</h3>
        <p className="text-sm text-muted-foreground">
          Optional. Deterministic milestones users hit for guaranteed prizes. Distinct from the automatic
          ticket minting configured above.
        </p>
      </div>

      {fields.length === 0 ? (
        <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">No checkpoints set</p>
          <p>Add checkpoints to give users a visible progression bar with tiered rewards.</p>
        </div>
      ) : null}

      <FormField
        control={form.control}
        name="checkpoints"
        render={() => (
          <FormItem>
            <FormMessage />
          </FormItem>
        )}
      />

      {fields.map((field, index) => (
        <CheckpointRow
          key={field.id}
          index={index}
          readOnly={readOnly}
          canMoveUp={index > 0}
          canMoveDown={index < fields.length - 1}
          onMoveUp={() => move(index, index - 1)}
          onMoveDown={() => move(index, index + 1)}
          onRemove={() => remove(index)}
        />
      ))}

      {readOnly ? null : (
        <Button type="button" variant="outline" onClick={() => append(EMPTY_CHECKPOINT)}>
          <Plus className="mr-2 h-4 w-4" />
          Add checkpoint
        </Button>
      )}
    </section>
  );
}
