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
import {
  AdminDesktopTableWrap,
  AdminMobileCard,
  AdminMobileField,
  AdminMobileStack,
} from "@/components/shared/admin-responsive-table";

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
            <AdminMobileField label="Phone" value={user.phoneNumber || "-"} />
            <AdminMobileField
              label="Date joined"
              value={user.createdAt ? format(new Date(user.createdAt), "dd/MM/yyyy") : "-"}
            />
            <AdminMobileField label="Referrer" value={user.referrer || "No Referer"} />
            <AdminMobileField label="Products" value={user.subscriptions ?? 0} />
            <AdminMobileField
              label="Networth"
              value={
                user.Networth !== undefined && user.Networth !== null
                  ? `N${user.Networth.toLocaleString()}`
                  : "-"
              }
            />
          </AdminMobileCard>
        ))}
      </AdminMobileStack>

      <AdminDesktopTableWrap>
        <div className="min-w-0 overflow-x-auto">
          <Table className="min-w-[960px]">
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone Number</TableHead>
                <TableHead>Date Joined</TableHead>
                <TableHead>Referrer</TableHead>
                <TableHead>Product Purchased</TableHead>
                <TableHead>Networth</TableHead>
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
                  <TableCell className="!py-3.5 max-w-[220px] whitespace-normal wrap-break-word">{user.email}</TableCell>
                  <TableCell>{user.phoneNumber || "-"}</TableCell>
                  <TableCell className="!py-3.5">
                    {user.createdAt ? format(new Date(user.createdAt), "dd/MM/yyyy") : "-"}
                  </TableCell>
                  <TableCell className="!py-3.5">{user.referrer || "No Referer"}</TableCell>
                  <TableCell className="!py-3.5">{user.subscriptions ?? 0}</TableCell>
                  <TableCell className="!py-3.5">
                    {user.Networth !== undefined && user.Networth !== null ? `N${user.Networth.toLocaleString()}` : "-"}
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
