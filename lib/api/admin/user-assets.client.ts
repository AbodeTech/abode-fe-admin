import { fetchGraphql } from "@/lib/graphql-client";
import {
  AddFlexAssetInput,
  AddFullOwnershipAssetInput,
  AddUserAssetResponse,
  CreateUsersFullOwnershipAssetResponse,
  DeleteUserAssetInput,
  DeleteUserFlexAssetResponse,
  DeleteUserFullOwnershipAssetResponse,
  SuspendPaymentPlanResponse,
  SuspendUserAssetInput,
  UnSuspendPaymentPlanResponse,
  SendContractResponse,
  SendCertificateResponse,
  SendHamperResponse,
  SendFlexTermsResponse,
  EditUserAssetQuestionInput,
  EditUserAssetQuestionResponse,
  EditUserPaymentPlanInput,
  EditUserPaymentPlanResponse,
  ViewAllAssetsResponse,
  ViewUserAssetsResponse,
} from "./user-assets.types";

export const getAllWebsiteAssets = async () => {
  const query = `
    query Data {
      viewAllWebsiteAssets {
        data {
          asset_name
          asset_type
          new_asset
          _id
        }
      }
    }
  `;
  const response = await fetchGraphql<ViewAllAssetsResponse>(query);
  return response.viewAllWebsiteAssets.data;
};

export const getUserAssetsByAdmin = async (id: string) => {
  const query = `
    query ViewUserAssetByAdmin($viewUserAssetByAdminId: ID!) {
      viewUserAssetByAdmin(id: $viewUserAssetByAdminId) {
        _id
        asset_name
        asset_size
        asset_type
        asset_unit
        payment_details {
          amount_paid
          balance
          month_subscription
          month_remaining
          default_amount
          next_date_of_payment
          asset_price
          months_covered
          is_suspended
          unique_asset_id
          size
          start_date
          amount_payable
          fullownerhsip_landprice
          fullownerhsip_documentprice
          asset_type
          no_of_units
        }
        document_plan {
          amount_paid
          balance
          asset_price
        }
        asset_questions {
          name_of_property
          address
          unique_asset_id
        }
      }
    }
  `;
  const response = await fetchGraphql<ViewUserAssetsResponse>(query, {
    viewUserAssetByAdminId: id,
  });
  return response.viewUserAssetByAdmin;
};

export const addUserFlexAssetByAdmin = async (payload: AddFlexAssetInput) => {
  const query = `
    mutation AddUserAssetByAdmin($assetUpdateInput: AssetUpdateInput!) {
      addUserAssetByAdmin(assetUpdateInput: $assetUpdateInput)
    }
  `;
  const response = await fetchGraphql<AddUserAssetResponse>(query, {
    assetUpdateInput: payload,
  });
  return response.addUserAssetByAdmin;
};

export const addUserFullOwnershipAssetByAdmin = async (payload: AddFullOwnershipAssetInput) => {
  const query = `
    mutation CreateUsersFullOwnershipAsset($createUsersFullOwnershipAssetInput: CreateUsersFullOwnershipAssetInput!) {
      createUsersFullOwnershipAsset(createUsersFullOwnershipAssetInput: $createUsersFullOwnershipAssetInput)
    }
  `;
  const response = await fetchGraphql<CreateUsersFullOwnershipAssetResponse>(query, {
    createUsersFullOwnershipAssetInput: payload,
  });
  return response.createUsersFullOwnershipAsset;
};

export const deleteUserFlexAsset = async (payload: DeleteUserAssetInput) => {
  const query = `
    mutation DeleteUserFlexAsset($deleteUserFlexAssetInput: DeleteUserFullOwnershipAssetInput!) {
      deleteUserFlexAsset(deleteUserFlexAssetInput: $deleteUserFlexAssetInput)
    }
  `;
  const response = await fetchGraphql<DeleteUserFlexAssetResponse>(query, {
    deleteUserFlexAssetInput: payload,
  });
  return response.deleteUserFlexAsset;
};

