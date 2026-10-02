"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
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
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAdminPermissions } from "@/hooks/use-admin-permission";
import { cn } from "@/lib/utils";

import { useAddCost } from "../../hooks/use-add-cost";
import { useAssetDetail } from "../../hooks/use-asset-detail";
import { useCostCatalogue, useCostItems } from "../../hooks/use-cost-items";
import {
  ADD_COST_STAGES,
  ADD_COST_STAGE_LABELS,
  NEW_COST_ITEM,
  NEW_ITEM_BASES,
  SHARED_SCOPE,
  addCostFormSchema,
  bookableProducts,
  isPlanError,
  planAddCost,
  type AddCostFormValues,
} from "../../schemas/add-cost.schema";
import { OFFER_TYPE_LABELS } from "../../schemas/asset.schema";
import {
  ALLOCATION_BASIS_LABELS,
  COST_GROUPS,
  COST_GROUP_LABELS,
  COST_ITEM_SUGGESTIONS,
} from "../../schemas/asset-cost.schema";
import { SingleUploadField } from "../create/UploadFields";
import { NumberInput } from "./NumberInput";

function Required() {
  return <span className="text-rose-600"> *</span>;
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-3 text-xs font-semibold">{children}</h3>;
}

/** A value the form shows but the admin can't change here, in the same box as an input. */
function ReadOnlyField({ label, value, help }: { label: string; value: string; help?: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-semibold">{label}</p>
      <p className="rounded-md border bg-muted/40 px-2.5 py-2 text-xs">{value}</p>
      {help ? <p className="text-[10px] leading-snug text-muted-foreground">{help}</p> : null}
    </div>
  );
}

const LABEL = "text-[11px] font-semibold";

interface FormProps {
  assetId: string;
  /** Pre-selects a cost item — e.g. opened from that item's row. */
  initialItemId?: string;
  onClose: () => void;
}

/**
 * The design's single "Add cost" form. What it does on save is three backend
 * action. The backend transaction creates a new category when needed, the
 * record, its opening entry, and its approval together.
 *
 * Three design fields have no backend equivalent and are adapted:
 *  - "Forecast" is not offered: there is no forecast stage.
 *  - "Scope" is "shared across products" or one product.
 *  - "Linked operational record" is left out: the backend sets a record's
 *    source itself, and an admin entry is always manual.
 */
