"use client";

import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  User,
  DollarSign,
  Calendar,
  Building,
  UserCheck,
  TrendingUp,
  CheckCircle,
  Wallet,
} from "lucide-react";
import { format } from "date-fns";
import { graphql } from "@/lib/gql";
import { FragmentType, useFragment as getFragmentData } from "@/lib/gql";
import { CommissionTransactionsTable_DataFragment } from "@/lib/gql/graphql";

export const CommissionTransactionsFragment = graphql(`
  fragment CommissionTransactionsTable_data on AdminTransactions {
    _id
    tin
    admin_status
    amount
    asset_type
    description
    user {
      _id
      firstName
      lastName
      referrer
      referral_status
      email
      tin
    }
    plot_size
    status
    referral
    transaction_type
    time_of_transaction
  }
`);


const formatNumber = (amount: number | string) => {
  const num = Number(amount);
  return isNaN(num) ? "0" : num.toLocaleString();
};

const formatDate = (date: Date) => {
  try {
    return {
      date: format(date, "dd MMM yyyy,"),
      time: format(date, "hh:mm a").toLowerCase()
    };
  } catch {
    return { date: "N/A", time: "" };
  }
};

const parseCommissionDescription = (description: string) => {
  try {
    // Check if it's a commission description format
    if (!description.startsWith("Commission:")) {
      return { isCommission: false, assetType: null, clientName: null, vatAmount: null, balance: null };
    }

    // Remove "Commission: " prefix
    const cleanDescription = description.substring("Commission: ".length);

    // Initialize variables with default values
    let assetType: string | null = "flex"; // Default asset type is "flex"
    let clientName: string | null = null;
    let vatAmount: string | null = null;
    let balance: string | null = null;

    // Check if description contains "by" to extract client name
    if (cleanDescription.includes(" by ")) {
      // Extract asset type and client name
      assetType = cleanDescription.split(" by ")[0].trim();

      // Extract client name
      if (cleanDescription.includes(" with VAT: ") || cleanDescription.includes(" with WHT:")) {
        // Format: "asset type by client name with VAT: amount & Balance at Transaction: amount"
        clientName = cleanDescription.split(" by ")[1].split(" with ")[0].trim();

        // Extract VAT amount if available
        const vatMatch = description.match(/VAT: (\d+\.?\d*)/);
        const whtMatch = description.match(/WHT: (\d+\.?\d*)/);
        vatAmount = vatMatch ? vatMatch[1] : whtMatch ? whtMatch[1] : null;

        // Extract balance if available
        const balanceMatch = description.match(/Balance at Transaction: (\d+\.?\d*)/);
        balance = balanceMatch ? balanceMatch[1] : null;
      } else {
        // Format: "asset type by client name" (without VAT and Balance)
        clientName = cleanDescription.split(" by ")[1].trim();
      }
    }

    return {
      isCommission: true,
      assetType,
      clientName,
      vatAmount,
      balance,
    };
  } catch (error) {
    console.error("Error parsing commission description:", error);
    // Return default values if parsing fails
    return {
      isCommission: true,
      assetType: "flex",
      clientName: null,
      vatAmount: null,
      balance: null,
    };
  }
};

interface CommissionTransactionsTableProps {
  data: (FragmentType<typeof CommissionTransactionsFragment> | null)[] | null | undefined;
  isLoading?: boolean;
}