export const deleteUserFullOwnershipAsset = async (payload: DeleteUserAssetInput) => {
  const query = `
    mutation DeleteUserFullOwnershipAsset($deleteFullOwnershipAssetInput: DeleteUserFullOwnershipAssetInput!) {
      deleteUserFullOwnershipAsset(deleteFullOwnershipAssetInput: $deleteFullOwnershipAssetInput)
    }
  `;
  const response = await fetchGraphql<DeleteUserFullOwnershipAssetResponse>(query, {
    deleteFullOwnershipAssetInput: payload,
  });
  return response.deleteUserFullOwnershipAsset;
};

export const suspendPaymentPlan = async (payload: SuspendUserAssetInput) => {
  const query = `
    mutation SuspendPaymentPlan($suspendPaymentPlanId: String!) {
      suspendPaymentPlan(id: $suspendPaymentPlanId)
    }
  `;
  const response = await fetchGraphql<SuspendPaymentPlanResponse>(query, {
    suspendPaymentPlanId: payload.uniqueAssetId,
  });
  return response.suspendPaymentPlan;
};

export const unSuspendPaymentPlan = async (payload: SuspendUserAssetInput) => {
  const query = `
    mutation UnSuspendPaymentPlan($unSuspendPaymentPlanId: String!) {
      unSuspendPaymentPlan(id: $unSuspendPaymentPlanId)
    }
  `;
  const response = await fetchGraphql<UnSuspendPaymentPlanResponse>(query, {
    unSuspendPaymentPlanId: payload.uniqueAssetId,
  });
  return response.unSuspendPaymentPlan;
};

export const sendUserContractOfSale = async (uniqueAssetId: string) => {
  const query = `
    mutation SendContractsByAdmin($uniqueAssetId: String!) {
      sendContractsByAdmin(unique_asset_id: $uniqueAssetId)
    }
  `;
  const response = await fetchGraphql<SendContractResponse>(query, {
    uniqueAssetId,
  });
  return response.sendContractsByAdmin;
};

export const sendCertificateByEmail = async (email: string, uniqueAssetId: string) => {
  const query = `
    mutation SendCertificateByEmail($email: String!, $uniqueAssetId: String!) {
      sendCertificateByEmail(email: $email, uniqueAssetId: $uniqueAssetId)
    }
  `;
  const response = await fetchGraphql<SendCertificateResponse>(query, {
    email,
    uniqueAssetId,
  });
  return response.sendCertificateByEmail;
};

export const sendHamperNotificationEmail = async (email: string, uniqueAssetId: string) => {
  const query = `
    mutation SendHamperNotificationEmail($email: String!, $uniqueAssetId: String!) {
      sendHamperNotificationEmail(email: $email, uniqueAssetId: $uniqueAssetId) {
        emailSent
      }
    }
  `;
  const response = await fetchGraphql<SendHamperResponse>(query, {
    email,
    uniqueAssetId,
  });
  return response.sendHamperNotificationEmail;
};

export const sendFlexTermsAndConditionEmail = async (email: string, uniqueAssetId: string) => {
  const query = `
    mutation SendFlexTermsAndConditionEmail($email: String!, $uniqueAssetId: String!) {
      sendFlexTermsAndConditionEmail(email: $email, uniqueAssetId: $uniqueAssetId) {
        success
      }
    }
  `;
  const response = await fetchGraphql<SendFlexTermsResponse>(query, {
    email,
    uniqueAssetId,
  });
  return response.sendFlexTermsAndConditionEmail;
};

export const editUserAssetQuestion = async (payload: EditUserAssetQuestionInput) => {
  const query = `
    mutation EditUserAssetQuestion($unique_asset_id: String!, $address: String!, $name_of_property: String) {
      editUserAssetQuestion(unique_asset_id: $unique_asset_id, address: $address, name_of_property: $name_of_property)
    }
  `;
  const response = await fetchGraphql<EditUserAssetQuestionResponse>(query, {
    unique_asset_id: payload.unique_asset_id,
    address: payload.address,
    name_of_property: payload.name_of_property,
  });
  return response.editUserAssetQuestion;
};

export const editUserPaymentPlanByAdmin = async (payload: EditUserPaymentPlanInput) => {
  const query = `
   mutation EditUserPaymentPlanByAdmin($assets: EditUserPaymentPlanByAdminInput!) {
      editUserPaymentPlanByAdmin(assets: $assets)
    }
  `;
  const response = await fetchGraphql<EditUserPaymentPlanResponse>(query, {
    assets: payload,
  });
  return response.editUserPaymentPlanByAdmin;
};
