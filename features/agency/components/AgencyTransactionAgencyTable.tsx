"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Eye } from "lucide-react";
import { AgencyListItem } from "./AgencyListTable";
import { useRouter } from "next/navigation";

interface AgencyTransactionAgencyTableProps {
  rows?: AgencyListItem[] | null;
}

const formatCurrency = (value?: number | null) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(value ?? 0);

export function AgencyTransactionAgencyTable({ rows }: AgencyTransactionAgencyTableProps) {
  const router = useRouter();
  const items = rows ?? [];

  return (
    <Card className="border border-gray-200 overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Agency</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Sales Volume</TableHead>
            <TableHead>Amount Paid</TableHead>
            <TableHead>Outstanding</TableHead>
            <TableHead className="text-right">Transactions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                No agency records found.
              </TableCell>
            </TableRow>
          ) : (
            items.map((agency) => (
              <TableRow
                key={agency._id}
                className="cursor-pointer hover:bg-muted/40"
                onClick={() => router.push(`/agency/transactions/${agency._id}`)}
              >
                <TableCell className="font-medium">{agency.agency_name}</TableCell>
                <TableCell>
                  <div className="text-sm">{agency.contact?.email || "-"}</div>
                  <div className="text-xs text-muted-foreground">{agency.contact?.phoneNumber || "-"}</div>
                </TableCell>
                <TableCell>{formatCurrency(agency.total_sales_volume)}</TableCell>
                <TableCell>{formatCurrency(agency.total_amount_paid)}</TableCell>
                <TableCell className="text-rose-600">{formatCurrency(agency.total_balance)}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    onClick={(event) => event.stopPropagation()}
                  >
                    <Link href={`/agency/transactions/${agency._id}`} aria-label={`View ${agency.agency_name} transactions`}>
                      <Eye className="h-4 w-4 mr-2" />
                      View
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
