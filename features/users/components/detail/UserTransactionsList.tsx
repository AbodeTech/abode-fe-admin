"use client";

import { UserTransaction } from "../../types/user.types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { format } from "date-fns";

interface UserTransactionsListProps {
  transactions: UserTransaction[];
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
    return format(new Date(dateString), "dd MMM yyyy, hh:mm a");
  } catch {
    return "N/A";
  }
};

export function UserTransactionsList({ transactions }: UserTransactionsListProps) {
  if (!transactions || transactions.length === 0) {
    return (
      <div className="p-12 text-center bg-white border border-[#E5EAEF] rounded-lg">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-gray-100 mb-4">
          <TrendingUp className="h-6 w-6 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900">No transactions</h3>
        <p className="mt-1 text-sm text-gray-500">This user has not made any transactions yet.</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'success':
      case 'successful':
        return <Badge className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100">Success</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100">Pending</Badge>;
      case 'failed':
      case 'declined':
        return <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100">Failed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getTransactionIcon = (type: string) => {
    if (type?.toLowerCase()?.includes('debit') || type?.toLowerCase()?.includes('withdrawal')) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    }
    return <TrendingUp className="h-4 w-4 text-green-500" />;
  };

  return (
    <div className="bg-white border border-[#E5EAEF] rounded-lg overflow-hidden">
      <ScrollArea className="w-full">
        <Table>
          <TableHeader className="bg-[#F9FAFB] border-b border-[#E5EAEF]">
            <TableRow>
              <TableHead className="py-4 px-6 font-medium">Type</TableHead>
              <TableHead className="py-4 px-6 font-medium">Description</TableHead>
              <TableHead className="py-4 px-6 font-medium">Amount</TableHead>
              <TableHead className="py-4 px-6 font-medium">Date</TableHead>
              <TableHead className="py-4 px-6 font-medium">Status</TableHead>
              <TableHead className="py-4 px-6 font-medium text-right">Reference</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx._id} className="hover:bg-gray-50">
                <TableCell className="py-4 px-6">
                  <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-full ${tx.type?.toLowerCase()?.includes('debit') ? 'bg-red-50' : 'bg-green-50'}`}>
                      {getTransactionIcon(tx.type)}
                    </div>
                    <span className="font-medium capitalize">{tx.type}</span>
                  </div>
                </TableCell>
                <TableCell className="py-4 px-6 max-w-[250px] truncate" title={tx.description}>
                  {tx.description}
                </TableCell>
                <TableCell className={`py-4 px-6 font-medium ${tx.type?.toLowerCase()?.includes('debit') ? 'text-red-600' : 'text-green-600'}`}>
                  {tx.type?.toLowerCase()?.includes('debit') ? '-' : '+'}{formatCurrency(tx.amount)}
                </TableCell>
                <TableCell className="py-4 px-6 text-gray-500">
                  {formatDate(tx.time_of_transaction)}
                </TableCell>
                <TableCell className="py-4 px-6">
                  {getStatusBadge(tx.status)}
                </TableCell>
                <TableCell className="py-4 px-6 text-right text-gray-500 text-xs font-mono">
                  {tx.paystack_reference || tx.transfer_reference || "N/A"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </ScrollArea>
    </div>
  );
}
