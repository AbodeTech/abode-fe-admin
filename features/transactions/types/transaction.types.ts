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

// Withdrawal Transaction Types
export type WithdrawalTransaction = {
  _id: string;
  admin_status: string;
  amount: number;
  time_of_transaction: string;
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

// Transaction Data Points (Stats)
export type TransactionDataPoints = {
  pending_transaction: number;
  approved_transaction: number;
  rejected_transaction: number;
  commission_transaction: number;
  users_wallet_balance: number;
};

// Document Transaction Types
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

// Input types
export interface ProcessCommissionInput {
  userId: string;
  transactionId: string;
  commissionTypes: ("direct" | "topline" | "upline")[];
}

export interface DeclineTransactionInput {
  transactionId: string;
  message: string;
}

export type TransactionType = "credit" | "debit" | "asset" | "commission" | "document";
