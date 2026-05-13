"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { graphql, useFragment as getFragmentData, FragmentType } from "@/lib/gql";

export const SuspendedPaymentPlansRowFragment = graphql(`
  fragment SuspendedPaymentPlansRow_plan on SuspendedPaymentPlans {
    firstName
    lastName
    email
    phoneNumber
    referrer
    asset_name
    size
    asset_type
    no_of_units
    amount_paid
    balance
    start_date
    next_date
  }
`);

type SuspendedPaymentPlanRow = FragmentType<typeof SuspendedPaymentPlansRowFragment>;

interface SuspendedPaymentPlansTableProps {
  plans: (SuspendedPaymentPlanRow | null)[] | null | undefined;
}

export function SuspendedPaymentPlansTable({ plans }: SuspendedPaymentPlansTableProps) {
  const plansRaw = plans || [];
  const rows = plansRaw.map((plan) => getFragmentData(SuspendedPaymentPlansRowFragment, plan));
  const validRows = rows.filter((plan): plan is NonNullable<typeof plan> => plan !== null && plan !== undefined);

  return (
    <Table className="min-w-[1320px]">
      <TableHeader>
        <TableRow>
          <TableHead>First Name</TableHead>
          <TableHead>Last Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Phone Number</TableHead>
          <TableHead>Referrer</TableHead>
          <TableHead>Asset Name</TableHead>
          <TableHead>Size</TableHead>
          <TableHead>Asset Type</TableHead>
          <TableHead className="text-right">No. of Units</TableHead>
          <TableHead className="text-right">Amount Paid</TableHead>
          <TableHead className="text-right">Amount Left</TableHead>
          <TableHead>Start Date</TableHead>
          <TableHead>End Date</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {validRows.length ? (
          validRows.map((row, idx) => (
            <TableRow key={`${row.email}-${idx}`}>
              <TableCell>{row.firstName}</TableCell>
              <TableCell>{row.lastName}</TableCell>
              <TableCell className="max-w-[200px] whitespace-normal wrap-break-word">{row.email}</TableCell>
              <TableCell>{row.phoneNumber}</TableCell>
              <TableCell>{row.referrer}</TableCell>
              <TableCell className="max-w-[180px] whitespace-normal wrap-break-word">{row.asset_name}</TableCell>
              <TableCell>{row.size}</TableCell>
              <TableCell>
                <Badge variant={row.asset_type === "Flex" ? "default" : "secondary"}>
                  {row.asset_type}
                </Badge>
              </TableCell>
              <TableCell className="text-right">{row.no_of_units ?? 0}</TableCell>
              <TableCell className="text-right font-medium">{row.amount_paid ?? 0}</TableCell>
              <TableCell className="text-right font-medium text-red-600">
                {row.balance ?? 0}
              </TableCell>
              <TableCell>
                {row.start_date ? format(new Date(row.start_date), "dd/MM/yyyy") : "-"}
              </TableCell>
              <TableCell>
                {row.next_date ? format(new Date(row.next_date), "dd/MM/yyyy") : "-"}
              </TableCell>
            </TableRow>
          ))
        ) : (
          <TableRow>
            <TableCell colSpan={13} className="text-center py-6">
              No users found with suspended payment plans.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
