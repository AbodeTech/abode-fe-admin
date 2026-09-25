"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";

import { OFFER_TYPES, OFFER_TYPE_LABELS } from "../../schemas/asset.schema";
import {
  COST_GROUP_LABELS,
  createObligationFormSchema,
  type AssetCostItem,
  type CreateObligationFormValues,
} from "../../schemas/asset-cost.schema";
import { useCostItems } from "../../hooks/use-cost-items";
import { useCreateObligation } from "../../hooks/use-cost-obligations";
import { NumberInput } from "./OfferEditDialogs";

export type AddCostInitialValues = { costItemId?: string };

interface FormProps {
  assetId: string;
  initialValues?: AddCostInitialValues;
  onClose: () => void;
}

/**
 * Creates a cost RECORD (an `AssetCostObligation`) against an existing cost
 * item — the item itself (its group/name/sharing config) is created
 * separately via `AddCostItemDialog`. A fresh mount per drawer open (see the
 * wrapper below), same reasoning as every other RHF form in this feature:
 * `defaultValues` are read once at mount.
 */
function AddCostForm({ assetId, initialValues, onClose }: FormProps) {
  const { data: items } = useCostItems(assetId);
  const createObligation = useCreateObligation(assetId);

  const form = useForm<CreateObligationFormValues>({
    resolver: zodResolver(createObligationFormSchema),
    defaultValues: {
      cost_item_id: initialValues?.costItemId ?? "",
      title: "",
      description: "",
      product: undefined,
      vendor: "",
      reference: "",
      effective_date: new Date().toISOString().slice(0, 10),
      amount: undefined,
      stage: "budget",
      note: "",
    },
  });

  function close() {
    onClose();
  }

  const submit = form.handleSubmit((values) => {
    const parsed = createObligationFormSchema.parse(values);
    createObligation.mutate(parsed, {
      onSuccess: () => {
        toast.success("Cost record added");
        close();
      },
      onError: (error) => toast.error(error.message || "Couldn't add this cost record"),
    });
  });

  const itemLabel = (item: AssetCostItem) => `${item.name} (${COST_GROUP_LABELS[item.group]})`;

  return (
    <>
      <SheetHeader className="border-b px-6 py-5 text-left">
        <SheetTitle>Add cost</SheetTitle>
        <SheetDescription>
          Starts as a stage entry on an existing cost item — record its next financial stage separately once
          it exists.
        </SheetDescription>
      </SheetHeader>

      <Form {...form}>
        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <FormField
            control={form.control}
            name="cost_item_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Cost item</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder={(items ?? []).length === 0 ? "No cost items yet" : "Choose a cost item"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {(items ?? [])
                      .filter((item) => item.is_active)
                      .map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {itemLabel(item)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <FormDescription className="text-xs">
                  No item for this yet? Add one first from the cost table above.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Title</FormLabel>
                <FormControl>
                  <Input placeholder="A short, specific description" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="product"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Product</FormLabel>
                <Select
                  value={field.value ?? "estate-wide"}
                  onValueChange={(value) => field.onChange(value === "estate-wide" ? undefined : value)}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="estate-wide">Estate-wide (no single product)</SelectItem>
                    {OFFER_TYPES.map((offerType) => (
                      <SelectItem key={offerType} value={offerType}>
                        {OFFER_TYPE_LABELS[offerType]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <FormField
              control={form.control}
              name="vendor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Vendor / payee</FormLabel>
                  <FormControl>
                    <Input {...field} />
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
                  <FormLabel className="text-xs">Reference</FormLabel>
                  <FormControl>
                    <Input placeholder="Contract, invoice or work order no." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="effective_date"
            render={({ field }) => (
              <FormItem>
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
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Initial amount (optional)</FormLabel>
                <FormControl>
                  <NumberInput field={field} prefix="₦" min={0} />
                </FormControl>
                <FormDescription className="text-xs">
                  Leave blank if the amount isn&apos;t known yet — it can be recorded later.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="note"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs">Note</FormLabel>
                <FormControl>
                  <Textarea rows={2} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </Form>

      <div className="flex items-center justify-end gap-3 border-t px-6 py-4">
        <Button type="button" variant="outline" onClick={close} disabled={createObligation.isPending}>
          Cancel
        </Button>
        <Button type="button" onClick={submit} disabled={createObligation.isPending}>
          {createObligation.isPending ? (
            <>
              Adding <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            </>
          ) : (
            "Add cost"
          )}
        </Button>
      </div>
    </>
  );
}

interface Props {
  assetId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-fills the cost item — e.g. from a coverage-panel "Add cost" shortcut. */
  initialValues?: AddCostInitialValues;
}

export function AddCostDrawer({ assetId, open, onOpenChange, initialValues }: Props) {
  return (
    <Sheet open={open} onOpenChange={(next) => (next ? undefined : onOpenChange(false))}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        {open ? (
          <AddCostForm assetId={assetId} initialValues={initialValues} onClose={() => onOpenChange(false)} />
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
