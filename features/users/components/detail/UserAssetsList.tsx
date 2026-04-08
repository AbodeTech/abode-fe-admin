"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Plus,
  Calendar,
  Clock,
  Hash,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  CalendarClock,
  User,
  MapPin,
  Landmark,
  FileText,
  Sigma,
  CalendarIcon,
  Wallet,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

import { getUserAssetsByAdmin } from "@/lib/api/admin/user-assets.client";
import { AddFlexAssetModal } from "../modals/AddFlexAssetModal";
import { AddFullOwnershipAssetModal } from "../modals/AddFullOwnershipAssetModal";
import { UserAssetActions } from "./UserAssetActions";

interface UserAssetsListProps {
  userId: string;
  userEmail?: string;
  readOnly?: boolean;
}

const formatDateWord = (date: Date | string) => {
  try {
    return format(new Date(date), "dd MMM yyyy");
  } catch {
    return "N/A";
  }
};

const formatCurrency = (amount: number) => {
  return amount.toLocaleString("en-NG", { style: "currency", currency: "NGN" });
};

export function UserAssetsList({ userId, userEmail, readOnly = false }: UserAssetsListProps) {
  const [isFlexModalOpen, setIsFlexModalOpen] = useState(false);
  const [isFullOwnershipModalOpen, setIsFullOwnershipModalOpen] = useState(false);

  const { data: assets, isLoading } = useQuery({
    queryKey: ["userAssets", userId],
    queryFn: () => getUserAssetsByAdmin(userId),
  });

  const flexAssets = assets?.filter((asset) => asset.payment_details?.asset_type === "flex") || [];
  const fullOwnershipAssets = assets?.filter((asset) => asset.payment_details?.asset_type === "full-ownership") || [];

  const getDaysUntilNextPayment = (nextPaymentDate: Date | string): number => {
    const today = new Date();
    const nextDate = new Date(nextPaymentDate);
    const diffTime = nextDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getRelativeDateText = (date: Date | string): string => {
    const daysUntil = getDaysUntilNextPayment(date);
    if (daysUntil < 0) return `Overdue by ${Math.abs(daysUntil)} days`;
    if (daysUntil === 0) return "Due today";
    if (daysUntil === 1) return "Due tomorrow";
    if (daysUntil < 7) return `Due in ${daysUntil} days`;
    if (daysUntil < 30) return `Due in ${Math.floor(daysUntil / 7)} weeks`;
    return formatDateWord(date);
  };

  const isPaymentUrgent = (nextPaymentDate: Date | string): boolean => {
    const days = getDaysUntilNextPayment(nextPaymentDate);
    return days <= 7 && days >= 0;
  };

  const isPaymentOverdue = (nextPaymentDate: Date | string): boolean => {
    return getDaysUntilNextPayment(nextPaymentDate) < 0;
  };

  if (isLoading) {
    return (
      <div className="space-y-6 mt-6">
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-6">
      {!readOnly && (
        <>
          <AddFlexAssetModal userId={userId} isOpen={isFlexModalOpen} onClose={() => setIsFlexModalOpen(false)} />
          <AddFullOwnershipAssetModal
            userId={userId}
            isOpen={isFullOwnershipModalOpen}
            onClose={() => setIsFullOwnershipModalOpen(false)}
          />
        </>
      )}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-2xl font-bold">User Flex Assets</CardTitle>
          {!readOnly && (
            <Button onClick={() => setIsFlexModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Flex Asset
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {flexAssets.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">No flex assets found.</CardContent>
              </Card>
            )}

            {flexAssets.map((asset) => {
              const pd = asset.payment_details!;
              const question = asset.asset_questions?.find((q) => q.unique_asset_id === pd.unique_asset_id);
              const paymentProgress = pd.asset_price > 0 ? Math.round((pd.amount_paid / pd.asset_price) * 100) : 0;
              const isUrgent = isPaymentUrgent(pd.next_date_of_payment);
              const isOverdue = isPaymentOverdue(pd.next_date_of_payment);

              return (
                <Card key={asset._id} className={`py-0 ${pd.is_suspended ? "opacity-75 border-red-200" : ""}`}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-lg font-bold">{asset.asset_name}</h3>
                        <Badge
                          variant={pd.is_suspended ? "destructive" : "outline"}
                          className={`${pd.is_suspended ? "bg-red-100 text-red-800" : ""}`}
                        >
                          {pd.is_suspended ? (
                            <>
                              <XCircle className="h-3 w-3 mr-1" /> Suspended
                            </>
                          ) : (
                            <>
                              <CheckCircle2 className="h-3 w-3 mr-1" /> Active
                            </>
                          )}
                        </Badge>
                        <Badge variant="outline">{pd.size}</Badge>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700">
                          <Calendar className="h-3 w-3 mr-1" /> Started: {formatDateWord(pd.start_date)}
                        </Badge>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                        {isOverdue && (
                          <Badge variant="destructive">
                            <AlertTriangle className="h-3 w-3 mr-1" /> Payment Overdue
                          </Badge>
                        )}
                        {isUrgent && !isOverdue && (
                          <Badge variant="outline" className="bg-amber-100 text-amber-800">
                            <AlertTriangle className="h-3 w-3 mr-1" /> Payment Due Soon
                          </Badge>
                        )}
                        {!readOnly && <UserAssetActions userId={userId} asset={asset} email={userEmail} />}
                      </div>
                    </div>

                    <div className="mb-4 p-3 bg-gray-50 rounded-md">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <User className="h-4 w-4" /> Legally Owned By:{" "}
                          <span className="font-medium text-foreground">{question?.name_of_property || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" /> Owner&apos;s Address:{" "}
                          <span className="font-medium text-foreground">{question?.address || "No address"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Financial Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-muted/20 p-3 rounded-md">
                          <p className="text-sm font-medium text-muted-foreground">Price</p>
                          <p className="text-lg font-semibold flex items-center">
                            <DollarSign className="mr-1 h-4 w-4 text-muted-foreground" />
                            {formatCurrency(pd.asset_price)}
                          </p>
                        </div>
                        <div className={`p-3 rounded-md ${pd.balance > 0 ? "bg-muted/20" : "bg-green-50"}`}>
                          <p className="text-sm font-medium text-muted-foreground">Balance</p>
                          <p className="text-lg font-semibold flex items-center">
                            {pd.balance > 0 ? (
                              <TrendingDown className="mr-1 h-4 w-4 text-red-500" />
                            ) : (
                              <CheckCircle2 className="mr-1 h-4 w-4 text-green-500" />
                            )}
                            {formatCurrency(pd.balance)}
                          </p>
                        </div>
                        <div className="bg-muted/20 p-3 rounded-md">
                          <p className="text-sm font-medium text-muted-foreground">Amount Paid</p>
                          <p className="text-lg font-semibold flex items-center">
                            <TrendingUp className="mr-1 h-4 w-4 text-green-500" />
                            {formatCurrency(pd.amount_paid)}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Payment Progress</span>
                          <span className="font-medium">{paymentProgress}%</span>
                        </div>
                        <Progress value={paymentProgress} className="h-2" />
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Timeline</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-muted/20 p-3 rounded-md">
                          <p className="text-sm font-medium text-muted-foreground">Start Date</p>
                          <p className="text-base font-semibold flex items-center">
                            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                            {formatDateWord(pd.start_date)}
                          </p>
                        </div>
                        <div
                          className={`p-3 rounded-md ${isUrgent ? "bg-amber-50" : isOverdue ? "bg-red-50" : "bg-muted/20"}`}
                        >
                          <p className="text-sm font-medium text-muted-foreground">Next Payment</p>
                          <p className="text-base font-semibold flex items-center">
                            <CalendarClock
                              className={`mr-2 h-4 w-4 ${
                                isOverdue ? "text-red-500" : isUrgent ? "text-amber-500" : "text-muted-foreground"
                              }`}
                            />
                            {formatDateWord(pd.next_date_of_payment)}
                          </p>
                          <p
                            className={`text-xs mt-1 ${
                              isOverdue
                                ? "text-red-500 font-medium"
                                : isUrgent
                                  ? "text-amber-500 font-medium"
                                  : "text-muted-foreground"
                            }`}
                          >
                            {getRelativeDateText(pd.next_date_of_payment)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="mb-2">
                      <h4 className="text-sm font-medium text-muted-foreground mb-2">Subscription Details</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-muted/20 p-3 rounded-md">
                          <p className="text-sm font-medium text-muted-foreground">Subscription Period</p>
                          <p className="text-base font-semibold flex items-center">
                            <Calendar className="mr-2 h-4 w-4 text-muted-foreground" />
                            {pd.month_subscription} months
                          </p>
                        </div>
                        <div className="bg-muted/20 p-3 rounded-md">
                          <p className="text-sm font-medium text-muted-foreground">Months Remaining</p>
                          <p className="text-base font-semibold flex items-center">
                            <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                            {pd.month_remaining} months
                          </p>
                        </div>
                        <div className="bg-muted/20 p-3 rounded-md">
                          <p className="text-sm font-medium text-muted-foreground">Number of Units</p>
                          <p className="text-base font-semibold flex items-center">
                            <Hash className="mr-2 h-4 w-4 text-muted-foreground" />
                            {pd.no_of_units}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="w-full">
  
          <div className="flex items-center justify-between gap-2 w-full px-4 ">
            <CardTitle className="text-2xl font-bold">User Full Ownership Assets</CardTitle>
            {!readOnly && (
              <Button onClick={() => setIsFullOwnershipModalOpen(true)}>
                <Plus className=" h-4 w-4" /> Add New Asset
              </Button>
            )}
          </div>    
          
        <CardContent>
          <div className="space-y-6">
            {fullOwnershipAssets.length === 0 && (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">No full ownership assets found.</CardContent>
              </Card>
            )}

            {fullOwnershipAssets.map((asset) => {
              const pd = asset.payment_details!;
              const doc = asset.document_plan;
              const question = asset.asset_questions?.find((q) => q.unique_asset_id === pd.unique_asset_id);

              const landPrice = pd.fullownerhsip_landprice || 0;
              const documentPrice = doc?.asset_price || 0;
              const amountPaid = pd.amount_paid || 0;
              const balance = pd.balance || 0;
              const documentAmountPaid = doc?.amount_paid || 0;
              const documentBalance = doc?.balance || 0;
              const totalPrice = landPrice + documentPrice;

              const landProgress = landPrice > 0 ? (amountPaid / landPrice) * 100 : 0;
              const documentProgress = documentPrice > 0 ? (documentAmountPaid / documentPrice) * 100 : 0;
              const isLandPaymentOverdue = isPaymentOverdue(pd.next_date_of_payment);
              const monthsCovered = pd.month_subscription - pd.month_remaining;
              const monthlyPayment = pd.month_subscription > 0 ? landPrice / pd.month_subscription : null;

              return (
                <Card key={asset._id} className={`overflow-hidden py-0 ${pd.is_suspended ? "border-red-400" : ""}`}>
                  <div className="flex flex-row! items-start justify-between gap-4 bg-gray-50 border-b p-4">
                    <div>
                      <h3 className="text-xl font-semibold">{asset.asset_name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                        <User className="h-4 w-4" /> Legally Owned By:{" "}
                        <span className="font-medium">{question?.name_of_property || "N/A"}</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground flex items-center gap-2 mt-3">
                        <MapPin className="h-4 w-4" /> Owner&apos;s Address :{" "}
                        <span className="font-medium">{question?.address || "No Address"}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {pd.is_suspended && <Badge variant="destructive">Suspended</Badge>}
                      {!readOnly && <UserAssetActions userId={userId} asset={asset} email={userEmail} />}
                    </div>
                  </div>

                  <CardContent className="p-0">
                    <div className="bg-white p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Start Date</p>
                          <p className="font-semibold">{formatDateWord(pd.start_date)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Size</p>
                          <p className="font-semibold">{pd.size || asset.asset_size || "N/A"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Hash className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Units</p>
                          <p className="font-semibold">{pd.no_of_units}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Subscription</p>
                          <p className="font-semibold">{pd.month_subscription} months</p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white p-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Sigma className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="text-muted-foreground">Total Price</p>
                          <p className="font-semibold">{formatCurrency(totalPrice)}</p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="grid md:grid-cols-2">
                      <div className="p-4 space-y-4 bg-green-50/40">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <Landmark className="h-5 w-5 text-green-600" /> Land Payment
                        </h3>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-white/70 p-2 rounded-md">
                            <p className="text-xs text-muted-foreground">Land Price</p>
                            <p className="font-bold text-green-700">{formatCurrency(landPrice)}</p>
                          </div>
                          <div className="bg-white/70 p-2 rounded-md">
                            <p className="text-xs text-muted-foreground">Amount Paid</p>
                            <p className="font-bold text-green-700">{formatCurrency(amountPaid)}</p>
                          </div>
                          <div className="bg-white/70 p-2 rounded-md">
                            <p className="text-xs text-muted-foreground">Balance</p>
                            <p className="font-bold text-green-700">{formatCurrency(balance)}</p>
                          </div>
                        </div>
                        <div>
                          <Progress value={landProgress} className="h-2" />
                          <p className="text-xs text-right mt-1">{landProgress.toFixed(1)}% Complete</p>
                        </div>
                        <div className="text-sm space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                              <CalendarIcon className="h-4 w-4" /> Next Payment
                            </span>
                            <span className={`font-medium ${isLandPaymentOverdue ? "text-red-600" : ""}`}>
                              {formatDateWord(pd.next_date_of_payment)}
                            </span>
                          </div>
                          {isLandPaymentOverdue && (
                            <Badge variant="destructive" className="w-full justify-center">
                              <AlertTriangle className="h-4 w-4 mr-2" /> Payment Overdue
                            </Badge>
                          )}
                          <div className="flex justify-between">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                              <Clock className="h-4 w-4" /> Months Covered
                            </span>
                            <span className="font-medium">
                              {monthsCovered} / {pd.month_subscription}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground flex items-center gap-1.5">
                              <Wallet className="h-4 w-4" /> Monthly Payment
                            </span>
                            <span className="font-medium">{monthlyPayment ? formatCurrency(monthlyPayment) : "N/A"}</span>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 space-y-4 bg-blue-50/40">
                        <h3 className="font-semibold text-lg flex items-center gap-2">
                          <FileText className="h-5 w-5 text-blue-600" /> Document Payment
                        </h3>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-white/70 p-2 rounded-md">
                            <p className="text-xs text-muted-foreground">Doc Price</p>
                            <p className="font-bold text-blue-700">{formatCurrency(documentPrice)}</p>
                          </div>
                          <div className="bg-white/70 p-2 rounded-md">
                            <p className="text-xs text-muted-foreground">Amount Paid</p>
                            <p className="font-bold text-blue-700">{formatCurrency(documentAmountPaid)}</p>
                          </div>
                          <div className="bg-white/70 p-2 rounded-md">
                            <p className="text-xs text-muted-foreground">Balance</p>
                            <p className="font-bold text-blue-700">{formatCurrency(documentBalance)}</p>
                          </div>
                        </div>
                        <div>
                          <Progress value={documentProgress} className="h-2 bg-blue-200" />
                          <p className="text-xs text-right mt-1">{documentProgress.toFixed(1)}% Complete</p>
                        </div>
                        {documentBalance === 0 && (
                          <Badge className="w-full justify-center bg-blue-100 text-blue-800 hover:bg-blue-200">
                            Documentation Fully Paid
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
