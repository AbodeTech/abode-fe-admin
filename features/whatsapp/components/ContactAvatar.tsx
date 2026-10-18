import { Phone } from "lucide-react";

import { cn } from "@/lib/utils";
import { contactInitials } from "../lib/format";
import type { WhatsappContactIdentity } from "../schemas/whatsapp.schema";

type Props = {
  contact: Pick<
    WhatsappContactIdentity,
    "firstName" | "lastName" | "phoneNumber" | "userId"
  >;
  size?: "sm" | "md";
};

/**
 * Teal with initials when the number matched an account; grey with a phone
 * glyph when it didn't. The colour is the "matched" signal, so the list
 * doesn't need a separate marker for it.
 */
export function ContactAvatar({ contact, size = "sm" }: Props) {
  const initials = contactInitials(contact);
  const matched = !!contact.userId;

  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold",
        size === "sm" ? "h-9 w-9 text-xs" : "h-10 w-10 text-sm",
        matched ? "bg-[#E0F2F1] text-[#00695C]" : "bg-gray-100 text-gray-500",
      )}
    >
      {initials ?? (
        <Phone className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
      )}
    </span>
  );
}
