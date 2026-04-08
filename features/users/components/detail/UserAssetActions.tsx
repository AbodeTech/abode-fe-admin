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
import { useAuthStore } from "@/store/auth-store";
import { useRouter, useSearchParams } from "next/navigation";

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
  const currentUser = useAuthStore((state) => state.user);
  const permissions = currentUser?.permissions ?? [];
  const canEditPaymentPlan = permissions.includes("update-payment-plan");
  const canEditAssetQuestion = permissions.includes("update-asset-question");
  const canDeleteAsset = permissions.includes("delete-user-asset");
  const canSendContract = permissions.includes("send-contract");
  const searchParams = useSearchParams();
  const router = useRouter();

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showSuspendDialog, setShowSuspendDialog] = useState(false);

  // Modal states
  const [showSendContract, setShowSendContract] = useState(false);
  const [showSendCert, setShowSendCert] = useState(false);
  const [showSendHamper, setShowSendHamper] = useState(false);
  const [showSendTerms, setShowSendTerms] = useState(false);

  const pd = asset.payment_details!;
  const question = asset.asset_questions?.find(q => q.unique_asset_id === pd.unique_asset_id);
  const isSuspended = pd.is_suspended;
  const uniqueAssetId = pd.unique_asset_id;
  const assetType = pd.asset_type === "flex" ? "flex" : "full-ownership";

  const setModalParam = (value: string | null, withAssetId = false) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (value) {
      params.set("modal", value);
      if (withAssetId) {
        params.set("uniqueAssetId", uniqueAssetId);
      }
    } else {
      params.delete("modal");
      params.delete("uniqueAssetId");
    }
    const next = params.toString();
    router.push(next ? `?${next}` : "?");
  };

  // Keep parity with legacy behavior: modal query alone can open, and
  // uniqueAssetId (if provided) should only scope to the matching asset row.
  const modal = searchParams?.get("modal");
  const paramAssetId = searchParams?.get("uniqueAssetId");
  const isMatchingAsset = !paramAssetId || paramAssetId === uniqueAssetId;
  const showEditPlan = canEditPaymentPlan && modal === "updatepaymentplan" && isMatchingAsset;
  const showEditQuestion = canEditAssetQuestion && modal === "edituserassetquestion" && isMatchingAsset;

  const deleteMutation = useMutation({
    mutationFn: assetType === "flex" ? deleteUserFlexAsset : deleteUserFullOwnershipAsset,
  });

  const suspendMutation = useMutation({
    mutationFn: isSuspended ? unSuspendPaymentPlan : suspendPaymentPlan,
  });

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ userId, assetId: asset._id, unique_asset_id: uniqueAssetId });
      toast.success("Asset deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["userAssets", userId] });
      setShowDeleteDialog(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to delete asset"));
    }
  };

  const handleSuspend = async () => {
    try {
      await suspendMutation.mutateAsync({ uniqueAssetId });
      toast.success(isSuspended ? "Asset transactions resumed" : "Asset transactions suspended");
      queryClient.invalidateQueries({ queryKey: ["userAssets", userId] });
      setShowSuspendDialog(false);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to update suspension status"));
    }
  };

  if (!canEditPaymentPlan && !canEditAssetQuestion && !canDeleteAsset && !canSendContract) {
    return null;
  }

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

        {canEditPaymentPlan && (
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              setModalParam("updatepaymentplan", true);
            }}
          >
            Edit Payment Plan
          </DropdownMenuItem>
        )}

        {canEditAssetQuestion && (
          <DropdownMenuItem
            onSelect={(event) => {
              event.preventDefault();
              setModalParam("edituserassetquestion", true);
            }}
          >
            Edit Asset Question
          </DropdownMenuItem>
        )}

        {canSendContract && (
          <DropdownMenuItem onClick={() => setShowSendContract(true)}>
            Send Contract of Sale
          </DropdownMenuItem>
        )}

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

          {canDeleteAsset && (
            <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-red-600 focus:text-red-600">
              Delete Asset
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modals */}
      {canEditPaymentPlan && (
        <EditUserPaymentPlanModal
          isOpen={showEditPlan}
          onClose={() => {
            setModalParam(null);
          }}
          asset={asset}
          userId={userId}
        />
      )}

      {canEditAssetQuestion && (
        <EditUserAssetQuestionModal
          isOpen={showEditQuestion}
          onClose={() => {
            setModalParam(null);
          }}
          uniqueAssetId={uniqueAssetId}
          currentName={question?.name_of_property || ""}
          currentAddress={question?.address || ""}
          userId={userId}
        />
      )}

      {canSendContract && (
        <SendContractOfSalesModal
          isOpen={showSendContract}
          onClose={() => setShowSendContract(false)}
          uniqueAssetId={uniqueAssetId}
        />
      )}

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
                handleDelete();
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
                handleSuspend();
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
