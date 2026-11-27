"use client";

import Link from "next/link";
import { Lock } from "lucide-react";

import { Button } from "@/components/ui/button";

type NoAccessProps = {
  /** The page the person tried to open, e.g. "Marketplace". */
  pageLabel?: string;
  /** Names of every role the person holds, primary first. */
  roleNames?: string[];
  /** Where "Go to…" leads: the person's own start page. */
  homeHref?: string;
  homeLabel?: string;
  /** Replaces the "your role doesn't include this page" sentence, e.g. for a missing manager record. */
  note?: string;
};

/** `sales_member` → `Sales Member`: role names are snake_case records, people read words. */
function roleLabel(name: string): string {
  return name
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function joinNames(names: string[]): string {
  const labels = names.map(roleLabel);
  if (labels.length <= 1) return labels[0] ?? "";
  return `${labels.slice(0, -1).join(", ")} and ${labels[labels.length - 1]}`;
}

/**
 * The state a page shows when the signed-in admin's roles don't include it.
 * The shell (sidebar, header) stays around it so the person is never stranded.
 *
 * It is the lock card the Financial Officer and Associate Performance pages
 * already use, made one shared component. The same refusal arrives from the
 * server (403) when the page's data is requested directly.
 */
export function NoAccess({ pageLabel, roleNames = [], homeHref = "/", homeLabel, note }: NoAccessProps) {
  const roles = joinNames(roleNames);

  return (
    <div role="alert" className="flex items-center justify-center h-[calc(100vh-200px)]">
      <div className="max-w-md text-center space-y-3">
        <div className="mx-auto h-12 w-12 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center">
          <Lock className="h-6 w-6" />
        </div>
        <h2 className="text-lg font-semibold text-gray-900">
          {pageLabel ? `${pageLabel} is restricted` : "This page is restricted"}
        </h2>
        <p className="text-sm text-gray-600">
          {note ??
            `${
              roles
                ? `Your ${roleNames.length > 1 ? "roles" : "role"}, ${roles}, ${roleNames.length > 1 ? "don't" : "doesn't"} include this page. `
                : "Your role doesn't include this page. "
            }Nothing was changed. If you need it for your work, ask a Founder to add the role that covers it.`}
        </p>
        <Button asChild variant="outline">
          <Link href={homeHref}>{homeLabel ? `Go to ${homeLabel}` : "Go to your start page"}</Link>
        </Button>
      </div>
    </div>
  );
}
