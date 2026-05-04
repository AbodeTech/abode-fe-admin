"use client";

import { useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";
import { UserAssetsList } from "../detail/UserAssetsList";
import { useSelectedClientStore } from "@/store/selected-client-store";

export function ViewClientAssetModal() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { clientId, clientName, clearClient } = useSelectedClientStore();

  const isOpen = searchParams?.get("modal") === "viewclientasset";

  const title = useMemo(() => {
    if (!clientName) return "Client Assets";
    return `${clientName}'s Assets`;
  }, [clientName]);

  const handleOpenChange = (open: boolean) => {
    if (open) return;
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.delete("modal");
    router.push(params.toString() ? `?${params.toString()}` : "?");
    clearClient();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        {!clientId ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center">No client selected.</p>
            </CardContent>
          </Card>
        ) : (
          <UserAssetsList userId={clientId} readOnly />
        )}
      </DialogContent>
    </Dialog>
  );
}
