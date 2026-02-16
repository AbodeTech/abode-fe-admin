"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { format } from "date-fns";
import type { FragmentType } from "@/lib/gql";
import { useFragment as getFragmentData, graphql } from "@/lib/gql";

export const DefaultUsersRowFragment = graphql(`
  fragment DefaultUsersRow_user on UserAdmin {
    _id
    firstName
    lastName
    email
    phoneNumber
    createdAt
    referrer
    subscriptions
    Networth
  }
`);

type UserRow = FragmentType<typeof DefaultUsersRowFragment>;

interface DefaultUsersTableProps {
  users: (UserRow | null)[] | null | undefined;
}

export function DefaultUsersTable({ users }: DefaultUsersTableProps) {
  const usersRaw = users || [];
  const rows = usersRaw.map((user) => getFragmentData(DefaultUsersRowFragment, user));
  const validRows = rows.filter((user): user is NonNullable<typeof user> => user !== null && user !== undefined);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>No.</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone</TableHead>
          <TableHead>Date Joined</TableHead>
          <TableHead>Referrer</TableHead>
          <TableHead>Subscriptions</TableHead>
          <TableHead>Networth</TableHead>
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
            <TableCell>{user.phoneNumber || "-"}</TableCell>
            <TableCell>
              {user.createdAt ? format(new Date(user.createdAt), "dd/MM/yyyy") : "-"}
            </TableCell>
            <TableCell>{user.referrer || "No Referrer"}</TableCell>
            <TableCell>{user.subscriptions ?? 0}</TableCell>
            <TableCell>
              {(user.Networth !== undefined && user.Networth !== null) ? `₦${user.Networth.toLocaleString()}` : "-"}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
