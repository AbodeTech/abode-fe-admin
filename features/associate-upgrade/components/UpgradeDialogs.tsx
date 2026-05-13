"use client";

import React from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { FragmentType, useFragment as getFragmentData } from "@/lib/gql";
import { UpgradeRowFragment } from "./UpgradeTable";
import { RotateCcw } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  actionLabel: string;
  loading?: boolean;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  actionLabel,
  loading,
  onConfirm,
  onOpenChange,
}: ConfirmDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="w-[calc(100vw-1.5rem)] max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={loading}>
            {loading && <RotateCcw className="mr-2 h-4 w-4 animate-spin" />}
            {actionLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function UpgradeSummary({ row }: { row?: FragmentType<typeof UpgradeRowFragment> | null }) {
  const upgrade = getFragmentData(UpgradeRowFragment, row);
  if (!upgrade) return null;
  return (
    <div className="rounded-md border p-3 bg-muted/40 text-sm space-y-1">
      <p className="font-medium">
        {upgrade.user?.firstName} {upgrade.user?.lastName}
      </p>
      <p className="text-muted-foreground">{upgrade.user?.email}</p>
      <p>Upgrade: {upgrade.user_upgrade_type}</p>
      <p>Amount: {upgrade.fee_amount}</p>
    </div>
  );
}
