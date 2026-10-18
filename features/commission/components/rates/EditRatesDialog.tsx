"use client";

import { useState } from "react";
import { useForm, type Control, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import type { CommissionConfig } from "../../schemas/commission.schema";
import {
  configFormSchema,
  configToForm,
  formToPayload,
  type ConfigFormValues,
} from "../../schemas/config-form.schema";
import { usePublishConfig } from "../../hooks/use-publish-config";

type FieldName = FieldPath<ConfigFormValues>;

function PercentField({
  control,
  name,
  label,
  disabled,
}: {
  control: Control<ConfigFormValues>;
  name: FieldName;
  label: string;
  disabled: boolean;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs">{label}</FormLabel>
          <FormControl>
            <div className="relative">
              <Input
                type="number"
                step="0.01"
                min={0}
                max={100}
                disabled={disabled}
                className="pr-8"
                {...field}
                value={field.value as number}
                onChange={(e) => field.onChange(e.target.valueAsNumber)}
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                %
              </span>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function AmountField({
  control,
  name,
  label,
  disabled,
}: {
  control: Control<ConfigFormValues>;
  name: FieldName;
  label: string;
  disabled: boolean;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-xs">{label}</FormLabel>
          <FormControl>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                ₦
              </span>
              <Input
                type="number"
                step="0.01"
                min={0}
                disabled={disabled}
                className="pl-7"
                {...field}
                value={field.value as number}
                onChange={(e) => field.onChange(e.target.valueAsNumber)}
              />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="grid gap-3 sm:grid-cols-2">{children}</div>
    </section>
  );
}

export function EditRatesDialog({ config }: { config: CommissionConfig }) {
  const [open, setOpen] = useState(false);
  const publish = usePublishConfig();

  const form = useForm<ConfigFormValues>({
    resolver: zodResolver(configFormSchema),
    defaultValues: configToForm(config),
  });

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    // Re-seed from the active config each time, so a cancelled edit doesn't
    // linger and a newly published version is picked up.
    if (next) form.reset(configToForm(config));
  };

  function onSubmit(values: ConfigFormValues) {
    publish.mutate(formToPayload(values), {
      onSuccess: (created) => {
        toast.success(`Published version ${created.version}`);
        setOpen(false);
      },
      onError: (error) => toast.error(error.message || "Failed to publish"),
    });
  }

  const disabled = publish.isPending;
  const control = form.control;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto">
          <Pencil className="mr-2 h-4 w-4" />
          Edit rates
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Publish new commission rates</DialogTitle>
          <DialogDescription>
            This creates version {config.version + 1}. Payment plans that already exist keep the
            rate they were created with — only new plans use these values.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Section title="Flex — direct">
              <PercentField control={control} name="flexCommission.direct.founder" label="Founder" disabled={disabled} />
              <PercentField control={control} name="flexCommission.direct.associate-pro" label="Associate Pro" disabled={disabled} />
              <PercentField control={control} name="flexCommission.direct.premium" label="Premium" disabled={disabled} />
              <PercentField control={control} name="flexCommission.direct.default" label="Default" disabled={disabled} />
            </Section>

            <Separator />

            <Section title="Full ownership — direct">
              <PercentField control={control} name="fullOwnershipCommission.direct.founder" label="Founder" disabled={disabled} />
              <PercentField control={control} name="fullOwnershipCommission.direct.associate-pro" label="Associate Pro" disabled={disabled} />
              <PercentField control={control} name="fullOwnershipCommission.direct.premium" label="Premium" disabled={disabled} />
              <PercentField control={control} name="fullOwnershipCommission.direct.default" label="Default" disabled={disabled} />
            </Section>

            <Section title="Full ownership — upline">
              <PercentField control={control} name="fullOwnershipCommission.upline.founder" label="Founder" disabled={disabled} />
              <PercentField control={control} name="fullOwnershipCommission.upline.associate-pro" label="Associate Pro" disabled={disabled} />
              <PercentField control={control} name="fullOwnershipCommission.upline.premium" label="Premium" disabled={disabled} />
            </Section>

            <Section title="Full ownership — topline">
              <PercentField control={control} name="fullOwnershipCommission.topline.founder" label="Founder" disabled={disabled} />
              <PercentField control={control} name="fullOwnershipCommission.topline.associate-pro" label="Associate Pro" disabled={disabled} />
            </Section>

            <Separator />

            <Section title="Platform rates">
              <PercentField control={control} name="wht_rate" label="Withholding tax" disabled={disabled} />
              <PercentField control={control} name="marketplace_platform_fee_pct" label="Marketplace platform fee" disabled={disabled} />
              <PercentField control={control} name="upgrade_commission_pct" label="Upgrade commission" disabled={disabled} />
            </Section>

            <Section title="Amounts">
              <AmountField control={control} name="associate_pro_fee" label="Associate Pro upgrade fee" disabled={disabled} />
              <AmountField control={control} name="high_commission_alert_threshold" label="High commission alert" disabled={disabled} />
            </Section>

            <Separator />

            <FormField
              control={control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Reason for this change</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      disabled={disabled}
                      placeholder="e.g. Q3 founder rate review — direct up 1%"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs">
                    Recorded on version {config.version + 1} and shown in the history.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={disabled}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={disabled}>
                {disabled ? (
                  <>
                    Publishing <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  </>
                ) : (
                  `Publish v${config.version + 1}`
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
