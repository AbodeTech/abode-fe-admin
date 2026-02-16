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
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>No.</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Date Joined</TableHead>
          <TableHead>Referrer</TableHead>
          <TableHead>Subscriptions</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {validRows.map((user, idx) => (
          <TableRow key={user._id}>
            <TableCell>{idx + 1}</TableCell>
            <TableCell>
              <Link href={`/dashboard/users/${user._id}`} className="hover:underline text-blue-600">
                {user.firstName} {user.lastName}
              </Link>
            </TableCell>
            <TableCell>{user.email}</TableCell>
            <TableCell>
              {user.createdAt ? format(new Date(user.createdAt), "dd/MM/yyyy") : "-"}
            </TableCell>
            <TableCell>{user.referrer || "No Referrer"}</TableCell>
            <TableCell>{user.subscriptions ?? 0}</TableCell>
            <TableCell>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isPending}
                  >
                    {isPending ? "Working..." : "Unsuspend"}
                  </Button>
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
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
