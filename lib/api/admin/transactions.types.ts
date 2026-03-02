// Topup Transaction Types
export type TopupTransaction = {
  _id: string;
  amount: number;
  status: string;
  admin_status: string;
  time_of_transaction: string;
  transaction_type: string;
  transfer_file: {
    file: string;
  } | null;
  user: {
    firstName: string;
    lastName: string;
    _id: string;
  };
};

export type GetTopupTransactionData = {
  getTopupTransaction: {
    data: TopupTransaction[];
    count: number;
  };
};

// Withdrawal Transaction Types
export type WithdrawalTransaction = {
  _id: string;
  admin_status: string;
  amount: number;
  time_of_transaction: string;
  processing_type?: string | null;
  bank_details: {
    accountNumber: string;
    bankName: string;
    name: string;
  } | null;
  user: {
    firstName: string;
    lastName: string;
    _id: string;
    tin: string;
  };
  tin: string;
};

export type GetWithdrawalTransactionData = {
  getWithdrawalTransaction: {
    data: WithdrawalTransaction[];
    count: number;
  };
};

// Transaction Data Points (Stats)
export type TransactionDataPoints = {
  pending_transaction: number;
  approved_transaction: number;
  rejected_transaction: number;
  commission_transaction: number;
  users_wallet_balance: number;
  auto_approved_transaction?: number;
  auto_failed_transaction?: number;
};

// Document Transaction Types (similar to asset transactions)
export type DocumentTransaction = {
  _id: string;
  amount: number;
  description: string;
  admin_status: string;
  plot_size: string;
  asset_type: string;
  referral: string;
  transaction_type: string;
  transfer_file: {
    file: string;
  } | null;
  user: {
    firstName: string;
    lastName: string;
    _id: string;
  };
  type: string;
  time_of_transaction: string;
};

export type GetDocumentTransactionData = {
  getDocumentTransaction: {
    data: DocumentTransaction[];
    count: number;
  };
};

// Commission Transaction Types
export type CommissionTransaction = {
  _id: string;
  tin: string;
  admin_status: string;
  amount: number;
  asset_type: string;
  description: string;
  user: {
    _id: string;
    firstName: string;
    lastName: string;
    referrer: string;
    referral_status: string;
    email: string;
  };
  plot_size: string;
  status: string;
  referral: string;
  transaction_type: string;
  time_of_transaction: string;
  type: string;
};

export type GetCommissionTransactionData = {
  getCommissionTransactions: {
    data: CommissionTransaction[];
    count: number;
  };
};
// Process Commission & Receipt Types
export interface ProcessCommissionInput {
  userId: string
  transactionId: string
  commissionTypes: ("direct" | "topline" | "upline")[]
}

// User Transaction Type
export interface TransactionListResponse {
  _id: string;
  time_of_transaction: string;
  amount: number;
  type: string;
  status: string;
  description: string;
  transaction_type: string;
  paystack_reference?: string;
  transfer_reference?: string;
  transfer_file?: {
    file: string;
  } | null;
  // Optional fields for flexibility or deprecated usage
  user?: {
    firstName: string;
    lastName: string;
    _id: string;
  };
}

export interface ProcessReceiptInput {
  transactionId: string
}
