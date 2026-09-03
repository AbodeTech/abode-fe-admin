"use client";

import { useState } from "react";
import { useUnsuspendUserPlan } from "../../hooks/use-user-plan-mutations";
import { ReasonActionModal } from "./ReasonActionModal";

interface UserPaymentPlanUnSuspendProps {
  planId: string;
  userId?: string;
}

export function UserPaymentPlanUnSuspend({ planId, userId }: UserPaymentPlanUnSuspendProps) {
  const [isOpen, setIsOpen] = useState(false);
  const mutation = useUnsuspendUserPlan();

  return (
    <>
      <button
        type="button"
        className="w-full text-left text-sm text-destructive"
        onClick={() => setIsOpen(true)}
      >
        Resume Transactions on User Asset
      </button>
      <ReasonActionModal
        open={isOpen}
        onOpenChange={setIsOpen}
        title="Resume payment plan"
        description="The user will be able to continue making payments on this plan."
        confirmLabel="Resume plan"
        successMessage="Payment plan resumed"
        onSubmit={(resolvedUserId, payload) =>
          mutation.mutateAsync({ userId: userId ?? resolvedUserId, planId, payload })
        }
      />
    </>
  );
}
