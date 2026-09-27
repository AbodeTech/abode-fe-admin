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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import {
  updateCostItemFormSchema,
  type AssetCostItem,
  type UpdateCostItemFormValues,
} from "../../schemas/asset-cost.schema";
import { useUpdateCostItem } from "../../hooks/use-cost-items";

function toFormValues(item: AssetCostItem): UpdateCostItemFormValues {
  return {
    name: item.name,
    description: item.description ?? "",
    is_shared: item.is_shared,
  };
}

interface FormProps {
  assetId: string;
  item: AssetCostItem;
  onClose: () => void;
}

/**
 * Edits a cost ITEM's catalogue fields (name/description/sharing) — no
 * `expected_version`/reason here, unlike the Land Account editor: the real
 * `PATCH .../costs/items/:itemId` endpoint carries no optimistic-concurrency
 * guard at all, so there is nothing to protect with a conflict banner.
 * Product/size/vendor/reference live on the obligation instead (edited via
 * its events, not here).
 */
function EditCostItemForm({ assetId, item, onClose }: FormProps) {
  const update = useUpdateCostItem(assetId, item.id);

  const form = useForm<UpdateCostItemFormValues>({
    resolver: zodResolver(updateCostItemFormSchema),
    defaultValues: toFormValues(item),
  });

  const submit = form.handleSubmit((values) => {
    update.mutate(values, {
      onSuccess: () => {
        toast.success("Cost item updated");
        onClose();
      },
      onError: (error) => toast.error(error.message || "Couldn't save these changes"),
    });
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit cost item</DialogTitle>
        <DialogDescription>
          Catalogue details only — cost records and their financial stages are managed separately.
        </DialogDescription>
      </DialogHeader>

      <Form {...form}>
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Description</FormLabel>
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
                <FormLabel className="text-xs font-normal">Shared across products</FormLabel>
              </FormItem>
            )}
          />
        </div>
      </Form>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={update.isPending}>
          Cancel
        </Button>
        <Button type="button" onClick={submit} disabled={update.isPending}>
          {update.isPending ? (
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
  item: AssetCostItem;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCostMetadataDialog({ assetId, item, open, onOpenChange }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {open ? (
          <EditCostItemForm key={item.id} assetId={assetId} item={item} onClose={() => onOpenChange(false)} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
