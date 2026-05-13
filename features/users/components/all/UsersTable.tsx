"use client";

import { graphql } from "@/lib/gql";
import { FragmentType, useFragment } from "@/lib/gql";
import { UsersTableFragmentFragment as UsersTableFragmentType } from "@/lib/gql/graphql";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  User as UserIcon,
  Mail,
  Calendar,
  CheckCircle,
  UserCheck,
  ShoppingCart,
  DollarSign,
  Eye,
  Radio,
} from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";

export const UsersTableFragment = graphql(`
  fragment UsersTableFragment on UserAdmin {
    _id
    firstName
    lastName
    email
    createdAt
    referral_status
    referrer
    howYouHearAboutUs
    virtual_subscriptions
    virtual_networth
  }
`);

interface UsersTableProps {
  data: FragmentType<typeof UsersTableFragment>[] | null | undefined;
  isLoading?: boolean;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return format(date, "dd MMM yyyy");
  } catch {
    return "N/A";
  }
};

const getStatusStyle = (status: string | null | undefined) => {
  switch (status?.toLowerCase()) {
    case "active":
      return "bg-[#ECFDF3] text-[#027A48] border-[#ABEFC6]";
    case "pending":
      return "bg-[#FFFAEB] text-[#B54708] border-[#FEDF89]";
    case "suspended":
      return "bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]";
    default:
      return "bg-[#F2F4F7] text-[#344054] border-[#E4E7EC]";
  }
};

function UsersTableRow({ row }: { row: FragmentType<typeof UsersTableFragment> }) {
  const user = useFragment(UsersTableFragment, row);
  const router = useRouter();

  if (!user) return null;

  return (
    <TableRow
      className="cursor-pointer border-b border-[#E5EAEF] bg-white transition-colors hover:bg-gray-50"
      onClick={() => router.push(`/users/${user._id}`)}
    >
      <TableCell className="px-3 py-4 text-sm font-medium text-[#333333]">
        {user.firstName} {user.lastName}
      </TableCell>
      <TableCell className="max-w-[200px] whitespace-normal wrap-break-word px-3 py-4 text-sm text-[#667085]">
        {user.email}
      </TableCell>
      <TableCell className="px-3 py-4 text-sm text-[#333333]">{formatDate(user.createdAt)}</TableCell>
      <TableCell className="px-3 py-4">
        <Badge variant="outline" className={`${getStatusStyle(user.referral_status)} border font-medium`}>
          {user.referral_status}
        </Badge>
      </TableCell>
      <TableCell className="max-w-[160px] whitespace-normal wrap-break-word px-3 py-4 text-sm text-[#667085]">
        {user.referrer || "No Referrer"}
      </TableCell>
      <TableCell className="max-w-[180px] whitespace-normal wrap-break-word px-3 py-4 text-sm text-[#667085]">
        {user.howYouHearAboutUs || "N/A"}
      </TableCell>
      <TableCell className="px-3 py-4 text-center text-sm font-medium text-[#333333]">
        {user.virtual_subscriptions || 0}
      </TableCell>
      <TableCell className="max-w-[140px] whitespace-normal wrap-break-word px-3 py-4 text-sm font-semibold text-[#333333]">
        {formatCurrency(user.virtual_networth || 0)}
      </TableCell>
      <TableCell className="px-3 py-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-500 hover:text-gray-900"
          onClick={(event) => {
            event.stopPropagation();
            router.push(`/users/${user._id}`);
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

export function UsersTable({ data, isLoading }: UsersTableProps) {
  const usersRaw = data || [];

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading users...</div>;
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <UserIcon className="mb-4 h-12 w-12 text-gray-400" />
        <h3 className="mb-2 text-lg font-semibold text-gray-900">No users found</h3>
        <p className="max-w-md text-center text-gray-600">There are no users to display at this time.</p>
      </div>
    );
  }

  return (
    <div className="w-full min-w-0">
      <Table className="min-w-[1100px]">
        <TableHeader className="border-b border-[#E5EAEF] bg-[#F9FAFB]">
          <TableRow className="text-xs font-medium text-[#5D6679]">
            <TableHead className="px-3 py-4 font-medium">
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Name
              </div>
            </TableHead>
            <TableHead className="px-3 py-4 font-medium">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </div>
            </TableHead>
            <TableHead className="px-3 py-4 font-medium">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Date Joined
              </div>
            </TableHead>
            <TableHead className="px-3 py-4 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Status
              </div>
            </TableHead>
            <TableHead className="px-3 py-4 font-medium">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Referrer
              </div>
            </TableHead>
            <TableHead className="px-3 py-4 font-medium">
              <div className="flex items-center gap-2">
                <Radio className="h-4 w-4" />
                How You Heard
              </div>
            </TableHead>
            <TableHead className="px-3 py-4 text-center font-medium">
              <div className="flex items-center justify-center gap-2">
                <ShoppingCart className="h-4 w-4" />
                Products
              </div>
            </TableHead>
            <TableHead className="px-3 py-4 font-medium">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                NetWorth (Virtual)
              </div>
            </TableHead>
            <TableHead className="px-3 py-4 font-medium">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {usersRaw
            .filter((u): u is NonNullable<typeof u> => u !== null && u !== undefined)
            .map((row) => {
              const rowId = (row as unknown as UsersTableFragmentType)._id;
              return <UsersTableRow key={rowId} row={row} />;
            })}
        </TableBody>
      </Table>
    </div>
  );
}
