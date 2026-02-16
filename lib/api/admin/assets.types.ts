export type AssetInventoryData = {
  getAssetInventoryData: {
    statistics: {
      totalAssets: number;
      totalWorth: number;
      totalFlexAssets: number;
      totalFlexWorth: number;
      totalFullOwnershipAssets: number;
      totalFullOwnershipWorth: number;
    };
  };
};

export type AdminAsset = {
  _id: string;
  asset_name: string;
  asset_location: string;
  asset_type: string;
  sold: string;
  asset_pictures: string[];
  asset_option: Array<{
    size: number;
    unit: number;
    price: number;
    one_month: number;
    zero_months: number;
    flex_payment_plans?: Array<{
      price: number;
      unit: number;
    }>;
  }>;
};

export type AdminAssetsData = {
  getAllAdminAssets: {
    count: number;
    data: AdminAsset[];
  };
};

export type FlexPaymentPlanInput = {
  description: string;
  duration_months: number;
  initial_payment: number;
  monthly_installment: number;
  price: number;
  unit: number;
};

export type FlexAssetOptionInput = {
  size: number;
  flex_payment_plans: FlexPaymentPlanInput[];
};

export type CreateFlexAssetInput = {
  asset_name: string;
  asset_pictures: string[];
  asset_location: string;
  title: string;
  asset_type: string;
  description: string;
  allocation_qualification: number;
  amenities: string[];
  asset_history: Record<string, any>;
  deed_of_assignment: string;
  survey: string;
  contract_of_sales: string;
  estate_layout: string;
  asset_option: FlexAssetOptionInput[];
  new_asset: boolean;
};

export type FullOwnershipAssetOptionInput = {
  size: number;
  unit: number;
  price: number;
  zero_months?: number;
  three_months?: number;
  six_months?: number;
  twelve_months?: number;
  five_months?: number;
  seven_months?: number;
  one_month?: number;
  development_fee?: number;
  initial_payment?: number;
  monthly_installment?: number; // fallback or specific field
  five_months_initial_payment?: number;
  seven_months_initial_payment?: number;
  one_month_initial_payment?: number;
};

export type CreateFullOwnershipAssetInput = {
  asset_name: string;
  asset_pictures: string[];
  asset_location: string;
  title: string;
  asset_type: string;
  description: string;
  allocation_qualification: number;
  amenities: string[];
  asset_history: Record<string, any>;
  deed_of_assignment: string;
  survey: string;
  contract_of_sales: string;
  estate_layout: string;
  asset_option: FullOwnershipAssetOptionInput[];
  new_asset: boolean;
};

export type AssetByNameData = {
  viewAssetByName: {
    sizes?: string[];
    available_unit: number;
    total_value: number;
    unit_sold: number;
    expected_return: number;
  };
};

export type AssetOptionDataByNameData = {
  viewAssetOptionDataByName: {
    sizes: Array<{
      size: number;
      available_unit: number;
      value: number;
      unit_sold: number;
      expected_return: number;
    }>;
  };
};

export type Subscriber = {
  _id?: string | null;
  name?: string | null;
  email?: string | null;
  phone_number?: string | null;
  salesPerson?: string | null;
  assetName?: string | null;
  sizeBought?: number | null;
  unitPurchased?: number | null;
  landPrice?: number | null;
  landAmountPaid?: number | null;
  documentPrice?: number | null;
  documentAmountPaid?: number | null;
  month_subscription?: number | null;
  startDate?: string | null;
  nextPaymentDate?: string | null;
  isDefaulted?: boolean | null;
  isSuspended?: boolean | null;
};

export type AssetSubscribersData = {
  viewSubscribedCustomersOnAsset: {
    totalSubscribers: number;
    userDetails: Subscriber[];
    unitSold: number;
    earningReceived: number;
    expectedEarning: number;
    defaultedUsers: number;
    suspendedUsers: number;
    completedPayments: number;
    totalPlotsSold: number;
  };
};

// --- Asset Transactions Types ---

export type AssetTransaction = {
  _id: string;
  amount: string;
  description: string;
  admin_status: string; // 'pending' | 'approved' | 'declined'
  status: string;
  plot_size: string;
  asset_type: string;
  referral: string;
  transaction_type: string;
  type: string;
  time_of_transaction: string;
  transfer_file?: {
    file: string;
    bank_name?: string;
    amount?: string;
  } | null;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phoneNumber?: string;
  };
};

export type GetAssetTransactionData = {
  getAssetTransaction: {
    data: AssetTransaction[];
    count: number;
  };
};

export type GetAssetTransactionVariables = {
  page: number;
  limit: number;
  assetType?: string | null;
  transactionType?: string | null;
  status?: string | null;
  salesType?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  search?: string | null;
};

// --- Edit Asset Types ---

export type UpdateFlexAssetInput = {
  id: string; // ID is required for update
  asset_name: string;
  asset_pictures?: string[]; // Optional in update usually, but sending complete list is safer
  asset_location?: string;
  title?: string;
  asset_type?: string;
  description?: string;
  allocation_qualification?: number;
  amenities?: string[];
  asset_history?: Record<string, any>;
  deed_of_assignment?: string;
  survey?: string;
  contract_of_sales?: string;
  estate_layout?: string;
  asset_option?: FlexAssetOptionInput[];
  // Include other fields if they are editable 
};

export type ViewAssetData = {
  viewAsset: {
    _id: string;
    asset_name: string;
    asset_location: string;
    asset_type: string;
    description: string;
    title: string;
    allocation_qualification?: number; // basic_details.allocation_qualification in legacy?
    asset_pictures: string[];
    amenities: string[];
    asset_history?: Record<string, number>; // Legacy map: "2021": 5000000
    documents?: {
      deed_of_assignment?: string;
      survey?: string;
      contract_of_sales?: string;
      estate_layout?: string;
    };
    asset_option?: Array<{
      size: number;
      unit: number;
      price: number;
      flex_payment_plans: Array<{
        description: string;
        duration_months: number;
        initial_payment: number;
        monthly_installment: number;
        price: number;
        unit: number; // Cast to number if string in legacy
      }>;
    }>;
  };
};
