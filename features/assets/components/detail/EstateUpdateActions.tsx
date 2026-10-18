"use client";

import { useState } from "react";
import { Loader2, MoreVertical } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { useAdminPermissions } from "@/hooks/use-admin-permission";

import {
  ESTATE_UPDATE_TRANSITIONS,
  type EstateUpdate,
} from "../../schemas/estate-update.schema";
import {
  useArchiveEstateUpdate,
  usePublishEstateUpdate,
} from "../../hooks/use-estate-update-mutations";

type ActionUpdate = Pick<
  EstateUpdate,
  "id" | "headline" | "status" | "audience" | "published_at" | "notified_at"
>;

type ConfirmAction = "publish" | "republish" | "archive";

type ConfirmCopy = {
  title: string;
  description: string;
  confirmLabel: string;
  destructive: boolean;
};

/**
 * Publish spells out who will see the update, because archiving later can't
 * unsend what buyers have already read. Archive is the only destructive move:
 * on a published update buyers lose it at once, and on a draft it only leaves
 * the drafts, which is why the two get different descriptions.
 */
function confirmCopy(action: ConfirmAction, update: ActionUpdate): ConfirmCopy {
  switch (action) {
    case "publish":
      return {
        title: "Publish this update?",
        description:
          update.audience === "owners"
            ? "Buyers with a plot in this estate will see it on their plot page and home feed."
            : "Everyone signed in to Abode will be able to see it.",
        confirmLabel: "Publish",
        destructive: false,
      };
    case "republish":
      return {
        title: "Re-publish this update?",
        description: "It goes back on the feed with its original publish date.",
        confirmLabel: "Re-publish",
        destructive: false,
      };
    case "archive":
      return {
        title: "Archive this update?",
        description:
          update.status === "draft"
            ? "It moves out of your drafts. You can publish it later."
            : "Buyers stop seeing it straight away. You can re-publish it later.",
        confirmLabel: "Archive",
        destructive: true,
      };
  }
}

interface EstateUpdateActionsProps {
  assetId: string;
  update: ActionUpdate;
  /**
   * The list is re-reading. A publish or archive settles before its refetch
   * lands, so until then `update.status` is the old one and the menu would
   * offer a move the server has already made.
   */
  isFetching?: boolean;
  /** The parent owns the form dialog, so one dialog serves every row. */
  onEdit: () => void;
}

/**
 * Row actions for one estate update. `ESTATE_UPDATE_TRANSITIONS` decides which
 * moves a row offers, but the server stays the authority: a move another admin
 * already made comes back as a 409, its message is toasted as-is, and the list
 * re-reads so the row shows where the update actually is.
 *
 * Renders nothing without `manage_estate_updates`. Every hook runs before that
 * return, so the hook order holds if the permission changes between renders.
 */
export function EstateUpdateActions({
  assetId,
  update,
  isFetching = false,
  onEdit,
}: EstateUpdateActionsProps) {
  const canManage = useAdminPermissions().has("manage_estate_updates");
  const publish = usePublishEstateUpdate(assetId);
  const archive = useArchiveEstateUpdate(assetId);

  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);
  // Off every time the dialog opens: emailing an estate's plot holders is a
  // deliberate choice per publish, never a setting that sticks from the last one.
  const [notify, setNotify] = useState(false);
  // `confirm` goes null the moment the dialog closes, but the dialog keeps
  // rendering through its fade-out. Reading the copy from the last action
  // shown stops the title and button colour swapping mid-animation.
  const [shownAction, setShownAction] = useState<ConfirmAction>("publish");

  if (!canManage) return null;

  const isPending = publish.isPending || archive.isPending;
  const canPublish = ESTATE_UPDATE_TRANSITIONS[update.status].includes("published");
  const canArchive = ESTATE_UPDATE_TRANSITIONS[update.status].includes("archived");
  // `published_at` is set on the first publish and never cleared. An archived
  // update that has one was live before and goes back with its original date;
  // one archived straight from draft never was, so it gets a plain Publish.
  const publishAction: ConfirmAction =
    update.status === "archived" && update.published_at !== null ? "republish" : "publish";

  const openConfirm = (action: ConfirmAction) => {
    setShownAction(action);
    setNotify(false);
    setConfirm(action);
  };

  // Mailed once, never again: the BE drops a second request, so the box doesn't offer it.
  const alreadyNotified = update.notified_at !== null;
  const showNotify = shownAction !== "archive" && !alreadyNotified;

  const handleConfirm = () => {
    const action = confirm;
    setConfirm(null);
    if (!action) return;

    const onError = (error: Error) =>
      toast.error(error.message || "Couldn't change the update's status");

    if (action === "archive") {
      archive.mutate(
        { updateId: update.id },
        { onSuccess: () => toast.success("Update archived"), onError }
      );
      return;
    }

    const notifySubscribers = notify && !alreadyNotified;
    publish.mutate(
      { updateId: update.id, notifySubscribers },
      {
        onSuccess: () =>
          toast.success(
            notifySubscribers
              ? "Update published, and plot holders are being emailed"
              : action === "republish"
                ? "Update re-published"
                : "Update published"
          ),
        onError,
      }
    );
  };

  const copy = confirmCopy(shownAction, update);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${update.headline}`}
            disabled={isPending || isFetching}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreVertical className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => onEdit()}>Edit</DropdownMenuItem>
          {canPublish ? (
            <DropdownMenuItem onClick={() => openConfirm(publishAction)}>
              {publishAction === "republish" ? "Re-publish" : "Publish"}
            </DropdownMenuItem>
          ) : null}
          {canArchive ? (
            <DropdownMenuItem variant="destructive" onClick={() => openConfirm("archive")}>
              Archive
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={confirm !== null}
        onOpenChange={(open) => {
          if (!open) setConfirm(null);
        }}
        title={copy.title}
        description={copy.description}
        confirmLabel={copy.confirmLabel}
        onConfirm={handleConfirm}
        destructive={copy.destructive}
      >
        {showNotify ? (
          <label className="flex items-start gap-3 rounded-md border p-3 text-sm">
            <Checkbox
              checked={notify}
              onCheckedChange={(checked) => setNotify(checked === true)}
              className="mt-0.5"
            />
            <span>
              <span className="font-medium">Email this estate&apos;s plot holders</span>
              <span className="mt-0.5 block text-muted-foreground">
                Everyone with a live plan here gets it once, unless they turned emails off.
              </span>
            </span>
          </label>
        ) : null}
        {shownAction !== "archive" && alreadyNotified ? (
          <p className="rounded-md border p-3 text-sm text-muted-foreground">
            Plot holders were already emailed about this update, so no mail goes out again.
          </p>
        ) : null}
      </ConfirmDialog>
    </>
  );
}
