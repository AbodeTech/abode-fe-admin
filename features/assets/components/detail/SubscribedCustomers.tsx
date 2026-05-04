"use client";

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
import { cn } from "@/lib/utils";
import { saveAs } from "file-saver";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { FilterSelect } from "@/components/shared/FilterSelect";
import { DateFilter } from "@/components/shared/DateFilter";
import { SendAssetStatementsModal } from "./SendAssetStatementsModal";
import { useAssetIdStore } from "@/store/assetid-store";

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
  } catch {
    return dateStr;
  }
}

export function SubscribedCustomers({ assetName, assetType }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { assetId } = useAssetIdStore();

  const { data, isLoading, error } = useQuery({
    queryKey: ['subscribers', assetName, assetType, searchParams.toString()],
    queryFn: () => getAssetSubscribers(decodeURIComponent(assetName), assetType, searchParams)
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
    <section className="py-12 w-full overflow-x-auto">
      <div className="mx-auto px-4 max-w-[1600px]">
        {/* Filtering Strategy */}
        <div className="mb-8 flex flex-wrap items-center gap-3 p-1">
          <FilterSelect
            data={[
              { label: "All Subscribers", value: "all" },
              { label: "Suspended Subscribers", value: "Suspended-subscribers" },
              { label: "Default Subscribers", value: "Default-subscribers" },
              { label: "Completed Subscribers", value: "Completed-subscribers" },
              {
                label: "Allocation Qualified Subscribers",
                value: assetType === "flex" ? "thirty-percent-subscribers" : "FullownershipQualifiedUsers",
              },
            ]}
            queryKey="subscriber_type"
            placeholder="Subscriber Type"
          />
          <FilterSelect
            data={[
              { label: "All Sizes", value: "all" },
              { label: "150sqm", value: "150" },
              { label: "300sqm", value: "300" },
              { label: "500sqm", value: "500" },
              { label: "1500sqm", value: "1500" },
              { label: "3000sqm", value: "3000" },
            ]}
            queryKey="size"
            placeholder="Size"
          />
          <DateFilter />
          <Button variant="outline" onClick={() => router.push(pathname)}>
            Clear Filters
          </Button>
        </div>

        {/* Subscribers Details Table */}
        <div className="rounded-2xl border border-border/50 bg-background overflow-hidden shadow-sm">
          <div className="p-6 border-b border-border/50 flex flex-col gap-4 md:flex-row items-center justify-between bg-white">
            <div>
              <h3 className="text-xl font-bold tracking-tight">Subscribers Directory</h3>
              <p className="text-xs text-muted-foreground font-medium mt-1 uppercase tracking-wider">Granular Customer Collection Tracking</p>
            </div>
            <div className="flex gap-2">
              <SendAssetStatementsModal assetId={assetId} />
              <Button 
                variant="outline" 
                size="sm" 
                onClick={downloadSubscribersData}
                className="text-xs font-bold uppercase tracking-wider h-9"
              >
                Export Registry
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
            {subscribers.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground italic">No historical data found for current filters.</div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="hover:bg-transparent border-b">
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10">Subscriber</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10 hidden sm:table-cell">Lease Size</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10 hidden md:table-cell">Land Value</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10">Collected</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10 text-center">Collection Progress</TableHead>
                    <TableHead className="text-[10px] font-bold uppercase tracking-wider h-10 hidden lg:table-cell text-right">Next Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscribers.map((subscriber, index) => {
                    const progress = subscriber.landPrice ? Math.round((subscriber.landAmountPaid / subscriber.landPrice) * 100) : 0;
                    return (
                      <TableRow key={index} className="group hover:bg-muted/30 transition-colors border-b last:border-0">
                        <TableCell>
                          <div className="flex flex-col">
                            {subscriber._id ? (
                              <Link href={`/users/${subscriber._id}`} className="text-sm font-bold text-slate-900 group-hover:text-primary transition-colors">
                                {subscriber.name}
                              </Link>
                            ) : (
                              <span className="text-sm font-bold">{subscriber.name}</span>
                            )}
                            <span className="text-[10px] text-muted-foreground font-medium truncate w-32">{subscriber.email}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs font-bold hidden sm:table-cell">
                          {Number(subscriber.sizeBought ?? 0) * Number(subscriber.unitPurchased ?? 0)} SQM
                        </TableCell>
                        <TableCell className="text-xs font-medium tabular-nums hidden md:table-cell">{formatNaira(subscriber.landPrice ?? 0)}</TableCell>
                        <TableCell className="text-xs font-bold tabular-nums">{formatNaira(subscriber.landAmountPaid ?? 0)}</TableCell>
                        <TableCell>
                          <div className="flex flex-col items-center gap-1.5 min-w-[120px]">
                            <div className="flex items-center gap-2 w-full justify-center">
                              <span className="text-[10px] font-black w-8 text-right underline decoration-primary/20">{progress}%</span>
                              <div 
                                className="h-1.5 w-full max-w-[80px] bg-muted rounded-full overflow-hidden"
                                role="progressbar"
                                aria-valuenow={progress}
                                aria-valuemin={0}
                                aria-valuemax={100}
                                aria-label={`${subscriber.name}'s Payment Progress`}
                              >
                                <div 
                                  className={cn(
                                    "h-full rounded-full transition-all duration-1000",
                                    progress >= 100 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" : 
                                    subscriber.isDefaulted ? "bg-rose-500" : "bg-primary"
                                  )} 
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                            <span
                              className={cn(
                                "px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter shadow-sm border leading-none self-center",
                                subscriber.isDefaulted 
                                  ? "bg-rose-50 border-rose-100 text-rose-700" 
                                  : subscriber.isSuspended 
                                  ? "bg-amber-50 border-amber-100 text-amber-700"
                                  : progress >= 100
                                  ? "bg-emerald-50 border-emerald-100 text-emerald-700"
                                  : "bg-white border-slate-200 text-slate-500"
                              )}
                            >
                              {subscriber.isDefaulted ? "Defaulted" : subscriber.isSuspended ? "Suspended" : progress >= 100 ? "Completed" : "In Progress"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter text-right hidden lg:table-cell">
                          {formatDate(subscriber.nextPaymentDate || "") || "N/A"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
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
