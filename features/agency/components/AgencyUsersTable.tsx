"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface AgencyUserRow {
  _id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
}

interface AgencyUsersTableProps {
  users?: AgencyUserRow[] | null;
}

export function AgencyUsersTable({ users }: AgencyUsersTableProps) {
  const rows = users ?? [];

  return (
    <div className="border border-gray-200 rounded-md overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                No users under this agency.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((user) => (
              <TableRow key={user._id} className="hover:bg-muted/30">
                <TableCell className="font-medium">
                  {[user.firstName, user.lastName].filter(Boolean).join(" ") || "-"}
                </TableCell>
                <TableCell>{user.email || "-"}</TableCell>
                <TableCell>{user.phoneNumber || "-"}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