function AddCostForm({ assetId, initialItemId, onClose }: FormProps) {
  const permissions = useAdminPermissions();
  const canApprove = permissions.has("approve_asset_costs");

  const { data: items = [] } = useCostItems(assetId);
  // The backend's own list of groups; the compiled-in copy stands in until it arrives.
  const { data: catalogue } = useCostCatalogue(assetId);
  const groups = catalogue?.length
    ? catalogue
    : COST_GROUPS.map((group) => ({ group, label: COST_GROUP_LABELS[group] }));
  const { data: asset } = useAssetDetail(assetId);
  const addCost = useAddCost(assetId);

  const form = useForm<AddCostFormValues>({
    resolver: zodResolver(addCostFormSchema),
    defaultValues: {
      stage: "budget",
      cost_item_id: initialItemId ?? "",
      new_item_name: "",
      new_item_group: "development",
      scope: undefined,
      allocation_basis: undefined,
      title: "",
      description: "",
      amount: undefined,
      effective_date: new Date().toISOString().slice(0, 10),
      vendor: "",
      reference: "",
      evidence_url: "",
      note: "",
    },
  });

  const stage = form.watch("stage");
  const costItemId = form.watch("cost_item_id");
  const scope = form.watch("scope");
  const newItemGroup = form.watch("new_item_group");

  const isNew = costItemId === NEW_COST_ITEM;
  const selectedItem = isNew ? undefined : items.find((item) => item.id === costItemId);
  const products = bookableProducts(asset?.offers ?? []);
  const activeItems = items.filter((item) => item.is_active);

  function save(approve: boolean) {
    return form.handleSubmit((values) => {
      const plan = planAddCost(addCostFormSchema.parse(values), items, { approve });
      if (isPlanError(plan)) {
        form.setError(plan.field, { message: plan.message });
        return;
      }

      addCost.mutate(
        plan,
        {
          onSuccess: () => {
            toast.success(plan.approve ? "Cost added" : "Saved as a draft — it counts once it is approved");
            onClose();
          },
          onError: (error) => toast.error(error.message || "Couldn't add this cost"),
        }
      );
    })();
  }

  return (
    <Form {...form}>
      <div className="max-h-[70vh] space-y-5 overflow-y-auto px-5 py-5">
        {/* ---- 1 ---- */}
        <section>
          <SectionHeading>1. What are you recording?</SectionHeading>
          <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4" role="radiogroup" aria-label="What are you recording?">
            {ADD_COST_STAGES.map((option) => (
              <button
                key={option}
                type="button"
                role="radio"
                aria-checked={stage === option}
                onClick={() => form.setValue("stage", option)}
                className={cn(
                  "rounded-md border px-2 py-2.5 text-center text-[11px]",
                  stage === option ? "border-foreground bg-muted font-semibold" : "bg-background hover:bg-muted/40"
                )}
              >
                {ADD_COST_STAGE_LABELS[option]}
              </button>
            ))}
          </div>
          <p className="mt-2 text-[10px] leading-snug text-muted-foreground">
            Each stage is recorded separately against the same cost, so a budget that becomes an invoice and then a
            payment is not counted three times. Only an incurred cost reduces profit.
          </p>
        </section>

        {/* ---- 2 ---- */}
        <section className="border-t pt-4">
          <SectionHeading>2. Cost classification</SectionHeading>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="cost_item_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LABEL}>
                    Cost group
                    <Required />
                  </FormLabel>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Scope and split belong to the item, so they start over with it.
                      form.setValue("scope", undefined);
                      form.setValue("allocation_basis", undefined);
                    }}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select cost group" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {activeItems.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                          <span className="text-muted-foreground"> · {COST_GROUP_LABELS[item.group]}</span>
                        </SelectItem>
                      ))}
                      {activeItems.length > 0 ? <SelectSeparator /> : null}
                      <SelectItem value={NEW_COST_ITEM}>New cost item…</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LABEL}>
                    Cost title
                    <Required />
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Northern boundary fencing" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isNew ? (
              <>
                <FormField
                  control={form.control}
                  name="new_item_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={LABEL}>
                        New cost item name
                        <Required />
                      </FormLabel>
                      <FormControl>
                        <Input list="add-cost-item-suggestions" placeholder="e.g. Perimeter fencing" {...field} />
                      </FormControl>
                      <datalist id="add-cost-item-suggestions">
                        {(newItemGroup ? COST_ITEM_SUGGESTIONS[newItemGroup] : []).map((suggestion) => (
                          <option key={suggestion} value={suggestion} />
                        ))}
                      </datalist>
                      <FormDescription className="text-[10px] leading-snug">
                        The row this cost, and later ones like it, will sit under in the table.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="new_item_group"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className={LABEL}>
                        Finance group
                        <Required />
                      </FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {groups.map(({ group, label }) => (
                            <SelectItem key={group} value={group}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            ) : null}

            {selectedItem?.is_shared ? (
              <ReadOnlyField label="Scope" value="Shared across products" />
            ) : (
              <FormField
                control={form.control}
                name="scope"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={LABEL}>
                      Scope
                      <Required />
                    </FormLabel>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={(value) => {
                        field.onChange(value);
                        if (value !== SHARED_SCOPE) form.setValue("allocation_basis", undefined);
                      }}
                      disabled={!costItemId}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder={isNew ? "What does it apply to?" : "Which product?"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {/* An existing item that isn't shared can only take a product. */}
                        {isNew ? <SelectItem value={SHARED_SCOPE}>Shared across products</SelectItem> : null}
                        {products.map((product) => (
                          <SelectItem key={product} value={product}>
                            {OFFER_TYPE_LABELS[product]} only
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {isNew && scope === SHARED_SCOPE ? (
              <FormField
                control={form.control}
                name="allocation_basis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className={LABEL}>
                      Allocation basis
                      <Required />
                    </FormLabel>
                    <Select value={field.value ?? ""} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="How is it split?" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {NEW_ITEM_BASES.map((basis) => (
                          <SelectItem key={basis} value={basis}>
                            {ALLOCATION_BASIS_LABELS[basis]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-[10px] leading-snug">
                      Determines how this cost reaches product profitability. Set percentages or exact amounts
                      afterwards from Edit basis.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <ReadOnlyField
                label="Allocation basis"
                value={
                  selectedItem
                    ? selectedItem.is_shared
                      ? (selectedItem.allocation_label ?? "No split rule yet")
                      : "Belongs to one product"
                    : scope && scope !== SHARED_SCOPE
                      ? "Belongs to one product"
                      : "—"
                }
                help={
                  selectedItem?.needs_allocation_rule
                    ? "Profit can't use this cost until a split rule is set, from Edit basis."
                    : undefined
                }
              />
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="sm:col-span-2">
                  <FormLabel className={LABEL}>Description</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Describe what this cost covers and what is excluded" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        {/* ---- 3 ---- */}
        <section className="border-t pt-4">
          <SectionHeading>3. Amount and timing</SectionHeading>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LABEL}>Amount</FormLabel>
                  <FormControl>
                    <NumberInput field={field} prefix="₦" placeholder="0" />
                  </FormControl>
                  <FormDescription className="text-[10px] leading-snug">
                    Needed to add the cost. Leave it blank to save a draft when the amount isn&apos;t known yet.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="effective_date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LABEL}>
                    Effective date
                    <Required />
                  </FormLabel>
                  <FormControl>
                    <Input type="date" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="vendor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LABEL}>Vendor or payee</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter vendor" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reference"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LABEL}>Reference</FormLabel>
                  <FormControl>
                    <Input placeholder="Contract, invoice or work-order no." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>

        {/* ---- 4 ---- */}
        <section className="border-t pt-4">
          <SectionHeading>4. Evidence and note</SectionHeading>
          <div className="grid gap-3.5 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="evidence_url"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <SingleUploadField
                      id="add-cost.evidence"
                      label="Evidence"
                      description="A contract, invoice or receipt. Kept with the amount when one is entered."
                      accept="image/*,application/pdf"
                      value={field.value || undefined}
                      onChange={(url) => field.onChange(url ?? "")}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="note"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className={LABEL}>Internal note</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Reason, approval context or assumptions" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </section>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 border-t px-5 py-3">
        {!canApprove ? (
          <p className="mr-auto text-[11px] text-muted-foreground">
            You can save drafts. Someone with approval rights must approve one before it counts.
          </p>
        ) : null}
        <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={addCost.isPending}>
          Cancel
        </Button>
        <Button
          type="button"
          variant={canApprove ? "outline" : "default"}
          size="sm"
          onClick={() => save(false)}
          disabled={addCost.isPending}
        >
          Save draft
        </Button>
        {canApprove ? (
          <Button type="button" size="sm" onClick={() => save(true)} disabled={addCost.isPending}>
            {addCost.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : null}
            Add cost
          </Button>
        ) : null}
      </div>
    </Form>
  );
}

interface Props {
  assetId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialItemId?: string;
}

/** A fresh form per open (its defaults, and its save progress, are read once at mount). */
export function AddCostModal({ assetId, open, onOpenChange, initialItemId }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 p-0 sm:max-w-[720px]">
        <DialogHeader className="border-b px-5 py-4 text-left">
          <DialogTitle>Add asset cost</DialogTitle>
          <DialogDescription className="text-[11px]">
            Create a financial record and link it to the cost group and product it belongs to.
          </DialogDescription>
        </DialogHeader>
        {open ? <AddCostForm assetId={assetId} initialItemId={initialItemId} onClose={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}
