"use client";

import { UserDetail } from "../../types/user.types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet, TrendingUp, Bookmark, Package, DollarSign, PiggyBank, Calendar, Clock } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useHasPermission } from "@/hooks/use-admin-permission";
import { ReasonActionModal } from "../modals/ReasonActionModal";
import { useSuspendUser, useUnsuspendUser, useForcePasswordReset, useSuspendWallet, useUnsuspendWallet } from "../../hooks/use-user-mutations";

interface UserStatsProps {
  user: UserDetail;
}

const formatNaira = (amount: number) => {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const formatDateWord = (dateString: string) => {
  try {
    return format(new Date(dateString), "dd MMM yyyy");
  } catch {
    return "N/A";
  }
};

const DataPoint = ({ title, value, icon, isEven }: { title: string; value: string; icon: React.ReactNode; isEven: boolean }) => (
  <Card className={`${isEven ? "bg-[#F9FAFB]" : "bg-[#101828] text-white"} min-w-0 overflow-hidden border-none shadow-sm`}>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className={`text-sm font-medium ${isEven ? "text-[#667085]" : "text-gray-300"}`}>{title}</CardTitle>
      {icon}
    </CardHeader>
    <CardContent>
      <div className={`text-2xl font-bold wrap-break-word ${isEven ? "text-[#101828]" : "text-white"}`}>{value}</div>
    </CardContent>
  </Card>
);

type ActionModal = "suspend" | "unsuspend" | "forceReset" | "suspendWallet" | "unsuspendWallet" | null;

export function UserStats({ user }: UserStatsProps) {
  const [activeAction, setActiveAction] = useState<ActionModal>(null);
  const isSuspended = user.is_suspended;
  const canSuspend = useHasPermission("suspend_user");
  const canUnsuspend = useHasPermission("unsuspend_user");
  const canForceReset = useHasPermission("force_password_reset");
  const canSuspendWallet = useHasPermission("suspend_wallet");
  const canUnsuspendWallet = useHasPermission("unsuspend_wallet");
  const canToggleStatus = isSuspended ? canUnsuspend : canSuspend;

  const suspendUser = useSuspendUser();
  const unsuspendUser = useUnsuspendUser();
  const forceReset = useForcePasswordReset();
  const suspendWallet = useSuspendWallet();
  const unsuspendWallet = useUnsuspendWallet();

  const stats = [
    {
      title: "Wallet Balance",
      value: formatNaira(user.wallet?.balance || 0),
      icon: <Wallet className="h-4 w-4 text-muted-foreground" />,
      isEven: false,
    },
    {
      title: "Net Worth",
      value: formatNaira(user.virtual_networth || 0),
      icon: <TrendingUp className="h-4 w-4 text-muted-foreground" />,
      isEven: true,
    },
    {
      title: "Subscriptions",
      value: (user.virtual_subscriptions || 0).toString(),
      icon: <Bookmark className="h-4 w-4 text-muted-foreground" />,
      isEven: false,
    },
    {
      title: "Unit Purchased",
      value: (user.units_purchased || 0).toString(),
      icon: <Package className="h-4 w-4 text-muted-foreground" />,
      isEven: true,
    },
    {
      title: "Amount Paid",
      value: formatNaira(user.amount_paid || 0),
      icon: <DollarSign className="h-4 w-4 text-muted-foreground" />,
      isEven: false,
    },
    {
      title: "Balance",
      value: formatNaira(user.balance_payable || 0),
      icon: <PiggyBank className="h-4 w-4 text-muted-foreground" />,
      isEven: true,
    },
    {
      title: "Next Payment Date",
      value: user.next_date_of_payment ? formatDateWord(user.next_date_of_payment) : "N/A",
      icon: <Calendar className="h-4 w-4 text-muted-foreground" />,
      isEven: false,
    },
    {
      title: "Unsigned contracts",
      value: (user.unsigned_contracts ?? 0).toString(),
      icon: <Clock className="h-4 w-4 text-muted-foreground" />,
      isEven: true,
    },
  ];

  return (
    <div className="mt-8 space-y-6 sm:space-y-8">
      <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-2xl font-bold text-[#101828]">User Data Points</h3>
        <div className="flex flex-wrap gap-2">
          {canToggleStatus && (
            isSuspended ? (
              <Button
                variant="outline"
                className="text-green-700 border-green-200 bg-green-50 hover:bg-green-100 hover:text-green-800"
                onClick={() => setActiveAction("unsuspend")}
              >
                Unsuspend User
              </Button>
            ) : (
              <Button
                variant="destructive"
                className="bg-[#D92D20] hover:bg-[#B42318]"
                onClick={() => setActiveAction("suspend")}
              >
                Suspend User
              </Button>
            )
          )}
          {canForceReset && (
            <Button
              variant="outline"
              onClick={() => setActiveAction("forceReset")}
            >
              Force Password Reset
            </Button>
          )}
          {canSuspendWallet && (
            <Button
              variant="outline"
              className="text-orange-700 border-orange-200"
              onClick={() => setActiveAction("suspendWallet")}
            >
              Suspend Wallet
            </Button>
          )}
          {canUnsuspendWallet && (
            <Button
              variant="outline"
              className="text-green-700 border-green-200"
              onClick={() => setActiveAction("unsuspendWallet")}
            >
              Unsuspend Wallet
            </Button>
          )}
        </div>
      </div>
      <div className="grid min-w-0 gap-4 min-[380px]:grid-cols-2 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => (
          <DataPoint
            key={i}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            isEven={stat.isEven}
          />
        ))}
      </div>

      <ReasonActionModal
        open={activeAction === "suspend"}
        onOpenChange={(open) => { if (!open) setActiveAction(null) }}
        title="Suspend user"
        description="Suspending this user will revoke their access to the platform."
        confirmLabel="Suspend"
        successMessage="User suspended"
        destructive
        includeExpiresAt
        onSubmit={(userId, payload) => suspendUser.mutateAsync({ userId, payload })}
      />
      <ReasonActionModal
        open={activeAction === "unsuspend"}
        onOpenChange={(open) => { if (!open) setActiveAction(null) }}
        title="Unsuspend user"
        description="Unsuspending will restore their access to the platform."
        confirmLabel="Unsuspend"
        successMessage="User unsuspended"
        onSubmit={(userId, payload) => unsuspendUser.mutateAsync({ userId, payload })}
      />
      <ReasonActionModal
        open={activeAction === "forceReset"}
        onOpenChange={(open) => { if (!open) setActiveAction(null) }}
        title="Force password reset"
        description="This will revoke all sessions and send a password-reset code."
        confirmLabel="Force reset"
        successMessage="Sessions revoked, reset initiated"
        destructive
        onSubmit={(userId, payload) => forceReset.mutateAsync({ userId, payload })}
      />
      <ReasonActionModal
        open={activeAction === "suspendWallet"}
        onOpenChange={(open) => { if (!open) setActiveAction(null) }}
        title="Suspend wallet"
        description="The user will not be able to transact until the wallet is unsuspended."
        confirmLabel="Suspend wallet"
        successMessage="Wallet suspended"
        destructive
        onSubmit={(userId, payload) => suspendWallet.mutateAsync({ userId, payload })}
      />
      <ReasonActionModal
        open={activeAction === "unsuspendWallet"}
        onOpenChange={(open) => { if (!open) setActiveAction(null) }}
        title="Unsuspend wallet"
        description="Restore the wallet so the user can transact again."
        confirmLabel="Unsuspend wallet"
        successMessage="Wallet unsuspended"
        onSubmit={(userId, payload) => unsuspendWallet.mutateAsync({ userId, payload })}
      />
    </div>
  );
}
