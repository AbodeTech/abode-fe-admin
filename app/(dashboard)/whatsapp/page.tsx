"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";

import { WhatsappInbox } from "@/features/whatsapp";

export default function WhatsappPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">WhatsApp</h1>
        <p className="text-sm text-muted-foreground">
          Every message to and from the Abode WhatsApp number, by contact.
          Read-only.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        }
      >
        <WhatsappInbox />
      </Suspense>
    </div>
  );
}
