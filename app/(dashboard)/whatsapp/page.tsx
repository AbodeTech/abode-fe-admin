"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";

import { WhatsappInbox } from "@/features/whatsapp";

/**
 * WhatsApp inbox — every message to and from the Abode number, by contact.
 * Read-only; the open conversation lives in the URL (`?phone=`). The heading
 * sits in the inbox's list column, as on the customer-side Amaris page.
 */
export default function WhatsappPage() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-[1600px]">
      <Suspense
        fallback={
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
          </div>
        }
      >
        <WhatsappInbox />
      </Suspense>
    </div>
  );
}
