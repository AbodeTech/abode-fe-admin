"use client";

import { useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { ApiClientError } from "@/lib/api-client";

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
import { Textarea } from "@/components/ui/textarea";

import { OFFER_TYPES, OFFER_TYPE_LABELS } from "../../schemas/asset.schema";
import {
  CHARGE_BASES,
  CHARGE_BASIS_LABELS,
  SELLING_CHARGE_TYPES,
  SELLING_CHARGE_TYPE_LABELS,
  setSellingChargesFormSchema,
  type SellingChargeVersion,
  type SetSellingChargesFormValues,
} from "../../schemas/selling-charges.schema";
import { useSetSellingCharges } from "../../hooks/use-selling-charges-mutations";

const ANY_PRODUCT = "any";

function toFormValues(seed: SellingChargeVersion | null, latestVersion: number): SetSellingChargesFormValues {
  return {
    expected_version: latestVersion,
    charges: (seed?.charges ?? []).map((c) => ({
      charge_type: c.charge_type,
      label: c.label,
      offer_type: c.offer_type ?? undefined,
      size_id: c.size_id ?? undefined,
      amount: c.amount,
      basis: c.basis,
      note: c.note ?? undefined,
    })),
    effective_date: new Date().toISOString().slice(0, 10),
    reason: "",
  };
}

interface FormProps {
  assetId: string;
  /** The newest saved version, which the editor starts from. `null` for a first version. */
  seed: SellingChargeVersion | null;
  /** Sent back as `expected_version`, so a save made on stale data is refused. */
  latestVersion: number;
  onClose: () => void;
}

function SellingChargesForm({ assetId, seed, latestVersion, onClose }: FormProps) {
  const save = useSetSellingCharges(assetId);

  const form = useForm<SetSellingChargesFormValues>({
    resolver: zodResolver(setSellingChargesFormSchema),
    defaultValues: toFormValues(seed, latestVersion),
  });

  const charges = useFieldArray({ control: form.control, name: "charges" });

  const submit = form.handleSubmit((values) => {
    const parsed = setSellingChargesFormSchema.parse(values);
    save.mutate(parsed, {
      onSuccess: (result) => {
        toast.success(
          result.starts_in_future
            ? `Version ${result.version} scheduled — it takes effect on ${parsed.effective_date}`
            : "Selling charges saved"
        );
        onClose();
      },
      onError: (error) => {
        if (error instanceof ApiClientError && error.statusCode === 409) {
          toast.error("Someone else saved these charges first. Reopen the editor to work from the latest version.");
          onClose();
          return;
        }
        toast.error(error.message || "Couldn't save these charges");
      },
    });
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit selling charges</DialogTitle>
        <DialogDescription>
          Every save approves a brand-new version, effective from the date below. A future date schedules it:
          buyers keep the version in force until then.
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
          <div className="max-h-[60vh] space-y-4 overflow-y-auto pr-1">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-medium">Charges</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  charges.append({ charge_type: "other", label: "", amount: 0, basis: "per_unit" })
                }
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                Add charge
              </Button>
            </div>

            {charges.fields.length === 0 ? (
              <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
                No charges yet — add at least one.
              </p>
            ) : (
              <div className="space-y-3">
                {charges.fields.map((row, index) => (
                  <div key={row.id} className="space-y-2 rounded-lg border p-3">
                    <div className="grid gap-2 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name={`charges.${index}.charge_type` as const}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Type</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {SELLING_CHARGE_TYPES.map((type) => (
                                  <SelectItem key={type} value={type}>
                                    {SELLING_CHARGE_TYPE_LABELS[type]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`charges.${index}.label` as const}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Label</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g. Development levy" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid gap-2 sm:grid-cols-3">
                      <FormField
                        control={form.control}
                        name={`charges.${index}.offer_type` as const}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Applies to</FormLabel>
                            <Select
                              value={field.value ?? ANY_PRODUCT}
                              onValueChange={(value) => field.onChange(value === ANY_PRODUCT ? undefined : value)}
                            >
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value={ANY_PRODUCT}>Every product</SelectItem>
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
                        name={`charges.${index}.amount` as const}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Amount</FormLabel>
                            <FormControl>
                              <NumberInput field={field} prefix="₦" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`charges.${index}.basis` as const}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Basis</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {CHARGE_BASES.map((basis) => (
                                  <SelectItem key={basis} value={basis}>
                                    {CHARGE_BASIS_LABELS[basis]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex items-end gap-2">
                      <FormField
                        control={form.control}
                        name={`charges.${index}.note` as const}
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormLabel className="text-xs">Note (optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Internal note" {...field} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <Button type="button" variant="ghost" size="icon" onClick={() => charges.remove(index)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <FormMessage>{form.formState.errors.charges?.message}</FormMessage>

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
                    <Textarea rows={2} placeholder="e.g. Board approved the 2026 price list" {...field} />
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
  seed: SellingChargeVersion | null;
  latestVersion: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * The full-replacement editor for one asset's selling charges — approving
 * this creates a brand-new version, dated from `effective_date`. Remounted
 * per `latestVersion`, so reopening after someone else's save starts from
 * their version, not a stale one.
 */
export function SellingChargesDialog({ assetId, seed, latestVersion, open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        {open ? (
          <SellingChargesForm
            key={latestVersion}
            assetId={assetId}
            seed={seed}
            latestVersion={latestVersion}
            onClose={() => onOpenChange(false)}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
