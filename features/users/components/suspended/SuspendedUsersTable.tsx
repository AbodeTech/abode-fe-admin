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
  }
`);

type SuspendedUserRow = FragmentType<typeof SuspendedUsersRowFragment>;

interface SuspendedUsersTableProps {
  users: (SuspendedUserRow | null)[] | null | undefined;
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
    <Table className="min-w-[920px]">
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Date Joined</TableHead>
          <TableHead>Referrer</TableHead>
          <TableHead>Product Purchased</TableHead>
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
                {user.firstName} {user.lastName}
              </Link>
            </TableCell>
            <TableCell className="!py-3.5 max-w-[200px] whitespace-normal wrap-break-word">{user.email}</TableCell>
            <TableCell className="!py-3.5">
              {user.createdAt ? format(new Date(user.createdAt), "dd/MM/yyyy") : "-"}
            </TableCell>
            <TableCell className="!py-3.5">{user.referrer || "No Referer"}</TableCell>
            <TableCell className="!py-3.5">{user.subscriptions ?? 0}</TableCell>
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
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
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
                        <AlertDialogAction onClick={() => handleUnsuspend(user._id)}>
                          Unsuspend
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
