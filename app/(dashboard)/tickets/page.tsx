"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { TicketInbox } from "@/features/tickets";

export default function TicketsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      }
    >
      <TicketInbox />
    </Suspense>
  );
}
