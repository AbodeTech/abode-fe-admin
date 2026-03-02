import { useMutation, useQueryClient } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";
import { uploadToCloudinary } from "@/lib/utils/upload";
import { upgradeKeys } from "./query-keys";

const MANUAL_UPGRADE_TO_ASSOCIATE_PRO_MUTATION = graphql(`
  mutation ManualUpgradeToAssociatePro(
    $email: String!
    $amount: Float!
    $payCommission: Boolean!
    $paymentUrl: String!
    $commissionableAmount: Float
  ) {
    manualUpgradeToAssociatePro(
      email: $email
      amount: $amount
      payCommission: $payCommission
      paymentUrl: $paymentUrl
      commissionableAmount: $commissionableAmount
    ) {
      success
      message
    }
  }
`);

interface CreateUpgradeTransactionInput {
  email: string;
  amount: string;
  payCommission: boolean;
  commissionAmount?: string;
  evidence: File;
}

export const useCreateUpgradeTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateUpgradeTransactionInput) => {
      const upload = await uploadToCloudinary(input.evidence, "receipts");
      const paymentUrl = upload?.secure_url;

      if (!paymentUrl) {
        throw new Error("Failed to upload payment evidence");
      }

      const amount = Number(input.amount);
      if (!Number.isFinite(amount) || amount <= 0) {
        throw new Error("Enter a valid amount");
      }

      const commissionableAmount = input.payCommission
        ? Number(input.commissionAmount ?? "0")
        : null;

      if (input.payCommission && (!Number.isFinite(commissionableAmount) || commissionableAmount <= 0)) {
        throw new Error("Enter a valid commission amount");
      }

      return execute(MANUAL_UPGRADE_TO_ASSOCIATE_PRO_MUTATION, {
        email: input.email,
        amount,
        payCommission: input.payCommission,
        paymentUrl,
        commissionableAmount,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: upgradeKeys.all });
    },
  });
};

