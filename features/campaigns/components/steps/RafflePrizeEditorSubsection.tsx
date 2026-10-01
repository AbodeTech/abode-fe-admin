"use client";

import { useFieldArray, useFormContext } from "react-hook-form";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  RAFFLE_PRIZE_KINDS,
  RAFFLE_PRIZE_KIND_LABELS,
} from "../../schemas/campaign.schema";
import type { RafflePrizeInput } from "../../schemas/create-campaign.schema";

type PrizeFormValues = { raffle_prizes?: RafflePrizeInput[] };

const EMPTY_PRIZE: RafflePrizeInput = { label: "", kind: "other" };

function PrizeRow({
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
  const form = useFormContext<PrizeFormValues>();

  return (
    <div className="space-y-3 rounded-md border p-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_10rem]">
        <FormField
          control={form.control}
          name={`raffle_prizes.${index}.label`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prize</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  disabled={readOnly}
                  placeholder="All-expense-paid trip to Nairobi"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name={`raffle_prizes.${index}.kind`}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kind</FormLabel>
              <Select value={field.value} onValueChange={field.onChange} disabled={readOnly}>
                <FormControl>
                  <SelectTrigger aria-label="Prize kind">
                    <SelectValue />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {RAFFLE_PRIZE_KINDS.map((kind) => (
                    <SelectItem key={kind} value={kind}>
                      {RAFFLE_PRIZE_KIND_LABELS[kind]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

/**
 * The prize pool for the end-of-campaign draw.
 *
 * Built the same way as CheckpointEditorSubsection, and deliberately kept
 * separate from it: a checkpoint prize is ASSURED once a realtor reaches its
 * sqm, while a raffle prize is drawn from every ticket at the end and nobody is
 * promised one. Merging the two lists would blur exactly the line the realtor
 * page draws between "yours" and "you could win".
 *
 * Only shown for ticket campaigns — a hamper campaign has no draw.
 */
export function RafflePrizeEditorSubsection({ readOnly = false }: { readOnly?: boolean }) {
  const form = useFormContext<PrizeFormValues>();
  const { fields, append, remove, move } = useFieldArray({
    control: form.control,
    name: "raffle_prizes",
  });

  return (
    <section className="space-y-3">
      <div>
        <h3 className="font-medium">Raffle prizes</h3>
        <p className="text-sm text-muted-foreground">
          What can be won in the draw at campaign end. List the top prize first — realtors see them
          in this order. Separate from checkpoint prizes, which are guaranteed on reaching a
          milestone.
        </p>
      </div>

      {fields.length === 0 ? (
        <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground">No prizes announced</p>
          <p>Realtors see no prize list until at least one is added.</p>
        </div>
      ) : null}

      <FormField
        control={form.control}
        name="raffle_prizes"
        render={() => (
          <FormItem>
            <FormMessage />
          </FormItem>
        )}
      />

      {fields.map((field, index) => (
        <PrizeRow
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

      {readOnly || fields.length >= 20 ? null : (
        <Button type="button" variant="outline" onClick={() => append(EMPTY_PRIZE)}>
          <Plus className="mr-2 h-4 w-4" />
          Add prize
        </Button>
      )}
    </section>
  );
}
