"use client";

import { Search, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
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

import { agencyMemberName, type AgencyMember } from "../schemas/agency.schema";

type MemberRow = Pick<
  AgencyMember,
  | "id"
  | "first_name"
  | "last_name"
  | "email"
  | "user_name"
  | "phone_number"
  | "referral_status"
  | "is_owner"
  | "joined_at"
>;

interface AgencyMembersTableProps {
  rows?: MemberRow[] | null;
  isLoading?: boolean;
  search: string;
  onSearchChange: (value: string) => void;
  /** Selected type (`all` for none). Pass `onTierChange` to show the filter. */
  tier?: string;
  onTierChange?: (value: string) => void;
  /** Rendered when a member needs moving out — omit to hide the column. */
  onRemove?: (member: MemberRow) => void;
  removingId?: string | null;
}

/** `referral_status` (the BE UserTier) as the agency reads it: clients vs the sales side. */
const MEMBER_TYPE_LABELS: Record<string, string> = {
  guest: "Guest",
  user: "Client",
  premium: "Premium client",
  associate: "Associate",
  "associate-pro": "Associate Pro",
  founder: "Founder",
  management: "Management",
  agency: "Agency",
};

const SALES_SIDE_TYPES = new Set(["associate", "associate-pro", "founder", "management", "agency"]);

function MemberTypeBadge({ tier }: { tier?: string | null }) {
  if (!tier) return <span className="text-sm text-muted-foreground">—</span>;
  return (
    <Badge variant={SALES_SIDE_TYPES.has(tier) ? "default" : "secondary"}>
      {MEMBER_TYPE_LABELS[tier] ?? tier}
    </Badge>
  );
}

const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
};

export function AgencyMembersTable({
  rows,
  isLoading,
  search,
  onSearchChange,
  tier = "all",
  onTierChange,
  onRemove,
  removingId,
}: AgencyMembersTableProps) {
  const items = rows ?? [];
  const showActions = Boolean(onRemove);

  return (
    <div className="w-full min-w-0 space-y-3">
      <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
      <div className="relative w-full max-w-sm">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="min-w-0 pl-9 pr-10"
          placeholder="Search name, email, username or phone"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
        {search && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
            onClick={() => onSearchChange("")}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      {onTierChange && (
        <Select value={tier} onValueChange={onTierChange}>
          <SelectTrigger className="w-full bg-white sm:w-48" aria-label="Member type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All types</SelectItem>
            <SelectItem value="user">Client</SelectItem>
            <SelectItem value="associate">Associate</SelectItem>
            <SelectItem value="associate-pro">Associate Pro</SelectItem>
          </SelectContent>
        </Select>
      )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <>
          <AdminMobileStack>
            {items.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No members in this agency.
              </p>
            ) : (
              items.map((member) => (
                <AdminMobileCard
                  key={member.id}
                  title={agencyMemberName(member)}
                  subtitle={member.email || undefined}
                >
                  {member.is_owner && (
                    <AdminMobileField label="Role" value={<Badge>Owner</Badge>} />
                  )}
                  <AdminMobileField label="Type" value={<MemberTypeBadge tier={member.referral_status} />} />
                  <AdminMobileField label="Username" value={member.user_name || "—"} />
                  <AdminMobileField label="Phone" value={member.phone_number || "—"} />
                  <AdminMobileField label="Joined" value={formatDate(member.joined_at)} />
                  {onRemove && !member.is_owner && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 w-full"
                      disabled={removingId === member.id}
                      onClick={() => onRemove(member)}
                    >
                      Remove from agency
                    </Button>
                  )}
                </AdminMobileCard>
              ))
            )}
          </AdminMobileStack>

          <AdminDesktopTableWrap>
            <div className="min-w-0 overflow-x-auto rounded-md border border-gray-200">
              <Table className="min-w-[720px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Username</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Joined</TableHead>
                    {showActions && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={showActions ? 7 : 6}
                        className="py-6 text-center text-sm text-muted-foreground"
                      >
                        No members in this agency.
                      </TableCell>
                    </TableRow>
                  ) : (
                    items.map((member) => (
                      <TableRow key={member.id} className="hover:bg-muted/30">
                        <TableCell className="max-w-48 whitespace-normal wrap-break-word font-medium">
                          <span className="wrap-break-word">{agencyMemberName(member)}</span>
                          {member.is_owner && (
                            <Badge className="ml-2 align-middle">Owner</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <MemberTypeBadge tier={member.referral_status} />
                        </TableCell>
                        <TableCell className="max-w-48 wrap-break-word text-sm">
                          {member.email || "—"}
                        </TableCell>
                        <TableCell className="text-sm">{member.user_name || "—"}</TableCell>
                        <TableCell className="text-sm">{member.phone_number || "—"}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(member.joined_at)}
                        </TableCell>
                        {showActions && (
                          <TableCell className="text-right">
                            {member.is_owner ? (
                              <span className="text-xs text-muted-foreground">
                                Change owner first
                              </span>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={removingId === member.id}
                                onClick={() => onRemove?.(member)}
                              >
                                Remove
                              </Button>
                            )}
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </AdminDesktopTableWrap>
        </>
      )}
    </div>
  );
}
