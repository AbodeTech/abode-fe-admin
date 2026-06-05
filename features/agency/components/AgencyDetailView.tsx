"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { AgencyUsersTable, AgencyUserRow } from "./AgencyUsersTable";
import { AgencyTransactionsTable, AgencyTransactionRow } from "./AgencyTransactionsTable";
import { useReactivateAgency, useSuspendAgency, useUpdateAgencyCommission } from "../hooks/use-agency-actions";
import { getErrorMessage } from "../utils/error-message";

export interface AgencyDetail {
  _id: string;
  agency_name: string;
  agency_code: string;
  email: string;
  phoneNumber: string;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  commission_percentage: number;
  communication_preference?: string | null;
  status: string;
  verified: boolean;
  is_suspended: boolean;
  suspension_reason?: string | null;
  total_referrals?: number | null;
  purchases_on_behalf_count?: number | null;
  total_commission_earned: number;
  withdrawn_commission: number;
  available_commission_balance: number;
  total_transaction_amount?: number | null;
  createdAt: string;
}

export interface AgencyStatistics {
  total_referrals: number;
  active_referrals: number;
  purchases_on_behalf: number;
  sub_realtors_count: number;
  total_transactions: number;
  total_commission_earned: number;
  withdrawn_amount: number;
  available_balance: number;
}

interface AgencyDetailViewProps {
  agency?: AgencyDetail | null;
  statistics?: AgencyStatistics | null;
  users?: AgencyUserRow[] | null;
  transactions?: AgencyTransactionRow[] | null;
}

const formatCurrency = (value?: number | null) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(value ?? 0);

const formatDate = (value?: string | null) => {
  if (!value) return "-";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
};

