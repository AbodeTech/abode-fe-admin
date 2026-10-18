"use client";

import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AlertTriangle, Eye, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { formatNaira } from "@/lib/utils/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { NumberInput } from "./NumberInput";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";

import { OFFER_TYPES, OFFER_TYPE_LABELS } from "../../schemas/asset.schema";
import {
  ALLOCATION_BASES,
  ALLOCATION_BASIS_LABELS,
  setAllocationRuleFormSchema,
  type AllocationRule,
  type AssetCostItem,
  type SetAllocationRuleFormValues,
} from "../../schemas/asset-cost.schema";
import { useAllocationRuleHistory, useSetAllocationRule } from "../../hooks/use-cost-items";
import { useCostImpactPreview } from "../../hooks/use-cost-impact-preview";

function toFormValues(current: AllocationRule | undefined): SetAllocationRuleFormValues {
  return {
    method: current?.method ?? "equal",
    applies_to_products: current?.applies_to_products ?? [],
    excluded_products: current?.excluded_products ?? [],
    percentages: (current?.shares ?? [])
      .filter((s) => s.percent != null)
      .map((s) => ({ offer_type: s.offer_type, percent: s.percent as number })),
    amounts: (current?.shares ?? [])
      .filter((s) => s.amount != null)
      .map((s) => ({ offer_type: s.offer_type, amount: s.amount as number })),
    effective_date: new Date().toISOString().slice(0, 10),
    reason: "",
  };
}

interface FormProps {
  assetId: string;
  item: AssetCostItem;
  current: AllocationRule | undefined;
  onClose: () => void;
}

