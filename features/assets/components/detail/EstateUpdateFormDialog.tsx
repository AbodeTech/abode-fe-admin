"use client";

import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
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
import { Textarea } from "@/components/ui/textarea";

import {
  EMPTY_ESTATE_UPDATE_FORM,
  ESTATE_UPDATE_AUDIENCE_LABELS,
  ESTATE_UPDATE_AUDIENCES,
  ESTATE_UPDATE_CATEGORIES,
  ESTATE_UPDATE_CATEGORY_LABELS,
  ESTATE_UPDATE_HEADLINE_MAX,
  ESTATE_UPDATE_MAX_IMAGES,
  estateUpdateChanges,
  estateUpdateFormSchema,
  estateUpdateFormToPayload,
  estateUpdateToForm,
  headlineMentionsEstate,
  type EstateUpdate,
  type EstateUpdateFormValues,
} from "../../schemas/estate-update.schema";
import {
  useCreateEstateUpdate,
  useEditEstateUpdate,
} from "../../hooks/use-estate-update-mutations";
import { useAssetFormStore } from "../../store/asset-form-store";
import { GalleryUploadField } from "../create/UploadFields";

/* ============================================================
 * Create or edit one estate update, from the detail Updates tab.
 *
 * `update: null` saves a new draft; an update is edited in place at any status.
 * Status never moves from here. The PATCH DTO has no `status`, so publish and
 * archive live in the row actions.
 *
 * Images reuse the asset form's upload-on-select field, and with it the shared
 * `useAssetFormStore`. Two rules keep that store honest:
 * - Opening clears only this dialog's `estate-update.images.*` entries. The
 *   store's `reset()` would also wipe the Overview tab's edit state.
 * - Close requests are ignored while an upload is in flight, so its URL can't
 *   land in a form that has since been reset for another update. The X is
 *   hidden meanwhile, so it never looks usable while doing nothing.
 *
 * An edit sends only the fields that changed (`estateUpdateChanges`), so saving
 * never writes back a stale value over an edit made since the row was read.
 * ============================================================ */

const UPLOAD_KEY_PREFIX = "estate-update.images.";