export function AgencyDetailView({ agency, statistics, users, transactions }: AgencyDetailViewProps) {
  const [commissionOpen, setCommissionOpen] = useState(false);
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [commissionValue, setCommissionValue] = useState(String(agency?.commission_percentage ?? ""));
  const [suspendReason, setSuspendReason] = useState("");

  const { mutateAsync: updateCommission, isPending: updatingCommission } = useUpdateAgencyCommission();
  const { mutateAsync: suspendAgency, isPending: suspending } = useSuspendAgency();
  const { mutateAsync: reactivateAgency, isPending: reactivating } = useReactivateAgency();

  if (!agency) {
    return null;
  }

  const handleCommissionUpdate = async () => {
    const commission = Number(commissionValue);
    if (!Number.isFinite(commission) || commission <= 0) {
      toast.error("Enter a valid commission percentage");
      return;
    }

    try {
      await updateCommission({ agencyId: agency._id, commission_percentage: commission });
      toast.success("Commission updated");
      setCommissionOpen(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to update commission"));
    }
  };

  const handleSuspend = async () => {
    if (!suspendReason.trim()) {
      toast.error("Suspension reason is required");
      return;
    }

    try {
      await suspendAgency({ agencyId: agency._id, reason: suspendReason.trim() });
      toast.success("Agency suspended");
      setSuspendOpen(false);
      setSuspendReason("");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to suspend agency"));
    }
  };

  const handleReactivate = async () => {
    try {
      await reactivateAgency(agency._id);
      toast.success("Agency reactivated");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to reactivate agency"));
    }
  };

  return (
    <div className="min-w-0 space-y-4 sm:space-y-6">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:gap-3">
          <Button variant="outline" size="sm" className="w-full shrink-0 sm:w-fit" asChild>
            <Link href="/agency/lists">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight wrap-break-word sm:text-2xl">{agency.agency_name}</h1>
            <p className="text-sm text-muted-foreground">Agency profile and performance metrics</p>
          </div>
        </div>

        <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:justify-end">
          <Button variant="outline" className="w-full sm:w-auto" asChild>
            <Link href={`/agency/transactions/${agency._id}`}>View Transactions</Link>
          </Button>
          <Button variant="outline" className="w-full sm:w-auto" onClick={() => setCommissionOpen(true)}>
            Edit Commission
          </Button>
          {agency.is_suspended ? (
            <Button className="w-full sm:w-auto" onClick={handleReactivate} disabled={reactivating}>
              {reactivating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Reactivate Agency
            </Button>
          ) : (
            <Button variant="destructive" className="w-full sm:w-auto" onClick={() => setSuspendOpen(true)}>
              Suspend Agency
            </Button>
          )}
        </div>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-3 min-[380px]:grid-cols-2 sm:gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card className="min-w-0 overflow-hidden border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Available Balance</CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-semibold tabular-nums wrap-break-word sm:text-xl">
            {formatCurrency(statistics?.available_balance ?? agency.available_commission_balance)}
          </CardContent>
        </Card>
        <Card className="min-w-0 overflow-hidden border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Referrals</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold tabular-nums sm:text-2xl">
            {statistics?.total_referrals ?? agency.total_referrals ?? 0}
          </CardContent>
        </Card>
        <Card className="min-w-0 overflow-hidden border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Transactions</CardTitle>
          </CardHeader>
          <CardContent className="text-xl font-semibold tabular-nums sm:text-2xl">
            {statistics?.total_transactions ?? transactions?.length ?? 0}
          </CardContent>
        </Card>
        <Card className="min-w-0 overflow-hidden border border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Commission Earned</CardTitle>
          </CardHeader>
          <CardContent className="text-lg font-semibold tabular-nums wrap-break-word sm:text-xl">
            {formatCurrency(statistics?.total_commission_earned ?? agency.total_commission_earned)}
          </CardContent>
        </Card>
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="min-w-0 border border-gray-200">
          <CardHeader>
            <CardTitle>Agency Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm wrap-break-word">
            <p>
              <span className="text-muted-foreground">Agency Code:</span> {agency.agency_code}
            </p>
            <p>
              <span className="text-muted-foreground">Email:</span> {agency.email}
            </p>
            <p>
              <span className="text-muted-foreground">Phone:</span> {agency.phoneNumber}
            </p>
            <p>
              <span className="text-muted-foreground">Address:</span>{" "}
              {[agency.address, agency.city, agency.state, agency.country].filter(Boolean).join(", ") || "-"}
            </p>
            <p><span className="text-muted-foreground">Communication:</span> {agency.communication_preference || "-"}</p>
            <p><span className="text-muted-foreground">Created:</span> {formatDate(agency.createdAt)}</p>
          </CardContent>
        </Card>

        <Card className="min-w-0 border border-gray-200">
          <CardHeader>
            <CardTitle>Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={agency.status?.toLowerCase() === "active" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-800"}>
                {agency.status}
              </Badge>
              <Badge variant="outline">{agency.verified ? "Verified" : "Unverified"}</Badge>
              {agency.is_suspended && <Badge className="bg-rose-100 text-rose-800">Suspended</Badge>}
            </div>

            <p className="text-sm"><span className="text-muted-foreground">Commission Rate:</span> {agency.commission_percentage}%</p>
            <p className="text-sm">
              <span className="text-muted-foreground">Withdrawn Commission:</span>{" "}
              {formatCurrency(statistics?.withdrawn_amount ?? agency.withdrawn_commission)}
            </p>
            <p className="text-sm">
              <span className="text-muted-foreground">Purchases on Behalf:</span>{" "}
              {statistics?.purchases_on_behalf ?? agency.purchases_on_behalf_count ?? 0}
            </p>
            {agency.suspension_reason && (
              <p className="text-sm text-rose-600">
                <span className="font-medium">Suspension reason:</span> {agency.suspension_reason}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="min-w-0 border border-gray-200">
        <CardHeader className="min-w-0 pb-3">
          <CardTitle className="text-lg wrap-break-word sm:text-xl">
            Users under Agency ({users?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="min-w-0">
          <AgencyUsersTable users={users} />
        </CardContent>
      </Card>

      <Card className="min-w-0 border border-gray-200">
        <CardHeader className="min-w-0 pb-3">
          <CardTitle className="text-lg wrap-break-word sm:text-xl">
            Agency Transactions ({transactions?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="min-w-0">
          <AgencyTransactionsTable transactions={transactions} />
        </CardContent>
      </Card>

      <Dialog open={commissionOpen} onOpenChange={setCommissionOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Commission</DialogTitle>
            <DialogDescription>Update commission percentage for this agency.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="commission_percentage">Commission (%)</Label>
            <Input
              id="commission_percentage"
              type="number"
              min={0.1}
              step={0.1}
              value={commissionValue}
              onChange={(event) => setCommissionValue(event.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCommissionOpen(false)} disabled={updatingCommission}>Cancel</Button>
            <Button onClick={handleCommissionUpdate} disabled={updatingCommission}>
              {updatingCommission && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={suspendOpen} onOpenChange={setSuspendOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Suspend Agency</DialogTitle>
            <DialogDescription>Provide a reason for suspension.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="suspend_reason">Reason</Label>
            <Input
              id="suspend_reason"
              value={suspendReason}
              onChange={(event) => setSuspendReason(event.target.value)}
              placeholder="Reason for suspension"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSuspendOpen(false)} disabled={suspending}>Cancel</Button>
            <Button variant="destructive" onClick={handleSuspend} disabled={suspending}>
              {suspending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Suspend
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