export function CommissionTransactionsTable({ data, isLoading }: CommissionTransactionsTableProps) {
  console.log(data);
  const [sortField, setSortField] = useState("time_of_transaction");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const sortableFields = ["time_of_transaction", "amount"];

  const transactionsRaw = data || [];
  const transactions = transactionsRaw.map((t) => getFragmentData(CommissionTransactionsFragment, t));
  const validTransactions = transactions.filter((t): t is CommissionTransactionsTable_DataFragment => t !== null && t !== undefined);


  if (isLoading) {
    return <div className="p-8 text-center text-gray-500">Loading transactions...</div>;
  }

  if (!data || validTransactions.length === 0) {
    return (
      <Card className="border border-gray-200">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <TrendingUp className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No commission data found</h3>
          <p className="text-gray-600 text-center max-w-md">
            There are no commission transactions to display at this time.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Process and sort data
  const processedData = validTransactions.map((c) => {
    const parsed = parseCommissionDescription(c.description || "");
    return {
      ...c,
      whtAmount: parsed.vatAmount,
      balance: parsed.balance,
      clientName: parsed.clientName || `${c.user?.firstName || ""} ${c.user?.lastName || ""}`,
      parsedAssetType: parsed.assetType || c.asset_type || "N/A",
      amount: Number(c.amount ?? 0),
      time_of_transaction: c.time_of_transaction || new Date().toISOString()
    };
  });

  const sortedData = [...processedData].sort((a, b) => {
    if (sortField === "time_of_transaction") {
      return sortDirection === "asc"
        ? new Date(a.time_of_transaction).getTime() - new Date(b.time_of_transaction).getTime()
        : new Date(b.time_of_transaction).getTime() - new Date(a.time_of_transaction).getTime();
    } else if (sortField === "amount") {
      return sortDirection === "asc" ? a.amount - b.amount : b.amount - a.amount;
    }
    return 0;
  });

  const handleSort = (field: string) => {
    if (!sortableFields.includes(field)) return;
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const renderSortIndicator = (field: string) => {
    if (!sortableFields.includes(field)) return null;
    if (sortField === field) {
      return sortDirection === "asc" ? (
        <ArrowUpIcon className="inline ml-1 h-4 w-4" />
      ) : (
        <ArrowDownIcon className="inline ml-1 h-4 w-4" />
      );
    }
    return null;
  };

  return (
    <div className="w-full">
      <Table>
        <TableHeader className="bg-[#F9FAFB] border-b border-[#E5EAEF]">
          <TableRow className="text-xs font-medium text-[#5D6679]">
            <TableHead
              className="cursor-pointer py-4 px-4 font-medium"
              onClick={() => handleSort("time_of_transaction")}
            >
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Time
                {renderSortIndicator("time_of_transaction")}
              </div>
            </TableHead>
            <TableHead className="py-4 px-4 font-medium">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Client Name
              </div>
            </TableHead>
            <TableHead className="py-4 px-4 font-medium">
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Transaction Amount
              </div>
            </TableHead>
            <TableHead className="py-4 px-4 font-medium">TIN</TableHead>
            <TableHead className="py-4 px-4 font-medium">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                Asset Type
              </div>
            </TableHead>
            <TableHead className="py-4 px-4 font-medium">
              <div className="flex items-center gap-2">
                <UserCheck className="h-4 w-4" />
                Associate Name
              </div>
            </TableHead>
            <TableHead className="py-4 px-4 font-medium">Referrer</TableHead>
            <TableHead className="py-4 px-4 font-medium">Associate Status</TableHead>
            <TableHead className="py-4 px-4 font-medium">Percentage Earned</TableHead>
            <TableHead className="cursor-pointer py-4 px-4 font-medium" onClick={() => handleSort("amount")}>
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Commission Amount
                {renderSortIndicator("amount")}
              </div>
            </TableHead>
            <TableHead className="py-4 px-4 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Transaction Status
              </div>
            </TableHead>
            <TableHead className="py-4 px-4 font-medium">
              <div className="flex items-center gap-2">
                <Wallet className="h-4 w-4" />
                Balance
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedData.map((commission, idx) => {
            const formattedDate = formatDate(new Date(commission.time_of_transaction));
            return (
              <TableRow
                key={commission._id}
                className={`hover:bg-gray-50 transition-colors border-b border-[#E5EAEF] ${idx % 2 === 0 ? "bg-white" : "bg-white"
                  }`}
              >
                <TableCell className="py-5 px-4 text-sm text-[#333333]">
                  <div className="flex flex-col">
                    <span>{formattedDate.date}</span>
                    <span className="text-[#667085]">{formattedDate.time}</span>
                  </div>
                </TableCell>
                <TableCell className="py-5 px-4 text-sm font-medium text-[#333333]">{commission.clientName}</TableCell>
                <TableCell className="py-5 px-4 text-sm font-semibold text-[#333333]">
                  {commission.whtAmount
                    ? `₦${formatNumber(Number(commission.whtAmount) + Number(commission.amount))}`
                    : "N/A"}
                </TableCell>
                <TableCell className="py-5 px-4 text-sm text-[#667085]">{commission.user?.tin || "N/A"}</TableCell>
                <TableCell className="py-5 px-4">
                  <Badge variant="outline" className="bg-[#F0F1F3] text-[#333333] border-[#E0E2E7] text-xs font-medium">
                    {commission.parsedAssetType}
                  </Badge>
                </TableCell>
                <TableCell className="py-5 px-4 text-sm font-medium text-[#333333]">
                  {commission.user?.firstName} {commission.user?.lastName}
                </TableCell>
                <TableCell className="py-5 px-4 text-sm text-[#667085]">{commission.user?.referrer || "N/A"}</TableCell>
                <TableCell className="py-5 px-4">
                  <Badge variant="outline" className="bg-[#F0F1F3] text-[#333333] border-[#E0E2E7] text-xs font-medium">
                    {commission.user?.referral_status ?? "N/A"}
                  </Badge>
                </TableCell>
                <TableCell className="py-5 px-4 text-sm text-[#667085]">
                  {commission.whtAmount
                    ? `${(
                      100 *
                      (Number(commission.amount) /
                        ((Number(commission.whtAmount) + Number(commission.amount)) * 0.95))
                    ).toFixed(2)}%`
                    : "N/A"}
                </TableCell>
                <TableCell className="py-5 px-4 text-sm font-semibold text-[#333333]">₦{formatNumber(commission.amount)}</TableCell>
                <TableCell className="py-5 px-4">
                  <Badge className="bg-[#1A1A1A] text-white border-0 text-xs font-medium hover:bg-[#333333]">
                    {commission.status || "N/A"}
                  </Badge>
                </TableCell>
                <TableCell className="py-5 px-4 text-sm font-semibold text-[#333333]">{commission.balance ? `₦${formatNumber(commission.balance)}` : "N/A"}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
