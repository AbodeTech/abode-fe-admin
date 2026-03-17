export interface AddFlexAssetInput {
  user_id: string;
  number_of_units: number;
  asset_id: string;
  size: number;
  amount: string;
  asset_purchase_price: number;
  date_of_payment: Date;
  credit_referral: boolean;
  monthly_installment: number;
  referral_amount: number;
  name_of_property: string;
  address: string;
  // send_contract_of_sales: boolean; // Commented out in legacy, keeping it optional or commented
  send_receipt_email: boolean;
}

export interface AddFullOwnershipAssetInput {
  doc_amount: number;
  number_of_units: number;
  assetId: string;
  amount: number;
  land_price: number;
  start_date: Date;
  months: string;
  development: boolean;
  development_price: number;
  userId: string;
  pay_commision: boolean;
  commission_amount: number;
  size: number;
  name_of_property: string;
  address: string;
  send_contract_agreement: boolean;
  send_receipt_email: boolean;
}

export interface DeleteUserAssetInput {
  userId: string;
  assetId: string;
  unique_asset_id: string;
}

export interface SuspendUserAssetInput {
  uniqueAssetId: string;
}

export interface UserAsset {
  _id: string;
  asset_name: string;
  asset_size: string;
  asset_type: "flex" | "full-ownership" | string;
  asset_unit: string;
  payment_details?: {
    amount_paid: number;
    balance: number;
    month_subscription: number;
    month_remaining: number;
    default_amount: number;
    next_date_of_payment: string;
    asset_price: number;
    months_covered: number;
    is_suspended: boolean;
    unique_asset_id: string;
    size: number;
    start_date: string;
    amount_payable: number;
    fullownerhsip_landprice: number;
    fullownerhsip_documentprice: number;
    asset_type: string;
    no_of_units: number;
  };
  document_plan?: {
    amount_paid: number;
    balance: number;
    asset_price: number;
  };
  asset_questions?: {
    name_of_property: string;
    address: string;
    unique_asset_id: string;
  }[];
}

export interface ViewUserAssetsResponse {
  viewUserAssetByAdmin: UserAsset[];
}

export interface AssetOption {
  _id: string;
  asset_name: string;
  asset_type: "flex" | "full-ownership" | string;
  new_asset: boolean;
  // Add other fields if necessary for dropdown
}

export interface ViewAllAssetsResponse {
  viewAllWebsiteAssets: {
    data: AssetOption[];
  };
}

// Re-using or extending types from users.types.ts for the asset list response
// But defining specific response wrappers here
export interface AddUserAssetResponse {
  addUserAssetByAdmin: boolean; // or string message
}

export interface CreateUsersFullOwnershipAssetResponse {
  createUsersFullOwnershipAsset: boolean;
}

export interface DeleteUserFlexAssetResponse {
  deleteUserFlexAsset: boolean;
}

export interface DeleteUserFullOwnershipAssetResponse {
  deleteUserFullOwnershipAsset: boolean;
}

export interface SuspendPaymentPlanResponse {
  suspendPaymentPlan: string;
}

export interface SuspendPaymentPlanResponse {
  suspendPaymentPlan: string;
}

export interface UnSuspendPaymentPlanResponse {
  unSuspendPaymentPlan: string;
}

export interface SendContractResponse {
  sendContractsByAdmin: boolean;
}

export interface SendCertificateResponse {
  sendCertificateByEmail: boolean;
}

export interface SendHamperResponse {
  sendHamperNotificationEmail: {
    emailSent: boolean;
  };
}

export interface SendFlexTermsResponse {
  sendFlexTermsAndConditionEmail: {
    success: boolean;
  };
}

export interface EditUserAssetQuestionInput {
  unique_asset_id: string;
  name_of_property: string;
  address: string;
}

export interface EditUserAssetQuestionResponse {
  editUserAssetQuestion: boolean;
}

export interface EditUserPaymentPlanInput {
  userId: string;
  uniqueAssetId: string;
  start_date: Date;
  amount_paid: number;
  balance: number;
  asset_price: number;
  amount_payable: number;
  next_date_of_payment: Date;
  no_of_units: number;
  default_amount: number;
  fullownerhsip_landprice?: number | null;
  fullownerhsip_documentprice?: number | null;
  months_covered: number;
  month_remaining: number;
  month_subscription: number;
  document_amount_paid?: number | null;
  document_balance?: number | null;
  size: number;
}

export interface EditUserPaymentPlanResponse {
  updateUserPaymentDetails: boolean;
}
