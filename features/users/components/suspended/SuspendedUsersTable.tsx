"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Link from "next/link";
import { format } from "date-fns";
import { graphql, useFragment as getFragmentData, FragmentType } from "@/lib/gql";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { toast } from "sonner";
import { useUnsuspendUser } from "../../hooks/use-suspended-users";
import { getErrorMessage } from "../../utils/error-message";
import {
  AdminDesktopTableWrap,
  AdminMobileCard,
  AdminMobileField,
  AdminMobileStack,
} from "@/components/shared/admin-responsive-table";

export const SuspendedUsersRowFragment = graphql(`
  fragment SuspendedUsersRow_user on UserAdmin {
    _id
    firstName
    lastName
    email
    phoneNumber
    createdAt
    referrer
    subscriptions
    is_suspended
    referral_status
    gender
    country
    Networth
    hasAsset
  }
`);

type SuspendedUserRow = FragmentType<typeof SuspendedUsersRowFragment>;

// `hasAsset` comes back as a string; normalize the common boolean-ish
// values to Yes/No and fall back to the raw value (or a dash when empty).
export function formatHasAsset(value?: string | null): string {
  if (value === null || value === undefined || value === "") return "—";
  const normalized = value.trim().toLowerCase();
  if (["true", "yes", "1"].includes(normalized)) return "Yes";
  if (["false", "no", "0"].includes(normalized)) return "No";
  return value;
}

interface SuspendedUsersTableProps {
  users: (SuspendedUserRow | null)[] | null | undefined;
}

function UnsuspendMenuItem({ userId, disabled, onConfirm }: { userId: string; disabled?: boolean; onConfirm: (id: string) => void }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <DropdownMenuItem onSelect={(event) => event.preventDefault()} disabled={disabled}>
          Unsuspend User
        </DropdownMenuItem>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will unsuspend the user and allow them to access the platform again.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={() => onConfirm(userId)}>Unsuspend</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export function SuspendedUsersTable({ users }: SuspendedUsersTableProps) {
  const usersRaw = users || [];
  const rows = usersRaw.map((user) => getFragmentData(SuspendedUsersRowFragment, user));
  const validRows = rows.filter((user): user is NonNullable<typeof user> => user !== null && user !== undefined);

  const { mutateAsync, isPending } = useUnsuspendUser();

  const handleUnsuspend = async (id: string) => {
    try {
      await mutateAsync(id);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Unable to unsuspend user"));
    }
  };

  return (
    <div className="w-full min-w-0 space-y-3">
      <AdminMobileStack>
        {validRows.map((user) => (
          <AdminMobileCard
            key={user._id}
            title={
              <Link href={`/users/${user._id}`} className="text-primary hover:underline">
                {user.lastName} {user.firstName}
              </Link>
            }
            subtitle={user.email}
          >
            <AdminMobileField label="Phone" value={user.phoneNumber || "—"} />
            <AdminMobileField
              label="Date joined"
              value={user.createdAt ? format(new Date(user.createdAt), "dd/MM/yyyy") : "-"}
            />
            <AdminMobileField label="Referrer" value={user.referrer || "No Referer"} />
            <AdminMobileField label="Products" value={user.subscriptions ?? 0} />
            <AdminMobileField label="Has asset" value={formatHasAsset(user.hasAsset)} />
            <AdminMobileField
              label="Networth"
              value={
                user.Networth !== undefined && user.Networth !== null ? `N${user.Networth.toLocaleString()}` : "-"
              }
            />
            <div className="border-t border-border pt-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full" disabled={isPending}>
                    <MoreVertical className="mr-2 h-4 w-4" />
                    Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Actions</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <UnsuspendMenuItem userId={user._id} disabled={isPending} onConfirm={handleUnsuspend} />
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </AdminMobileCard>
        ))}
      </AdminMobileStack>

      <AdminDesktopTableWrap>
        <div className="min-w-0 overflow-x-auto">
          <Table className="min-w-[920px]">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Date Joined</TableHead>
                <TableHead>Referrer</TableHead>
                <TableHead>Product Purchased</TableHead>
                <TableHead>Has Asset</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {validRows.map((user, idx) => (
                <TableRow
                  key={user._id}
                  className={`text-sm font-medium text-[#333333] ${idx % 2 === 1 ? "bg-[#F8F8F8]" : ""}`}
                >
                  <TableCell className="!py-3.5">
                    <Link href={`/users/${user._id}`} className="hover:underline">
                      {user.lastName} {user.firstName}
                    </Link>
                  </TableCell>
                  <TableCell className="!py-3.5 max-w-[200px] whitespace-normal wrap-break-word">{user.email}</TableCell>
                  <TableCell className="!py-3.5">{user.phoneNumber || "—"}</TableCell>
                  <TableCell className="!py-3.5">
                    {user.createdAt ? format(new Date(user.createdAt), "dd/MM/yyyy") : "-"}
                  </TableCell>
                  <TableCell className="!py-3.5">{user.referrer || "No Referer"}</TableCell>
                  <TableCell className="!py-3.5">{user.subscriptions ?? 0}</TableCell>
                  <TableCell className="!py-3.5">{formatHasAsset(user.hasAsset)}</TableCell>
                  <TableCell className="!py-3.5">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={isPending}>
                          <MoreVertical className="h-5 w-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <UnsuspendMenuItem userId={user._id} disabled={isPending} onConfirm={handleUnsuspend} />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </AdminDesktopTableWrap>
    </div>
  );
}
