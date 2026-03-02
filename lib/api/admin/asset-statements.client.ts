import { graphql } from "@/lib/gql/gql";
import { execute } from "@/lib/graphql-client";

const SEND_ASSET_STATEMENTS_TO_ADMIN_MUTATION = graphql(`
  mutation SendAssetStatementsToAdmin($assetId: ID!, $adminEmail: String!) {
    sendAssetStatementsToAdmin(assetId: $assetId, adminEmail: $adminEmail) {
      success
      statementsCount
    }
  }
`);

type SendAssetStatementsResult = {
  success: boolean;
  statementsCount: number;
};

export async function sendAssetStatementsToAdmin(assetId: string, adminEmail: string): Promise<SendAssetStatementsResult> {
  const response = await execute(SEND_ASSET_STATEMENTS_TO_ADMIN_MUTATION, {
    assetId,
    adminEmail,
  });

  return response.sendAssetStatementsToAdmin;
}