export function EstateUpdateFormDialog({
  assetId,
  assetName,
  open,
  onOpenChange,
  update,
}: {
  assetId: string;
  assetName: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null → create a draft; an update → edit it in place (any status). */
  update: EstateUpdate | null;
}) {
  const createMutation = useCreateEstateUpdate(assetId);
  const editMutation = useEditEstateUpdate(assetId);
  const isPending = createMutation.isPending || editMutation.isPending;

  const isUploading = useAssetFormStore((state) => state.isUploading());

  const form = useForm<EstateUpdateFormValues>({
    resolver: zodResolver(estateUpdateFormSchema),
    defaultValues: EMPTY_ESTATE_UPDATE_FORM,
  });

  // `useWatch` rather than `form.watch()` — the latter returns a fresh function
  // each render, which makes React Compiler skip memoising this component.
  const headline = useWatch({ control: form.control, name: "headline" });

  // The dialog stays mounted between opens, so each open re-seeds the form
  // rather than showing whatever the last update left behind.
  useEffect(() => {
    if (!open) return;
    form.reset(update ? estateUpdateToForm(update) : EMPTY_ESTATE_UPDATE_FORM);

    const { uploads, clearUpload } = useAssetFormStore.getState();
    Object.keys(uploads)
      .filter((key) => key.startsWith(UPLOAD_KEY_PREFIX))
      .forEach(clearUpload);
  }, [open, update, form]);

  const handleOpenChange = (next: boolean) => {
    // A save in flight is held open too: its success closes the dialog, and
    // would otherwise close it again after it was reopened for another update.
    if (!next && (isUploading || isPending)) return;
    onOpenChange(next);
  };

  const onSubmit = (values: EstateUpdateFormValues) => {
    const payload = estateUpdateFormToPayload(values);
    const changes = update ? estateUpdateChanges(update, payload) : payload;

    // The BE refuses this with 400 HEADLINE_CONTAINS_ESTATE_NAME; checking first
    // puts the message on the field instead of a toast. Like the BE, an edit
    // only re-checks a changed headline, so renaming the estate never blocks an
    // unrelated edit.
    if (changes.headline !== undefined && headlineMentionsEstate(changes.headline, assetName)) {
      form.setError("headline", {
        message: "Leave the estate name out. It is shown next to the headline.",
      });
      return;
    }

    const onError = (error: Error) => toast.error(error.message || "Couldn't save the update");

    if (!update) {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Draft saved");
          onOpenChange(false);
        },
        onError,
      });
      return;
    }

    // Nothing differs, so there is nothing to write; the BE would skip it too.
    if (Object.keys(changes).length === 0) {
      onOpenChange(false);
      return;
    }

    editMutation.mutate(
      { updateId: update.id, ...changes },
      {
        onSuccess: () => {
          toast.success("Update saved");
          onOpenChange(false);
        },
        onError,
      }
    );
  };

  const description = !update
    ? "It saves as a draft. Publish it from the list when it's ready."
    : update.status === "published"
      ? "Changes show to buyers straight away. The publish date stays the same."
      : "Changes are saved to this update.";

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-xl"
        showCloseButton={!(isUploading || isPending)}
      >
        <DialogHeader>
          <DialogTitle>{update ? "Edit update" : "New estate update"}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          {/* noValidate: the progress input's min/max/step would otherwise let the
              browser block submit with its own bubble, before the schema's
              inline messages get a chance. */}
          <form noValidate onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="headline"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between gap-3">
                    <FormLabel className="text-xs">Headline</FormLabel>
                    {/* Hidden from screen readers: the description below carries the count. */}
                    <p className="text-xs text-muted-foreground" aria-hidden>
                      {headline.length} / {ESTATE_UPDATE_HEADLINE_MAX}
                    </p>
                  </div>
                  <FormControl>
                    <Input {...field} maxLength={ESTATE_UPDATE_HEADLINE_MAX} />
                  </FormControl>
                  <FormDescription className="text-xs">
                    {`Don't include the estate name${assetName ? ` (${assetName})` : ""}. Buyers see it next to the headline.`}
                    <span className="sr-only">
                      {` ${headline.length} of ${ESTATE_UPDATE_HEADLINE_MAX} characters used.`}
                    </span>
                  </FormDescription>
                  {/* maxLength silently stops input at the limit, so announce reaching it. */}
                  <p className="sr-only" aria-live="polite">
                    {headline.length >= ESTATE_UPDATE_HEADLINE_MAX
                      ? `Headline is at the ${ESTATE_UPDATE_HEADLINE_MAX} character limit.`
                      : ""}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Category</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ESTATE_UPDATE_CATEGORIES.map((category) => (
                        <SelectItem key={category} value={category}>
                          {ESTATE_UPDATE_CATEGORY_LABELS[category]}
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
              name="body"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Details (optional)</FormLabel>
                  <FormControl>
                    <Textarea rows={5} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="progress_percent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Progress % (optional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type="number"
                      min={0}
                      max={100}
                      step={1}
                      value={field.value ?? ""}
                      // Blank means "no progress to show", which the BE stores as null.
                      onChange={(e) =>
                        field.onChange(e.target.value === "" ? null : Number(e.target.value))
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="images"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <GalleryUploadField
                      id="estate-update.images"
                      label="Images (up to 4)"
                      max={ESTATE_UPDATE_MAX_IMAGES}
                      value={field.value ?? []}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="audience"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Audience</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {ESTATE_UPDATE_AUDIENCES.map((audience) => (
                        <SelectItem key={audience} value={audience}>
                          {ESTATE_UPDATE_AUDIENCE_LABELS[audience]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => onOpenChange(false)}
                disabled={isPending || isUploading}
              >
                Cancel
              </Button>
              {/* Saving mid-upload would send the images without the ones still on their way. */}
              <Button type="submit" disabled={isPending || isUploading}>
                {isPending ? (
                  <>
                    Saving <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  </>
                ) : update ? (
                  "Save changes"
                ) : (
                  "Save draft"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