function AllocationRuleForm({ assetId, item, current, onClose }: FormProps) {
  const save = useSetAllocationRule(assetId, item.id);
  const preview = useCostImpactPreview(assetId);

  const form = useForm<SetAllocationRuleFormValues>({
    resolver: zodResolver(setAllocationRuleFormSchema),
    defaultValues: toFormValues(current),
  });

  const method = useWatch({ control: form.control, name: "method" });
  const percentages = useFieldArray({ control: form.control, name: "percentages" });
  const amounts = useFieldArray({ control: form.control, name: "amounts" });

  const submit = form.handleSubmit((values) => {
    const parsed = setAllocationRuleFormSchema.parse(values);
    save.mutate(parsed, {
      onSuccess: () => {
        toast.success("Allocation rule saved");
        onClose();
      },
      onError: (error) => toast.error(error.message || "Couldn't save this allocation rule"),
    });
  });

  function runPreview() {
    const values = form.getValues();
    preview.mutate({
      cost_item_id: item.id,
      allocation_basis: values.method,
      applies_to_products: values.applies_to_products,
      excluded_products: values.excluded_products,
      manual_shares: values.percentages,
      is_shared: true,
    });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Set allocation rule</DialogTitle>
        <DialogDescription>
          {item.name} — how this shared cost splits across products. Every save is a new, dated version.
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
          <section className="space-y-3 rounded-lg border p-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium">Preview this change</h3>
              <Button type="button" variant="outline" size="sm" onClick={runPreview} disabled={preview.isPending}>
                {preview.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Eye className="mr-1.5 h-3.5 w-3.5" />}
                Preview impact
              </Button>
            </div>
            {preview.data ? (
              <div className="space-y-2 rounded-md bg-muted/30 p-3 text-xs">
                <ul className="space-y-1">
                  {preview.data.changes.map((change) => (
                    <li key={change.offer_type} className="flex items-center justify-between gap-2">
                      <span>{OFFER_TYPE_LABELS[change.offer_type]}</span>
                      <span className="tabular-nums font-medium">
                        {change.net_profit_change >= 0 ? "+" : ""}
                        {formatNaira(change.net_profit_change)}
                      </span>
                    </li>
                  ))}
                </ul>
                {preview.data.new_warnings.map((warning) => (
                  <p key={warning} className="flex items-start gap-2 text-amber-700">
                    <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" aria-hidden />
                    {warning}
                  </p>
                ))}
              </div>
            ) : null}
          </section>

          <FormField
            control={form.control}
            name="method"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Allocation method</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {ALLOCATION_BASES.map((option) => (
                      <SelectItem key={option} value={option}>
                        {ALLOCATION_BASIS_LABELS[option]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {method === "manual" ? (
            <section className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-medium text-muted-foreground">Percent per product</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => percentages.append({ offer_type: OFFER_TYPES[0], percent: 0 })}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add
                </Button>
              </div>
              {percentages.fields.map((row, index) => (
                <div key={row.id} className="flex items-end gap-2">
                  <FormField
                    control={form.control}
                    name={`percentages.${index}.offer_type` as const}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {OFFER_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {OFFER_TYPE_LABELS[type]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`percentages.${index}.percent` as const}
                    render={({ field }) => (
                      <FormItem className="w-28">
                        <FormControl>
                          <NumberInput field={field} suffix="%" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => percentages.remove(index)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <FormMessage>{form.formState.errors.percentages?.message}</FormMessage>
            </section>
          ) : null}

          {method === "amount" ? (
            <section className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-xs font-medium text-muted-foreground">Amount per product</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => amounts.append({ offer_type: OFFER_TYPES[0], amount: 0 })}
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Add
                </Button>
              </div>
              {amounts.fields.map((row, index) => (
                <div key={row.id} className="flex items-end gap-2">
                  <FormField
                    control={form.control}
                    name={`amounts.${index}.offer_type` as const}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {OFFER_TYPES.map((type) => (
                              <SelectItem key={type} value={type}>
                                {OFFER_TYPE_LABELS[type]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`amounts.${index}.amount` as const}
                    render={({ field }) => (
                      <FormItem className="w-40">
                        <FormControl>
                          <NumberInput field={field} prefix="₦" />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  <Button type="button" variant="ghost" size="icon" onClick={() => amounts.remove(index)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <FormMessage>{form.formState.errors.amounts?.message}</FormMessage>
            </section>
          ) : null}

          <Separator />

          <FormField
            control={form.control}
            name="effective_date"
            render={({ field }) => (
              <FormItem className="max-w-xs">
                <FormLabel className="text-xs">Effective date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="reason"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Reason for this change</FormLabel>
                <FormControl>
                  <Textarea rows={2} placeholder="e.g. Switched fencing to a manual split" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </Form>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={save.isPending}>
          Cancel
        </Button>
        <Button type="button" onClick={submit} disabled={save.isPending}>
          {save.isPending ? (
            <>
              Saving <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      </DialogFooter>
    </>
  );
}

interface Props {
  assetId: string;
  item: AssetCostItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Replaces the old estate-wide `ProfitabilitySetupDrawer` — the real backend
 * has no such singleton config. Allocation is set per shared cost item,
 * versioned and dated like every other complete-replace surface in this
 * app, but scoped narrowly here since there's no client-side optimistic
 * lock to protect on this endpoint.
 */
export function AllocationRuleDialog({ assetId, item, open, onOpenChange }: Props) {
  const { data, error } = useAllocationRuleHistory(assetId, item?.id, { enabled: open });
  const current = data?.rules.find((rule) => rule.is_current);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {error ? (
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-500">
            <h3 className="font-bold">Couldn&apos;t load this cost item&apos;s allocation history</h3>
            <p>{error.message}</p>
          </div>
        ) : open && item && data ? (
          <AllocationRuleForm key={item.id} assetId={assetId} item={item} current={current} onClose={() => onOpenChange(false)} />
        ) : (
          <div className="space-y-4 py-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function AllocationBadge({ item, onClick }: { item: AssetCostItem; onClick: () => void }) {
  if (!item.is_shared) return null;
  return (
    <Badge
      variant={item.needs_allocation_rule ? "outline" : "secondary"}
      className={item.needs_allocation_rule ? "cursor-pointer text-amber-600" : "cursor-pointer"}
      onClick={onClick}
    >
      {item.needs_allocation_rule ? "Needs allocation rule" : item.allocation_label ?? "Shared"}
    </Badge>
  );
}
