"use client";

import { useFieldArray, useFormContext, useWatch } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { cn } from "@/lib/utils";

import { NumberInput } from "./NumberInput";
import type { LandConfigurationFormValues } from "../../schemas/land-configuration.schema";
import { LAND_USE_CATEGORIES, LAND_USE_CATEGORY_LABELS } from "../../schemas/land-configuration.schema";

/** One line per row from `sm` up: category · name · sqm · active · remove. Stacked below that. */
const ROW_GRID = "gap-2.5 sm:grid-cols-[11rem_minmax(0,1fr)_9.5rem_3rem_2.25rem]";

const emptyLandUse = () => ({
  category: "road-circulation" as const,
  label: "",
  allocated_sqm: undefined as unknown as number,
  is_active: true,
});

/**
 * The Land Account editor's non-saleable rows — add/edit/deactivate named
 * areas under a standard category. `other` requires a name; the standard
 * categories accept one too, for a clearer estate-specific label.
 */
export function LandUseFieldArray() {
  const { control } = useFormContext<LandConfigurationFormValues>();
  const rows = useFieldArray({ control, name: "non_saleable" });
  const watchedRows = useWatch({ control, name: "non_saleable" });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Roads & services</p>
          <p className="text-xs text-muted-foreground">
            Land that will never be sold. Untick a row to keep it for history without counting it.
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => rows.append(emptyLandUse())}>
          <Plus className="mr-1.5 h-3.5 w-3.5" />
          Add land use
        </Button>
      </div>

      {rows.fields.length === 0 ? (
        <p className="text-xs text-muted-foreground">No non-saleable land recorded yet.</p>
      ) : (
        // Column captions once, instead of a label over every field in every row.
        <div className={cn(ROW_GRID, "hidden px-3 text-[10px] uppercase tracking-wide text-muted-foreground sm:grid")}>
          <span>Category</span>
          <span>Name</span>
          <span>Allocated</span>
          <span>Active</span>
          <span />
        </div>
      )}

      {rows.fields.map((row, index) => {
        const category = watchedRows?.[index]?.category;
        const isOther = category === "other";

        return (
          <div key={row.id} className="rounded-lg border px-3 py-2.5">
            <div className={cn(ROW_GRID, "grid items-start")}>
              <FormField
                control={control}
                name={`non_saleable.${index}.category` as const}
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs sm:sr-only">Category</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LAND_USE_CATEGORIES.map((option) => (
                          <SelectItem key={option} value={option}>
                            {LAND_USE_CATEGORY_LABELS[option]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`non_saleable.${index}.label` as const}
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs sm:sr-only">
                      Name {isOther ? <span className="text-destructive">*</span> : null}
                    </FormLabel>
                    <FormControl>
                      <Input placeholder={isOther ? "e.g. Drainage reserve" : "Optional, e.g. Internal Road A"} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`non_saleable.${index}.allocated_sqm` as const}
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel className="text-xs sm:sr-only">Allocated sqm</FormLabel>
                    <FormControl>
                      <NumberInput field={field} suffix="sqm" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name={`non_saleable.${index}.is_active` as const}
                render={({ field }) => (
                  <FormItem className="flex h-9 items-center gap-2 space-y-0">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} />
                    </FormControl>
                    <FormLabel className="text-xs font-normal sm:sr-only">
                      {field.value ? "Active — counted in the estate total" : "Inactive — kept for history, not counted"}
                    </FormLabel>
                  </FormItem>
                )}
              />

              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Remove this land-use row"
                onClick={() => rows.remove(index)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
