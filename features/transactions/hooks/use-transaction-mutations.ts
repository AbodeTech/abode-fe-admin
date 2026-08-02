import { useMutation, useQueryClient } from '@tanstack/react-query';
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';
import { transactionKeys } from './query-keys';
import type { ProcessCommissionInput, DeclineTransactionInput } from '@/lib/gql/graphql';

// --- Mutation Queries ---

const APPROVE_TRANSACTION_MUTATION = graphql(`
  mutation ApproveTransaction($approveTransactionId: ID!) {
    approveTransaction(id: $approveTransactionId)
  }
`);

const DECLINE_TRANSACTION_MUTATION = graphql(`
  mutation DeclineTransaction($declineTransactionInput: DeclineTransactionInput!) {
    declineTransaction(declineTransactionInput: $declineTransactionInput)
  }
`);

const APPROVE_ASSET_TRANSACTION_MUTATION = graphql(`
  mutation ApproveAssetTransaction($approveAssetTransactionId: ID!) {
    approveAssetTransaction(id: $approveAssetTransactionId)
  }
`);

const DECLINE_DOCUMENT_MUTATION = graphql(`
  mutation DeclineDocumentTransaction($declineTransactionInput: DeclineTransactionInput!) {
    declineDocumentTransaction(declineTransactionInput: $declineTransactionInput)
  }
`);

const PROCESS_COMMISSION_MUTATION = graphql(`
  mutation ProcessCommission($processCommissionInput: ProcessCommissionInput!) {
    processCommission(processCommissionInput: $processCommissionInput)
  }
`);

const PROCESS_RECEIPT_MUTATION = graphql(`
  mutation ProcessReceipt($processReceiptInput: ProcessReceiptInput!) {
    processReceipt(processReceiptInput: $processReceiptInput)
  }
`);

const DECLINE_ASSET_TRANSACTION_MUTATION = graphql(`
  mutation DeclineAssetTransaction($declineTransactionInput: DeclineTransactionInput!) {
  declineAssetTransaction(declineTransactionInput: $declineTransactionInput)
}
`);

// --- Topup Transaction Mutations ---

export const useApproveTopupTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      execute(APPROVE_TRANSACTION_MUTATION, { approveTransactionId: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.topup() });
    },
  });
};

export const useDeclineTopupTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ transactionId, message }: DeclineTransactionInput) =>
      execute(DECLINE_TRANSACTION_MUTATION, { declineTransactionInput: { transactionId, message } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.topup() });
    },
  });
};

// --- Withdrawal Transaction Mutations ---

// --- Document Transaction Mutations ---

export const useApproveDocumentTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      execute(APPROVE_ASSET_TRANSACTION_MUTATION, { approveAssetTransactionId: id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.document() });
    },
  });
};

export const useDeclineDocumentTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ transactionId, message }: DeclineTransactionInput) =>
      execute(DECLINE_DOCUMENT_MUTATION, { declineTransactionInput: { transactionId, message } }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.document() });
    },
  });
};

// --- Commission Transaction Mutations ---

export const useProcessCommission = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ProcessCommissionInput) =>
      execute(PROCESS_COMMISSION_MUTATION, { processCommissionInput: input }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: transactionKeys.commission() });
    },
  });
};

// --- Receipt Mutation ---

export const useSendReceipt = () => {
  return useMutation({
    mutationFn: (transactionId: string) =>
      execute(PROCESS_RECEIPT_MUTATION, { processReceiptInput: { transactionId } }),
  });
};

// --- Asset Transaction Mutations ---

