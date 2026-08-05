"use client";

import { useEffect, useState } from "react";
import { useForm, type Control } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

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
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import { OFFER_TYPES, OFFER_TYPE_LABELS } from "../../schemas/commission.schema";
import {
  emptySubjectOverrideForm,
  subjectFormToPayload,
  subjectOverrideFormSchema,
  subjectOverrideToForm,
  type SubjectOverrideFormValues,
} from "../../schemas/override-form.schema";
import {
  assetRefName,
  personRefName,
  type NormalisedOverride,
} from "../../schemas/override.schema";
import {
  useUpsertAssetUserOverride,
  useUpsertUserOverride,
} from "../../hooks/use-upsert-override";
import { AssetPicker } from "../shared/AssetPicker";
import { UserPicker } from "../shared/UserPicker";

type SubjectType = "user" | "asset-user";
type FormControl = Control<SubjectOverrideFormValues>;

const LEGS = [
  {
    key: "direct" as const,
    label: "Direct",
    hint: "Paid when this referrer brings the buyer.",
  },
  {
    key: "upline" as const,
    label: "Upline",
    hint: "Paid when they sit one level above the direct referrer.",
  },
  {
    key: "topline" as const,
    label: "Topline",
    hint: "Paid when they sit two levels above.",
  },
];

function LegField({
  control,
  leg,
  label,
  hint,
  disabled,
}: {
  control: FormControl;
  leg: "direct" | "upline" | "topline";
  label: string;
  hint: string;
  disabled: boolean;
}) {

  return (
    <FormField
      control={control}
      name={leg}
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
                placeholder="—"
                disabled={disabled}
                className="pr-7"
                value={field.value ?? ""}
                onChange={(e) =>
                  // Empty string — not undefined — so RHF doesn't fall back to defaultValues.
                  field.onChange(e.target.value === "" ? "" : e.target.valueAsNumber)
                }
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
              />
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                %
              </span>
            </div>
          </FormControl>
          <FormDescription className="text-xs">{hint}</FormDescription>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

interface SubjectOverrideDialogProps {
  type: SubjectType;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Present when editing; absent when creating. */
  override?: NormalisedOverride;
}

export function SubjectOverrideDialog({
  type,
  open,
  onOpenChange,
  override,
}: SubjectOverrideDialogProps) {
  const includeAsset = type === "asset-user";
  const isEdit = Boolean(override);

  const upsertUser = useUpsertUserOverride();
  const upsertAssetUser = useUpsertAssetUserOverride();
  const mutation = includeAsset ? upsertAssetUser : upsertUser;

  const [formKey, setFormKey] = useState(0);
  const form = useForm<SubjectOverrideFormValues>({
    resolver: zodResolver(subjectOverrideFormSchema),
    defaultValues: emptySubjectOverrideForm(),
  });
  const { isDirty } = form.formState;

  // Parent opens via controlled `open` — Radix does not call onOpenChange(true),
  // so seed the form when the dialog opens (create or edit).
  useEffect(() => {
    if (!open) return;
    form.reset(override ? subjectOverrideToForm(override) : emptySubjectOverrideForm());
    setFormKey((key) => key + 1);
    // Only re-seed when the dialog opens or the edited row changes — not on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `form` is stable; including it can re-reset mid-edit
  }, [open, override]);

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
  };

  function onSubmit(values: SubjectOverrideFormValues) {
    const parsed = subjectOverrideFormSchema.parse(values);

    if (includeAsset && !parsed.asset_id) {
      form.setError("asset_id", { message: "Choose an asset" });
      return;
    }

    mutation.mutate(subjectFormToPayload(parsed, { includeAsset }), {
      onSuccess: () => {
        toast.success(isEdit ? "Override updated" : "Override created");
        onOpenChange(false);
      },
      onError: (error) => toast.error(error.message || "Failed to save override"),
    });
  }

  const disabled = mutation.isPending;
  const saveDisabled = disabled || (isEdit && !isDirty);
  const control = form.control;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit" : "New"} {includeAsset ? "asset + referrer" : "referrer"} override
          </DialogTitle>
          <DialogDescription>
            {includeAsset
              ? "The most specific override — it beats a blanket referrer rate, but only on this asset."
              : "Applies to this referrer across every asset, unless an asset + referrer override exists."}{" "}
            Takes effect on new payment plans only.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form key={formKey} onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              {includeAsset ? (
                <FormField
                  control={control}
                  name="asset_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Asset</FormLabel>
                      <FormControl>
                        <AssetPicker
                          value={field.value ?? ""}
                          onChange={field.onChange}
                          disabled={disabled || isEdit}
                          fallbackLabel={override ? assetRefName(override.asset) : null}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : null}

              <FormField
                control={control}
                name="user_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Referrer</FormLabel>
                    <FormControl>
                      <UserPicker
                        value={field.value}
                        onChange={field.onChange}
                        disabled={disabled || isEdit}
                        fallbackLabel={override ? personRefName(override.user) : null}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="offer_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Offer type</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={disabled || isEdit}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {OFFER_TYPES.map((offerType) => (
                          <SelectItem key={offerType} value={offerType}>
                            {OFFER_TYPE_LABELS[offerType]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="text-xs">
                      One override per offer type. Covering both means creating two.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {isEdit ? (
              <p className="text-xs text-muted-foreground">
                Subject and offer type identify the override and can&apos;t be changed. Revoke this
                one and create another to move it.
              </p>
            ) : null}

            <Separator />

            <section className="space-y-3">
              <h3 className="text-sm font-semibold">Rates</h3>
              <div className="grid gap-3 sm:grid-cols-3">
                {LEGS.map((leg) => (
                  <LegField
                    key={leg.key}
                    control={control}
                    leg={leg.key}
                    label={leg.label}
                    hint={leg.hint}
                    disabled={disabled}
                  />
                ))}
              </div>

              {/*
                All three legs are live since 2026-07-28: resolution walks the
                referral chain at plan creation (ticket 6) and each leg's rate
                is stored per override (ticket 8). Flex only ever resolves the
                direct leg, but storing the others is harmless.
              */}
            </section>

            <Separator />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={control}
                name="expires_at"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expires</FormLabel>
                    <FormControl>
                      <Input type="date" disabled={disabled} {...field} value={field.value ?? ""} />
                    </FormControl>
                    <FormDescription>
                      Optional. Plans created before it expires keep this rate for life.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Why this referrer earns a different rate"
                        disabled={disabled}
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={disabled}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saveDisabled}>
                {disabled ? (
                  <>
                    Saving <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  </>
                ) : isEdit ? (
                  "Save override"
                ) : (
                  "Create override"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
