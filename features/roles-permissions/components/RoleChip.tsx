"use client";

import { ChevronDown } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ApiClientError } from "@/lib/api-client";
import { isLandingPage, landingLabel, type LandingPage } from "@/lib/rbac";
import { useAuthStore } from "@/store/auth-store";

import { useSetStartPage } from "../hooks/use-set-start-page";

/** `sales_team_lead` → `Sales Team Lead`. Role names are snake_case records. */
function roleLabel(name: string): string {
  return name
    .split("_")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Radio value for "use my primary role's page", which the API takes as null. */
const PRIMARY = "__primary__";

/**
 * The header's role chip: who the signed-in admin is, in roles.
 *
 * With several roles whose landing pages differ it becomes a menu — "Start on
 * sign-in" — so the person can choose which of their roles' pages opens first.
 * The BE only accepts a landing page that belongs to a role they hold, so the
 * options here are exactly those pages; it never offers one the server would
 * refuse. With one role (or roles that share a landing page) it is a plain label.
 */
export function RoleChip() {
  const user = useAuthStore((state) => state.user);
  const setStartPage = useSetStartPage();

  const roles = [user?.role, ...(user?.additional_roles ?? [])].filter(
    (role): role is NonNullable<typeof role> => !!role,
  );
  if (roles.length === 0) return null;

  const primary = roleLabel(roles[0].name);
  const chipText = roles.length > 1 ? `${primary} +${roles.length - 1}` : primary;

  // Distinct landing pages among the held roles, primary's first.
  const options = [
    ...new Set(roles.map((role) => role.default_landing_page).filter(isLandingPage)),
  ];
  const canChoose = options.length > 1;

  // A stored choice equal to the main role's own page is the same as no choice.
  const choice = user?.start_page_choice ?? null;
  const current = choice && choice !== options[0] ? choice : PRIMARY;

  const choose = (value: string) => {
    const next = value === PRIMARY ? null : (value as LandingPage);
    setStartPage.mutate(
      { start_page: next },
      {
        onSuccess: (result) =>
          toast.success(`You will start on ${landingLabel(result.start_page as LandingPage)}.`),
        onError: (error) =>
          toast.error(error instanceof ApiClientError ? error.message : "Could not save your start page."),
      },
    );
  };

  const label = (
    <>
      <span className="h-2 w-2 shrink-0 rounded-full bg-[#00695C]" aria-hidden />
      <span className="truncate text-sm font-medium text-[#222222]">{chipText}</span>
    </>
  );

  if (!canChoose) {
    return (
      <div
        className="flex max-w-56 items-center gap-2 rounded-full border border-[#E5E5E5] bg-white px-3 py-1.5"
        title={roles.map((role) => roleLabel(role.name)).join(", ")}
      >
        {label}
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="h-auto max-w-64 gap-2 rounded-full px-3 py-1.5"
          aria-label="Your roles and start page"
        >
          {label}
          <ChevronDown className="h-4 w-4 shrink-0 text-gray-500" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Your roles</DropdownMenuLabel>
        <ul className="px-2 pb-1 text-sm text-gray-600">
          {roles.map((role) => (
            <li key={role.id}>{roleLabel(role.name)}</li>
          ))}
        </ul>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Start on sign-in</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={current} onValueChange={choose}>
          <DropdownMenuRadioItem value={PRIMARY} disabled={setStartPage.isPending}>
            My main role&apos;s page ({landingLabel(options[0])})
          </DropdownMenuRadioItem>
          {options.slice(1).map((value) => (
            <DropdownMenuRadioItem key={value} value={value} disabled={setStartPage.isPending}>
              {landingLabel(value)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
