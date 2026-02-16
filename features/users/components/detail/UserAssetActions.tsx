"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { MoreHorizontal, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { deleteUserFlexAsset, deleteUserFullOwnershipAsset, suspendPaymentPlan, unSuspendPaymentPlan } from "@/lib/api/admin/user-assets.client";
import { UserAsset } from "@/lib/api/admin/user-assets.types";
import { EditUserPaymentPlanModal } from "../modals/EditUserPaymentPlanModal";
import { EditUserAssetQuestionModal } from "../modals/EditUserAssetQuestionModal";
import { SendContractOfSalesModal } from "../modals/SendContractOfSalesModal";
import { SendCompletionCertificateModal } from "../modals/SendCompletionCertificateModal";
import { SendHamperModal } from "../modals/SendHamperModal";
import { SendFlexTermsAndConditionModal } from "../modals/SendFlexTermsAndConditionModal";
import { getErrorMessage } from "../../utils/error-message";

interface UserAssetActionsProps {
  userId: string;
  asset: UserAsset;
  email?: string; // Need email for sending certs etc.
}

export function UserAssetActions({
  userId,
  asset,
  email,
}: UserAssetActionsProps) {
  const queryClient = useQueryClient();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);

  // Modal states
  const [showEditPlan, setShowEditPlan] = useState(false);
  const [showEditQuestion, setShowEditQuestion] = useState(false);
  const [showSendContract, setShowSendContract] = useState(false);
  const [showSendCert, setShowSendCert] = useState(false);
  const [showSendHamper, setShowSendHamper] = useState(false);
  const [showSendTerms, setShowSendTerms] = useState(false);

  const pd = asset.payment_details!;
  const question = asset.asset_questions?.find(q => q.unique_asset_id === pd.unique_asset_id);
  const isSuspended = pd.is_suspended;
  const uniqueAssetId = pd.unique_asset_id;
  const assetType = pd.asset_type === "flex" ? "flex" : "full-ownership";

  const deleteMutation = useMutation({
    mutationFn: assetType === "flex" ? deleteUserFlexAsset : deleteUserFullOwnershipAsset,
    onSuccess: () => {
      toast.success("Asset deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["userAssets", userId] });
      setShowDeleteDialog(false);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to delete asset"));
    },
  });

  const suspendMutation = useMutation({
    mutationFn: isSuspended ? unSuspendPaymentPlan : suspendPaymentPlan,
    onSuccess: () => {
      toast.success(isSuspended ? "Asset transactions resumed" : "Asset transactions suspended");
      queryClient.invalidateQueries({ queryKey: ["userAssets", userId] });
      setShowSuspendDialog(false);
    },
    onError: (error: unknown) => {
      toast.error(getErrorMessage(error, "Failed to update suspension status"));
    },
  });

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
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem onClick={() => setShowEditPlan(true)}>
            Edit Payment Plan
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setShowEditQuestion(true)}>
            Edit Asset Question
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setShowSendContract(true)}>
            Send Contract of Sale
          </DropdownMenuItem>

          {email && (
            <>
              <DropdownMenuItem onClick={() => setShowSendCert(true)}>
                Send Completion Certificate
              </DropdownMenuItem>

              {assetType === "full-ownership" && (
                <DropdownMenuItem onClick={() => setShowSendHamper(true)}>
                  Send Hamper
                </DropdownMenuItem>
              )}

              {assetType === "flex" && (
                <DropdownMenuItem onClick={() => setShowSendTerms(true)}>
                  Send Flex Terms & Conditions
                </DropdownMenuItem>
              )}
            </>
          )}

          <DropdownMenuItem onClick={() => setShowSuspendDialog(true)}>
            {isSuspended ? "Resume Transactions" : "Suspend Transactions"}
          </DropdownMenuItem>

          <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600 focus:text-red-600">
            Delete Asset
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modals */}
      <EditUserPaymentPlanModal
        isOpen={showEditPlan}
        onClose={() => setShowEditPlan(false)}
        asset={asset}
        userId={userId}
      />

      <EditUserAssetQuestionModal
        isOpen={showEditQuestion}
        onClose={() => setShowEditQuestion(false)}
        uniqueAssetId={uniqueAssetId}
        currentName={question?.name_of_property || ""}
        currentAddress={question?.address || ""}
        userId={userId}
      />

      <SendContractOfSalesModal
        isOpen={showSendContract}
        onClose={() => setShowSendContract(false)}
        uniqueAssetId={uniqueAssetId}
      />

      {email && (
        <>
          <SendCompletionCertificateModal
            isOpen={showSendCert}
            onClose={() => setShowSendCert(false)}
            uniqueAssetId={uniqueAssetId}
            email={email}
          />
          <SendHamperModal
            isOpen={showSendHamper}
            onClose={() => setShowSendHamper(false)}
            uniqueAssetId={uniqueAssetId}
            email={email}
          />
          <SendFlexTermsAndConditionModal
            isOpen={showSendTerms}
            onClose={() => setShowSendTerms(false)}
            uniqueAssetId={uniqueAssetId}
            email={email}
          />
        </>
      )}

      {/* Delete Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this asset?</AlertDialogTitle>
            <AlertDialogDescription>
              Deleting this user asset will remove the asset transaction history from our database. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={deleteMutation.isPending}
              onClick={(e) => {
                e.preventDefault();
                deleteMutation.mutate({ userId, assetId: asset._id, unique_asset_id: uniqueAssetId });
              }}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Suspend/Unsuspend Dialog */}
      <AlertDialog open={showSuspendDialog} onOpenChange={setShowSuspendDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isSuspended ? "Resume Transactions?" : "Suspend Transactions?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isSuspended
                ? "Resuming transactions will re-enable all financial activities linked to this asset."
                : "Suspending transactions will disable all financial activities associated with this asset."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button
              onClick={(e) => {
                e.preventDefault();
                suspendMutation.mutate({ uniqueAssetId });
              }}
              disabled={suspendMutation.isPending}
            >
              {suspendMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isSuspended ? "Resume" : "Suspend"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
