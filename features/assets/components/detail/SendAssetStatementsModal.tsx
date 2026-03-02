"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { sendAssetStatementsToAdmin } from "@/lib/api/admin/asset-statements.client";

interface SendAssetStatementsModalProps {
  assetId: string | null;
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function SendAssetStatementsModal({ assetId }: SendAssetStatementsModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const mutation = useMutation({
    mutationFn: ({ id, adminEmail }: { id: string; adminEmail: string }) =>
      sendAssetStatementsToAdmin(id, adminEmail),
    onSuccess: (result) => {
      toast.success(
        `Asset statements sent successfully${
          result?.statementsCount ? `: ${result.statementsCount} statement(s)` : ""
        }.`
      );
      setIsOpen(false);
      setEmail("");
      setEmailError("");
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to send asset statements");
    },
  });

  const onSend = async () => {
    if (!email.trim()) {
      setEmailError("Email is required");
      return;
    }

    if (!isValidEmail(email.trim())) {
      setEmailError("Please enter a valid email address");
      return;
    }

    if (!assetId) {
      toast.error("Asset ID is missing. Open this page from the assets table and try again.");
      return;
    }

    setEmailError("");
    await mutation.mutateAsync({ id: assetId, adminEmail: email.trim() });
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="outline">Receive Statements</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Send Asset Statements</AlertDialogTitle>
          <AlertDialogDescription>
            Enter the admin email that should receive statements for this asset.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="grid gap-2 py-2">
          <Label htmlFor="statement-email">Email Address</Label>
          <Input
            id="statement-email"
            type="email"
            placeholder="admin@example.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setEmailError("");
            }}
            className={emailError ? "border-red-500" : ""}
          />
          {emailError && <p className="text-sm text-red-500">{emailError}</p>}
        </div>

        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setIsOpen(false);
              setEmail("");
              setEmailError("");
            }}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button onClick={onSend} disabled={mutation.isPending}>
            {mutation.isPending ? "Sending..." : "Send"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
