"use client";

import { useState } from "react";
import { useSuspendUserPlan } from "../../hooks/use-user-plan-mutations";
import { ReasonActionModal } from "./ReasonActionModal";

interface UserPaymentPlanSuspendProps {
  planId: string;
  userId?: string;
}

export function UserPaymentPlanSuspend({ planId, userId }: UserPaymentPlanSuspendProps) {
  const [isOpen, setIsOpen] = useState(false);
  const mutation = useSuspendUserPlan();

  return (
    <>
      <button type="button" className="w-full text-left text-sm" onClick={() => setIsOpen(true)}>
        Suspend Transactions on User Asset
      </button>
      <ReasonActionModal
        open={isOpen}
        onOpenChange={setIsOpen}
        title="Suspend payment plan"
        description="Payments on this plan will be paused until an admin resumes it."
        confirmLabel="Suspend plan"
        successMessage="Payment plan suspended"
        destructive
        onSubmit={(resolvedUserId, payload) =>
          mutation.mutateAsync({ userId: userId ?? resolvedUserId, planId, payload })
        }
      />
    </>
  );
}
