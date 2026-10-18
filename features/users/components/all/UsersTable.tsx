"use client";

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
  Phone,
  ShieldCheck,
} from "lucide-react";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import { AdminDesktopTableWrap, AdminMobileCard, AdminMobileField, AdminMobileStack } from "@/components/shared/admin-responsive-table";

import {
  referrerDisplayName,
  userDisplayName,
  type AdminUserRow,
} from "../../schemas/user.schema";

interface UsersTableProps {
  data: AdminUserRow[] | null | undefined;
  isLoading?: boolean;
  errorMessage?: string | null;
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
  }).format(amount);
};

const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "N/A";
  try {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "N/A";
    return format(date, "dd MMM yyyy");
  } catch {
    return "N/A";
  }
};

const getStatusStyle = (status: string | null | undefined) => {
  switch (status?.toLowerCase()) {
    case "associate-pro":
    case "premium":
    case "founder":
      return "bg-[#ECFDF3] text-[#027A48] border-[#ABEFC6]";
    case "associate":
      return "bg-[#FFFAEB] text-[#B54708] border-[#FEDF89]";
    case "suspended":
      return "bg-[#FEF3F2] text-[#B42318] border-[#FECDCA]";
    default:
      return "bg-[#F2F4F7] text-[#344054] border-[#E4E7EC]";
  }
};

function UsersTableRow({ user }: { user: AdminUserRow }) {
  const router = useRouter();

  return (
    <TableRow
      className="cursor-pointer border-b border-[#E5EAEF] bg-white transition-colors hover:bg-gray-50"
      onClick={() => router.push(`/users/${user.id}`)}
    >
      <TableCell className="px-3 py-4 text-sm font-medium text-[#333333]">
        {userDisplayName(user)}
      </TableCell>
      <TableCell className="max-w-[200px] whitespace-normal wrap-break-word px-3 py-4 text-sm text-[#667085]">
        {user.email || "—"}
      </TableCell>
      <TableCell className="px-3 py-4 text-sm text-[#333333]">{user.phone_number || "—"}</TableCell>
      <TableCell className="px-3 py-4 text-sm text-[#333333]">{formatDate(user.created_at)}</TableCell>
      <TableCell className="px-3 py-4">
        <Badge variant="outline" className={`${getStatusStyle(user.tier)} border font-medium`}>
          {user.tier || "—"}
        </Badge>
      </TableCell>
      <TableCell className="max-w-[160px] whitespace-normal wrap-break-word px-3 py-4 text-sm text-[#667085]">
        {referrerDisplayName(user.referrer) || "No Referrer"}
      </TableCell>
      <TableCell className="max-w-[180px] whitespace-normal wrap-break-word px-3 py-4 text-sm text-[#667085]">
        {user.how_you_heard || "N/A"}
      </TableCell>
      <TableCell className="px-3 py-4 text-sm text-[#333333]">
        {user.verified ? "Yes" : "No"}
      </TableCell>
      <TableCell className="px-3 py-4 text-center text-sm font-medium text-[#333333]">
        {user.subscriptions || 0}
      </TableCell>
      <TableCell className="max-w-[140px] whitespace-normal wrap-break-word px-3 py-4 text-sm font-semibold text-[#333333]">
        {formatCurrency(user.networth || 0)}
      </TableCell>
      <TableCell className="px-3 py-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-gray-500 hover:text-gray-900"
          onClick={(event) => {
            event.stopPropagation();
            router.push(`/users/${user.id}`);
          }}
        >
          <Eye className="h-4 w-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

function UsersMobileCard({ user }: { user: AdminUserRow }) {
  const router = useRouter();

  return (
    <AdminMobileCard
      title={
        <span className="flex items-center gap-2">
          <UserIcon className="h-4 w-4 shrink-0" />
          {userDisplayName(user)}
        </span>
      }
      subtitle={
        <span className="flex items-center gap-2">
          <Mail className="h-3 w-3 shrink-0" />
          {user.email || "—"}
        </span>
      }
      onClick={() => router.push(`/users/${user.id}`)}
    >
      <div className="flex items-center justify-between gap-2 border-b border-[#E5EAEF] pb-2">
        <span className="text-xs text-muted-foreground">Status</span>
        <Badge variant="outline" className={`${getStatusStyle(user.tier)} border font-medium`}>
          {user.tier || "—"}
        </Badge>
      </div>
      <AdminMobileField label="Phone" value={user.phone_number || "—"} />
      <AdminMobileField label="Joined" value={formatDate(user.created_at)} />
      <AdminMobileField label="Referrer" value={referrerDisplayName(user.referrer) || "No Referrer"} />
      <AdminMobileField label="How you heard" value={user.how_you_heard || "N/A"} />
      <AdminMobileField label="Verified" value={user.verified ? "Yes" : "No"} />
      <AdminMobileField label="Products" value={user.subscriptions || 0} />
      <AdminMobileField label="Net worth" value={formatCurrency(user.networth || 0)} />
      <div className="flex justify-end border-t border-[#E5EAEF] pt-2">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1"
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/users/${user.id}`);
          }}
        >
          <Eye className="h-4 w-4" />
          View
        </Button>
      </div>
    </AdminMobileCard>
  );
}

export function UsersTable({ data, isLoading, errorMessage }: UsersTableProps) {
  const rows = data ?? [];

  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading users...</div>;
  }

  if (errorMessage) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <UserIcon className="mb-4 h-12 w-12 text-gray-400" />
        <h3 className="mb-2 text-lg font-semibold text-gray-900">Could not load users</h3>
        <p className="max-w-md text-center text-gray-600">{errorMessage}</p>
      </div>
    );
  }

  if (rows.length === 0) {
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
      <AdminMobileStack>
        {rows.map((row) => (
          <UsersMobileCard key={row.id} user={row} />
        ))}
      </AdminMobileStack>

      <AdminDesktopTableWrap>
        <div className="min-w-0 overflow-x-auto">
          <Table className="min-w-[1180px]">
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
                    <Phone className="h-4 w-4" />
                    Phone
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
                  How You Heard
                </TableHead>
                <TableHead className="px-3 py-4 font-medium">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    Verified
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
                    NetWorth
                  </div>
                </TableHead>
                <TableHead className="px-3 py-4 font-medium">
                  <span className="sr-only">Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <UsersTableRow key={row.id} user={row} />
              ))}
            </TableBody>
          </Table>
        </div>
      </AdminDesktopTableWrap>
    </div>
  );
}
