'use client';

import { useState } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useHasPermission } from '@/hooks/use-admin-permission';
import type { UserAsset } from '@/lib/api/admin/user-assets.types';

import { EditUserAssetQuestionModal } from '../modals/EditUserAssetQuestionModal';
import { EditUserPaymentPlanModal } from '../modals/EditUserPaymentPlanModal';
import {
  CloseAndRelocatePlanModal,
  EditPlanCommissionModal,
} from '../modals/AdvancedPlanActionModals';
import {
  ClosePlanModal,
  DeletePlanModal,
  PlanBalanceAdjustmentModal,
  PlanPaymentDateModal,
  SignatureReminderModal,
} from '../modals/PlanActionModals';
import { SendCompletionCertificateModal } from '../modals/SendCompletionCertificateModal';
import { SendContractOfSalesModal } from '../modals/SendContractOfSalesModal';
import { SendFlexTermsAndConditionModal } from '../modals/SendFlexTermsAndConditionModal';
import { UserPaymentPlanSuspend } from '../modals/UserPaymentPlanSuspend';
import { UserPaymentPlanUnSuspend } from '../modals/UserPaymentPlanUnSuspend';

interface UserAssetActionsProps {
  userId: string;
  asset: UserAsset;
  email?: string;
}

export function UserAssetActions({ userId, asset, email }: UserAssetActionsProps) {
  const canEditSpec = useHasPermission('update_plan_spec');
  const canEditQuestion = useHasPermission('edit_user_asset_question');
  const canAdjustBalance = useHasPermission('adjust_plan_balance');
  const canOverrideDate = useHasPermission('override_next_payment_date');
  const canSuspend = useHasPermission('suspend_plan');
  const canUnsuspend = useHasPermission('unsuspend_plan');
  const canClose = useHasPermission('close_plan');
  const canEditCommissionConfig = useHasPermission('edit_plan_commission_config');
  const canEditCommissionRecipients = useHasPermission('edit_plan_commission_recipients');
  const canDelete = useHasPermission('delete_user_plan');
  const canSendEmail = useHasPermission('send_user_email');
  const searchParams = useSearchParams();
  const router = useRouter();

  const [showDelete, setShowDelete] = useState(false);
  const [showBalance, setShowBalance] = useState(false);
  const [showDate, setShowDate] = useState(false);
  const [showClose, setShowClose] = useState(false);
  const [showRelocate, setShowRelocate] = useState(false);
  const [showCommissionConfig, setShowCommissionConfig] = useState(false);
  const [showCommissionRecipients, setShowCommissionRecipients] = useState(false);
  const [showContract, setShowContract] = useState(false);
  const [showCertificate, setShowCertificate] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showSignatureReminder, setShowSignatureReminder] = useState(false);

  const pd = asset.payment_details!;
  const question = asset.asset_questions?.find(
    (item) => item.unique_asset_id === pd.unique_asset_id,
  );
  const isSuspended = asset.status === 'suspended';

  const setModalParam = (value: string | null) => {
    const params = new URLSearchParams(searchParams?.toString() || '');
    if (value) {
      params.set('modal', value);
      params.set('planId', asset._id);
    } else {
      params.delete('modal');
      params.delete('planId');
    }
    const next = params.toString();
    router.push(next ? `?${next}` : '?');
  };

  const modal = searchParams?.get('modal');
  const paramPlanId = searchParams?.get('planId') ?? searchParams?.get('uniqueAssetId');
  const isMatchingPlan =
    !paramPlanId || paramPlanId === asset._id || paramPlanId === pd.unique_asset_id;
  const showEditPlan = canEditSpec && modal === 'updatepaymentplan' && isMatchingPlan;
  const showEditQuestion =
    canEditQuestion && modal === 'edituserassetquestion' && isMatchingPlan;

  const hasAnyAction =
    canEditSpec ||
    canEditQuestion ||
    canAdjustBalance ||
    canOverrideDate ||
    canSuspend ||
    canUnsuspend ||
    canClose ||
    canEditCommissionConfig ||
    canEditCommissionRecipients ||
    canDelete ||
    canSendEmail;
  if (!hasAnyAction) return null;

  const target = { userId, planId: asset._id, expectedUpdatedAt: asset.updated_at };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 rounded-full p-0 hover:bg-muted">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Plan actions</DropdownMenuLabel>
          <DropdownMenuSeparator />

          {canEditSpec && (
            <DropdownMenuItem onSelect={() => setModalParam('updatepaymentplan')}>
              Edit Plan Specification
            </DropdownMenuItem>
          )}
          {canEditQuestion && (
            <DropdownMenuItem onSelect={() => setModalParam('edituserassetquestion')}>
              Edit Legal Details
            </DropdownMenuItem>
          )}
          {canAdjustBalance && (
            <DropdownMenuItem onSelect={() => setShowBalance(true)}>
              Adjust Recorded Payment
            </DropdownMenuItem>
          )}
          {canOverrideDate && (
            <DropdownMenuItem onSelect={() => setShowDate(true)}>
              Change Next Payment Date
            </DropdownMenuItem>
          )}
          {canEditCommissionConfig && (
            <DropdownMenuItem onSelect={() => setShowCommissionConfig(true)}>
              Edit Commission Rates
            </DropdownMenuItem>
          )}
          {canEditCommissionRecipients && (
            <DropdownMenuItem onSelect={() => setShowCommissionRecipients(true)}>
              Edit Commission Recipients
            </DropdownMenuItem>
          )}

          {canSendEmail && <DropdownMenuSeparator />}
          {canSendEmail && (
            <DropdownMenuItem onSelect={() => setShowContract(true)}>
              Send Contract of Sale
            </DropdownMenuItem>
          )}
          {canSendEmail && email && (
            <DropdownMenuItem onSelect={() => setShowCertificate(true)}>
              Send Completion Certificate
            </DropdownMenuItem>
          )}
          {canSendEmail && email && pd.asset_type === 'flex' && (
            <DropdownMenuItem onSelect={() => setShowTerms(true)}>
              Send Flex Terms &amp; Conditions
            </DropdownMenuItem>
          )}
          {canSendEmail && (
            <DropdownMenuItem onSelect={() => setShowSignatureReminder(true)}>
              Send Signature Reminder
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />
          {(isSuspended ? canUnsuspend : canSuspend) && (
            <DropdownMenuItem onSelect={(event) => event.preventDefault()}>
              {isSuspended ? (
                <UserPaymentPlanUnSuspend planId={asset._id} userId={userId} />
              ) : (
                <UserPaymentPlanSuspend planId={asset._id} userId={userId} />
              )}
            </DropdownMenuItem>
          )}
          {canClose && asset.status !== 'closed' && asset.status !== 'cancelled' && (
            <>
              <DropdownMenuItem className="text-amber-700" onSelect={() => setShowClose(true)}>
                Close Plan
              </DropdownMenuItem>
              <DropdownMenuItem className="text-amber-700" onSelect={() => setShowRelocate(true)}>
                Close and Relocate
              </DropdownMenuItem>
            </>
          )}
          {canDelete && (
            <DropdownMenuItem
              className="text-red-600 focus:text-red-600"
              onSelect={() => setShowDelete(true)}
            >
              Delete Plan
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {canEditSpec && (
        <EditUserPaymentPlanModal
          isOpen={showEditPlan}
          onClose={() => setModalParam(null)}
          asset={asset}
          userId={userId}
        />
      )}
      {canEditQuestion && (
        <EditUserAssetQuestionModal
          isOpen={showEditQuestion}
          onClose={() => setModalParam(null)}
          planId={asset._id}
          expectedUpdatedAt={asset.updated_at}
          currentName={question?.name_of_property || ''}
          currentAddress={question?.address || ''}
          userId={userId}
        />
      )}

      {canSendEmail && (
        <SendContractOfSalesModal
          isOpen={showContract}
          onClose={() => setShowContract(false)}
          userId={userId}
          planId={asset._id}
        />
      )}
      {canSendEmail && email && (
        <>
          <SendCompletionCertificateModal
            isOpen={showCertificate}
            onClose={() => setShowCertificate(false)}
            userId={userId}
            planId={asset._id}
            email={email}
          />
          <SendFlexTermsAndConditionModal
            isOpen={showTerms}
            onClose={() => setShowTerms(false)}
            userId={userId}
            planId={asset._id}
            email={email}
          />
        </>
      )}

      <PlanBalanceAdjustmentModal open={showBalance} onOpenChange={setShowBalance} {...target} />
      <PlanPaymentDateModal open={showDate} onOpenChange={setShowDate} {...target} />
      <ClosePlanModal open={showClose} onOpenChange={setShowClose} {...target} />
      <CloseAndRelocatePlanModal
        open={showRelocate}
        onOpenChange={setShowRelocate}
        carryOverAmount={pd.amount_paid + (asset.document_plan?.amount_paid ?? 0)}
        {...target}
      />
      {showCommissionConfig && (
        <EditPlanCommissionModal
          mode="config"
          open
          onOpenChange={setShowCommissionConfig}
          commissionConfigVersion={asset.commission_config_version}
          recipients={asset.commission_recipients ?? []}
          {...target}
        />
      )}
      {showCommissionRecipients && (
        <EditPlanCommissionModal
          mode="recipients"
          open
          onOpenChange={setShowCommissionRecipients}
          commissionConfigVersion={asset.commission_config_version}
          recipients={asset.commission_recipients ?? []}
          {...target}
        />
      )}
      <DeletePlanModal open={showDelete} onOpenChange={setShowDelete} {...target} />
      <SignatureReminderModal
        open={showSignatureReminder}
        onOpenChange={setShowSignatureReminder}
        userId={userId}
        planId={asset._id}
      />
    </>
  );
}
