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
  AdminDesktopTableWrap,
  AdminMobileCard,
  AdminMobileField,
  AdminMobileStack,
} from "@/components/shared/admin-responsive-table";

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
    <div className="w-full min-w-0 space-y-3">
      <AdminMobileStack>
        {rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No users under this agency.</p>
        ) : (
          rows.map((user) => (
            <AdminMobileCard
              key={user._id}
              title={[user.firstName, user.lastName].filter(Boolean).join(" ") || "-"}
              subtitle={user.email || undefined}
            >
              <AdminMobileField label="Phone" value={user.phoneNumber || "-"} />
            </AdminMobileCard>
          ))
        )}
      </AdminMobileStack>

      <AdminDesktopTableWrap>
    <div className="min-w-0 overflow-x-auto rounded-md border border-gray-200">
      <Table className="min-w-[560px]">
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
                <TableCell className="max-w-48 font-medium">
                  <span className="wrap-break-word">
                    {[user.firstName, user.lastName].filter(Boolean).join(" ") || "-"}
                  </span>
                </TableCell>
                <TableCell className="max-w-48 wrap-break-word text-sm">{user.email || "-"}</TableCell>
                <TableCell className="max-w-40 wrap-break-word text-sm">{user.phoneNumber || "-"}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
      </AdminDesktopTableWrap>
    </div>
  );
}
