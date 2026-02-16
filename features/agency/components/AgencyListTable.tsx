"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Link from "next/link";
import { Eye } from "lucide-react";
import { useRouter } from "next/navigation";

export interface AgencyListItem {
  _id: string;
  agency_name: string;
  commission_percentage: number;
  contact?: {
    email?: string;
    phoneNumber?: string;
  };
  total_amount_paid: number;
  total_balance: number;
  total_referrals: number;
  total_sales_volume: number;
}

interface AgencyListTableProps {
  rows?: AgencyListItem[] | null;
  isLoading?: boolean;
}

const formatCurrency = (value?: number | null) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(value ?? 0);

export function AgencyListTable({ rows, isLoading }: AgencyListTableProps) {
  const router = useRouter();

  if (isLoading) {
    return (
      <Card className="border border-gray-200 p-4 space-y-3">
        <Skeleton className="h-6 w-48" />
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full" />
        ))}
      </Card>
    );
  }

  const items = rows ?? [];

  return (
    <Card className="border border-gray-200 overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Agency Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Sales Volume</TableHead>
            <TableHead>Amount Paid</TableHead>
            <TableHead>Balance</TableHead>
            <TableHead>Commission</TableHead>
            <TableHead>Clients</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                No agencies found.
              </TableCell>
            </TableRow>
          ) : (
            items.map((agency) => (
              <TableRow
                key={agency._id}
                className="cursor-pointer hover:bg-muted/40"
                onClick={() => router.push(`/agency/lists/${agency._id}`)}
              >
                <TableCell className="font-medium">{agency.agency_name}</TableCell>
                <TableCell>
                  <div className="text-sm">{agency.contact?.email || "-"}</div>
                  <div className="text-xs text-muted-foreground">{agency.contact?.phoneNumber || "-"}</div>
                </TableCell>
                <TableCell>{formatCurrency(agency.total_sales_volume)}</TableCell>
                <TableCell>{formatCurrency(agency.total_amount_paid)}</TableCell>
                <TableCell className="text-rose-600">{formatCurrency(agency.total_balance)}</TableCell>
                <TableCell>{agency.commission_percentage}%</TableCell>
                <TableCell>{agency.total_referrals}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full"
                    asChild
                    onClick={(event) => event.stopPropagation()}
                  >
                    <Link href={`/agency/lists/${agency._id}`} aria-label={`View ${agency.agency_name}`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
