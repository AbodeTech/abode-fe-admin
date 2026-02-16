"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Plus, CheckCircle2, Calendar, AlertTriangle, TrendingDown, TrendingUp, User, MapPin, Clock, CalendarClock, FileText, Landmark, Sigma } from "lucide-react";
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
  userEmail: string;
}

const formatDateWord = (dateString: string) => {
  try {
    return format(new Date(dateString), "dd MMM yyyy");
  } catch {
    return "N/A";
  }
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export function UserAssetsList({ userId, userEmail }: UserAssetsListProps) {
  const [isFlexModalOpen, setIsFlexModalOpen] = useState(false);
  const [isFullOwnershipModalOpen, setIsFullOwnershipModalOpen] = useState(false);

  const { data: assets, isLoading } = useQuery({
    queryKey: ["userAssets", userId],
    queryFn: () => getUserAssetsByAdmin(userId),
  });

  const flexAssets = assets?.filter((asset) => asset.payment_details?.asset_type === "flex") || [];
  const fullOwnershipAssets = assets?.filter((asset) => asset.payment_details?.asset_type === "full-ownership") || [];

  if (isLoading) {
    return (
      <div className="space-y-6 mt-12">
        <Skeleton className="h-[200px] w-full" />
        <Skeleton className="h-[200px] w-full" />
      </div>
    );
  }

  // Helper functions
  const getDaysUntilNextPayment = (nextPaymentDate: string): number => {
    const today = new Date();
    const nextDate = new Date(nextPaymentDate);
    const diffTime = nextDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const getRelativeDateText = (dateStr: string): string => {
    const daysUntil = getDaysUntilNextPayment(dateStr);
    if (daysUntil < 0) return `Overdue by ${Math.abs(daysUntil)} days`;
    if (daysUntil === 0) return "Due today";
    if (daysUntil === 1) return "Due tomorrow";
    if (daysUntil < 7) return `Due in ${daysUntil} days`;
    return formatDateWord(dateStr);
  };

  const isPaymentOverdue = (nextPaymentDate: string): boolean => {
    return getDaysUntilNextPayment(nextPaymentDate) < 0;
  };

  const isPaymentUrgent = (nextPaymentDate: string): boolean => {
    const days = getDaysUntilNextPayment(nextPaymentDate);
    return days >= 0 && days <= 7;
  };

  return (
    <div className="space-y-6 mt-12">
      <AddFlexAssetModal
        userId={userId}
        isOpen={isFlexModalOpen}
        onClose={() => setIsFlexModalOpen(false)}
      />
      <AddFullOwnershipAssetModal
        userId={userId}
        isOpen={isFullOwnershipModalOpen}
        onClose={() => setIsFullOwnershipModalOpen(false)}
      />

      {/* Flex Assets Section */}
      <Card className="border border-[#E5EAEF] shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-[#E5EAEF] bg-gray-50/50">
          <CardTitle className="text-xl font-bold text-[#101828]">User Flex Assets</CardTitle>
          <Button className="bg-[#7F56D9] hover:bg-[#6941C6]" onClick={() => setIsFlexModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Flex Asset
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          {flexAssets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No flex assets found for this user.</div>
          ) : (
            <div className="grid gap-6">
              {flexAssets.map((asset) => {
                const pd = asset.payment_details!;
                const question = asset.asset_questions?.find(q => q.unique_asset_id === pd.unique_asset_id);
                const paymentProgress = pd.asset_price > 0 ? (pd.amount_paid / pd.asset_price) * 100 : 0;
                const isOverdue = isPaymentOverdue(pd.next_date_of_payment);
                const isUrgent = isPaymentUrgent(pd.next_date_of_payment);

                return (
                  <Card key={asset._id} className={`${pd.is_suspended ? "opacity-75 border-red-200" : ""} border shadow-sm`}>
                    <CardContent className="p-4">
                      {/* Flex Asset Header */}
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-lg font-bold text-[#101828]">{asset.asset_name}</h3>
                            <Badge variant={pd.is_suspended ? "destructive" : "outline"} className={!pd.is_suspended ? "bg-green-50 text-green-700 border-green-200" : ""}>
                              {pd.is_suspended ? "Suspended" : "Active"}
                            </Badge>
                            <Badge variant="outline">{pd.size} sqm</Badge>
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              <Calendar className="mr-1 h-3 w-3" />
                              Started: {formatDateWord(pd.start_date)}
                            </Badge>
                          </div>

                          <div className="text-sm text-gray-500 flex flex-col gap-1">
                            <span className="flex items-center gap-2"><User className="h-4 w-4" /> Owned By: <span className="font-medium text-gray-900">{question?.name_of_property || "N/A"}</span></span>
                            <span className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Address: <span className="font-medium text-gray-900">{question?.address || "N/A"}</span></span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {(isOverdue || isUrgent) && (
                            <Badge variant={isOverdue ? "destructive" : "outline"} className={isUrgent && !isOverdue ? "bg-amber-50 text-amber-700 border-amber-200" : ""}>
                              <AlertTriangle className="mr-1 h-3 w-3" />
                              {isOverdue ? "Overdue" : "Due Soon"}
                            </Badge>
                          )}
                          <UserAssetActions
                            userId={userId}
                            asset={asset}
                            email={userEmail}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-gray-50 p-3 rounded-md">
                          <p className="text-sm text-gray-500">Price</p>
                          <div className="font-semibold text-lg">{formatCurrency(pd.asset_price)}</div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-md">
                          <p className="text-sm text-gray-500">Balance</p>
                          <div className="font-semibold text-lg flex items-center gap-1">
                            {pd.balance > 0 ? <TrendingDown className="h-4 w-4 text-red-500" /> : <CheckCircle2 className="h-4 w-4 text-green-500" />}
                            {formatCurrency(pd.balance)}
                          </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-md">
                          <p className="text-sm text-gray-500">Amount Paid</p>
                          <div className="font-semibold text-lg flex items-center gap-1">
                            <TrendingUp className="h-4 w-4 text-green-500" />
                            {formatCurrency(pd.amount_paid)}
                          </div>
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="flex justify-between text-xs mb-1">
                          <span>Payment Progress</span>
                          <span className="font-medium">{Math.round(paymentProgress)}%</span>
                        </div>
                        <Progress value={paymentProgress} className="h-2" />
                      </div>

                      <Separator className="my-4" />

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-gray-50 p-3 rounded-md flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-500">Subscription Period</p>
                            <div className="font-semibold flex items-center gap-2">
                              <Clock className="h-4 w-4 text-gray-400" />
                              {pd.month_subscription} Months
                            </div>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Remaining</p>
                            <div className="font-semibold">{pd.month_remaining} Months</div>
                          </div>
                        </div>

                        <div className={`p-3 rounded-md ${isOverdue ? "bg-red-50" : "bg-gray-50"}`}>
                          <p className="text-sm text-gray-500">Next Payment</p>
                          <div className="flex items-center gap-2 font-semibold">
                            <CalendarClock className={`h-4 w-4 ${isOverdue ? "text-red-500" : "text-gray-400"}`} />
                            {formatDateWord(pd.next_date_of_payment)}
                          </div>
                          <p className={`text-xs mt-1 ${isOverdue ? "text-red-600 font-medium" : "text-gray-500"}`}>
                            {getRelativeDateText(pd.next_date_of_payment)}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Full Ownership Assets Section */}
      <Card className="border border-[#E5EAEF] shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-[#E5EAEF] bg-gray-50/50">
          <CardTitle className="text-xl font-bold text-[#101828]">User Full Ownership Assets</CardTitle>
          <Button className="bg-[#7F56D9] hover:bg-[#6941C6]" onClick={() => setIsFullOwnershipModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add New Asset
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          {fullOwnershipAssets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No full ownership assets found for this user.</div>
          ) : (
            <div className="grid gap-6">
              {fullOwnershipAssets.map((asset) => {
                const pd = asset.payment_details!;
                const doc = asset.document_plan!;
                const question = asset.asset_questions?.find(q => q.unique_asset_id === pd.unique_asset_id);
                const landAmount = pd.fullownerhsip_landprice ?? 0;
                const landPaid = pd.amount_paid ?? 0;
                const landBalance = pd.balance ?? 0;
                const docAmount = pd.fullownerhsip_documentprice || doc?.asset_price || 0;
                const docPaid = doc?.amount_paid || 0;
                const docBalance = doc?.balance || 0;
                const totalPrice = landAmount + docAmount;

                const landProgress = landAmount > 0 ? (landPaid / landAmount) * 100 : 0;
                const docProgress = docAmount > 0 ? (docPaid / docAmount) * 100 : 0;
                const isLandOverdue = isPaymentOverdue(pd.next_date_of_payment);

                return (
                  <Card key={asset._id} className={`${pd.is_suspended ? "border-red-400" : ""} overflow-hidden`}>
                    <div className="bg-gray-50 p-4 border-b flex justify-between items-start">
                      <div>
                        <h3 className="text-lg font-bold text-[#101828]">{asset.asset_name}</h3>
                        <div className="text-sm text-gray-500 flex flex-col gap-1 mt-1">
                          <span className="flex items-center gap-2"><User className="h-4 w-4" /> Owned By: <span className="font-medium text-gray-900">{question?.name_of_property || "N/A"}</span></span>
                          <span className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Address: <span className="font-medium text-gray-900">{question?.address || "N/A"}</span></span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {pd.is_suspended && <Badge variant="destructive">Suspended</Badge>}
                        <UserAssetActions
                          userId={userId}
                          asset={asset}
                          email={userEmail}
                        />
                      </div>
                    </div>

                    <div className="bg-white p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-b">
                      <div><p className="text-gray-500">Start Date</p><p className="font-semibold">{formatDateWord(pd.start_date)}</p></div>
                      <div><p className="text-gray-500">Size</p><p className="font-semibold">{pd.size || asset.asset_size || "N/A"}</p></div>
                      <div><p className="text-gray-500">Units</p><p className="font-semibold">{pd.no_of_units}</p></div>
                      <div><p className="text-gray-500">Subscription</p><p className="font-semibold">{pd.month_subscription} Months</p></div>
                    </div>

                    <div className="p-4 bg-white border-b">
                      <div className="flex items-center gap-2 mb-2">
                        <Sigma className="h-5 w-5 text-gray-500" />
                        <span className="font-semibold">Total Price: {formatCurrency(totalPrice)}</span>
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2">
                      {/* Land Payment */}
                      <div className="p-4 bg-green-50/30 space-y-4 border-r">
                        <h4 className="font-semibold flex items-center gap-2"><Landmark className="h-4 w-4 text-green-600" /> Land Payment</h4>
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="bg-white p-2 rounded border"><p className="text-gray-500">Price</p><p className="font-bold text-green-700">{formatCurrency(landAmount)}</p></div>
                          <div className="bg-white p-2 rounded border"><p className="text-gray-500">Paid</p><p className="font-bold text-green-700">{formatCurrency(landPaid)}</p></div>
                          <div className="bg-white p-2 rounded border"><p className="text-gray-500">Balance</p><p className="font-bold text-green-700">{formatCurrency(landBalance)}</p></div>
                        </div>
                        <div>
                          <Progress value={landProgress} className="h-2" />
                          <p className="text-right text-xs mt-1 text-gray-500">{landProgress.toFixed(1)}%</p>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Next Payment</span>
                          <span className={isLandOverdue ? "text-red-600 font-bold" : "font-medium"}>{formatDateWord(pd.next_date_of_payment)}</span>
                        </div>
                      </div>

                      {/* Document Payment */}
                      <div className="p-4 bg-blue-50/30 space-y-4">
                        <h4 className="font-semibold flex items-center gap-2"><FileText className="h-4 w-4 text-blue-600" /> Document Payment</h4>
                        <div className="grid grid-cols-3 gap-2 text-center text-xs">
                          <div className="bg-white p-2 rounded border"><p className="text-gray-500">Price</p><p className="font-bold text-blue-700">{formatCurrency(docAmount)}</p></div>
                          <div className="bg-white p-2 rounded border"><p className="text-gray-500">Paid</p><p className="font-bold text-blue-700">{formatCurrency(docPaid)}</p></div>
                          <div className="bg-white p-2 rounded border"><p className="text-gray-500">Balance</p><p className="font-bold text-blue-700">{formatCurrency(docBalance)}</p></div>
                        </div>
                        <div>
                          <Progress value={docProgress} className="h-2 bg-blue-200" />
                          <p className="text-right text-xs mt-1 text-gray-500">{docProgress.toFixed(1)}%</p>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
