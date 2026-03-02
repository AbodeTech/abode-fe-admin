import { useMutation, useQueryClient } from "@tanstack/react-query";
import { graphql } from "@/lib/gql";
import { execute, executeRaw } from "@/lib/graphql-client";
import { toast } from "sonner";
import { requestKeys } from "./query-keys";

const UPDATE_REQUEST_STATUS_MUTATION = graphql(`
  mutation UpdateRequestStatus($updateRequestInput: UpdateRequestInput!) {
    updateRequestStatus(updateRequestInput: $updateRequestInput) {
      success
      message
    }
  }
`);

const SYSTEM_APPROVE_LOCATION_CHANGE_MUTATION = graphql(`
  mutation SystemApproveLocationChangeRequest($requestId: ID!) {
    systemApproveLocationChangeRequest(requestId: $requestId) {
      success
      message
    }
  }
`);

const SYSTEM_APPROVE_DOCUMENT_CHANGE_MUTATION = graphql(`
  mutation SystemApproveDocumentChangeRequest($requestId: ID!) {
    systemApproveDocumentChangeRequest(requestId: $requestId) {
      success
      message
    }
  }
`);

const SYSTEM_APPROVE_ASSET_UPDATE_MUTATION_RAW = `
  mutation SystemApproveAssetUpdateRequest($requestId: ID!) {
    systemApproveAssetUpdateRequest(requestId: $requestId) {
      success
      message
    }
  }
`;

export function useActionRequests() {
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: async (vars: {
      requestId: string;
      status: string;
      adminMessage?: string;
      declineReason?: string;
      estimatedCompletionHours?: number;
    }) => {
      return execute(UPDATE_REQUEST_STATUS_MUTATION, {
        updateRequestInput: {
          requestId: vars.requestId,
          status: vars.status,
          adminMessage: vars.adminMessage,
          declineReason: vars.declineReason,
          estimatedCompletionHours: vars.estimatedCompletionHours != null
            ? Math.round(vars.estimatedCompletionHours)
            : undefined,
        },
      });
    },
    onSuccess: (data) => {
      const res = data.updateRequestStatus;
      if (res?.success) {
        toast.success(res.message || "Status updated successfully.");
        queryClient.invalidateQueries({ queryKey: requestKeys.all });
      } else {
        toast.error(res?.message || "Failed to update status.");
      }
    },
    onError: (error) => {
      toast.error(error.message || "An unexpected error occurred.");
    },
  });

  const approveLocationChangeMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return execute(SYSTEM_APPROVE_LOCATION_CHANGE_MUTATION, { requestId });
    },
    onSuccess: (data) => {
      const res = data.systemApproveLocationChangeRequest;
      if (res?.success) {
        toast.success(res.message || "Status updated successfully.");
        queryClient.invalidateQueries({ queryKey: requestKeys.all });
      } else {
        toast.error(res?.message || "Failed to update status.");
      }
    },
    onError: (error) => {
      toast.error(error.message || "An unexpected error occurred.");
    },
  });

  const approveDocumentChangeMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return execute(SYSTEM_APPROVE_DOCUMENT_CHANGE_MUTATION, { requestId });
    },
    onSuccess: (data) => {
      const res = data.systemApproveDocumentChangeRequest;
      if (res?.success) {
        toast.success(res.message || "Status updated successfully.");
        queryClient.invalidateQueries({ queryKey: requestKeys.all });
      } else {
        toast.error(res?.message || "Failed to update status.");
      }
    },
    onError: (error) => {
      toast.error(error.message || "An unexpected error occurred.");
    },
  });

  const approveAssetUpdateMutation = useMutation({
    mutationFn: async (requestId: string) => {
      return executeRaw<{
        systemApproveAssetUpdateRequest?: {
          success?: boolean;
          message?: string;
        };
      }>(SYSTEM_APPROVE_ASSET_UPDATE_MUTATION_RAW, { requestId });
    },
    onSuccess: (data) => {
      const res = data.systemApproveAssetUpdateRequest;
      if (res?.success) {
        toast.success(res.message || "Status updated successfully.");
        queryClient.invalidateQueries({ queryKey: requestKeys.all });
      } else {
        toast.error(res?.message || "Failed to update status.");
      }
    },
    onError: (error) => {
      toast.error(error.message || "An unexpected error occurred.");
    },
  });

  return {
    updateStatus: updateStatusMutation,
    approveLocationChange: approveLocationChangeMutation,
    approveDocumentChange: approveDocumentChangeMutation,
    approveAssetUpdate: approveAssetUpdateMutation,
  };
}
