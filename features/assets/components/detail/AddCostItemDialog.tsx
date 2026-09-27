"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

import { OFFER_TYPE_LABELS } from "../../schemas/asset.schema";
import {
  COST_GROUPS,
  COST_GROUP_LABELS,
  COST_ITEM_SUGGESTIONS,
  createCostItemFormSchema,
  type CostGroup,
  type CreateCostItemFormValues,
} from "../../schemas/asset-cost.schema";
import { useCreateCostItem } from "../../hooks/use-cost-items";

export type AddCostItemInitialValues = { group?: CostGroup; name?: string };

interface FormProps {
  assetId: string;
  initialValues?: AddCostItemInitialValues;
  onClose: () => void;
}

/**
 * Creates a catalogue line (`AssetCostItem`) — the first of the three real
 * resources (item → obligation → event). A cost record (`AddCostDrawer`)
 * can only be added once at least one item exists.
 */
function AddCostItemForm({ assetId, initialValues, onClose }: FormProps) {
  const createItem = useCreateCostItem(assetId);

  const form = useForm<CreateCostItemFormValues>({
    resolver: zodResolver(createCostItemFormSchema),
    defaultValues: {
      group: initialValues?.group ?? "acquisition",
      name: initialValues?.name ?? "",
      description: "",
      is_shared: false,
      applies_to_products: [],
      excluded_products: [],
    },
  });

  const group = form.watch("group");
  const isShared = form.watch("is_shared");
  const suggestions = COST_ITEM_SUGGESTIONS[group] ?? [];

  const submit = form.handleSubmit((values) => {
    const parsed = createCostItemFormSchema.parse(values);
    createItem.mutate(parsed, {
      onSuccess: () => {
        toast.success("Cost item added");
        onClose();
      },
      onError: (error) => toast.error(error.message || "Couldn't add this cost item"),
    });
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>Add a cost item</DialogTitle>
        <DialogDescription>
          A catalogue line — e.g. &ldquo;Perimeter fencing&rdquo;. Cost records (actual spend) get added against
          it separately.
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="group"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Cost group</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {COST_GROUPS.map((option) => (
                      <SelectItem key={option} value={option}>
                        {COST_GROUP_LABELS[option]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Name</FormLabel>
                <FormControl>
                  <Input list="cost-item-suggestions" placeholder="e.g. Perimeter fencing" {...field} />
                </FormControl>
                <datalist id="cost-item-suggestions">
                  {suggestions.map((suggestion) => (
                    <option key={suggestion} value={suggestion} />
                  ))}
                </datalist>
                <FormDescription className="text-xs">
                  Pick a suggestion or type your own — item names aren&apos;t a fixed list.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Description (optional)</FormLabel>
                <FormControl>
                  <Textarea rows={2} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="is_shared"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={(checked) => field.onChange(checked === true)} />
                </FormControl>
                <FormLabel className="text-xs font-normal">
                  Shared across products — needs an allocation rule before it can count toward per-product profit
                </FormLabel>
              </FormItem>
            )}
          />

          {isShared ? (
            <p className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
              After saving, set this item&apos;s allocation rule from the cost table — it decides how the cost
              splits across {OFFER_TYPE_LABELS["flex"]}, {OFFER_TYPE_LABELS["full-ownership"]}, etc.
            </p>
          ) : null}
        </div>
      </Form>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={createItem.isPending}>
          Cancel
        </Button>
        <Button type="button" onClick={submit} disabled={createItem.isPending}>
          {createItem.isPending ? (
            <>
              Adding <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            </>
          ) : (
            "Add item"
          )}
        </Button>
      </DialogFooter>
    </>
  );
}

interface Props {
  assetId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialValues?: AddCostItemInitialValues;
}

export function AddCostItemDialog({ assetId, open, onOpenChange, initialValues }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {open ? (
          <AddCostItemForm assetId={assetId} initialValues={initialValues} onClose={() => onOpenChange(false)} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
