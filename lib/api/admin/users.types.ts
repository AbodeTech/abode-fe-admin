export type User = {
  _id: string;
  email: string;
  firstName: string;
  is_suspended: boolean;
  referral_status: string;
  lastName: string;
  howYouHearAboutUs?: string;
  gender?: string;
  country?: string;
  createdAt: string;
  subscriptions?: number;
  Networth?: number;
  virtual_networth?: number;
  virtual_subscriptions?: number;
  referrer?: string;
};

export type GetAllUsersResponse = {
  getAllUsers: {
    count: number;
    data: User[];
  };
};

export type UserDetail = {
  Networth: number;
  virtual_networth: number;
  virtual_subscriptions: number;
  _id: string;
  address: string;
  amount_paid: number;
  amount_payable: number;
  balance_payable: number;
  referral_status: string;
  country: string;
  date_of_birth: string;
  email: string;
  last_login: string;
  default_status: string;
  employment_status: string;
  firstName: string;
  gender: string;
  lastName: string;
  marital_status: string;
  occupation: string;
  phoneNumber: string;
  is_suspended: boolean;
  profile_pic: string;
  referral: {
    lastName: string;
    firstName: string;
    email: string;
  } | null;
  kyc: {
    tin: string;
  } | null;
  subscriptions: number;
  transaction: UserTransaction[];
  wallet: {
    balance: number;
  };
  units_purchased: number;
  userName: string;
  next_date_of_payment: string;
};

export type UserTransaction = {
  _id: string;
  time_of_transaction: string;
  amount: number;
  type: string;
  status: string;
  description: string;
  transaction_type: string;
  paystack_reference: string;
  transfer_reference: string;
  transfer_file: {
    file: string;
  } | null;
};

export type GetUserDetailsResponse = {
  getUserDetailsByAdmin: UserDetail;
};

export type SystemUsersOverviewResponse = {
  getSystemUsersOverview: {
    metrics: {
      totalUsers: number;
      referralStatusCounts: {
        user: number;
        associate: number;
        associatePro: number;
      };
      noReferralUsers: number;
      users_with_assets: number;
      flexSubscribers: number;
      fullOwnershipSubscribers: number;
      defaultUsers: number;
      overdueUsers: number;
      active_associate: number;
      active_associate_pro: number;
    };
  };
};
