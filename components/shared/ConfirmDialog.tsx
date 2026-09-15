"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  /** Red confirm button for a destructive/irreversible action. Default true. */
  destructive?: boolean;
}

/**
 * App-wide replacement for `window.confirm()` — a native browser dialog that
 * can't be styled, doesn't match the rest of the UI, and blocks the JS
 * thread. Wraps `components/ui/alert-dialog.tsx` (the same primitive already
 * used ad hoc in places like `CouponsTable.tsx`'s delete confirm) behind one
 * controlled, reusable component instead of repeating the AlertDialog
 * boilerplate at every call site.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Back",
  onConfirm,
  destructive = true,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            className={destructive ? "bg-red-600 hover:bg-red-700" : undefined}
          >
            {confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
