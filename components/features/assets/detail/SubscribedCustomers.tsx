"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, Users, UserMinus, UserX, ShoppingCart, CheckCircle, LandPlot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Subscriber } from "@/lib/api/admin/assets";
import { getAssetSubscribers } from "@/lib/api/admin/assets.client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

interface Props {
  assetName: string;
  assetType: string;
}

function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string) {
  if (!dateStr) return "-";
  try {
    return format(new Date(dateStr), 'dd/MM/yyyy');
  } catch (e) {
    return dateStr;
  }
}

export function SubscribedCustomers({ assetName, assetType }: Props) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['subscribers', assetName, assetType],
    queryFn: () => getAssetSubscribers(decodeURIComponent(assetName), assetType)
  });

  if (isLoading) return <div className="p-8 text-center">Loading subscribers...</div>;
  if (error) return <div className="p-8 text-center text-red-500">Error loading subscribers</div>;

  const result = data;
  const subscribers = result?.userDetails || [];

  const metrics = {
    expectedEarning: result?.expectedEarning || 0,
    earningReceived: result?.earningReceived || 0,
    unitSold: result?.unitSold || 0,
    totalPlotsSold: result?.totalPlotsSold || 0,
    totalSubscribers: result?.totalSubscribers || 0,
    defaultedUsers: result?.defaultedUsers || 0,
    suspendedUsers: result?.suspendedUsers || 0,
    completedPayments: result?.completedPayments || 0,
  };

  const downloadSubscribersData = () => {
    const downloadData = subscribers.map((subscriber: Subscriber) => {
      return {
        name: subscriber.name,
        email: subscriber.email,
        phone_number: subscriber.phone_number,
        salesPerson: subscriber.salesPerson,
        size: Number(subscriber.sizeBought ?? 0) * Number(subscriber.unitPurchased ?? 0),
        landprice: subscriber.landPrice ?? 0,
        landamountpaid: subscriber.landAmountPaid ?? 0,
        ...(assetType === 'full-ownership' ? { documentPrice: subscriber.documentPrice ?? 0 } : {}),
        ...(assetType === 'full-ownership' ? { documentAmountPaid: subscriber.documentAmountPaid ?? 0 } : {}),
        monthSubscribed: subscriber?.month_subscription ?? 0,
        startDate: subscriber.startDate || "",
        nextPaymentDate: subscriber.nextPaymentDate || "",
        isDefaulted: !!subscriber.isDefaulted,
        isSuspended: !!subscriber.isSuspended,
      }
    });

    const worksheet = XLSX.utils.json_to_sheet(downloadData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Subscribers");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const dataBlob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
    saveAs(dataBlob, `${decodeURIComponent(assetName)}_subscribers.xlsx`);
  };

  return (
    <section className="py-8 w-full overflow-x-auto">
      <div className="mx-auto px-4">
        <h2 className="text-3xl font-bold mb-8 text-center">Subscribed Customers</h2>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <MetricCard title="Total Sales" value={formatNaira(metrics.expectedEarning)} icon={<DollarSign className="h-4 w-4" />} />
          <MetricCard title="Inflow" value={formatNaira(metrics.earningReceived)} icon={<DollarSign className="h-4 w-4" />} />
          <MetricCard title="Units" value={metrics.unitSold} icon={<ShoppingCart className="h-4 w-4" />} />
          <MetricCard title="Total Plots Sold" value={metrics.totalPlotsSold} icon={<LandPlot className="h-4 w-4" />} />
          <MetricCard title="Total Subscribers" value={metrics.totalSubscribers} icon={<Users className="h-4 w-4" />} />
          <MetricCard title="Defaulted Subscribers" value={metrics.defaultedUsers} icon={<UserMinus className="h-4 w-4" />} />
          <MetricCard title="Suspended Subscribers" value={metrics.suspendedUsers} icon={<UserX className="h-4 w-4" />} />
          <MetricCard title="Completed Payments" value={metrics.completedPayments} icon={<CheckCircle className="h-4 w-4" />} />
        </div>

        {/* Subscribers Table */}
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex flex-col gap-3 md:flex-row items-center justify-between">
              <CardTitle>Subscribers Details</CardTitle>
              <div className="flex gap-2">
                {/* TODO: Add SendAssetStatementsModal if needed */}
                <Button variant={"outline"} onClick={downloadSubscribersData}>Download Excel</Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              {subscribers.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">No subscribers found.</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Size </TableHead>
                      <TableHead>Land Price</TableHead>
                      <TableHead>Land Amount Paid</TableHead>
                      {assetType === 'flex' && <TableHead>Month Subscription</TableHead>}
                      {assetType === 'full-ownership' && <TableHead>Document Price</TableHead>}
                      {assetType === 'full-ownership' && <TableHead>Document Amount Paid</TableHead>}
                      <TableHead>Start Date</TableHead>
                      <TableHead>Next Payment Date</TableHead>
                      <TableHead>Defaulted</TableHead>
                      <TableHead>Suspended</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscribers.map((subscriber, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {/* <Link href={`/admin/dashboard/user/${subscriber._id}`} className="hover:underline"> */}
                          {/* Linking to user profile - path might need adjustment */}
                          {subscriber.name}
                          {/* </Link> */}
                        </TableCell>
                        <TableCell>{Number(subscriber.sizeBought ?? 0) * Number(subscriber.unitPurchased ?? 0)}</TableCell>
                        <TableCell>{formatNaira(subscriber.landPrice ?? 0)}</TableCell>
                        <TableCell>{formatNaira(subscriber.landAmountPaid ?? 0)}</TableCell>
                        {assetType === 'flex' && <TableCell>{subscriber.month_subscription ?? 0}</TableCell>}
                        {assetType === 'full-ownership' && <TableCell>{formatNaira(subscriber.documentPrice ?? 0)}</TableCell>}
                        {assetType === 'full-ownership' && <TableCell>{formatNaira(subscriber.documentAmountPaid ?? 0)}</TableCell>}
                        <TableCell>{formatDate(subscriber.startDate || "")}</TableCell>
                        <TableCell>{formatDate(subscriber.nextPaymentDate || "")}</TableCell>
                        <TableCell>
                          <StatusBadge isNegative={!!subscriber.isDefaulted} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge isNegative={!!subscriber.isSuspended} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function MetricCard({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <span className="text-muted-foreground">{icon}</span>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}

function StatusBadge({ isNegative }: { isNegative: boolean }) {
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold ${isNegative ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
        }`}
    >
      {isNegative ? "Yes" : "No"}
    </span>
  )
}
