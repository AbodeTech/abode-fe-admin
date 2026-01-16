/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = T | null | undefined;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  Date: { input: any; output: any; }
  JSON: { input: any; output: any; }
};

export type AddReferralUpdateInput = {
  referral_email?: InputMaybe<Scalars['String']['input']>;
  user_id?: InputMaybe<Scalars['String']['input']>;
};

export type Admin = {
  __typename?: 'Admin';
  _id: Scalars['ID']['output'];
  authToken: Scalars['String']['output'];
  email: Scalars['String']['output'];
  message: Scalars['String']['output'];
  password: Scalars['String']['output'];
  permissions: Array<Scalars['String']['output']>;
  role: Scalars['String']['output'];
  userName: Scalars['String']['output'];
};

export type AdminAsset = {
  __typename?: 'AdminAsset';
  _id: Scalars['ID']['output'];
  amenities?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  asset_location?: Maybe<Scalars['String']['output']>;
  asset_name?: Maybe<Scalars['String']['output']>;
  asset_option?: Maybe<Array<Maybe<AssetOption>>>;
  asset_pictures?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  asset_price?: Maybe<Scalars['Float']['output']>;
  asset_size?: Maybe<Scalars['Int']['output']>;
  asset_type?: Maybe<Scalars['String']['output']>;
  asset_unit?: Maybe<Scalars['Int']['output']>;
  basic_details?: Maybe<Array<Maybe<BasicDetails>>>;
  description?: Maybe<Scalars['String']['output']>;
  documents?: Maybe<Documents>;
  full_ownership?: Maybe<Array<Maybe<FullOwnership>>>;
  is_subscribed?: Maybe<Scalars['Boolean']['output']>;
  newAsset?: Maybe<Scalars['Boolean']['output']>;
  sold?: Maybe<Scalars['Boolean']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

export type AdminCreatedUser = {
  __typename?: 'AdminCreatedUser';
  Networth?: Maybe<Scalars['Float']['output']>;
  _id: Scalars['ID']['output'];
  address?: Maybe<Scalars['String']['output']>;
  bvn_verification_status?: Maybe<Scalars['Boolean']['output']>;
  country?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['Date']['output']>;
  date_of_birth?: Maybe<Scalars['Date']['output']>;
  email: Scalars['String']['output'];
  employment_status?: Maybe<Scalars['String']['output']>;
  facial_recognitation_verification_status?: Maybe<Scalars['Boolean']['output']>;
  firstName: Scalars['String']['output'];
  gender?: Maybe<Scalars['String']['output']>;
  howYouHearAboutUs?: Maybe<Scalars['String']['output']>;
  is_processing?: Maybe<Scalars['Boolean']['output']>;
  kyc?: Maybe<Kyc>;
  kyc_verification_status?: Maybe<Scalars['Boolean']['output']>;
  lastName: Scalars['String']['output'];
  last_login?: Maybe<Scalars['Date']['output']>;
  marital_status?: Maybe<Scalars['String']['output']>;
  means_of_id_verification_status?: Maybe<Scalars['Boolean']['output']>;
  nextofKin?: Maybe<NextofKin>;
  occupation?: Maybe<Scalars['String']['output']>;
  payment_plan?: Maybe<PaymentPlan>;
  phoneNumber: Scalars['String']['output'];
  profile_pic?: Maybe<Scalars['String']['output']>;
  referral_link?: Maybe<Scalars['String']['output']>;
  referrals?: Maybe<Array<Maybe<Referral>>>;
  subscriptions?: Maybe<Scalars['Int']['output']>;
  updatedAt?: Maybe<Scalars['Date']['output']>;
  userName: Scalars['String']['output'];
  user_type: Scalars['String']['output'];
  verified: Scalars['Boolean']['output'];
  virtual_networth?: Maybe<Scalars['Float']['output']>;
  virtual_subscriptions?: Maybe<Scalars['Int']['output']>;
  wallet?: Maybe<Wallet>;
};

export type AdminDashboard = {
  __typename?: 'AdminDashboard';
  associate_pro_users?: Maybe<Scalars['Int']['output']>;
  associate_users?: Maybe<Scalars['Int']['output']>;
  default_users?: Maybe<Scalars['Int']['output']>;
  inflow?: Maybe<Scalars['Float']['output']>;
  monthly_recurring_revenue?: Maybe<Scalars['Float']['output']>;
  outflow?: Maybe<Scalars['Float']['output']>;
  sales?: Maybe<Scalars['Int']['output']>;
  suspended_payment_plans?: Maybe<Scalars['Int']['output']>;
  suspended_users?: Maybe<Scalars['Int']['output']>;
  top_associates?: Maybe<Array<Maybe<UserReferralAdmin>>>;
  top_selling_prop?: Maybe<Array<Maybe<AssetDashBoard>>>;
  total_asset?: Maybe<Scalars['Int']['output']>;
  total_payable?: Maybe<Scalars['Float']['output']>;
  total_wallet_balance?: Maybe<Scalars['Float']['output']>;
  users?: Maybe<Scalars['Int']['output']>;
};

export type AdminReferral = {
  __typename?: 'AdminReferral';
  _id: Scalars['ID']['output'];
  commission?: Maybe<Scalars['Float']['output']>;
  createdAt?: Maybe<Scalars['Date']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  phoneNumber?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  userId?: Maybe<Scalars['ID']['output']>;
  userReferralStatus?: Maybe<Scalars['String']['output']>;
};

export type AdminRoleResponse = {
  __typename?: 'AdminRoleResponse';
  data: Array<AdminRoles>;
  success: Scalars['Boolean']['output'];
};

export type AdminRoles = {
  __typename?: 'AdminRoles';
  adminEmail: Scalars['String']['output'];
  adminId: Scalars['ID']['output'];
  adminName: Scalars['String']['output'];
  permissions: Array<Scalars['String']['output']>;
  role: Scalars['String']['output'];
  roleId: Scalars['ID']['output'];
};

export type AdminSignupData = {
  __typename?: 'AdminSignupData';
  generatedPassword: Scalars['String']['output'];
  user: AdminCreatedUser;
};

export type AdminSignupInput = {
  email: Scalars['String']['input'];
  firstName: Scalars['String']['input'];
  howYouHearAboutUs?: InputMaybe<Scalars['String']['input']>;
  lastName: Scalars['String']['input'];
  phoneNumber: Scalars['String']['input'];
  referral?: InputMaybe<Scalars['String']['input']>;
  userName: Scalars['String']['input'];
  user_type: Scalars['String']['input'];
};

export type AdminSignupResponse = {
  __typename?: 'AdminSignupResponse';
  data?: Maybe<AdminSignupData>;
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export enum AdminStatus {
  Approved = 'approved',
  Declined = 'declined',
  Pending = 'pending'
}

export type AdminTransactions = {
  __typename?: 'AdminTransactions';
  _id: Scalars['ID']['output'];
  admin_status?: Maybe<Scalars['String']['output']>;
  amount?: Maybe<Scalars['String']['output']>;
  asset_type?: Maybe<Scalars['String']['output']>;
  bank_details?: Maybe<UserBankDetails>;
  description?: Maybe<Scalars['String']['output']>;
  no_of_units?: Maybe<Scalars['Int']['output']>;
  paystack_reference?: Maybe<Scalars['String']['output']>;
  plot_size?: Maybe<Scalars['String']['output']>;
  referral?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  time_of_transaction?: Maybe<Scalars['Date']['output']>;
  tin?: Maybe<Scalars['String']['output']>;
  transaction_type?: Maybe<Scalars['String']['output']>;
  transfer_file?: Maybe<TransferFile>;
  transfer_reference?: Maybe<Scalars['String']['output']>;
  type?: Maybe<Scalars['String']['output']>;
  user?: Maybe<UserAdmin>;
};

export type AdminWallet = {
  __typename?: 'AdminWallet';
  _id: Scalars['ID']['output'];
  balance?: Maybe<Scalars['String']['output']>;
  currency?: Maybe<Scalars['String']['output']>;
  inflow?: Maybe<Scalars['Int']['output']>;
  isActive?: Maybe<Scalars['Boolean']['output']>;
  outflow?: Maybe<Scalars['Int']['output']>;
};

export type AdminWalletCommissionInput = {
  add_to_balance?: InputMaybe<Scalars['Boolean']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
};

export type AdminWalletInput = {
  id?: InputMaybe<Scalars['String']['input']>;
  new_amount?: InputMaybe<Scalars['String']['input']>;
  reason?: InputMaybe<Scalars['String']['input']>;
};

export type AgenciesResponse = {
  __typename?: 'AgenciesResponse';
  agencies: Array<AgencySummary>;
  count: Scalars['Int']['output'];
  currentPage: Scalars['Int']['output'];
  dashboard: AgencyDashboardData;
  success: Scalars['Boolean']['output'];
  totalPages: Scalars['Int']['output'];
};

export type Agency = {
  __typename?: 'Agency';
  _id: Scalars['ID']['output'];
  active_referrals_count?: Maybe<Scalars['Int']['output']>;
  address?: Maybe<Scalars['String']['output']>;
  agency_code: Scalars['String']['output'];
  agency_name: Scalars['String']['output'];
  available_commission_balance: Scalars['Float']['output'];
  city?: Maybe<Scalars['String']['output']>;
  commission_percentage: Scalars['Float']['output'];
  communication_preference: Scalars['String']['output'];
  country?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Date']['output'];
  created_by?: Maybe<Admin>;
  email: Scalars['String']['output'];
  is_suspended: Scalars['Boolean']['output'];
  last_login?: Maybe<Scalars['Date']['output']>;
  phoneNumber: Scalars['String']['output'];
  profile_pic?: Maybe<Scalars['String']['output']>;
  purchases_on_behalf_count: Scalars['Int']['output'];
  receive_all_communications: Scalars['Boolean']['output'];
  referrals: Array<AgencyReferral>;
  role: Scalars['String']['output'];
  settings?: Maybe<AgencySettings>;
  state?: Maybe<Scalars['String']['output']>;
  status: Scalars['String']['output'];
  sub_realtors: Array<UserAdmin>;
  suspension_reason?: Maybe<Scalars['String']['output']>;
  total_commission_earned: Scalars['Float']['output'];
  total_referrals: Scalars['Int']['output'];
  total_transaction_amount?: Maybe<Scalars['Float']['output']>;
  transactions: Array<AgencyTransaction>;
  updatedAt: Scalars['Date']['output'];
  verified: Scalars['Boolean']['output'];
  wallet?: Maybe<AdminWallet>;
  withdrawn_commission: Scalars['Float']['output'];
};

export type AgencyContact = {
  __typename?: 'AgencyContact';
  email: Scalars['String']['output'];
  phoneNumber: Scalars['String']['output'];
};

export type AgencyCredentials = {
  __typename?: 'AgencyCredentials';
  agency_code: Scalars['String']['output'];
  email: Scalars['String']['output'];
  temporary_password: Scalars['String']['output'];
};

export type AgencyDashboard = {
  __typename?: 'AgencyDashboard';
  outstanding_balance: Scalars['Float']['output'];
  top_performing_agencies: Array<TopPerformingAgency>;
  top_selling_lands: Array<TopSellingLand>;
  total_agencies: Scalars['Int']['output'];
  total_clients_recruited: Scalars['Int']['output'];
  total_land_value_sold: Scalars['Float']['output'];
};

export type AgencyDashboardData = {
  __typename?: 'AgencyDashboardData';
  active_agencies: Scalars['Int']['output'];
  all_agencies_total_sales_volume: Scalars['Float']['output'];
  total_agencies: Scalars['Int']['output'];
  total_commission_paid: Scalars['Float']['output'];
  total_users_under_agencies: Scalars['Int']['output'];
};

export type AgencyDashboardResponse = {
  __typename?: 'AgencyDashboardResponse';
  data: AgencyDashboard;
  success: Scalars['Boolean']['output'];
};

export type AgencyReferral = {
  __typename?: 'AgencyReferral';
  registered_date: Scalars['Date']['output'];
  total_commission_earned: Scalars['Float']['output'];
  total_transactions: Scalars['Int']['output'];
  user: UserAdmin;
};

export type AgencyResponse = {
  __typename?: 'AgencyResponse';
  agency: Agency;
  message?: Maybe<Scalars['String']['output']>;
  statistics?: Maybe<AgencyStatistics>;
  success: Scalars['Boolean']['output'];
};

export type AgencySettings = {
  __typename?: 'AgencySettings';
  auto_approve_referrals?: Maybe<Scalars['Boolean']['output']>;
  notification_email?: Maybe<Scalars['String']['output']>;
  notification_phone?: Maybe<Scalars['String']['output']>;
};

export type AgencyStatistics = {
  __typename?: 'AgencyStatistics';
  active_referrals: Scalars['Int']['output'];
  available_balance: Scalars['Float']['output'];
  purchases_on_behalf: Scalars['Int']['output'];
  sub_realtors_count: Scalars['Int']['output'];
  total_commission_earned: Scalars['Float']['output'];
  total_referrals: Scalars['Int']['output'];
  total_transactions: Scalars['Int']['output'];
  withdrawn_amount: Scalars['Float']['output'];
};

export type AgencySummary = {
  __typename?: 'AgencySummary';
  _id: Scalars['ID']['output'];
  agency_name: Scalars['String']['output'];
  commission_percentage: Scalars['Float']['output'];
  contact: AgencyContact;
  total_amount_paid: Scalars['Float']['output'];
  total_balance: Scalars['Float']['output'];
  total_referrals: Scalars['Int']['output'];
  total_sales_volume: Scalars['Float']['output'];
};

export type AgencyTransaction = {
  __typename?: 'AgencyTransaction';
  amount: Scalars['Float']['output'];
  asset?: Maybe<AdminAsset>;
  commission_earned: Scalars['Float']['output'];
  documentation?: Maybe<Scalars['String']['output']>;
  referral_user?: Maybe<UserAdmin>;
  transaction_date: Scalars['Date']['output'];
  transaction_id?: Maybe<Transactions>;
  transaction_type: Scalars['String']['output'];
};

export type AllocateLandResponse = {
  __typename?: 'AllocateLandResponse';
  assetName: Scalars['String']['output'];
  block: Scalars['String']['output'];
  message: Scalars['String']['output'];
  plot: Scalars['String']['output'];
  previousAllocation?: Maybe<PreviousAllocation>;
  success: Scalars['Boolean']['output'];
  user: UserAllocated;
};

export type Asset = {
  __typename?: 'Asset';
  _id?: Maybe<Scalars['ID']['output']>;
  amenities?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  asset_documents?: Maybe<Scalars['JSON']['output']>;
  asset_history?: Maybe<Scalars['JSON']['output']>;
  asset_location?: Maybe<Scalars['String']['output']>;
  asset_name?: Maybe<Scalars['String']['output']>;
  asset_option?: Maybe<Array<Maybe<AssetOption>>>;
  asset_pictures?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  asset_price?: Maybe<Scalars['Float']['output']>;
  asset_purpose?: Maybe<Scalars['String']['output']>;
  asset_size?: Maybe<Scalars['Int']['output']>;
  asset_type?: Maybe<Scalars['String']['output']>;
  asset_unit?: Maybe<Scalars['Int']['output']>;
  basic_details?: Maybe<Array<Maybe<BasicDetails>>>;
  description?: Maybe<Scalars['String']['output']>;
  document_plan?: Maybe<DocumentPaymentPlan>;
  documents?: Maybe<Documents>;
  gogle_map?: Maybe<Scalars['String']['output']>;
  is_processing?: Maybe<Scalars['Boolean']['output']>;
  is_subscribed?: Maybe<Scalars['Boolean']['output']>;
  landmark?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  newAsset?: Maybe<Scalars['Boolean']['output']>;
  paymentDetails?: Maybe<PaymentDetails>;
  sold?: Maybe<Scalars['Boolean']['output']>;
  subscribed_asset_details: Array<Maybe<SubscribedAssetDetails>>;
  title?: Maybe<Scalars['String']['output']>;
  topography?: Maybe<Scalars['String']['output']>;
};

export type AssetAdminResponse = {
  __typename?: 'AssetAdminResponse';
  count?: Maybe<Scalars['Int']['output']>;
  data: Array<Maybe<Asset>>;
  success?: Maybe<Scalars['Boolean']['output']>;
};

export type AssetBreakdown = {
  __typename?: 'AssetBreakdown';
  assetName?: Maybe<Scalars['String']['output']>;
  percentageOfTotal?: Maybe<Scalars['Float']['output']>;
  totalSqmSold?: Maybe<Scalars['Float']['output']>;
  totalTickets?: Maybe<Scalars['Int']['output']>;
};

export type AssetBreakdownHamper = {
  __typename?: 'AssetBreakdownHamper';
  assetName?: Maybe<Scalars['String']['output']>;
  percentageOfTotal?: Maybe<Scalars['Float']['output']>;
  totalHampers?: Maybe<Scalars['Int']['output']>;
  totalSqmSold?: Maybe<Scalars['Float']['output']>;
};

export type AssetDashBoard = {
  __typename?: 'AssetDashBoard';
  _id: Scalars['ID']['output'];
  amenities?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  amount_broughtin?: Maybe<Scalars['Float']['output']>;
  asset_location?: Maybe<Scalars['String']['output']>;
  asset_name?: Maybe<Scalars['String']['output']>;
  asset_pictures?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  asset_price?: Maybe<Scalars['Float']['output']>;
  asset_size?: Maybe<Scalars['Int']['output']>;
  asset_type?: Maybe<Scalars['String']['output']>;
  asset_unit?: Maybe<Scalars['Int']['output']>;
  basic_details?: Maybe<BasicDetails>;
  description?: Maybe<Scalars['String']['output']>;
  documents?: Maybe<Documents>;
  is_subscribed?: Maybe<Scalars['Boolean']['output']>;
  sold?: Maybe<Scalars['Boolean']['output']>;
  title?: Maybe<Scalars['String']['output']>;
  units_subscribed?: Maybe<Scalars['Int']['output']>;
};

export type AssetDetailByNameResponse = {
  __typename?: 'AssetDetailByNameResponse';
  available_unit?: Maybe<Scalars['Int']['output']>;
  expected_return?: Maybe<Scalars['Float']['output']>;
  sizes?: Maybe<Array<Scalars['Int']['output']>>;
  total_value?: Maybe<Scalars['Float']['output']>;
  unit_sold?: Maybe<Scalars['Int']['output']>;
};

export type AssetDetails = {
  __typename?: 'AssetDetails';
  monthly_installment?: Maybe<Scalars['Float']['output']>;
  total_amount?: Maybe<Scalars['Float']['output']>;
};

export type AssetDetailsInput = {
  __typename?: 'AssetDetailsInput';
  description?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  location?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  picture?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  price?: Maybe<Scalars['Float']['output']>;
  size?: Maybe<Scalars['Int']['output']>;
  type?: Maybe<Scalars['String']['output']>;
};

export type AssetFinancialOverview = {
  __typename?: 'AssetFinancialOverview';
  total_asset_gains?: Maybe<Scalars['Float']['output']>;
  total_asset_owned?: Maybe<Scalars['Float']['output']>;
  total_asset_value?: Maybe<Scalars['Float']['output']>;
};

export type AssetHamperPerformanceResponse = {
  __typename?: 'AssetHamperPerformanceResponse';
  assetBreakdown?: Maybe<Array<Maybe<AssetBreakdownHamper>>>;
  financialMetrics?: Maybe<FinancialMetricsHamper>;
  hamperMetrics?: Maybe<HamperMetrics>;
  promoDetails?: Maybe<PromoDetailsHamper>;
  referrersWithHampers?: Maybe<Array<Maybe<ReferrerWithHampers>>>;
  salesMetrics?: Maybe<SalesMetricsHamper>;
};

export type AssetInventoryDetails = {
  __typename?: 'AssetInventoryDetails';
  availableSizes?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  location?: Maybe<Scalars['String']['output']>;
  maxPrice?: Maybe<Scalars['Float']['output']>;
  minPrice?: Maybe<Scalars['Float']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  totalUnits?: Maybe<Scalars['Int']['output']>;
};

export type AssetInventoryResponse = {
  __typename?: 'AssetInventoryResponse';
  statistics?: Maybe<AssetInventoryStatistics>;
  success?: Maybe<Scalars['Boolean']['output']>;
};

export type AssetInventoryStatistics = {
  __typename?: 'AssetInventoryStatistics';
  assetDetails?: Maybe<Array<Maybe<AssetInventoryDetails>>>;
  totalAssets?: Maybe<Scalars['Int']['output']>;
  totalFlexAssets?: Maybe<Scalars['Int']['output']>;
  totalFlexWorth?: Maybe<Scalars['Float']['output']>;
  totalFullOwnershipAssets?: Maybe<Scalars['Int']['output']>;
  totalFullOwnershipWorth?: Maybe<Scalars['Float']['output']>;
  totalWorth?: Maybe<Scalars['Float']['output']>;
};

export type AssetOption = {
  __typename?: 'AssetOption';
  development_fee?: Maybe<Scalars['Int']['output']>;
  five_months?: Maybe<Scalars['Int']['output']>;
  five_months_initial_payment?: Maybe<Scalars['Int']['output']>;
  flex_payment_plans?: Maybe<Array<Maybe<FlexPaymentPlan>>>;
  initial_payment?: Maybe<Scalars['Int']['output']>;
  monthly_installment?: Maybe<Scalars['Int']['output']>;
  one_month?: Maybe<Scalars['Int']['output']>;
  one_month_initial_payment?: Maybe<Scalars['Int']['output']>;
  price?: Maybe<Scalars['Int']['output']>;
  seven_months?: Maybe<Scalars['Int']['output']>;
  seven_months_initial_payment?: Maybe<Scalars['Int']['output']>;
  six_months?: Maybe<Scalars['Int']['output']>;
  size?: Maybe<Scalars['Int']['output']>;
  three_months?: Maybe<Scalars['Int']['output']>;
  twelve_months?: Maybe<Scalars['Int']['output']>;
  unit?: Maybe<Scalars['String']['output']>;
  zero_months?: Maybe<Scalars['Int']['output']>;
};

export type AssetOptionInput = {
  development_fee?: InputMaybe<Scalars['Int']['input']>;
  five_months?: InputMaybe<Scalars['Int']['input']>;
  five_months_initial_payment?: InputMaybe<Scalars['Int']['input']>;
  initial_payment?: InputMaybe<Scalars['Int']['input']>;
  monthly_installment?: InputMaybe<Scalars['Int']['input']>;
  one_month?: InputMaybe<Scalars['Int']['input']>;
  one_month_initial_payment?: InputMaybe<Scalars['Int']['input']>;
  price: Scalars['Int']['input'];
  seven_months?: InputMaybe<Scalars['Int']['input']>;
  seven_months_initial_payment?: InputMaybe<Scalars['Int']['input']>;
  six_months?: InputMaybe<Scalars['Int']['input']>;
  size: Scalars['Int']['input'];
  three_months?: InputMaybe<Scalars['Int']['input']>;
  twelve_months?: InputMaybe<Scalars['Int']['input']>;
  unit: Scalars['Int']['input'];
  zero_months?: InputMaybe<Scalars['Int']['input']>;
};

export type AssetQuestion = {
  __typename?: 'AssetQuestion';
  _id: Scalars['ID']['output'];
  address?: Maybe<Scalars['String']['output']>;
  asset?: Maybe<Asset>;
  desired_landuse: Scalars['String']['output'];
  mode_of_communication: Scalars['String']['output'];
  name_of_property: Scalars['String']['output'];
  next_date_of_payment?: Maybe<Scalars['Date']['output']>;
  source_of_funds: Scalars['String']['output'];
  unique_asset_id: Scalars['String']['output'];
  user?: Maybe<User>;
};

export type AssetQuestions = {
  __typename?: 'AssetQuestions';
  _id: Scalars['ID']['output'];
  address?: Maybe<Scalars['String']['output']>;
  asset: Scalars['ID']['output'];
  createdAt?: Maybe<Scalars['Date']['output']>;
  desired_landuse: Scalars['String']['output'];
  mode_of_communication: Scalars['String']['output'];
  name_of_property: Scalars['String']['output'];
  next_date_of_payment?: Maybe<Scalars['Date']['output']>;
  source_of_funds: Scalars['String']['output'];
  unique_asset_id?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['Date']['output']>;
  user: Scalars['ID']['output'];
};

export type AssetRafflePerformanceResponse = {
  __typename?: 'AssetRafflePerformanceResponse';
  assetBreakdown?: Maybe<Array<Maybe<AssetBreakdown>>>;
  financialMetrics?: Maybe<FinancialMetrics>;
  promoDetails?: Maybe<PromoDetails>;
  salesMetrics?: Maybe<SalesMetrics>;
  ticketMetrics?: Maybe<TicketMetrics>;
  usersWithTickets?: Maybe<Array<Maybe<UserWithTicket>>>;
};

export type AssetResponse = {
  __typename?: 'AssetResponse';
  data?: Maybe<Array<Maybe<Assets>>>;
  success?: Maybe<Scalars['Boolean']['output']>;
};

export type AssetSizeDetails = {
  __typename?: 'AssetSizeDetails';
  available_unit: Scalars['Int']['output'];
  expected_return: Scalars['Float']['output'];
  size: Scalars['Int']['output'];
  sold_out: Scalars['Boolean']['output'];
  unit_sold: Scalars['Int']['output'];
  value: Scalars['Float']['output'];
};

export type AssetSizeDetailsResponse = {
  __typename?: 'AssetSizeDetailsResponse';
  sizes: Array<AssetSizeDetails>;
};

export type AssetTransactionFilters = {
  assetType?: InputMaybe<Scalars['String']['input']>;
  endDate?: InputMaybe<Scalars['Date']['input']>;
  salesType?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['Date']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  transactionType?: InputMaybe<Scalars['String']['input']>;
};

export type AssetTypeDistribution = {
  __typename?: 'AssetTypeDistribution';
  flexOwnership: Scalars['Int']['output'];
  fullOwnership: Scalars['Int']['output'];
};

export type AssetUpdateInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  amount?: InputMaybe<Scalars['String']['input']>;
  asset_id?: InputMaybe<Scalars['String']['input']>;
  asset_purchase_price?: InputMaybe<Scalars['Int']['input']>;
  credit_referral?: InputMaybe<Scalars['Boolean']['input']>;
  date_of_payment: Scalars['Date']['input'];
  monthly_installment: Scalars['Int']['input'];
  name_of_property?: InputMaybe<Scalars['String']['input']>;
  number_of_units?: InputMaybe<Scalars['Int']['input']>;
  referral_amount: Scalars['Int']['input'];
  send_receipt_email?: InputMaybe<Scalars['Boolean']['input']>;
  size: Scalars['Int']['input'];
  user_id?: InputMaybe<Scalars['String']['input']>;
};

export type AssetUpdateRequestInput = {
  assetId: Scalars['String']['input'];
  bankName: Scalars['String']['input'];
  currentAssetUniqueId: Scalars['String']['input'];
  currentSize: Scalars['Float']['input'];
  currentUnits: Scalars['Int']['input'];
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  newSize: Scalars['Float']['input'];
  newUnits: Scalars['Int']['input'];
  reasonForUpdate: Scalars['String']['input'];
  referenceNumber: Scalars['String']['input'];
};

export type AssetUpdateRequestResponse = {
  __typename?: 'AssetUpdateRequestResponse';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type Assets = {
  __typename?: 'Assets';
  _id: Scalars['ID']['output'];
  amenities?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  asset_documents?: Maybe<Scalars['JSON']['output']>;
  asset_history?: Maybe<Scalars['JSON']['output']>;
  asset_location?: Maybe<Scalars['String']['output']>;
  asset_name?: Maybe<Scalars['String']['output']>;
  asset_option?: Maybe<Array<Maybe<AssetOption>>>;
  asset_pictures?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  asset_price?: Maybe<Scalars['Float']['output']>;
  asset_purpose?: Maybe<Scalars['String']['output']>;
  asset_size?: Maybe<Scalars['Int']['output']>;
  asset_type?: Maybe<Scalars['String']['output']>;
  asset_unit?: Maybe<Scalars['Int']['output']>;
  basic_details?: Maybe<Array<Maybe<BasicDetails>>>;
  description?: Maybe<Scalars['String']['output']>;
  full_ownership?: Maybe<Array<Maybe<Scalars['ID']['output']>>>;
  gogle_map?: Maybe<Scalars['String']['output']>;
  is_subscribed?: Maybe<Scalars['Boolean']['output']>;
  landmark?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  new_asset?: Maybe<Scalars['Boolean']['output']>;
  sold?: Maybe<Scalars['Boolean']['output']>;
  subscribed_asset_details: Array<Maybe<SubscribedAssetDetails>>;
  title?: Maybe<Scalars['String']['output']>;
  topography?: Maybe<Scalars['String']['output']>;
};

export type Associate = {
  __typename?: 'Associate';
  commission?: Maybe<Scalars['Float']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  expected_revenue?: Maybe<Scalars['Float']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  no_of_clients?: Maybe<Scalars['Int']['output']>;
  received_revenue?: Maybe<Scalars['Float']['output']>;
  sales_person?: Maybe<Scalars['String']['output']>;
  size_sold?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  units_sold?: Maybe<Scalars['Int']['output']>;
};

export type AssociateResponse = {
  __typename?: 'AssociateResponse';
  count: Scalars['Int']['output'];
  data: Array<Associate>;
  success: Scalars['Boolean']['output'];
};

export type AuthResponse = {
  __typename?: 'AuthResponse';
  data?: Maybe<User>;
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type BankDetailInput = {
  accountNumber?: InputMaybe<Scalars['String']['input']>;
  bankName?: InputMaybe<Scalars['String']['input']>;
  bank_code?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  token?: InputMaybe<Scalars['String']['input']>;
};

export type BankDetailResponse = {
  __typename?: 'BankDetailResponse';
  data?: Maybe<BankDetails>;
  success?: Maybe<Scalars['Boolean']['output']>;
};

export type BankDetails = {
  __typename?: 'BankDetails';
  _id: Scalars['ID']['output'];
  accountNumber: Scalars['String']['output'];
  bankName: Scalars['String']['output'];
  bank_code: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type BasicDetails = {
  __typename?: 'BasicDetails';
  Asset?: Maybe<Asset>;
  _id: Scalars['ID']['output'];
  allocation_qualification?: Maybe<Scalars['Int']['output']>;
  monthly_installment?: Maybe<Scalars['Int']['output']>;
  payment_duration?: Maybe<Scalars['Int']['output']>;
  total_amount?: Maybe<Scalars['Int']['output']>;
};

export type BuyAssetPaystackInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  amount?: InputMaybe<Scalars['String']['input']>;
  assetId?: InputMaybe<Scalars['String']['input']>;
  desired_landuse?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  mode_of_communication?: InputMaybe<Scalars['String']['input']>;
  months: Scalars['Int']['input'];
  name_of_property?: InputMaybe<Scalars['String']['input']>;
  number_of_units?: InputMaybe<Scalars['Int']['input']>;
  paystackReference?: InputMaybe<Scalars['String']['input']>;
  size?: InputMaybe<Scalars['Int']['input']>;
  source_of_funds?: InputMaybe<Scalars['String']['input']>;
};

export type BuyAssetPaystackResponse = {
  __typename?: 'BuyAssetPaystackResponse';
  data?: Maybe<Scalars['String']['output']>;
  message?: Maybe<Scalars['String']['output']>;
  success?: Maybe<Scalars['Boolean']['output']>;
};

export type BuyAssetTransferInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  amount?: InputMaybe<Scalars['String']['input']>;
  assetId?: InputMaybe<Scalars['String']['input']>;
  bank_name?: InputMaybe<Scalars['String']['input']>;
  desired_landuse?: InputMaybe<Scalars['String']['input']>;
  file?: InputMaybe<Scalars['String']['input']>;
  mode_of_communication?: InputMaybe<Scalars['String']['input']>;
  months: Scalars['Int']['input'];
  name_of_property?: InputMaybe<Scalars['String']['input']>;
  number_of_units?: InputMaybe<Scalars['Int']['input']>;
  reference_no?: InputMaybe<Scalars['String']['input']>;
  size?: InputMaybe<Scalars['Int']['input']>;
  source_of_funds?: InputMaybe<Scalars['String']['input']>;
};

export type BuyAssetWalletInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  amount?: InputMaybe<Scalars['String']['input']>;
  assetId?: InputMaybe<Scalars['String']['input']>;
  desired_landuse?: InputMaybe<Scalars['String']['input']>;
  mode_of_communication?: InputMaybe<Scalars['String']['input']>;
  months: Scalars['Int']['input'];
  name_of_property?: InputMaybe<Scalars['String']['input']>;
  number_of_units?: InputMaybe<Scalars['Int']['input']>;
  size?: InputMaybe<Scalars['Int']['input']>;
  source_of_funds?: InputMaybe<Scalars['String']['input']>;
};

export type BuyFullOwnershipAssetInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  amount?: InputMaybe<Scalars['String']['input']>;
  assetId?: InputMaybe<Scalars['String']['input']>;
  desired_landuse?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  mode_of_communication?: InputMaybe<Scalars['String']['input']>;
  months: Scalars['String']['input'];
  name_of_property?: InputMaybe<Scalars['String']['input']>;
  number_of_units?: InputMaybe<Scalars['Int']['input']>;
  paystackReference?: InputMaybe<Scalars['String']['input']>;
  size?: InputMaybe<Scalars['Int']['input']>;
  source_of_funds?: InputMaybe<Scalars['String']['input']>;
};

export type BuyFullOwnershipAssetResponse = {
  __typename?: 'BuyFullOwnershipAssetResponse';
  amount?: Maybe<Scalars['String']['output']>;
  assetId?: Maybe<Scalars['String']['output']>;
  desired_landuse?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  mode_of_communication?: Maybe<Scalars['String']['output']>;
  months?: Maybe<Scalars['String']['output']>;
  name_of_property?: Maybe<Scalars['String']['output']>;
  number_of_units?: Maybe<Scalars['Int']['output']>;
  source_of_funds?: Maybe<Scalars['String']['output']>;
};

export type BuyFullOwnershipAssetTransferInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  amount?: InputMaybe<Scalars['String']['input']>;
  assetId?: InputMaybe<Scalars['String']['input']>;
  bank_name?: InputMaybe<Scalars['String']['input']>;
  desired_landuse?: InputMaybe<Scalars['String']['input']>;
  file?: InputMaybe<Scalars['String']['input']>;
  mode_of_communication?: InputMaybe<Scalars['String']['input']>;
  months: Scalars['String']['input'];
  name_of_property?: InputMaybe<Scalars['String']['input']>;
  number_of_units?: InputMaybe<Scalars['Int']['input']>;
  reference_no?: InputMaybe<Scalars['String']['input']>;
  size?: InputMaybe<Scalars['Int']['input']>;
  source_of_funds?: InputMaybe<Scalars['String']['input']>;
};

export type CampaignHamper = {
  __typename?: 'CampaignHamper';
  _id: Scalars['ID']['output'];
  assetLocation: Scalars['String']['output'];
  assetName: Scalars['String']['output'];
  assetType: Scalars['String']['output'];
  createdDate?: Maybe<Scalars['String']['output']>;
  referredUserEmail: Scalars['String']['output'];
  referredUserId: Scalars['String']['output'];
  referredUserName: Scalars['String']['output'];
  referrerEmail: Scalars['String']['output'];
  referrerId: Scalars['String']['output'];
  referrerName: Scalars['String']['output'];
  referrerStatus: Scalars['String']['output'];
  sizePurchased: Scalars['Float']['output'];
  totalSize: Scalars['Float']['output'];
  unitsPurchased: Scalars['Int']['output'];
};

export type CampaignHamperResponse = {
  __typename?: 'CampaignHamperResponse';
  count?: Maybe<Scalars['Int']['output']>;
  data?: Maybe<Array<Maybe<CampaignHamper>>>;
  success?: Maybe<Scalars['Boolean']['output']>;
};

export type CampaignPaymentPlan = {
  __typename?: 'CampaignPaymentPlan';
  _id: Scalars['ID']['output'];
  assetName: Scalars['String']['output'];
  createdAt?: Maybe<Scalars['String']['output']>;
  dateStarted?: Maybe<Scalars['Date']['output']>;
  documentAmountPaid: Scalars['Float']['output'];
  documentPrice: Scalars['Float']['output'];
  email: Scalars['String']['output'];
  landAmountPaid: Scalars['Float']['output'];
  landPrice: Scalars['Float']['output'];
  monthsOfSubscription: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  nextDateOfPayment?: Maybe<Scalars['Date']['output']>;
  size: Scalars['Float']['output'];
  unit: Scalars['Int']['output'];
  userId: Scalars['String']['output'];
};

export type CampaignPaymentPlansResponse = {
  __typename?: 'CampaignPaymentPlansResponse';
  count?: Maybe<Scalars['Int']['output']>;
  data?: Maybe<Array<Maybe<CampaignPaymentPlan>>>;
  success?: Maybe<Scalars['Boolean']['output']>;
};

export type ClearTinResponse = {
  __typename?: 'ClearTinResponse';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type ClearUserTinInput = {
  reason: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};

export type ClientInfo = {
  __typename?: 'ClientInfo';
  dateJoined: Scalars['Date']['output'];
  email: Scalars['String']['output'];
  isActive: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  netWorth: Scalars['Float']['output'];
  phone: Scalars['String']['output'];
  status: Scalars['String']['output'];
  totalAssets: Scalars['Int']['output'];
  totalSizeBought: Scalars['Float']['output'];
  userId: Scalars['String']['output'];
};

export type ClientInsights = {
  __typename?: 'ClientInsights';
  totalAssociatePro: Scalars['Int']['output'];
  totalAssociates: Scalars['Int']['output'];
  totalReferral: Scalars['Int']['output'];
};

export type ClientOverviewData = {
  __typename?: 'ClientOverviewData';
  assetTypeDistribution: AssetTypeDistribution;
  clients: Array<ClientInfo>;
  overview: ClientOverviewMetrics;
  pagination: PaginationInfo;
  realtorMetrics: RealtorMetrics;
};

export type ClientOverviewFilters = {
  dateRange?: InputMaybe<Scalars['String']['input']>;
  netWorthRange?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
};

export type ClientOverviewMetrics = {
  __typename?: 'ClientOverviewMetrics';
  activeClients: Scalars['Int']['output'];
  avgAssetsPerClient: Scalars['Float']['output'];
  avgNetWorth: Scalars['Float']['output'];
  avgPortfolioSize: Scalars['Float']['output'];
  inactiveClients: Scalars['Int']['output'];
  outstandingBalance: Scalars['Float']['output'];
  totalAmountPaid: Scalars['Float']['output'];
  totalClients: Scalars['Int']['output'];
};

export type ClientOverviewResponse = {
  __typename?: 'ClientOverviewResponse';
  data: ClientOverviewData;
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type ClientRequestFilters = {
  dateRange?: InputMaybe<DateRangeInput>;
  paymentStatus?: InputMaybe<Scalars['String']['input']>;
  requestType?: InputMaybe<Scalars['String']['input']>;
  searchQuery?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
};

export type CommissionData = {
  __typename?: 'CommissionData';
  asset_name?: Maybe<Scalars['String']['output']>;
  asset_type?: Maybe<Scalars['String']['output']>;
  commissions: Array<CommissionRecord>;
  size?: Maybe<Scalars['Int']['output']>;
};

export type CommissionRecord = {
  __typename?: 'CommissionRecord';
  client_amount_paid?: Maybe<Scalars['Float']['output']>;
  client_name?: Maybe<Scalars['String']['output']>;
  commission_amount?: Maybe<Scalars['Float']['output']>;
};

export type CommissionResponse = {
  __typename?: 'CommissionResponse';
  data: Array<CommissionData>;
  success: Scalars['Boolean']['output'];
};

export type CommissionTransactions = {
  __typename?: 'CommissionTransactions';
  _id: Scalars['ID']['output'];
  admin_status?: Maybe<Scalars['String']['output']>;
  amount?: Maybe<Scalars['String']['output']>;
  commissionType?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  paystack_reference?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  time_of_transaction?: Maybe<Scalars['Date']['output']>;
  tin?: Maybe<Scalars['String']['output']>;
  transaction_reference?: Maybe<Scalars['String']['output']>;
  transaction_type?: Maybe<Scalars['String']['output']>;
  transfer_reference?: Maybe<Scalars['String']['output']>;
  type?: Maybe<Scalars['String']['output']>;
  user?: Maybe<Scalars['String']['output']>;
  wallet?: Maybe<Scalars['String']['output']>;
};

export type CommissionTransactionsResponse = {
  __typename?: 'CommissionTransactionsResponse';
  pagination: PaginationInfo;
  transactions: Array<CommissionTransactions>;
};

export type Coupon = {
  __typename?: 'Coupon';
  _id: Scalars['ID']['output'];
  activeImmediately: Scalars['Boolean']['output'];
  couponCode: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  discountPercentage: Scalars['Float']['output'];
  endDate?: Maybe<Scalars['Date']['output']>;
  expiryDate?: Maybe<Scalars['String']['output']>;
  expiryType: ExpiryType;
  startDate: Scalars['Date']['output'];
  status?: Maybe<CouponStatus>;
  updatedAt: Scalars['String']['output'];
  usageLimit?: Maybe<Scalars['Int']['output']>;
  usageLimitType: UsageLimitType;
};

export type CouponResponse = {
  __typename?: 'CouponResponse';
  data?: Maybe<Coupon>;
  message?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

export enum CouponStatus {
  Active = 'active',
  Expired = 'expired',
  Inactive = 'inactive'
}

export type CouponsResponse = {
  __typename?: 'CouponsResponse';
  count: Scalars['Int']['output'];
  data: Array<Coupon>;
  success: Scalars['Boolean']['output'];
};

export type CreateAgencyInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  agency_name: Scalars['String']['input'];
  city?: InputMaybe<Scalars['String']['input']>;
  commission_percentage: Scalars['Float']['input'];
  communication_preference?: InputMaybe<Scalars['String']['input']>;
  country?: InputMaybe<Scalars['String']['input']>;
  email: Scalars['String']['input'];
  phoneNumber: Scalars['String']['input'];
  state?: InputMaybe<Scalars['String']['input']>;
};

export type CreateAgencyResponse = {
  __typename?: 'CreateAgencyResponse';
  agency: Agency;
  credentials?: Maybe<AgencyCredentials>;
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type CreateCouponInput = {
  activeImmediately?: InputMaybe<Scalars['Boolean']['input']>;
  couponCode: Scalars['String']['input'];
  discountPercentage: Scalars['Float']['input'];
  endDate?: InputMaybe<Scalars['Date']['input']>;
  expiryDate?: InputMaybe<Scalars['Date']['input']>;
  expiryType: Scalars['String']['input'];
  startDate?: InputMaybe<Scalars['Date']['input']>;
  usageLimit?: InputMaybe<Scalars['Int']['input']>;
  usageLimitType: Scalars['String']['input'];
};

export type CreateFlexAssetInput = {
  allocation_qualification: Scalars['Int']['input'];
  amenities: Array<Scalars['String']['input']>;
  asset_history?: InputMaybe<Scalars['JSON']['input']>;
  asset_location: Scalars['String']['input'];
  asset_name: Scalars['String']['input'];
  asset_option: Array<InputMaybe<FlexAssetOptionInput>>;
  asset_pictures: Array<Scalars['String']['input']>;
  asset_type: Scalars['String']['input'];
  contract_of_sales: Scalars['String']['input'];
  deed_of_assignment: Scalars['String']['input'];
  description: Scalars['String']['input'];
  estate_layout: Scalars['String']['input'];
  new_asset: Scalars['Boolean']['input'];
  survey: Scalars['String']['input'];
  title: Scalars['String']['input'];
};

export type CreateFullOwnershipAssetInput = {
  amenities: Array<Scalars['String']['input']>;
  asset_history: Scalars['JSON']['input'];
  asset_location: Scalars['String']['input'];
  asset_name: Scalars['String']['input'];
  asset_option: Array<InputMaybe<FullOwnershipAssetOptionInput>>;
  asset_pictures: Array<Scalars['String']['input']>;
  asset_purpose?: InputMaybe<Scalars['String']['input']>;
  asset_type: Scalars['String']['input'];
  contract_of_sales: Scalars['String']['input'];
  deed_of_assignment: Scalars['String']['input'];
  description: Scalars['String']['input'];
  estate_layout: Scalars['String']['input'];
  google_map?: InputMaybe<Scalars['String']['input']>;
  landmark?: InputMaybe<Array<Scalars['String']['input']>>;
  new_asset: Scalars['Boolean']['input'];
  survey: Scalars['String']['input'];
  title: Scalars['String']['input'];
  topography?: InputMaybe<Scalars['String']['input']>;
};

export type CreateLocationChangeInput = {
  bankName: Scalars['String']['input'];
  currentAssetId: Scalars['String']['input'];
  currentAssetUniqueId: Scalars['String']['input'];
  currentSize: Scalars['Float']['input'];
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  newAssetId: Scalars['String']['input'];
  newAssetType: Scalars['String']['input'];
  newSize: Scalars['Float']['input'];
  paymentDuration: Scalars['String']['input'];
  reasonForChange: Scalars['String']['input'];
  referenceNumber: Scalars['String']['input'];
};

export type CreateRoleInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  permissions: Array<Scalars['String']['input']>;
};

export type CreateUsersFullOwnershipAssetInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  amount?: InputMaybe<Scalars['Int']['input']>;
  assetId?: InputMaybe<Scalars['String']['input']>;
  commission_amount?: InputMaybe<Scalars['Int']['input']>;
  development?: InputMaybe<Scalars['Boolean']['input']>;
  development_price?: InputMaybe<Scalars['Int']['input']>;
  doc_amount?: InputMaybe<Scalars['Int']['input']>;
  land_price?: InputMaybe<Scalars['Int']['input']>;
  months?: InputMaybe<Scalars['String']['input']>;
  name_of_property?: InputMaybe<Scalars['String']['input']>;
  number_of_units?: InputMaybe<Scalars['Int']['input']>;
  pay_commision?: InputMaybe<Scalars['Boolean']['input']>;
  send_contract_agreement?: InputMaybe<Scalars['Boolean']['input']>;
  send_receipt_email?: InputMaybe<Scalars['Boolean']['input']>;
  size?: InputMaybe<Scalars['Int']['input']>;
  start_date?: InputMaybe<Scalars['Date']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type CustomRequestInput = {
  category: Scalars['String']['input'];
  description: Scalars['String']['input'];
  imageUrls?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  relatedAsset?: InputMaybe<Scalars['ID']['input']>;
  title: Scalars['String']['input'];
};

export type CustomRequestResponse = {
  __typename?: 'CustomRequestResponse';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type DataPointInput = {
  type?: InputMaybe<Scalars['String']['input']>;
};

export type DataPointResponse = {
  __typename?: 'DataPointResponse';
  approved_transaction?: Maybe<Scalars['Float']['output']>;
  commission_transaction?: Maybe<Scalars['Float']['output']>;
  pending_transaction?: Maybe<Scalars['Float']['output']>;
  rejected_transaction?: Maybe<Scalars['Float']['output']>;
  users_wallet_balance?: Maybe<Scalars['Float']['output']>;
};

export type DateRangeInput = {
  from?: InputMaybe<Scalars['Date']['input']>;
  to?: InputMaybe<Scalars['Date']['input']>;
};

export type DecemberTransaction = {
  __typename?: 'DecemberTransaction';
  admin_status?: Maybe<Scalars['String']['output']>;
  amount?: Maybe<Scalars['Float']['output']>;
  asset?: Maybe<Asset>;
  asset_type?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['Date']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  number_of_units?: Maybe<Scalars['Int']['output']>;
  paystack_reference?: Maybe<Scalars['String']['output']>;
  recipient_code?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  time_of_transaction?: Maybe<Scalars['Date']['output']>;
  transaction_type?: Maybe<Scalars['String']['output']>;
  transfer_file?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  transfer_reference?: Maybe<Scalars['String']['output']>;
  type?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['Date']['output']>;
  user?: Maybe<User>;
  wallet?: Maybe<Scalars['ID']['output']>;
  withdrawal_reason?: Maybe<Scalars['String']['output']>;
};

export type DeclineTransactionInput = {
  message?: InputMaybe<Scalars['String']['input']>;
  transactionId?: InputMaybe<Scalars['String']['input']>;
};

export type DeleteCouponResponse = {
  __typename?: 'DeleteCouponResponse';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type DeleteUserFullOwnershipAssetInput = {
  assetId: Scalars['ID']['input'];
  unique_asset_id: Scalars['String']['input'];
  userId: Scalars['ID']['input'];
};

export type DocumentChangeRequestInput = {
  assetId: Scalars['String']['input'];
  bankName: Scalars['String']['input'];
  currentAssetUniqueId: Scalars['String']['input'];
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  newAddress: Scalars['String']['input'];
  newName: Scalars['String']['input'];
  reasonForChange: Scalars['String']['input'];
  referenceNumber: Scalars['String']['input'];
};

export type DocumentChangeResponse = {
  __typename?: 'DocumentChangeResponse';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type DocumentFullownershipResponse = {
  __typename?: 'DocumentFullownershipResponse';
  data?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type DocumentPaymentInput = {
  amount?: InputMaybe<Scalars['String']['input']>;
  assetId?: InputMaybe<Scalars['String']['input']>;
  unique_asset_id?: InputMaybe<Scalars['String']['input']>;
};

export type DocumentPaymentPlan = {
  __typename?: 'DocumentPaymentPlan';
  amount_paid?: Maybe<Scalars['Float']['output']>;
  amount_payable?: Maybe<Scalars['Float']['output']>;
  asset_price?: Maybe<Scalars['Float']['output']>;
  balance?: Maybe<Scalars['Float']['output']>;
  default_amount?: Maybe<Scalars['Float']['output']>;
  month_remaining?: Maybe<Scalars['Int']['output']>;
  month_subscription?: Maybe<Scalars['Int']['output']>;
  next_date_of_payment?: Maybe<Scalars['Date']['output']>;
  unique_asset_id?: Maybe<Scalars['String']['output']>;
};

export type DocumentPaymentTransferInput = {
  amount?: InputMaybe<Scalars['String']['input']>;
  assetId?: InputMaybe<Scalars['String']['input']>;
  bank_name?: InputMaybe<Scalars['String']['input']>;
  file?: InputMaybe<Scalars['String']['input']>;
  reference_no?: InputMaybe<Scalars['String']['input']>;
  unique_asset_id?: InputMaybe<Scalars['String']['input']>;
};

export type DocumentPaystackPaymentInput = {
  amount?: InputMaybe<Scalars['String']['input']>;
  assetId?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  paystackReference?: InputMaybe<Scalars['String']['input']>;
  unique_asset_id?: InputMaybe<Scalars['String']['input']>;
};

export type DocumentPlan = {
  __typename?: 'DocumentPlan';
  _id: Scalars['ID']['output'];
  amount_paid?: Maybe<Scalars['Float']['output']>;
  amount_payable?: Maybe<Scalars['Float']['output']>;
  asset: Scalars['ID']['output'];
  asset_price?: Maybe<Scalars['Float']['output']>;
  asset_type?: Maybe<Scalars['String']['output']>;
  balance?: Maybe<Scalars['Float']['output']>;
  createdAt?: Maybe<Scalars['Date']['output']>;
  default_amount?: Maybe<Scalars['Float']['output']>;
  document_plan?: Maybe<Scalars['ID']['output']>;
  month_remaining?: Maybe<Scalars['Int']['output']>;
  month_subscription?: Maybe<Scalars['Int']['output']>;
  months_covered?: Maybe<Scalars['Int']['output']>;
  next_date_of_payment?: Maybe<Scalars['Date']['output']>;
  no_of_units?: Maybe<Scalars['Int']['output']>;
  size?: Maybe<Scalars['Int']['output']>;
  start_date?: Maybe<Scalars['Date']['output']>;
  transaction?: Maybe<Array<Scalars['ID']['output']>>;
  unique_asset_id?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['Date']['output']>;
  user: Scalars['ID']['output'];
};

export type Documents = {
  __typename?: 'Documents';
  asset?: Maybe<Asset>;
  contract_of_sales?: Maybe<Scalars['String']['output']>;
  deed_of_assignment?: Maybe<Scalars['String']['output']>;
  estate_layout?: Maybe<Scalars['String']['output']>;
  survey?: Maybe<Scalars['String']['output']>;
};

export type EditFullOwnershipAssetInput = {
  amenities: Array<InputMaybe<Scalars['String']['input']>>;
  assetId?: InputMaybe<Scalars['String']['input']>;
  asset_history: Scalars['JSON']['input'];
  asset_location: Scalars['String']['input'];
  asset_name: Scalars['String']['input'];
  asset_option: Array<InputMaybe<AssetOptionInput>>;
  asset_pictures: Array<InputMaybe<Scalars['String']['input']>>;
  asset_purpose: Scalars['String']['input'];
  asset_type: Scalars['String']['input'];
  contract_of_sales: Scalars['String']['input'];
  deed_of_assignment: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  estate_layout: Scalars['String']['input'];
  google_map: Scalars['String']['input'];
  landmark: Array<InputMaybe<Scalars['String']['input']>>;
  new_asset: Scalars['Boolean']['input'];
  survey: Scalars['String']['input'];
};

export type EditKycInput = {
  bvn?: InputMaybe<Scalars['String']['input']>;
  facial_recognition?: InputMaybe<Scalars['String']['input']>;
  means_of_identification?: InputMaybe<Scalars['String']['input']>;
  means_of_identification_pic?: InputMaybe<Scalars['String']['input']>;
  tin?: InputMaybe<Scalars['String']['input']>;
};

export type EditProfileInfo = {
  address?: InputMaybe<Scalars['String']['input']>;
  country?: InputMaybe<Scalars['String']['input']>;
  date_of_birth?: InputMaybe<Scalars['Date']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  employment_status?: InputMaybe<Scalars['String']['input']>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  gender?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  marital_status?: InputMaybe<Scalars['String']['input']>;
  occupation?: InputMaybe<Scalars['String']['input']>;
  phoneNumber?: InputMaybe<Scalars['String']['input']>;
  userName?: InputMaybe<Scalars['String']['input']>;
};

export type EditUserAssetQuestionInput = {
  address: Scalars['String']['input'];
  name_of_property: Scalars['String']['input'];
  unique_asset_id: Scalars['String']['input'];
};

export type EditUserResponse = {
  __typename?: 'EditUserResponse';
  authToken?: Maybe<Scalars['String']['output']>;
  message?: Maybe<Scalars['String']['output']>;
  success?: Maybe<Scalars['Boolean']['output']>;
};

export type EligibleClient = {
  __typename?: 'EligibleClient';
  allocation?: Maybe<Scalars['String']['output']>;
  allocationDate?: Maybe<Scalars['String']['output']>;
  allocationStatus?: Maybe<Scalars['String']['output']>;
  amountPaid?: Maybe<Scalars['Float']['output']>;
  assetName?: Maybe<Scalars['String']['output']>;
  assetSize?: Maybe<Scalars['Int']['output']>;
  assetType?: Maybe<Scalars['String']['output']>;
  duration?: Maybe<Scalars['Int']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  end_date?: Maybe<Scalars['String']['output']>;
  firstName?: Maybe<Scalars['String']['output']>;
  lastName?: Maybe<Scalars['String']['output']>;
  location?: Maybe<Scalars['String']['output']>;
  paymentPercentage?: Maybe<Scalars['String']['output']>;
  paymentPlan?: Maybe<Scalars['String']['output']>;
  phoneNumber?: Maybe<Scalars['String']['output']>;
  referral?: Maybe<Scalars['String']['output']>;
  referralStatus?: Maybe<Scalars['String']['output']>;
  totalPrice?: Maybe<Scalars['Float']['output']>;
  unit?: Maybe<Scalars['Int']['output']>;
};

export type EligibleClientsForLandResponse = {
  __typename?: 'EligibleClientsForLandResponse';
  count: Scalars['Int']['output'];
  data: Array<EligibleClient>;
  limit: Scalars['Int']['output'];
  page: Scalars['Int']['output'];
};

export type EmailInput = {
  email?: InputMaybe<Scalars['String']['input']>;
};

export type EmailVerifcation = {
  __typename?: 'EmailVerifcation';
  authToken: Scalars['String']['output'];
  message: Scalars['String']['output'];
};

export type EmailVerificationOutput = {
  __typename?: 'EmailVerificationOutput';
  authToken?: Maybe<Scalars['String']['output']>;
  message?: Maybe<Scalars['String']['output']>;
};

export type EmailVerificationResponse = {
  __typename?: 'EmailVerificationResponse';
  data?: Maybe<EmailVerificationOutput>;
  success?: Maybe<Scalars['Boolean']['output']>;
};

export enum ExpiryType {
  ExpiresOn = 'expires_on',
  NoExpiry = 'no_expiry'
}

export type FaqEmailInput = {
  email?: InputMaybe<Scalars['String']['input']>;
  explanation?: InputMaybe<Scalars['String']['input']>;
  question?: InputMaybe<Scalars['String']['input']>;
};

export type FilteredUserAdminDetail = {
  __typename?: 'FilteredUserAdminDetail';
  Networth?: Maybe<Scalars['Int']['output']>;
  _id?: Maybe<Scalars['ID']['output']>;
  createdAt?: Maybe<Scalars['Date']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  firstName?: Maybe<Scalars['String']['output']>;
  gender?: Maybe<Scalars['String']['output']>;
  lastName?: Maybe<Scalars['String']['output']>;
  occupation?: Maybe<Scalars['String']['output']>;
  phoneNumber?: Maybe<Scalars['String']['output']>;
  referral?: Maybe<Referrer>;
};

export type FilteredUserAdminResponse = {
  __typename?: 'FilteredUserAdminResponse';
  count?: Maybe<Scalars['Int']['output']>;
  data?: Maybe<Array<Maybe<FilteredUserAdminDetail>>>;
  success?: Maybe<Scalars['Boolean']['output']>;
};

export type FiltersInput = {
  assetName?: InputMaybe<Scalars['String']['input']>;
  assetType?: InputMaybe<Scalars['String']['input']>;
  percentage?: InputMaybe<Scalars['Float']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
};

export type FinanceSnapshot = {
  __typename?: 'FinanceSnapshot';
  assetValueSold: Scalars['Float']['output'];
  clientPayments: Scalars['Float']['output'];
  outstandingBalance: Scalars['Float']['output'];
  unrealizedCommission: Scalars['Float']['output'];
};

export type FinancialMetrics = {
  __typename?: 'FinancialMetrics';
  averagePaymentPerPlan?: Maybe<Scalars['Float']['output']>;
  totalAssetValueSold?: Maybe<Scalars['Float']['output']>;
  totalBalance?: Maybe<Scalars['Float']['output']>;
  totalRevenueGenerated?: Maybe<Scalars['Float']['output']>;
};

export type FinancialMetricsHamper = {
  __typename?: 'FinancialMetricsHamper';
  averagePaymentPerPlan?: Maybe<Scalars['Float']['output']>;
  totalAssetValueSold?: Maybe<Scalars['Float']['output']>;
  totalBalance?: Maybe<Scalars['Float']['output']>;
  totalDocumentAmountPaid?: Maybe<Scalars['Float']['output']>;
  totalDocumentPrice?: Maybe<Scalars['Float']['output']>;
  totalLandAmountPaid?: Maybe<Scalars['Float']['output']>;
  totalLandPrice?: Maybe<Scalars['Float']['output']>;
  totalRevenueGenerated?: Maybe<Scalars['Float']['output']>;
};

export type FlexAsset = {
  __typename?: 'FlexAsset';
  _id: Scalars['ID']['output'];
  amenities?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  asset_location?: Maybe<Scalars['String']['output']>;
  asset_name?: Maybe<Scalars['String']['output']>;
  asset_option?: Maybe<Array<Maybe<FlexAssetOption>>>;
  asset_pictures?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  asset_price?: Maybe<Scalars['Float']['output']>;
  asset_size?: Maybe<Scalars['Int']['output']>;
  asset_type?: Maybe<Scalars['String']['output']>;
  asset_unit?: Maybe<Scalars['Int']['output']>;
  basic_details?: Maybe<Array<Maybe<BasicDetails>>>;
  description?: Maybe<Scalars['String']['output']>;
  documents?: Maybe<Documents>;
  is_subscribed?: Maybe<Scalars['Boolean']['output']>;
  sold?: Maybe<Scalars['Boolean']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

export type FlexAssetOption = {
  __typename?: 'FlexAssetOption';
  monthly_installment?: Maybe<Scalars['Int']['output']>;
  price?: Maybe<Scalars['Int']['output']>;
  size?: Maybe<Scalars['Int']['output']>;
  unit?: Maybe<Scalars['Int']['output']>;
};

export type FlexAssetOptionInput = {
  flex_payment_plans: Array<FlexPaymentPlanInput>;
  size: Scalars['Int']['input'];
};

export type FlexAssetResponse = {
  __typename?: 'FlexAssetResponse';
  data?: Maybe<Array<Maybe<FlexAsset>>>;
  success?: Maybe<Scalars['Boolean']['output']>;
};

export type FlexPaymentPlan = {
  __typename?: 'FlexPaymentPlan';
  description?: Maybe<Scalars['String']['output']>;
  duration_months: Scalars['Int']['output'];
  initial_payment?: Maybe<Scalars['Int']['output']>;
  monthly_installment: Scalars['Int']['output'];
  price?: Maybe<Scalars['Int']['output']>;
  unit?: Maybe<Scalars['Int']['output']>;
};

export type FlexPaymentPlanInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  duration_months: Scalars['Int']['input'];
  initial_payment?: InputMaybe<Scalars['Int']['input']>;
  monthly_installment: Scalars['Int']['input'];
  price: Scalars['Int']['input'];
  unit: Scalars['Int']['input'];
};

export type FlexTermsEmailResponse = {
  __typename?: 'FlexTermsEmailResponse';
  assetName: Scalars['String']['output'];
  emailSent: Scalars['Boolean']['output'];
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
  userEmail: Scalars['String']['output'];
  userName: Scalars['String']['output'];
};

export type FullOwnership = {
  __typename?: 'FullOwnership';
  _id: Scalars['ID']['output'];
  development_price?: Maybe<Scalars['Int']['output']>;
  five_months?: Maybe<Scalars['Int']['output']>;
  five_months_initial_payment?: Maybe<Scalars['Int']['output']>;
  initial_payment?: Maybe<Scalars['Int']['output']>;
  one_month?: Maybe<Scalars['Int']['output']>;
  one_month_initial_payment?: Maybe<Scalars['Int']['output']>;
  payment_type?: Maybe<Scalars['String']['output']>;
  six_months?: Maybe<Scalars['Int']['output']>;
  size?: Maybe<Scalars['Int']['output']>;
  three_months?: Maybe<Scalars['Int']['output']>;
  twelve_months?: Maybe<Scalars['Int']['output']>;
  zero_months?: Maybe<Scalars['Int']['output']>;
};

export type FullOwnershipAssetOptionInput = {
  development_fee: Scalars['Int']['input'];
  five_months: Scalars['Int']['input'];
  five_months_initial_payment: Scalars['Int']['input'];
  initial_payment: Scalars['Int']['input'];
  monthly_installment: Scalars['Int']['input'];
  one_month: Scalars['Int']['input'];
  one_month_initial_payment: Scalars['Int']['input'];
  price: Scalars['Int']['input'];
  seven_months: Scalars['Int']['input'];
  seven_months_initial_payment: Scalars['Int']['input'];
  six_months: Scalars['Int']['input'];
  size: Scalars['Int']['input'];
  three_months: Scalars['Int']['input'];
  twelve_months: Scalars['Int']['input'];
  unit: Scalars['Int']['input'];
  zero_months: Scalars['Int']['input'];
};

export type HamperLeaderboardEntry = {
  __typename?: 'HamperLeaderboardEntry';
  email: Scalars['String']['output'];
  hamperCount: Scalars['Int']['output'];
  name: Scalars['String']['output'];
  numberOfReferredUsers: Scalars['Int']['output'];
  phoneNumber: Scalars['String']['output'];
  referrerId: Scalars['String']['output'];
  totalAmountPaid: Scalars['Float']['output'];
  totalAssetValue: Scalars['Float']['output'];
  totalBalance: Scalars['Float']['output'];
  totalLandPrice: Scalars['Float']['output'];
  totalSqmSold: Scalars['Float']['output'];
};

export type HamperMetrics = {
  __typename?: 'HamperMetrics';
  associatePercentage?: Maybe<Scalars['Float']['output']>;
  associatesWithHampers?: Maybe<Scalars['Int']['output']>;
  averageHampersPerReferrer?: Maybe<Scalars['Float']['output']>;
  totalHampersIssued?: Maybe<Scalars['Int']['output']>;
  totalUniqueReferrers?: Maybe<Scalars['Int']['output']>;
};

export type InitializeDocumentPaystackInput = {
  amount?: InputMaybe<Scalars['String']['input']>;
  assetId?: InputMaybe<Scalars['String']['input']>;
  callback_url?: InputMaybe<Scalars['String']['input']>;
  unique_asset_id?: InputMaybe<Scalars['String']['input']>;
};

export type InitializeFullOwnershipPaystackInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  amount?: InputMaybe<Scalars['String']['input']>;
  assetId?: InputMaybe<Scalars['String']['input']>;
  callback_url?: InputMaybe<Scalars['String']['input']>;
  desired_landuse?: InputMaybe<Scalars['String']['input']>;
  mode_of_communication?: InputMaybe<Scalars['String']['input']>;
  months?: InputMaybe<Scalars['String']['input']>;
  name_of_property?: InputMaybe<Scalars['String']['input']>;
  number_of_units?: InputMaybe<Scalars['Int']['input']>;
  size?: InputMaybe<Scalars['Int']['input']>;
  source_of_funds?: InputMaybe<Scalars['String']['input']>;
};

export type InitializePaystackInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  amount?: InputMaybe<Scalars['String']['input']>;
  assetId?: InputMaybe<Scalars['String']['input']>;
  callback_url?: InputMaybe<Scalars['String']['input']>;
  desired_landuse?: InputMaybe<Scalars['String']['input']>;
  mode_of_communication?: InputMaybe<Scalars['String']['input']>;
  months: Scalars['Int']['input'];
  name_of_property?: InputMaybe<Scalars['String']['input']>;
  number_of_units?: InputMaybe<Scalars['Int']['input']>;
  size?: InputMaybe<Scalars['Int']['input']>;
  source_of_funds?: InputMaybe<Scalars['String']['input']>;
};

export type InitializePaystackResponse = {
  __typename?: 'InitializePaystackResponse';
  authorization_url?: Maybe<Scalars['String']['output']>;
  paystack_reference?: Maybe<Scalars['String']['output']>;
};

export type InitializeRecurringPaystackInput = {
  amount?: InputMaybe<Scalars['String']['input']>;
  callback_url?: InputMaybe<Scalars['String']['input']>;
  unique_asset_id?: InputMaybe<Scalars['String']['input']>;
};

export type JoinCommunityInput = {
  abode_email?: InputMaybe<Scalars['String']['input']>;
  user_email?: InputMaybe<Scalars['String']['input']>;
};

export type Kyc = {
  __typename?: 'Kyc';
  _id?: Maybe<Scalars['ID']['output']>;
  bvn?: Maybe<Scalars['String']['output']>;
  facial_recognition?: Maybe<Scalars['String']['output']>;
  means_of_identification?: Maybe<Scalars['String']['output']>;
  means_of_identification_pic?: Maybe<Scalars['String']['output']>;
  tin?: Maybe<Scalars['String']['output']>;
};

export type KycInput = {
  bvn: Scalars['String']['input'];
  facial_recognition: Scalars['String']['input'];
  means_of_identification: Scalars['String']['input'];
  means_of_identification_pic: Scalars['String']['input'];
  tin: Scalars['String']['input'];
};

export type LastActiveAssetPaymentData = {
  __typename?: 'LastActiveAssetPaymentData';
  assetDetails: Asset;
  lastTransactionDate: Scalars['String']['output'];
  paymentPlan: PaymentPlan;
};

export type LastActiveAssetPaymentResponse = {
  __typename?: 'LastActiveAssetPaymentResponse';
  data?: Maybe<LastActiveAssetPaymentData>;
  message?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

export type LocationChangeResponse = {
  __typename?: 'LocationChangeResponse';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type LogAdmin = {
  __typename?: 'LogAdmin';
  _id: Scalars['ID']['output'];
  action?: Maybe<Scalars['String']['output']>;
  adminEmail?: Maybe<Scalars['String']['output']>;
  adminId?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  metadata?: Maybe<Scalars['JSON']['output']>;
  oldState?: Maybe<Scalars['JSON']['output']>;
  timestamp?: Maybe<Scalars['Date']['output']>;
};

export type LogAdminResponse = {
  __typename?: 'LogAdminResponse';
  count?: Maybe<Scalars['Int']['output']>;
  data?: Maybe<Array<Maybe<LogAdmin>>>;
  success?: Maybe<Scalars['Boolean']['output']>;
};

export type ModifyReferralInput = {
  referral_status?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type MonthlyPerformance = {
  __typename?: 'MonthlyPerformance';
  associatesRecruited: Scalars['Int']['output'];
  commissionEarned: Scalars['Float']['output'];
  month: Scalars['String']['output'];
  salesPerformance: Scalars['Float']['output'];
  year: Scalars['Int']['output'];
};

export type Mutation = {
  __typename?: 'Mutation';
  UserWithdrawPin: ResponseMessage;
  activateAgency: AgencyResponse;
  addBankDetails: Scalars['String']['output'];
  addReferralByAdmin: Scalars['String']['output'];
  addUserAssetByAdmin: Scalars['String']['output'];
  adminSignupUser: AdminSignupResponse;
  allocateLand: AllocateLandResponse;
  approveAssetTransaction: Scalars['String']['output'];
  approvePaystackTransaction: Scalars['String']['output'];
  approveTransaction: Scalars['String']['output'];
  approveUpgradeToAssociate: Scalars['String']['output'];
  approveUpgradeToAssociatePro: Scalars['String']['output'];
  approveUserBvn: Scalars['String']['output'];
  approveUserKyc: Scalars['String']['output'];
  buyAssetWithPaystack: BuyAssetPaystackResponse;
  buyAssetWithTransfer?: Maybe<Scalars['String']['output']>;
  buyAssetWithWallet: Scalars['String']['output'];
  buyFullOwnershipAssetByTransfer: Scalars['String']['output'];
  buyFullOwnershipAssetByWallet: Scalars['String']['output'];
  buyFullOwnershipAssetWithPaystack: BuyFullOwnershipAssetResponse;
  clearUserTin: ClearTinResponse;
  createAgency: CreateAgencyResponse;
  createAssetUpdateRequest: AssetUpdateRequestResponse;
  createCoupon: CouponResponse;
  createCustomRequest: CustomRequestResponse;
  createDocumentChangeRequest: DocumentChangeResponse;
  createFlexAsset: Asset;
  createFullOwnershipAsset: AdminAsset;
  createLocationChangeRequest: LocationChangeResponse;
  createRole: Role;
  createSubAdmin: Scalars['String']['output'];
  createUsersFullOwnershipAsset: Scalars['String']['output'];
  decemberTransaction: Scalars['String']['output'];
  declineAssetTransaction: Scalars['String']['output'];
  declineDocumentTransaction: Scalars['String']['output'];
  declineTransaction?: Maybe<Scalars['String']['output']>;
  declineUpgradeRequest: Scalars['String']['output'];
  declineUserBvn: Scalars['String']['output'];
  declineUserKyc: Scalars['String']['output'];
  deleteAsset: Scalars['String']['output'];
  deleteCoupon: DeleteCouponResponse;
  deleteUserFlexAsset: Scalars['String']['output'];
  deleteUserFullOwnershipAsset: Scalars['String']['output'];
  disableAsset: Scalars['String']['output'];
  documentPaymentPaystack: DocumentFullownershipResponse;
  documentPaymentTransfer: Scalars['String']['output'];
  documentPaymentWallet: Scalars['String']['output'];
  editBankDetails: Scalars['String']['output'];
  editFullOwnershipAsset: Scalars['String']['output'];
  editKycInfo: Scalars['String']['output'];
  editNextofKinInfo: Scalars['String']['output'];
  editProfilePic: Scalars['String']['output'];
  editUserDetailsByAdmin: Scalars['String']['output'];
  editUserInfo: EditUserResponse;
  editUserWalletDetailsByAdmin: Scalars['String']['output'];
  editWalletCommission: Scalars['String']['output'];
  enableAsset: Scalars['String']['output'];
  faqEmail: Scalars['String']['output'];
  initializeDocumentWithPaystack: InitializePaystackResponse;
  initializeFullOwnershipPaystackTransaction: InitializePaystackResponse;
  initializeFullOwnershipRecurringPaystack: InitializePaystackResponse;
  initializePaystackTransaction: InitializePaystackResponse;
  initializeRecurringPaystack: InitializePaystackResponse;
  initializeUpgradeToAssociatePro: UpgradePaystackResponse;
  joinCommunityEmail: Scalars['String']['output'];
  modifyUserReferralStatus: Scalars['String']['output'];
  processCommission: Scalars['String']['output'];
  processReceipt: Scalars['String']['output'];
  reactivateAgency: AgencyResponse;
  reccurringAssetWithPaystack: Scalars['String']['output'];
  recurringAssetPaymentTransfer: Scalars['String']['output'];
  recurringAssetPaymentWallet: Scalars['String']['output'];
  recurringFullOwnershipAssetByTransfer: Scalars['String']['output'];
  recurringFullOwnershipAssetByWallet: Scalars['String']['output'];
  recurringFullOwnershipAssetPaymentWithPaystack: ReoccurringFullownershipResponse;
  removeReferralByAdmin: Scalars['String']['output'];
  removeUserAssetByAdmin: Scalars['String']['output'];
  resendEmailVerification: Scalars['String']['output'];
  saveAsset: Scalars['String']['output'];
  sendAdminEmailVerification: EmailVerificationResponse;
  sendAssetStatementsToAdmin: StatementSendResponse;
  sendCertificateByEmail: Scalars['String']['output'];
  sendContractsByAdmin: Scalars['String']['output'];
  sendEmailVerification: EmailVerificationResponse;
  sendFlexTermsAndConditionEmail: FlexTermsEmailResponse;
  sendHamperNotificationEmail: SendHamperEmailResponse;
  sendTermsAndConditionMail: Scalars['String']['output'];
  signinAdmin: Admin;
  signinUser: AuthResponse;
  signupAdmin: Admin;
  signupUser: AuthResponse;
  suspendAgency: AgencyResponse;
  suspendPaymentPlan: Scalars['String']['output'];
  suspendUser: Scalars['String']['output'];
  systemApproveAssetUpdateRequest: SystemApproveAssetUpdateRequestResponse;
  systemApproveDocumentChangeRequest: SystemApproveDocumentChangeRequestResponse;
  systemApproveLocationChangeRequest: SystemApproveLocationChangeRequestResponse;
  topUpWallet: Scalars['String']['output'];
  topUpWalletTransfer: Scalars['String']['output'];
  topWalletUp: TopUpResponse;
  unSuspendPaymentPlan: Scalars['String']['output'];
  unsuspendUser: Scalars['String']['output'];
  updateAdminPassword: Scalars['String']['output'];
  updateAdminRole: Scalars['String']['output'];
  updateAgencyCommission: AgencyResponse;
  updateAsset: Scalars['String']['output'];
  updateCoupon: CouponResponse;
  updateCouponStatus: CouponResponse;
  updateKycInfo: User;
  updateNextofKinInfo: User;
  updatePassword: Scalars['String']['output'];
  updatePaymentPlan: Scalars['String']['output'];
  updateProfileInfo: User;
  updateRequestStatus: UpdateRequestResponse;
  updateUserAssetQuestion: Scalars['String']['output'];
  updateUserPaymentDetails: Scalars['String']['output'];
  updateUserTin: UpdateTinResponse;
  upgradeToAssociate: Scalars['String']['output'];
  upgradeToAssociatePro: Scalars['String']['output'];
  verifyAdminEmail: EmailVerifcation;
  verifyEmail: EmailVerifcation;
  verifyPaystack: Scalars['String']['output'];
  withdrawWallet: Scalars['String']['output'];
  withdrawWalletOTP: Scalars['String']['output'];
  withdrawWalletTransfer: Scalars['String']['output'];
  withdrwalFromWallet: ResponseMessage;
};


export type MutationUserWithdrawPinArgs = {
  userPin?: InputMaybe<WithdrawalPin>;
};


export type MutationActivateAgencyArgs = {
  agencyId: Scalars['ID']['input'];
};


export type MutationAddBankDetailsArgs = {
  bankInput?: InputMaybe<BankDetailInput>;
};


export type MutationAddReferralByAdminArgs = {
  addReferralUpdateInput: AddReferralUpdateInput;
};


export type MutationAddUserAssetByAdminArgs = {
  assetUpdateInput: AssetUpdateInput;
};


export type MutationAdminSignupUserArgs = {
  adminSignupInput: AdminSignupInput;
};


export type MutationAllocateLandArgs = {
  block: Scalars['String']['input'];
  paymentPlanId: Scalars['String']['input'];
  plot: Scalars['String']['input'];
};


export type MutationApproveAssetTransactionArgs = {
  id: Scalars['ID']['input'];
};


export type MutationApprovePaystackTransactionArgs = {
  id: Scalars['ID']['input'];
};


export type MutationApproveTransactionArgs = {
  id: Scalars['ID']['input'];
};


export type MutationApproveUpgradeToAssociateArgs = {
  id: Scalars['ID']['input'];
};


export type MutationApproveUpgradeToAssociateProArgs = {
  id: Scalars['ID']['input'];
};


export type MutationApproveUserBvnArgs = {
  id: Scalars['ID']['input'];
};


export type MutationApproveUserKycArgs = {
  id: Scalars['ID']['input'];
};


export type MutationBuyAssetWithPaystackArgs = {
  buyAssetPaystackInput: BuyAssetPaystackInput;
};


export type MutationBuyAssetWithTransferArgs = {
  buyAssetTransferInput: BuyAssetTransferInput;
};


export type MutationBuyAssetWithWalletArgs = {
  buyAssetWalletInput: BuyAssetWalletInput;
};


export type MutationBuyFullOwnershipAssetByTransferArgs = {
  buyFullOwnershipAssetTransferInput?: InputMaybe<BuyFullOwnershipAssetTransferInput>;
};


export type MutationBuyFullOwnershipAssetByWalletArgs = {
  buyFullOwnershipAssetInput?: InputMaybe<BuyFullOwnershipAssetInput>;
};


export type MutationBuyFullOwnershipAssetWithPaystackArgs = {
  buyFullOwnershipAssetInput: BuyFullOwnershipAssetInput;
};


export type MutationClearUserTinArgs = {
  clearUserTinInput: ClearUserTinInput;
};


export type MutationCreateAgencyArgs = {
  createAgencyInput: CreateAgencyInput;
};


export type MutationCreateAssetUpdateRequestArgs = {
  createAssetUpdateRequestInput: AssetUpdateRequestInput;
};


export type MutationCreateCouponArgs = {
  createCouponInput: CreateCouponInput;
};


export type MutationCreateCustomRequestArgs = {
  createCustomRequestInput: CustomRequestInput;
};


export type MutationCreateDocumentChangeRequestArgs = {
  createDocumentChangeRequestInput: DocumentChangeRequestInput;
};


export type MutationCreateFlexAssetArgs = {
  createFlexAssetInput: CreateFlexAssetInput;
};


export type MutationCreateFullOwnershipAssetArgs = {
  createFullOwnershipAssetInput: CreateFullOwnershipAssetInput;
};


export type MutationCreateLocationChangeRequestArgs = {
  createLocationChangeInput: CreateLocationChangeInput;
};


export type MutationCreateRoleArgs = {
  createRoleInput: CreateRoleInput;
};


export type MutationCreateSubAdminArgs = {
  subAdminInput: SubAdminInput;
};


export type MutationCreateUsersFullOwnershipAssetArgs = {
  createUsersFullOwnershipAssetInput: CreateUsersFullOwnershipAssetInput;
};


export type MutationDeclineAssetTransactionArgs = {
  declineTransactionInput: DeclineTransactionInput;
};


export type MutationDeclineDocumentTransactionArgs = {
  declineTransactionInput: DeclineTransactionInput;
};


export type MutationDeclineTransactionArgs = {
  declineTransactionInput?: InputMaybe<DeclineTransactionInput>;
};


export type MutationDeclineUpgradeRequestArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeclineUserBvnArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeclineUserKycArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteAssetArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteCouponArgs = {
  couponCode: Scalars['String']['input'];
};


export type MutationDeleteUserFlexAssetArgs = {
  deleteUserFlexAssetInput: DeleteUserFullOwnershipAssetInput;
};


export type MutationDeleteUserFullOwnershipAssetArgs = {
  deleteFullOwnershipAssetInput: DeleteUserFullOwnershipAssetInput;
};


export type MutationDisableAssetArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDocumentPaymentPaystackArgs = {
  documentPaystackPaymentInput: DocumentPaystackPaymentInput;
};


export type MutationDocumentPaymentTransferArgs = {
  documentPaymentTransferInput?: InputMaybe<DocumentPaymentTransferInput>;
};


export type MutationDocumentPaymentWalletArgs = {
  documentPaymentInput?: InputMaybe<DocumentPaymentInput>;
};


export type MutationEditBankDetailsArgs = {
  bankInput?: InputMaybe<BankDetailInput>;
};


export type MutationEditFullOwnershipAssetArgs = {
  editFullOwnershipAssetInput: EditFullOwnershipAssetInput;
};


export type MutationEditKycInfoArgs = {
  kycInput?: InputMaybe<EditKycInput>;
};


export type MutationEditNextofKinInfoArgs = {
  nextofKinInput?: InputMaybe<NextofKinInput>;
};


export type MutationEditProfilePicArgs = {
  editprofilepicInfo?: InputMaybe<ProfilepicInput>;
};


export type MutationEditUserDetailsByAdminArgs = {
  userDetailsInput: UserDetailsInput;
};


export type MutationEditUserInfoArgs = {
  editprofileInto?: InputMaybe<EditProfileInfo>;
};


export type MutationEditUserWalletDetailsByAdminArgs = {
  adminWalletInput: AdminWalletInput;
};


export type MutationEditWalletCommissionArgs = {
  adminWalletCommissionInput: AdminWalletCommissionInput;
};


export type MutationEnableAssetArgs = {
  id: Scalars['ID']['input'];
};


export type MutationFaqEmailArgs = {
  faqEmailInput?: InputMaybe<FaqEmailInput>;
};


export type MutationInitializeDocumentWithPaystackArgs = {
  initializeDocumentPaystackInput: InitializeDocumentPaystackInput;
};


export type MutationInitializeFullOwnershipPaystackTransactionArgs = {
  initializePaystackInput?: InputMaybe<InitializeFullOwnershipPaystackInput>;
};


export type MutationInitializeFullOwnershipRecurringPaystackArgs = {
  initializeRecurringPaystackInput: InitializeRecurringFullOwnershipAssetPaystack;
};


export type MutationInitializePaystackTransactionArgs = {
  initializePaystackInput: InitializePaystackInput;
};


export type MutationInitializeRecurringPaystackArgs = {
  initializeRecurringPaystackInput: InitializeRecurringPaystackInput;
};


export type MutationInitializeUpgradeToAssociateProArgs = {
  amount: Scalars['Float']['input'];
  callback_url: Scalars['String']['input'];
};


export type MutationJoinCommunityEmailArgs = {
  joinCommunityInput?: InputMaybe<JoinCommunityInput>;
};


export type MutationModifyUserReferralStatusArgs = {
  modifyReferralInput: ModifyReferralInput;
};


export type MutationProcessCommissionArgs = {
  processCommissionInput: ProcessCommissionInput;
};


export type MutationProcessReceiptArgs = {
  processReceiptInput: ProcessReceiptInput;
};


export type MutationReactivateAgencyArgs = {
  agencyId: Scalars['ID']['input'];
};


export type MutationReccurringAssetWithPaystackArgs = {
  reccurringAssetPaystackInput: ReccurringAssetPaystackInput;
};


export type MutationRecurringAssetPaymentTransferArgs = {
  recurringAssetTransferInput: RecurringAssetTransferInput;
};


export type MutationRecurringAssetPaymentWalletArgs = {
  recurringAssetWalletInput: RecurringAssetWalletInput;
};


export type MutationRecurringFullOwnershipAssetByTransferArgs = {
  recurringFullOwnershipAssetTransferInput?: InputMaybe<RecurringFullOwnershipAssetTransferInput>;
};


export type MutationRecurringFullOwnershipAssetByWalletArgs = {
  recurringFullOwnershipAssetWalletInput?: InputMaybe<RecurringFullOwnershipAssetWalletInput>;
};


export type MutationRecurringFullOwnershipAssetPaymentWithPaystackArgs = {
  RecurringFullOwnershipAssetPaystackInput: RecurringFullOwnershipAssetPaystackInput;
};


export type MutationRemoveReferralByAdminArgs = {
  referralUpdateInput: ReferralUpdateInput;
};


export type MutationRemoveUserAssetByAdminArgs = {
  removeAssetInput: RemoveAssetInput;
};


export type MutationSaveAssetArgs = {
  id: Scalars['ID']['input'];
};


export type MutationSendAdminEmailVerificationArgs = {
  emailInput: EmailInput;
};


export type MutationSendAssetStatementsToAdminArgs = {
  adminEmail: Scalars['String']['input'];
  assetId: Scalars['ID']['input'];
};


export type MutationSendCertificateByEmailArgs = {
  email: Scalars['String']['input'];
  uniqueAssetId: Scalars['String']['input'];
};


export type MutationSendContractsByAdminArgs = {
  unique_asset_id: Scalars['String']['input'];
};


export type MutationSendEmailVerificationArgs = {
  emailInput: EmailInput;
};


export type MutationSendFlexTermsAndConditionEmailArgs = {
  email: Scalars['String']['input'];
  uniqueAssetId: Scalars['String']['input'];
};


export type MutationSendHamperNotificationEmailArgs = {
  email: Scalars['String']['input'];
  uniqueAssetId: Scalars['String']['input'];
};


export type MutationSendTermsAndConditionMailArgs = {
  emailInput: EmailInput;
};


export type MutationSigninAdminArgs = {
  signinAdminInput: AdminSigninInput;
};


export type MutationSigninUserArgs = {
  signinInput: SigninInput;
};


export type MutationSignupAdminArgs = {
  signupAdminInput: AdminSignupInput;
};


export type MutationSignupUserArgs = {
  signupInput: SignupInput;
};


export type MutationSuspendAgencyArgs = {
  suspendAgencyInput: SuspendAgencyInput;
};


export type MutationSuspendPaymentPlanArgs = {
  id: Scalars['String']['input'];
};


export type MutationSuspendUserArgs = {
  id: Scalars['ID']['input'];
};


export type MutationSystemApproveAssetUpdateRequestArgs = {
  requestId: Scalars['ID']['input'];
};


export type MutationSystemApproveDocumentChangeRequestArgs = {
  requestId: Scalars['ID']['input'];
};


export type MutationSystemApproveLocationChangeRequestArgs = {
  requestId: Scalars['ID']['input'];
};


export type MutationTopUpWalletArgs = {
  topupInput?: InputMaybe<TopupInput>;
};


export type MutationTopUpWalletTransferArgs = {
  topuptransferInput?: InputMaybe<TopupTransferInput>;
};


export type MutationTopWalletUpArgs = {
  topUpInput?: InputMaybe<TopUpInput>;
};


export type MutationUnSuspendPaymentPlanArgs = {
  id: Scalars['String']['input'];
};


export type MutationUnsuspendUserArgs = {
  id: Scalars['ID']['input'];
};


export type MutationUpdateAdminPasswordArgs = {
  passwordInput: PasswordInput;
};


export type MutationUpdateAdminRoleArgs = {
  updateAdminRoleInput?: InputMaybe<UpdateAdminRoleInput>;
};


export type MutationUpdateAgencyCommissionArgs = {
  updateAgencyCommissionInput: UpdateAgencyCommissionInput;
};


export type MutationUpdateAssetArgs = {
  updateAssetInput: UpdateFlexAssetInput;
};


export type MutationUpdateCouponArgs = {
  updateCouponInput: UpdateCouponInput;
};


export type MutationUpdateCouponStatusArgs = {
  updateCouponStatusInput: UpdateCouponStatusInput;
};


export type MutationUpdateKycInfoArgs = {
  kycInput?: InputMaybe<KycInput>;
};


export type MutationUpdateNextofKinInfoArgs = {
  nextofKinInput?: InputMaybe<NextofKinInput>;
};


export type MutationUpdatePasswordArgs = {
  passwordInput: PasswordInput;
};


export type MutationUpdatePaymentPlanArgs = {
  paymentPlanInput: PaymentPlanInput;
};


export type MutationUpdateProfileInfoArgs = {
  profileInput: ProfileInput;
};


export type MutationUpdateRequestStatusArgs = {
  updateRequestInput: UpdateRequestInput;
};


export type MutationUpdateUserAssetQuestionArgs = {
  editUserAssetQuestionInput: EditUserAssetQuestionInput;
};


export type MutationUpdateUserPaymentDetailsArgs = {
  userPaymentDetailsInput: UserPaymentDetailsInput;
};


export type MutationUpdateUserTinArgs = {
  updateUserTinInput: UpdateUserTinInput;
};


export type MutationUpgradeToAssociateProArgs = {
  amount: Scalars['Float']['input'];
  bankName: Scalars['String']['input'];
  file_Url: Scalars['String']['input'];
  reference_no: Scalars['String']['input'];
};


export type MutationVerifyAdminEmailArgs = {
  tokenInput?: InputMaybe<TokenInput>;
};


export type MutationVerifyEmailArgs = {
  tokenInput?: InputMaybe<TokenInput>;
};


export type MutationWithdrawWalletArgs = {
  withdrawInput?: InputMaybe<WithdrawInput>;
};


export type MutationWithdrawWalletOtpArgs = {
  withdrawOtpInput?: InputMaybe<WithdrawOtpInput>;
};


export type MutationWithdrawWalletTransferArgs = {
  withdrawTransferInput?: InputMaybe<WithdrawTransferInput>;
};


export type MutationWithdrwalFromWalletArgs = {
  withdrawalInput?: InputMaybe<WithdrawalDetails>;
};

export type MyAgencyDashboardData = {
  __typename?: 'MyAgencyDashboardData';
  clientInsights: ClientInsights;
  financeSnapshot: FinanceSnapshot;
  monthlyPerformance: Array<MonthlyPerformance>;
  performanceMetrics: PerformanceMetrics;
  topClients: Array<TopClient>;
  upcomingPayments: Array<UpcomingPayment>;
};

export type MyAgencyDashboardResponse = {
  __typename?: 'MyAgencyDashboardResponse';
  data: MyAgencyDashboardData;
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type NextofKin = {
  __typename?: 'NextofKin';
  _id: Scalars['ID']['output'];
  address?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  firstName?: Maybe<Scalars['String']['output']>;
  lastName?: Maybe<Scalars['String']['output']>;
  phoneNumber?: Maybe<Scalars['String']['output']>;
  relationship?: Maybe<Scalars['String']['output']>;
};

export type NextofKinInput = {
  address: Scalars['String']['input'];
  email: Scalars['String']['input'];
  firstName: Scalars['String']['input'];
  lastName: Scalars['String']['input'];
  phoneNumber: Scalars['String']['input'];
  relationship: Scalars['String']['input'];
};

export type NextofKinResponse = {
  __typename?: 'NextofKinResponse';
  data?: Maybe<NextofKin>;
  success: Scalars['Boolean']['output'];
};

export type PaginationInfo = {
  __typename?: 'PaginationInfo';
  currentPage: Scalars['Int']['output'];
  hasNextPage: Scalars['Boolean']['output'];
  hasPrevPage: Scalars['Boolean']['output'];
  limit: Scalars['Int']['output'];
  page: Scalars['Int']['output'];
  pages: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
  totalClients: Scalars['Int']['output'];
  totalCount: Scalars['Int']['output'];
  totalPages: Scalars['Int']['output'];
};

export type PasswordInput = {
  password?: InputMaybe<Scalars['String']['input']>;
};

export type PaymentDetails = {
  __typename?: 'PaymentDetails';
  amount_paid?: Maybe<Scalars['Float']['output']>;
  amount_payable?: Maybe<Scalars['Float']['output']>;
  asset?: Maybe<Scalars['String']['output']>;
  asset_price?: Maybe<Scalars['Float']['output']>;
  asset_type?: Maybe<Scalars['String']['output']>;
  balance?: Maybe<Scalars['Float']['output']>;
  default_amount?: Maybe<Scalars['Float']['output']>;
  fullownerhsip_documentprice?: Maybe<Scalars['Float']['output']>;
  fullownerhsip_landprice?: Maybe<Scalars['Float']['output']>;
  is_suspended?: Maybe<Scalars['Boolean']['output']>;
  month_remaining?: Maybe<Scalars['Int']['output']>;
  month_subscription?: Maybe<Scalars['Int']['output']>;
  months_covered?: Maybe<Scalars['Int']['output']>;
  next_date_of_payment?: Maybe<Scalars['Date']['output']>;
  no_of_units?: Maybe<Scalars['Int']['output']>;
  size?: Maybe<Scalars['String']['output']>;
  start_date?: Maybe<Scalars['Date']['output']>;
  unique_asset_id?: Maybe<Scalars['String']['output']>;
};

export type PaymentPlan = {
  __typename?: 'PaymentPlan';
  amount_paid?: Maybe<Scalars['Float']['output']>;
  amount_payable?: Maybe<Scalars['Float']['output']>;
  asset: Scalars['ID']['output'];
  asset_price?: Maybe<Scalars['Float']['output']>;
  asset_type?: Maybe<Scalars['String']['output']>;
  balance?: Maybe<Scalars['Float']['output']>;
  createdAt?: Maybe<Scalars['String']['output']>;
  default_amount?: Maybe<Scalars['Float']['output']>;
  end_date?: Maybe<Scalars['String']['output']>;
  fullownership_documentprice?: Maybe<Scalars['Float']['output']>;
  fullownership_landprice?: Maybe<Scalars['Float']['output']>;
  is_suspended?: Maybe<Scalars['Boolean']['output']>;
  month_remaining?: Maybe<Scalars['Int']['output']>;
  month_subscription?: Maybe<Scalars['Int']['output']>;
  months_covered?: Maybe<Scalars['Int']['output']>;
  next_date_of_payment?: Maybe<Scalars['String']['output']>;
  no_of_units?: Maybe<Scalars['Int']['output']>;
  size?: Maybe<Scalars['Int']['output']>;
  start_date?: Maybe<Scalars['String']['output']>;
  transaction: Array<Scalars['ID']['output']>;
  unique_asset_id?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['String']['output']>;
  user: Scalars['ID']['output'];
};

export type PaymentPlanInput = {
  assetId?: InputMaybe<Scalars['String']['input']>;
  next_date_of_payment?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type PerformanceMetrics = {
  __typename?: 'PerformanceMetrics';
  assetValue: Scalars['Float']['output'];
  commissionEarned: Scalars['Float']['output'];
  pendingCommission: Scalars['Float']['output'];
  propertiesSold: Scalars['Int']['output'];
  totalAmountPaid: Scalars['Float']['output'];
  totalBalance: Scalars['Float']['output'];
};

export type Permission = {
  __typename?: 'Permission';
  _id: Scalars['ID']['output'];
  description?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
};

export type PermissionResponse = {
  __typename?: 'PermissionResponse';
  data: Array<Permission>;
  success: Scalars['Boolean']['output'];
};

export type PreviousAllocation = {
  __typename?: 'PreviousAllocation';
  block: Scalars['String']['output'];
  plot: Scalars['String']['output'];
};

export type ProcessCommissionInput = {
  commissionTypes?: InputMaybe<Array<Scalars['String']['input']>>;
  transactionId: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};

export type ProcessReceiptInput = {
  transactionId: Scalars['String']['input'];
};

export type ProfileInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  country?: InputMaybe<Scalars['String']['input']>;
  date_of_birth?: InputMaybe<Scalars['String']['input']>;
  employment_status?: InputMaybe<Scalars['String']['input']>;
  gender?: InputMaybe<Scalars['String']['input']>;
  marital_status?: InputMaybe<Scalars['String']['input']>;
  occupation?: InputMaybe<Scalars['String']['input']>;
  profile_pic?: InputMaybe<Scalars['String']['input']>;
};

export type ProfilepicInput = {
  profile_pic?: InputMaybe<Scalars['String']['input']>;
};

export type PromoDetails = {
  __typename?: 'PromoDetails';
  daysElapsed?: Maybe<Scalars['Int']['output']>;
  daysRemaining?: Maybe<Scalars['Int']['output']>;
  endDate?: Maybe<Scalars['String']['output']>;
  percentageDaysRemaining?: Maybe<Scalars['Float']['output']>;
  startDate?: Maybe<Scalars['String']['output']>;
  totalPromoDays?: Maybe<Scalars['Int']['output']>;
};

export type PromoDetailsHamper = {
  __typename?: 'PromoDetailsHamper';
  daysElapsed?: Maybe<Scalars['Int']['output']>;
  daysRemaining?: Maybe<Scalars['Int']['output']>;
  endDate?: Maybe<Scalars['String']['output']>;
  percentageDaysRemaining?: Maybe<Scalars['Float']['output']>;
  startDate?: Maybe<Scalars['String']['output']>;
  totalPromoDays?: Maybe<Scalars['Int']['output']>;
};

export type Purchase = {
  __typename?: 'Purchase';
  _id: Scalars['ID']['output'];
  land_size_id: Scalars['ID']['output'];
  payment_plan_id: Scalars['ID']['output'];
  total_amount: Scalars['Float']['output'];
  units: Scalars['Int']['output'];
  user_id: Scalars['ID']['output'];
};

export type QualifiedUser = {
  __typename?: 'QualifiedUser';
  assetName?: Maybe<Scalars['String']['output']>;
  assetSize?: Maybe<Scalars['Int']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  firstName?: Maybe<Scalars['String']['output']>;
  lastName?: Maybe<Scalars['String']['output']>;
  paymentPercentage?: Maybe<Scalars['String']['output']>;
  phoneNumber?: Maybe<Scalars['String']['output']>;
  referralStatus?: Maybe<Scalars['String']['output']>;
};

export type QualifiedUsersResponse = {
  __typename?: 'QualifiedUsersResponse';
  qualifiedUsers: Array<QualifiedUser>;
};

export type Query = {
  __typename?: 'Query';
  adminTransactionDataPoint?: Maybe<DataPointResponse>;
  eligibleClientsForLand: EligibleClientsForLandResponse;
  flexQualifiedUsers?: Maybe<QualifiedUsersResponse>;
  fullownershipQualifiedUsers?: Maybe<QualifiedUsersResponse>;
  generateAdminOtp?: Maybe<Scalars['String']['output']>;
  getActiveCoupons: CouponsResponse;
  getAdminDashboardDetails?: Maybe<AdminDashboard>;
  getAdminTransactionDetails?: Maybe<Transactions>;
  getAdminWithRole: SingleAdminWithRoleResponse;
  getAgencyById: AgencyResponse;
  getAgencyDashboard: AgencyDashboardResponse;
  getAllAdminAssets?: Maybe<AssetAdminResponse>;
  getAllAdminLogs?: Maybe<LogAdminResponse>;
  getAllAdminWithRoles: AdminRoleResponse;
  getAllAgencies: AgenciesResponse;
  getAllClientRequests: Scalars['JSON']['output'];
  getAllCoupons: CouponsResponse;
  getAllDefaultUsers?: Maybe<UserAdminResponse>;
  getAllPermissions: PermissionResponse;
  getAllRoles: RoleResponse;
  getAllSuspendedUsers?: Maybe<UserAdminResponse>;
  getAllUpgradeRequests: UpgradeRequestsResponse;
  getAllUsers?: Maybe<UserAdminResponse>;
  getAllUsersWithFilters?: Maybe<FilteredUserAdminResponse>;
  getAssetInventoryData?: Maybe<AssetInventoryResponse>;
  getAssetTransaction?: Maybe<TransactionAdminResponse>;
  getAssetTransactionData?: Maybe<TransactionAdminAssetResponse>;
  getAvailableAssets?: Maybe<AssetResponse>;
  getCampaignHampers?: Maybe<CampaignHamperResponse>;
  getCampaignPaymentPlans?: Maybe<CampaignPaymentPlansResponse>;
  getClientOverview: ClientOverviewResponse;
  getCommissionTransactions?: Maybe<TransactionAdminResponse>;
  getCommissionTransactionsDetails: CommissionTransactionsResponse;
  getCoupon: CouponResponse;
  getCustomerAsset?: Maybe<Array<Maybe<UserAsset>>>;
  getDocumentTransaction?: Maybe<TransactionAdminResponse>;
  getHamperLeaderboard: Array<HamperLeaderboardEntry>;
  getLastActiveAssetPayment: LastActiveAssetPaymentResponse;
  getListOfAllTransactions?: Maybe<TransactionAdminResponse>;
  getListOfBankDetails?: Maybe<Scalars['JSON']['output']>;
  getListOfPendingTransactions?: Maybe<TransactionAdminResponse>;
  getListOfSuccessfulTransactions?: Maybe<TransactionAdminResponse>;
  getMyAgencyDashboard: MyAgencyDashboardResponse;
  getMyRequests?: Maybe<Scalars['JSON']['output']>;
  getRaffleTickets?: Maybe<RaffleTicketResponse>;
  getRequestById?: Maybe<Scalars['JSON']['output']>;
  getRequestByIdAdmin: Scalars['JSON']['output'];
  getRequestStatistics: RequestStatistics;
  getSalesDashboard?: Maybe<SalesDashboard>;
  getSalesRecord?: Maybe<SalesRecordResponse>;
  getSingleAdminLogs?: Maybe<SingleAdminLogResponse>;
  getSoldAssets?: Maybe<AssetResponse>;
  getSuspendedPaymentPlans?: Maybe<SuspendedPaymentPlansResponse>;
  getSystemUsersOverview: SystemUsersOverviewResponse;
  getTopAssociates?: Maybe<AssociateResponse>;
  getTopupTransaction?: Maybe<TransactionAdminResponse>;
  getTransactionCommissionDetails: CommissionResponse;
  getTransactionDetails?: Maybe<TransactionResponse>;
  getTransferTransactions?: Maybe<TransactionAdminResponse>;
  getTrendingAssets?: Maybe<AssetResponse>;
  getUserAssetFinancialOverview?: Maybe<AssetFinancialOverview>;
  getUserBankDetails?: Maybe<BankDetailResponse>;
  getUserDetails: UserResponse;
  getUserDetailsByAdmin?: Maybe<UserAdminDetail>;
  getUserNextofKinDetails: NextofKinResponse;
  getUserReferrals?: Maybe<ReferralResponse>;
  getUserRefreshDetails: UserDetailResponse;
  getUserWalletDetails?: Maybe<WalletResponse>;
  getUsersWithZeroBalance: ZeroBalanceResponse;
  getWithdrawalTransaction?: Maybe<TransactionAdminResponse>;
  removeUserBankDetails: Scalars['String']['output'];
  sendOtpVerfication?: Maybe<Scalars['String']['output']>;
  usersWithAsset?: Maybe<UserAssetResponse>;
  validateAdminOtp?: Maybe<Scalars['String']['output']>;
  viewAllAssets?: Maybe<AssetResponse>;
  viewAllFlexAssets?: Maybe<FlexAssetResponse>;
  viewAllWebsiteAssets?: Maybe<AssetResponse>;
  viewAsset: Asset;
  viewAssetByName?: Maybe<AssetDetailByNameResponse>;
  viewAssetHamperPerformance?: Maybe<AssetHamperPerformanceResponse>;
  viewAssetOptionDataByName?: Maybe<AssetSizeDetailsResponse>;
  viewAssetRaffledrawPerformance?: Maybe<AssetRafflePerformanceResponse>;
  viewAssetUsers?: Maybe<Array<Maybe<UserAdminResponse>>>;
  viewAssets?: Maybe<AssetResponse>;
  viewFlexAsset: FlexAsset;
  viewSavedAssets?: Maybe<AssetResponse>;
  viewSubscribedAssets?: Maybe<SubscribedAssetResponse>;
  viewSubscribedCustomersOnAsset: SubscribedCustomerDetailsResponse;
  viewUserAsset: ViewUserAssetResponse;
  viewUserAssetByAdmin?: Maybe<Array<Maybe<SubscribedAssets>>>;
  viewUserAssetByUniqueId: SubscribedAssetDetails;
  viewUserReferralsByAdmin?: Maybe<Array<Maybe<AdminReferral>>>;
};


export type QueryAdminTransactionDataPointArgs = {
  dataPointInput: DataPointInput;
};


export type QueryEligibleClientsForLandArgs = {
  filters?: InputMaybe<FiltersInput>;
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
};


export type QueryGetAdminDashboardDetailsArgs = {
  endDate?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetAdminTransactionDetailsArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetAdminWithRoleArgs = {
  adminId: Scalars['String']['input'];
};


export type QueryGetAgencyByIdArgs = {
  agencyId: Scalars['ID']['input'];
};


export type QueryGetAllAdminAssetsArgs = {
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
};


export type QueryGetAllAdminLogsArgs = {
  action?: InputMaybe<Scalars['String']['input']>;
  adminEmail?: InputMaybe<Scalars['String']['input']>;
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
};


export type QueryGetAllAgenciesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  searchQuery?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetAllClientRequestsArgs = {
  filters?: InputMaybe<ClientRequestFilters>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryGetAllDefaultUsersArgs = {
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
};


export type QueryGetAllSuspendedUsersArgs = {
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
};


export type QueryGetAllUpgradeRequestsArgs = {
  adminStatus?: InputMaybe<AdminStatus>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  transactionType?: InputMaybe<TransactionType>;
};


export type QueryGetAllUsersArgs = {
  hasAsset?: InputMaybe<Scalars['Boolean']['input']>;
  hasReferral?: InputMaybe<Scalars['Boolean']['input']>;
  howDidYouHearAboutUs?: InputMaybe<Scalars['String']['input']>;
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
  referralStatus?: InputMaybe<Scalars['String']['input']>;
  searchQuery?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetAllUsersWithFiltersArgs = {
  hasAsset?: InputMaybe<Scalars['Boolean']['input']>;
  hasReferral?: InputMaybe<Scalars['Boolean']['input']>;
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
  referralStatus?: InputMaybe<Scalars['String']['input']>;
  searchQuery?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetAssetTransactionArgs = {
  assetType?: InputMaybe<Scalars['String']['input']>;
  endDate?: InputMaybe<Scalars['Date']['input']>;
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
  salesType?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['Date']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  transactionType?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetAssetTransactionDataArgs = {
  filters?: InputMaybe<AssetTransactionFilters>;
};


export type QueryGetCampaignHampersArgs = {
  endDate?: InputMaybe<Scalars['String']['input']>;
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
  startDate?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetCampaignPaymentPlansArgs = {
  endDate?: InputMaybe<Scalars['String']['input']>;
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
  startDate?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetClientOverviewArgs = {
  filters?: InputMaybe<ClientOverviewFilters>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  sortBy?: InputMaybe<Scalars['String']['input']>;
  sortOrder?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetCommissionTransactionsArgs = {
  endDate?: InputMaybe<Scalars['String']['input']>;
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
  startDate?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetCommissionTransactionsDetailsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryGetCouponArgs = {
  couponCode: Scalars['String']['input'];
};


export type QueryGetDocumentTransactionArgs = {
  endDate?: InputMaybe<Scalars['Date']['input']>;
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['Date']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  transactionType?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetHamperLeaderboardArgs = {
  endDate?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetListOfAllTransactionsArgs = {
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
};


export type QueryGetListOfPendingTransactionsArgs = {
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
};


export type QueryGetListOfSuccessfulTransactionsArgs = {
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
};


export type QueryGetMyRequestsArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  requestType?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetRaffleTicketsArgs = {
  ticketType?: InputMaybe<TicketTypeFilter>;
};


export type QueryGetRequestByIdArgs = {
  requestId: Scalars['String']['input'];
};


export type QueryGetRequestByIdAdminArgs = {
  requestId: Scalars['ID']['input'];
};


export type QueryGetRequestStatisticsArgs = {
  dateRange?: InputMaybe<DateRangeInput>;
};


export type QueryGetSalesRecordArgs = {
  filters?: InputMaybe<SalesRecordFilters>;
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
};


export type QueryGetSingleAdminLogsArgs = {
  adminId: Scalars['String']['input'];
};


export type QueryGetSuspendedPaymentPlansArgs = {
  assetType?: InputMaybe<Scalars['String']['input']>;
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
  searchQuery?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['Date']['input']>;
};


export type QueryGetTopAssociatesArgs = {
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
  sortBy?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetTopupTransactionArgs = {
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
};


export type QueryGetTransactionCommissionDetailsArgs = {
  userId: Scalars['ID']['input'];
};


export type QueryGetTransferTransactionsArgs = {
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
};


export type QueryGetUserAssetFinancialOverviewArgs = {
  assetType: Scalars['String']['input'];
};


export type QueryGetUserDetailsByAdminArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetUsersWithZeroBalanceArgs = {
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
};


export type QueryGetWithdrawalTransactionArgs = {
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
  status?: InputMaybe<Scalars['String']['input']>;
};


export type QueryUsersWithAssetArgs = {
  assetType?: InputMaybe<Scalars['String']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  searchQuery?: InputMaybe<Scalars['String']['input']>;
};


export type QueryValidateAdminOtpArgs = {
  token?: InputMaybe<Scalars['String']['input']>;
};


export type QueryViewAssetArgs = {
  id: Scalars['ID']['input'];
};


export type QueryViewAssetByNameArgs = {
  assetName: Scalars['String']['input'];
  assetType?: InputMaybe<Scalars['String']['input']>;
};


export type QueryViewAssetOptionDataByNameArgs = {
  assetName: Scalars['String']['input'];
  assetType?: InputMaybe<Scalars['String']['input']>;
};


export type QueryViewAssetUsersArgs = {
  id: Scalars['ID']['input'];
};


export type QueryViewAssetsArgs = {
  assetType: Scalars['String']['input'];
};


export type QueryViewFlexAssetArgs = {
  id: Scalars['ID']['input'];
};


export type QueryViewSubscribedAssetsArgs = {
  assetType: Scalars['String']['input'];
};


export type QueryViewSubscribedCustomersOnAssetArgs = {
  assetName: Scalars['String']['input'];
  assetType?: InputMaybe<Scalars['String']['input']>;
  endDate?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  size?: InputMaybe<Scalars['Int']['input']>;
  startDate?: InputMaybe<Scalars['String']['input']>;
  subscriberType?: InputMaybe<Scalars['String']['input']>;
};


export type QueryViewUserAssetArgs = {
  filterByType?: InputMaybe<Scalars['String']['input']>;
};


export type QueryViewUserAssetByAdminArgs = {
  id: Scalars['ID']['input'];
};


export type QueryViewUserAssetByUniqueIdArgs = {
  uniqueAssetId: Scalars['String']['input'];
};


export type QueryViewUserReferralsByAdminArgs = {
  id: Scalars['ID']['input'];
};

export type RaffleAsset = {
  __typename?: 'RaffleAsset';
  _id: Scalars['ID']['output'];
  asset_location?: Maybe<Scalars['String']['output']>;
  asset_name?: Maybe<Scalars['String']['output']>;
  asset_pictures?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  asset_price?: Maybe<Scalars['Float']['output']>;
  asset_type?: Maybe<Scalars['String']['output']>;
  asset_unit?: Maybe<Scalars['Int']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

export type RaffleTicket = {
  __typename?: 'RaffleTicket';
  asset_id: RaffleAsset;
  asset_name: Scalars['String']['output'];
  created_date: Scalars['Date']['output'];
  is_active: Scalars['Boolean']['output'];
  referral_ticket?: Maybe<RaffleTicket>;
  referrer_id?: Maybe<RaffleUsers>;
  size_purchased: Scalars['Float']['output'];
  ticket_id: Scalars['String']['output'];
  ticket_type: Scalars['String']['output'];
  total_size: Scalars['Float']['output'];
  units_purchased: Scalars['Float']['output'];
  user_id?: Maybe<RaffleUsers>;
};

export type RaffleTicketResponse = {
  __typename?: 'RaffleTicketResponse';
  data: Array<RaffleTicket>;
  success: Scalars['Boolean']['output'];
};

export type RaffleUsers = {
  __typename?: 'RaffleUsers';
  _id: Scalars['ID']['output'];
  address?: Maybe<Scalars['String']['output']>;
  country?: Maybe<Scalars['String']['output']>;
  date_of_birth?: Maybe<Scalars['Date']['output']>;
  email: Scalars['String']['output'];
  employment_status?: Maybe<Scalars['String']['output']>;
  firstName: Scalars['String']['output'];
  gender?: Maybe<Scalars['String']['output']>;
  lastName: Scalars['String']['output'];
  phoneNumber?: Maybe<Scalars['String']['output']>;
  profile_pic?: Maybe<Scalars['String']['output']>;
  referral_status?: Maybe<Scalars['String']['output']>;
  userName?: Maybe<Scalars['String']['output']>;
};

export type RealtorMetrics = {
  __typename?: 'RealtorMetrics';
  activeRealtors: Scalars['Int']['output'];
  avgPlotsSoldPerRealtor: Scalars['Float']['output'];
  inactiveRealtors: Scalars['Int']['output'];
  totalRealtors: Scalars['Int']['output'];
};

export type ReccurringAssetPaystackInput = {
  amount?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  paystack_reference?: InputMaybe<Scalars['String']['input']>;
  unique_asset_id?: InputMaybe<Scalars['String']['input']>;
};

export type RecurringAssetTransferInput = {
  amount?: InputMaybe<Scalars['String']['input']>;
  bank_name?: InputMaybe<Scalars['String']['input']>;
  file?: InputMaybe<Scalars['String']['input']>;
  reference_no?: InputMaybe<Scalars['String']['input']>;
  unique_asset_id?: InputMaybe<Scalars['String']['input']>;
};

export type RecurringAssetWalletInput = {
  amount?: InputMaybe<Scalars['String']['input']>;
  unique_asset_id?: InputMaybe<Scalars['String']['input']>;
};

export type RecurringFullOwnershipAssetPaystackInput = {
  amount?: InputMaybe<Scalars['String']['input']>;
  assetId?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  paystackReference?: InputMaybe<Scalars['String']['input']>;
  unique_asset_id?: InputMaybe<Scalars['String']['input']>;
};

export type RecurringFullOwnershipAssetTransferInput = {
  amount?: InputMaybe<Scalars['String']['input']>;
  bank_name?: InputMaybe<Scalars['String']['input']>;
  file?: InputMaybe<Scalars['String']['input']>;
  reference_no?: InputMaybe<Scalars['String']['input']>;
  unique_asset_id?: InputMaybe<Scalars['String']['input']>;
};

export type RecurringFullOwnershipAssetWalletInput = {
  amount?: InputMaybe<Scalars['String']['input']>;
  unique_asset_id?: InputMaybe<Scalars['String']['input']>;
};

export type Referral = {
  __typename?: 'Referral';
  _id: Scalars['ID']['output'];
  commission?: Maybe<Scalars['Float']['output']>;
  createdAt?: Maybe<Scalars['Date']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  phoneNumber?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
};

export type ReferralPaymentDetails = {
  __typename?: 'ReferralPaymentDetails';
  paymentPlan?: Maybe<Array<Maybe<PaymentPlan>>>;
  referral?: Maybe<Referral>;
};

export type ReferralResponse = {
  __typename?: 'ReferralResponse';
  data?: Maybe<Array<Maybe<ReferralPaymentDetails>>>;
  referral_link?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
};

export type ReferralStatusCounts = {
  __typename?: 'ReferralStatusCounts';
  associate: Scalars['Int']['output'];
  associatePro: Scalars['Int']['output'];
  user: Scalars['Int']['output'];
};

export type ReferralUpdateInput = {
  referral_id?: InputMaybe<Scalars['String']['input']>;
  user_id?: InputMaybe<Scalars['String']['input']>;
};

export type ReferralUpgrade = {
  __typename?: 'ReferralUpgrade';
  _id: Scalars['ID']['output'];
  admin_status?: Maybe<Scalars['String']['output']>;
  associate?: Maybe<User>;
  createdAt?: Maybe<Scalars['String']['output']>;
  fee_amount?: Maybe<Scalars['Float']['output']>;
  file_Url?: Maybe<Scalars['String']['output']>;
  transaction_type?: Maybe<Scalars['String']['output']>;
  user?: Maybe<User>;
  user_upgrade_type?: Maybe<Scalars['String']['output']>;
};

export type Referrer = {
  __typename?: 'Referrer';
  email?: Maybe<Scalars['String']['output']>;
  firstName: Scalars['String']['output'];
  lastName: Scalars['String']['output'];
};

export type ReferrerWithCombinedName = {
  __typename?: 'ReferrerWithCombinedName';
  email?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
};

export type ReferrerWithHampers = {
  __typename?: 'ReferrerWithHampers';
  email?: Maybe<Scalars['String']['output']>;
  hamperCount?: Maybe<Scalars['Int']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  totalSqmReferred?: Maybe<Scalars['Float']['output']>;
};

export type RemoveAssetInput = {
  asset_id?: InputMaybe<Scalars['String']['input']>;
  user_id?: InputMaybe<Scalars['String']['input']>;
};

export type ReoccurringFullownershipResponse = {
  __typename?: 'ReoccurringFullownershipResponse';
  data?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type RequestStatistics = {
  __typename?: 'RequestStatistics';
  approvedRequests?: Maybe<Scalars['Int']['output']>;
  assetUpdateRequests?: Maybe<Scalars['Int']['output']>;
  customRequests?: Maybe<Scalars['Int']['output']>;
  declinedRequests?: Maybe<Scalars['Int']['output']>;
  documentChangeRequests?: Maybe<Scalars['Int']['output']>;
  flexRequests?: Maybe<Scalars['Int']['output']>;
  fullOwnershipRequests?: Maybe<Scalars['Int']['output']>;
  locationChangeRequests?: Maybe<Scalars['Int']['output']>;
  paidRequests?: Maybe<Scalars['Int']['output']>;
  pendingAssetUpdateRequests?: Maybe<Scalars['Int']['output']>;
  pendingCustomRequests?: Maybe<Scalars['Int']['output']>;
  pendingDocumentChangeRequests?: Maybe<Scalars['Int']['output']>;
  pendingLocationChangeRequests?: Maybe<Scalars['Int']['output']>;
  pendingRequests?: Maybe<Scalars['Int']['output']>;
  totalFeesCollected?: Maybe<Scalars['Float']['output']>;
  totalRequests?: Maybe<Scalars['Int']['output']>;
  unpaidRequests?: Maybe<Scalars['Int']['output']>;
};

export type ResponseMessage = {
  __typename?: 'ResponseMessage';
  message: Scalars['String']['output'];
  transaction?: Maybe<Transactions>;
};

export type Role = {
  __typename?: 'Role';
  _id: Scalars['ID']['output'];
  description?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  permissions: Array<Scalars['String']['output']>;
};

export type RoleResponse = {
  __typename?: 'RoleResponse';
  data: Array<Role>;
  success: Scalars['Boolean']['output'];
};

export type SalesDashboard = {
  __typename?: 'SalesDashboard';
  expectedFlexTransactionValue?: Maybe<Scalars['Float']['output']>;
  expectedFullOwnershipTransactionValue?: Maybe<Scalars['Float']['output']>;
  expectedTransactionValue?: Maybe<Scalars['Float']['output']>;
  outstandingFlexTransactionValue?: Maybe<Scalars['Float']['output']>;
  outstandingFullOwnershipTransactionValue?: Maybe<Scalars['Float']['output']>;
  outstandingTransactionValue?: Maybe<Scalars['Float']['output']>;
  totalFlexTransactionValue?: Maybe<Scalars['Float']['output']>;
  totalFullOwnershipTransactionValue?: Maybe<Scalars['Float']['output']>;
  totalReceivedFlexTransactionValue?: Maybe<Scalars['Float']['output']>;
  totalReceivedFullOwnershipTransactionValue?: Maybe<Scalars['Float']['output']>;
  totalReceivedTransactionValue?: Maybe<Scalars['Float']['output']>;
  totalTransactionValue?: Maybe<Scalars['Float']['output']>;
};

export type SalesMetrics = {
  __typename?: 'SalesMetrics';
  dailySqmTargetRemaining?: Maybe<Scalars['Float']['output']>;
  percentageSold?: Maybe<Scalars['Float']['output']>;
  sqmRemainingToSell?: Maybe<Scalars['Float']['output']>;
  targetSqm?: Maybe<Scalars['Int']['output']>;
  totalSqmSold?: Maybe<Scalars['Float']['output']>;
};

export type SalesMetricsHamper = {
  __typename?: 'SalesMetricsHamper';
  dailySqmTargetRemaining?: Maybe<Scalars['Float']['output']>;
  percentageSold?: Maybe<Scalars['Float']['output']>;
  sqmRemainingToSell?: Maybe<Scalars['Float']['output']>;
  targetSqm?: Maybe<Scalars['Int']['output']>;
  totalSqmSold?: Maybe<Scalars['Float']['output']>;
};

export type SalesRecord = {
  __typename?: 'SalesRecord';
  allocation_date?: Maybe<Scalars['Date']['output']>;
  allocation_status?: Maybe<Scalars['String']['output']>;
  amount_paid?: Maybe<Scalars['Float']['output']>;
  amount_payable?: Maybe<Scalars['Float']['output']>;
  april_full_user?: Maybe<Scalars['Boolean']['output']>;
  asset_name?: Maybe<Scalars['String']['output']>;
  asset_type?: Maybe<Scalars['String']['output']>;
  balance?: Maybe<Scalars['Float']['output']>;
  block?: Maybe<Scalars['String']['output']>;
  default_amount?: Maybe<Scalars['Float']['output']>;
  document_amount_paid?: Maybe<Scalars['Float']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  end_date?: Maybe<Scalars['Date']['output']>;
  final_statement_sent?: Maybe<Scalars['Boolean']['output']>;
  first_statement_sent?: Maybe<Scalars['Boolean']['output']>;
  flex_email_sent?: Maybe<Scalars['Boolean']['output']>;
  fullownerhsip_documentprice?: Maybe<Scalars['Float']['output']>;
  fullownerhsip_landprice?: Maybe<Scalars['Float']['output']>;
  is_defaulted: Scalars['Boolean']['output'];
  is_suspended: Scalars['Boolean']['output'];
  month_remaining?: Maybe<Scalars['Int']['output']>;
  month_subscription?: Maybe<Scalars['Int']['output']>;
  months_covered?: Maybe<Scalars['Int']['output']>;
  next_date?: Maybe<Scalars['Date']['output']>;
  no_of_units?: Maybe<Scalars['Int']['output']>;
  payment_plan_created_at?: Maybe<Scalars['Date']['output']>;
  payment_plan_id?: Maybe<Scalars['ID']['output']>;
  payment_plan_updated_at?: Maybe<Scalars['Date']['output']>;
  plot?: Maybe<Scalars['String']['output']>;
  price?: Maybe<Scalars['Float']['output']>;
  referrer_email?: Maybe<Scalars['String']['output']>;
  referrer_name?: Maybe<Scalars['String']['output']>;
  referrer_phone?: Maybe<Scalars['String']['output']>;
  size?: Maybe<Scalars['Int']['output']>;
  start_date?: Maybe<Scalars['Date']['output']>;
  unique_asset_id?: Maybe<Scalars['String']['output']>;
  user_address?: Maybe<Scalars['String']['output']>;
  user_bvn_verification_status?: Maybe<Scalars['Boolean']['output']>;
  user_country?: Maybe<Scalars['String']['output']>;
  user_date_of_birth?: Maybe<Scalars['Date']['output']>;
  user_employment_status?: Maybe<Scalars['String']['output']>;
  user_firstName?: Maybe<Scalars['String']['output']>;
  user_gender?: Maybe<Scalars['String']['output']>;
  user_id: Scalars['ID']['output'];
  user_kyc_verification_status?: Maybe<Scalars['Boolean']['output']>;
  user_lastName?: Maybe<Scalars['String']['output']>;
  user_last_login?: Maybe<Scalars['Date']['output']>;
  user_marital_status?: Maybe<Scalars['String']['output']>;
  user_networth?: Maybe<Scalars['Float']['output']>;
  user_occupation?: Maybe<Scalars['String']['output']>;
  user_phone?: Maybe<Scalars['String']['output']>;
  user_profile_pic?: Maybe<Scalars['String']['output']>;
  user_referral_status?: Maybe<Scalars['String']['output']>;
  user_subscriptions?: Maybe<Scalars['Int']['output']>;
  user_userName?: Maybe<Scalars['String']['output']>;
  user_user_type?: Maybe<Scalars['String']['output']>;
  user_verified?: Maybe<Scalars['Boolean']['output']>;
  user_virtual_networth?: Maybe<Scalars['Float']['output']>;
  user_virtual_subscriptions?: Maybe<Scalars['Int']['output']>;
};

export type SalesRecordFilters = {
  assetType?: InputMaybe<Scalars['String']['input']>;
  nextDate?: InputMaybe<Scalars['Date']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['Date']['input']>;
};

export type SalesRecordResponse = {
  __typename?: 'SalesRecordResponse';
  count?: Maybe<Scalars['Int']['output']>;
  data?: Maybe<Array<Maybe<SalesRecord>>>;
};

export type SendHamperEmailResponse = {
  __typename?: 'SendHamperEmailResponse';
  emailSent: Scalars['Boolean']['output'];
  hamperCount?: Maybe<Scalars['Int']['output']>;
  hamperCreated: Scalars['Boolean']['output'];
  hamperId?: Maybe<Scalars['String']['output']>;
  message: Scalars['String']['output'];
  referrerEmail?: Maybe<Scalars['String']['output']>;
  referrerName?: Maybe<Scalars['String']['output']>;
  success: Scalars['Boolean']['output'];
  totalSqm?: Maybe<Scalars['Float']['output']>;
};

export type SigninInput = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type SignupInput = {
  email: Scalars['String']['input'];
  firstName: Scalars['String']['input'];
  howYouHearAboutUs?: InputMaybe<Scalars['String']['input']>;
  lastName: Scalars['String']['input'];
  password: Scalars['String']['input'];
  phoneNumber: Scalars['String']['input'];
  referral?: InputMaybe<Scalars['String']['input']>;
  userName: Scalars['String']['input'];
  user_type: Scalars['String']['input'];
};

export type SingleAdminLog = {
  __typename?: 'SingleAdminLog';
  count?: Maybe<Scalars['Int']['output']>;
  logs?: Maybe<Array<Maybe<SingleLog>>>;
};

export type SingleAdminLogResponse = {
  __typename?: 'SingleAdminLogResponse';
  data?: Maybe<SingleAdminLog>;
  success?: Maybe<Scalars['Boolean']['output']>;
};

export type SingleAdminWithRoleResponse = {
  __typename?: 'SingleAdminWithRoleResponse';
  data: AdminRoles;
  success: Scalars['Boolean']['output'];
};

export type SingleLog = {
  __typename?: 'SingleLog';
  _id: Scalars['ID']['output'];
  action?: Maybe<Scalars['String']['output']>;
  adminEmail?: Maybe<Scalars['String']['output']>;
  adminId?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  metadata?: Maybe<Scalars['JSON']['output']>;
  oldState?: Maybe<Scalars['JSON']['output']>;
  timestamp?: Maybe<Scalars['Date']['output']>;
};

export type StatementSendResponse = {
  __typename?: 'StatementSendResponse';
  failures?: Maybe<Array<Scalars['String']['output']>>;
  message: Scalars['String']['output'];
  statementsCount: Scalars['Int']['output'];
  success: Scalars['Boolean']['output'];
};

export type SubAdminInput = {
  email?: InputMaybe<Scalars['String']['input']>;
  role?: InputMaybe<Scalars['String']['input']>;
};

export type SubscribedAssetDetails = {
  __typename?: 'SubscribedAssetDetails';
  assetDetails?: Maybe<AssetDetailsInput>;
  assetQuestion?: Maybe<AssetQuestion>;
  asset_price?: Maybe<Scalars['Float']['output']>;
  documentPlan?: Maybe<DocumentPaymentPlan>;
  number_of_units?: Maybe<Scalars['Int']['output']>;
  paymentPlan?: Maybe<PaymentPlan>;
  purchase_date?: Maybe<Scalars['String']['output']>;
  unique_asset_id: Scalars['String']['output'];
};

export type SubscribedAssetDetailsForViewAsset = {
  __typename?: 'SubscribedAssetDetailsForViewAsset';
  assetDetails?: Maybe<ViewAssetDetails>;
  assetQuestion?: Maybe<Array<Maybe<AssetQuestion>>>;
  asset_price?: Maybe<Scalars['Float']['output']>;
  documentPlan?: Maybe<DocumentPaymentPlan>;
  number_of_units?: Maybe<Scalars['Int']['output']>;
  paymentPlan?: Maybe<PaymentPlan>;
  purchase_date?: Maybe<Scalars['String']['output']>;
  unique_asset_id: Scalars['String']['output'];
};

export type SubscribedAssetResponse = {
  __typename?: 'SubscribedAssetResponse';
  data?: Maybe<Array<Maybe<SubscribedAssets>>>;
  success?: Maybe<Scalars['Boolean']['output']>;
};

export type SubscribedAssets = {
  __typename?: 'SubscribedAssets';
  _id: Scalars['ID']['output'];
  amenities?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  asset_location?: Maybe<Scalars['String']['output']>;
  asset_name?: Maybe<Scalars['String']['output']>;
  asset_pictures?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  asset_price?: Maybe<Scalars['Float']['output']>;
  asset_questions?: Maybe<Array<Maybe<AssetQuestions>>>;
  asset_size?: Maybe<Scalars['Int']['output']>;
  asset_type?: Maybe<Scalars['String']['output']>;
  asset_unit?: Maybe<Scalars['Int']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  document_plan?: Maybe<DocumentPlan>;
  is_subscribed?: Maybe<Scalars['Boolean']['output']>;
  payment_details?: Maybe<PaymentDetails>;
  sold?: Maybe<Scalars['Boolean']['output']>;
  title?: Maybe<Scalars['String']['output']>;
};

export type SubscribedCustomerDetailsResponse = {
  __typename?: 'SubscribedCustomerDetailsResponse';
  completedPayments: Scalars['Int']['output'];
  defaultedUsers: Scalars['Int']['output'];
  earningReceived: Scalars['Float']['output'];
  expectedEarning: Scalars['Float']['output'];
  suspendedUsers: Scalars['Int']['output'];
  thirtyPercentUsers: Scalars['Int']['output'];
  totalPlotsSold: Scalars['Float']['output'];
  totalSQM: Scalars['Int']['output'];
  totalSubscribers: Scalars['Int']['output'];
  unitSold: Scalars['Int']['output'];
  userDetails: Array<SubscribedCustomersDetails>;
};

export type SuspendAgencyInput = {
  agencyId: Scalars['ID']['input'];
  reason: Scalars['String']['input'];
};

export type SuspendedPaymentPlans = {
  __typename?: 'SuspendedPaymentPlans';
  amount_paid?: Maybe<Scalars['Float']['output']>;
  asset_name?: Maybe<Scalars['String']['output']>;
  asset_type?: Maybe<Scalars['String']['output']>;
  balance?: Maybe<Scalars['Float']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  firstName?: Maybe<Scalars['String']['output']>;
  lastName?: Maybe<Scalars['String']['output']>;
  next_date?: Maybe<Scalars['Date']['output']>;
  no_of_units?: Maybe<Scalars['Int']['output']>;
  phoneNumber?: Maybe<Scalars['String']['output']>;
  referrer?: Maybe<Scalars['String']['output']>;
  size?: Maybe<Scalars['Int']['output']>;
  start_date?: Maybe<Scalars['Date']['output']>;
};

export type SuspendedPaymentPlansResponse = {
  __typename?: 'SuspendedPaymentPlansResponse';
  count?: Maybe<Scalars['Int']['output']>;
  data?: Maybe<Array<Maybe<SuspendedPaymentPlans>>>;
  success?: Maybe<Scalars['Boolean']['output']>;
};

export type SystemApproveAssetUpdateRequestResponse = {
  __typename?: 'SystemApproveAssetUpdateRequestResponse';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type SystemApproveDocumentChangeRequestResponse = {
  __typename?: 'SystemApproveDocumentChangeRequestResponse';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type SystemApproveLocationChangeRequestResponse = {
  __typename?: 'SystemApproveLocationChangeRequestResponse';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type SystemUsersMetrics = {
  __typename?: 'SystemUsersMetrics';
  active_associate: Scalars['Int']['output'];
  active_associate_pro: Scalars['Int']['output'];
  defaultUsers: Scalars['Int']['output'];
  flexSubscribers: Scalars['Int']['output'];
  fullOwnershipSubscribers: Scalars['Int']['output'];
  noReferralUsers: Scalars['Int']['output'];
  overdueUsers: Scalars['Int']['output'];
  referralStatusCounts: ReferralStatusCounts;
  totalUsers: Scalars['Int']['output'];
  users_with_assets: Scalars['Int']['output'];
};

export type SystemUsersOverviewResponse = {
  __typename?: 'SystemUsersOverviewResponse';
  metrics: SystemUsersMetrics;
  success: Scalars['Boolean']['output'];
};

export type TicketMetrics = {
  __typename?: 'TicketMetrics';
  associatePercentage?: Maybe<Scalars['Float']['output']>;
  associatesWithTickets?: Maybe<Scalars['Int']['output']>;
  regularUsersWithTickets?: Maybe<Scalars['Int']['output']>;
  totalTicketsIssued?: Maybe<Scalars['Int']['output']>;
  userTicketPercentage?: Maybe<Scalars['Float']['output']>;
};

export enum TicketTypeFilter {
  All = 'ALL',
  Referral = 'REFERRAL',
  User = 'USER'
}

export type TokenInput = {
  token: Scalars['String']['input'];
};

export type TopClient = {
  __typename?: 'TopClient';
  clientName: Scalars['String']['output'];
  outstandingBalance: Scalars['Float']['output'];
  potentialCommission: Scalars['Float']['output'];
  totalAssetValue: Scalars['Float']['output'];
  userId: Scalars['String']['output'];
};

export type TopPerformingAgency = {
  __typename?: 'TopPerformingAgency';
  _id: Scalars['ID']['output'];
  agency_name: Scalars['String']['output'];
  clients: Scalars['Int']['output'];
  email: Scalars['String']['output'];
  phoneNumber: Scalars['String']['output'];
  sales_volume: Scalars['Float']['output'];
};

export type TopSellingLand = {
  __typename?: 'TopSellingLand';
  asset_name: Scalars['String']['output'];
  location: Scalars['String']['output'];
  units_sold: Scalars['Int']['output'];
  value: Scalars['Float']['output'];
};

export type TopUpInput = {
  amount: Scalars['String']['input'];
  callback_url?: InputMaybe<Scalars['String']['input']>;
};

export type TopUpResponse = {
  __typename?: 'TopUpResponse';
  authorization_url: Scalars['String']['output'];
  paystack_reference: Scalars['String']['output'];
};

export type TopupInput = {
  amount?: InputMaybe<Scalars['Float']['input']>;
};

export type TopupTransferInput = {
  amount?: InputMaybe<Scalars['Float']['input']>;
  bank_name?: InputMaybe<Scalars['String']['input']>;
  file?: InputMaybe<Scalars['String']['input']>;
  reference_no?: InputMaybe<Scalars['String']['input']>;
};

export type TransactionAdminAssetResponse = {
  __typename?: 'TransactionAdminAssetResponse';
  statistics?: Maybe<TransactionStatistics>;
  success?: Maybe<Scalars['Boolean']['output']>;
};

export type TransactionAdminResponse = {
  __typename?: 'TransactionAdminResponse';
  count?: Maybe<Scalars['Int']['output']>;
  data?: Maybe<Array<Maybe<AdminTransactions>>>;
  success?: Maybe<Scalars['Boolean']['output']>;
};

export type TransactionResponse = {
  __typename?: 'TransactionResponse';
  data: Array<Transactions>;
  success: Scalars['Boolean']['output'];
};

export type TransactionStatistics = {
  __typename?: 'TransactionStatistics';
  approvedTransactions?: Maybe<Scalars['Int']['output']>;
  declinedTransactions?: Maybe<Scalars['Int']['output']>;
  flexTransactions?: Maybe<Scalars['Int']['output']>;
  flex_recurring_sales?: Maybe<Scalars['Int']['output']>;
  fullOwnershipTransactions?: Maybe<Scalars['Int']['output']>;
  fullOwnership_recurring_sales?: Maybe<Scalars['Int']['output']>;
  new_flex_sales?: Maybe<Scalars['Int']['output']>;
  new_fullOwnership_sales?: Maybe<Scalars['Int']['output']>;
  new_sales?: Maybe<Scalars['Int']['output']>;
  pendingTransactions?: Maybe<Scalars['Int']['output']>;
  totalApprovedAmount?: Maybe<Scalars['Float']['output']>;
  totalDeclinedAmount?: Maybe<Scalars['Float']['output']>;
  totalFlexAmount?: Maybe<Scalars['Float']['output']>;
  totalFullOwnershipAmount?: Maybe<Scalars['Float']['output']>;
  totalPendingAmount?: Maybe<Scalars['Float']['output']>;
  totalTransactions?: Maybe<Scalars['Int']['output']>;
  total_flex_recurring_sales?: Maybe<Scalars['Float']['output']>;
  total_fullOwnership_recurring_sales?: Maybe<Scalars['Float']['output']>;
  total_new_fullOwnership_sales?: Maybe<Scalars['Float']['output']>;
  total_new_sales?: Maybe<Scalars['Float']['output']>;
};

export enum TransactionType {
  Paystack = 'paystack',
  Transfer = 'transfer',
  Wallet = 'wallet'
}

export type Transactions = {
  __typename?: 'Transactions';
  _id: Scalars['ID']['output'];
  admin_status?: Maybe<Scalars['String']['output']>;
  amount?: Maybe<Scalars['String']['output']>;
  commissionType?: Maybe<Scalars['String']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  paystack_reference?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  time_of_transaction?: Maybe<Scalars['Date']['output']>;
  transaction_reference?: Maybe<Scalars['String']['output']>;
  transaction_type?: Maybe<Scalars['String']['output']>;
  transfer_file?: Maybe<TransferFile>;
  transfer_reference?: Maybe<Scalars['String']['output']>;
  type?: Maybe<Scalars['String']['output']>;
  wallet: Wallet;
  withdrawal_reason?: Maybe<Scalars['String']['output']>;
};

export type TransferFile = {
  __typename?: 'TransferFile';
  amount?: Maybe<Scalars['Int']['output']>;
  bank_name?: Maybe<Scalars['String']['output']>;
  file?: Maybe<Scalars['String']['output']>;
  reference_no?: Maybe<Scalars['String']['output']>;
};

export type UpcomingPayment = {
  __typename?: 'UpcomingPayment';
  amountDue: Scalars['Float']['output'];
  assetLocation: Scalars['String']['output'];
  assetName: Scalars['String']['output'];
  clientName: Scalars['String']['output'];
  dueDate: Scalars['Date']['output'];
  potentialCommission: Scalars['Float']['output'];
};

export type UpdateAdminRoleInput = {
  id: Scalars['ID']['input'];
  role: Scalars['String']['input'];
};

export type UpdateAgencyCommissionInput = {
  agencyId: Scalars['ID']['input'];
  commission_percentage: Scalars['Float']['input'];
};

export type UpdateAssetInput = {
  asset_location: Scalars['String']['input'];
  asset_name: Scalars['String']['input'];
  asset_price: Scalars['Float']['input'];
  asset_unit?: InputMaybe<Scalars['Int']['input']>;
  description: Scalars['String']['input'];
  id?: InputMaybe<Scalars['String']['input']>;
  monthly_installment?: InputMaybe<Scalars['Int']['input']>;
  title: Scalars['String']['input'];
};

export type UpdateCouponInput = {
  couponCode: Scalars['String']['input'];
  discountPercentage?: InputMaybe<Scalars['Float']['input']>;
  endDate?: InputMaybe<Scalars['Date']['input']>;
  expiryDate?: InputMaybe<Scalars['Date']['input']>;
  expiryType?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['Date']['input']>;
  usageLimit?: InputMaybe<Scalars['Int']['input']>;
  usageLimitType?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateCouponStatusInput = {
  couponCode: Scalars['String']['input'];
  status: Scalars['String']['input'];
};

export type UpdateFlexAssetInput = {
  asset_location?: InputMaybe<Scalars['String']['input']>;
  asset_name?: InputMaybe<Scalars['String']['input']>;
  asset_option?: InputMaybe<Array<InputMaybe<FlexAssetOptionInput>>>;
  description?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['String']['input'];
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateRequestInput = {
  adminMessage?: InputMaybe<Scalars['String']['input']>;
  declineReason?: InputMaybe<Scalars['String']['input']>;
  estimatedCompletionHours?: InputMaybe<Scalars['Int']['input']>;
  requestId: Scalars['ID']['input'];
  status: Scalars['String']['input'];
};

export type UpdateRequestResponse = {
  __typename?: 'UpdateRequestResponse';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type UpdateTinResponse = {
  __typename?: 'UpdateTinResponse';
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
  tin?: Maybe<Scalars['String']['output']>;
};

export type UpdateUserTinInput = {
  tin: Scalars['String']['input'];
  userId: Scalars['String']['input'];
};

export type UpgradePaystackResponse = {
  __typename?: 'UpgradePaystackResponse';
  authorization_url: Scalars['String']['output'];
  paystack_reference: Scalars['String']['output'];
};

export type UpgradeRequestsResponse = {
  __typename?: 'UpgradeRequestsResponse';
  upgradeRequests: Array<Maybe<ReferralUpgrade>>;
};

export enum UsageLimitType {
  Limited = 'limited',
  Unlimited = 'unlimited'
}

export type User = {
  __typename?: 'User';
  Networth?: Maybe<Scalars['Float']['output']>;
  _id: Scalars['ID']['output'];
  address?: Maybe<Scalars['String']['output']>;
  authToken: Scalars['String']['output'];
  bvn_verification_status?: Maybe<Scalars['Boolean']['output']>;
  country?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['Date']['output']>;
  date_of_birth?: Maybe<Scalars['Date']['output']>;
  email: Scalars['String']['output'];
  employment_status?: Maybe<Scalars['String']['output']>;
  facial_recognitation_verification_status?: Maybe<Scalars['Boolean']['output']>;
  firstName: Scalars['String']['output'];
  gender?: Maybe<Scalars['String']['output']>;
  is_processing?: Maybe<Scalars['Boolean']['output']>;
  kyc?: Maybe<Kyc>;
  kyc_verification_status?: Maybe<Scalars['Boolean']['output']>;
  lastName: Scalars['String']['output'];
  last_login?: Maybe<Scalars['Date']['output']>;
  marital_status?: Maybe<Scalars['String']['output']>;
  means_of_id_verification_status?: Maybe<Scalars['Boolean']['output']>;
  message: Scalars['String']['output'];
  nextofKin?: Maybe<NextofKin>;
  occupation?: Maybe<Scalars['String']['output']>;
  password: Scalars['String']['output'];
  payment_plan?: Maybe<PaymentPlan>;
  phoneNumber: Scalars['String']['output'];
  profile_pic?: Maybe<Scalars['String']['output']>;
  referral_link?: Maybe<Scalars['String']['output']>;
  referrals?: Maybe<Array<Maybe<Referral>>>;
  subscriptions?: Maybe<Scalars['Int']['output']>;
  updatedAt?: Maybe<Scalars['Date']['output']>;
  userName: Scalars['String']['output'];
  verified: Scalars['Boolean']['output'];
  virtual_networth?: Maybe<Scalars['Float']['output']>;
  virtual_subscriptions?: Maybe<Scalars['Int']['output']>;
  wallet?: Maybe<Wallet>;
  withdrawal_pin: Scalars['String']['output'];
};

export type UserAdmin = {
  __typename?: 'UserAdmin';
  Networth?: Maybe<Scalars['Int']['output']>;
  _id: Scalars['ID']['output'];
  address?: Maybe<Scalars['String']['output']>;
  bvn_verification_status?: Maybe<Scalars['Boolean']['output']>;
  country?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['Date']['output']>;
  date_of_birth?: Maybe<Scalars['Date']['output']>;
  email: Scalars['String']['output'];
  employment_status?: Maybe<Scalars['String']['output']>;
  facial_recognitation_verification_status?: Maybe<Scalars['Boolean']['output']>;
  firstName: Scalars['String']['output'];
  gender?: Maybe<Scalars['String']['output']>;
  howYouHearAboutUs?: Maybe<Scalars['String']['output']>;
  is_suspended?: Maybe<Scalars['Boolean']['output']>;
  kyc_verification_status?: Maybe<Scalars['Boolean']['output']>;
  lastName: Scalars['String']['output'];
  marital_status?: Maybe<Scalars['String']['output']>;
  means_of_id_verification_status?: Maybe<Scalars['Boolean']['output']>;
  occupation?: Maybe<Scalars['String']['output']>;
  phoneNumber?: Maybe<Scalars['String']['output']>;
  profile_pic?: Maybe<Scalars['String']['output']>;
  referral_status?: Maybe<Scalars['String']['output']>;
  referrer?: Maybe<Scalars['String']['output']>;
  subscriptions?: Maybe<Scalars['Int']['output']>;
  tin?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['Date']['output']>;
  userName: Scalars['String']['output'];
  verified: Scalars['Boolean']['output'];
  virtual_networth?: Maybe<Scalars['Float']['output']>;
  virtual_subscriptions?: Maybe<Scalars['Int']['output']>;
  wallet?: Maybe<AdminWallet>;
};

export type UserAdminDetail = {
  __typename?: 'UserAdminDetail';
  Networth?: Maybe<Scalars['Int']['output']>;
  _id: Scalars['ID']['output'];
  address?: Maybe<Scalars['String']['output']>;
  amount_paid?: Maybe<Scalars['Float']['output']>;
  amount_payable?: Maybe<Scalars['Float']['output']>;
  balance_payable?: Maybe<Scalars['Float']['output']>;
  bvn_verification_status?: Maybe<Scalars['Boolean']['output']>;
  country?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['Date']['output']>;
  date_of_birth?: Maybe<Scalars['Date']['output']>;
  default_status?: Maybe<Scalars['String']['output']>;
  email: Scalars['String']['output'];
  employment_status?: Maybe<Scalars['String']['output']>;
  facial_recognitation_verification_status?: Maybe<Scalars['Boolean']['output']>;
  firstName: Scalars['String']['output'];
  gender?: Maybe<Scalars['String']['output']>;
  howYouHearAboutUs?: Maybe<Scalars['String']['output']>;
  is_suspended?: Maybe<Scalars['Boolean']['output']>;
  kyc?: Maybe<Kyc>;
  kyc_verification_status?: Maybe<Scalars['Boolean']['output']>;
  lastName: Scalars['String']['output'];
  last_login?: Maybe<Scalars['Date']['output']>;
  marital_status?: Maybe<Scalars['String']['output']>;
  means_of_id_verification_status?: Maybe<Scalars['Boolean']['output']>;
  next_date_of_payment?: Maybe<Scalars['Date']['output']>;
  occupation?: Maybe<Scalars['String']['output']>;
  phoneNumber: Scalars['String']['output'];
  product_purchased?: Maybe<Array<Maybe<Asset>>>;
  profile_pic?: Maybe<Scalars['String']['output']>;
  referral?: Maybe<Referrer>;
  referral_status?: Maybe<Scalars['String']['output']>;
  subscriptions?: Maybe<Scalars['Int']['output']>;
  transaction?: Maybe<Array<Maybe<Transactions>>>;
  units_purchased?: Maybe<Scalars['Int']['output']>;
  updatedAt?: Maybe<Scalars['Date']['output']>;
  userName: Scalars['String']['output'];
  verified: Scalars['Boolean']['output'];
  virtual_networth?: Maybe<Scalars['Float']['output']>;
  virtual_subscriptions?: Maybe<Scalars['Int']['output']>;
  wallet?: Maybe<AdminWallet>;
};

export type UserAdminResponse = {
  __typename?: 'UserAdminResponse';
  count?: Maybe<Scalars['Int']['output']>;
  data?: Maybe<Array<Maybe<UserAdmin>>>;
  success?: Maybe<Scalars['Boolean']['output']>;
};

export type UserAllocated = {
  __typename?: 'UserAllocated';
  email: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type UserAsset = {
  __typename?: 'UserAsset';
  customer_assets?: Maybe<Array<Maybe<CustomersAsset>>>;
  email: Scalars['String']['output'];
  firstName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  lastName: Scalars['String']['output'];
  referral_status: Scalars['String']['output'];
  referrer?: Maybe<Referrer>;
};

export type UserAssetData = {
  __typename?: 'UserAssetData';
  asset_name?: Maybe<Scalars['String']['output']>;
  asset_type?: Maybe<Scalars['String']['output']>;
  balance?: Maybe<Scalars['Float']['output']>;
  document_amount_paid?: Maybe<Scalars['Float']['output']>;
  document_price?: Maybe<Scalars['Float']['output']>;
  land_amount_paid?: Maybe<Scalars['Float']['output']>;
  land_price?: Maybe<Scalars['Float']['output']>;
  month_subscription?: Maybe<Scalars['Int']['output']>;
  months_remaining?: Maybe<Scalars['Int']['output']>;
  next_date_of_payment?: Maybe<Scalars['String']['output']>;
  no_of_units?: Maybe<Scalars['Int']['output']>;
  size?: Maybe<Scalars['Float']['output']>;
  start_date?: Maybe<Scalars['String']['output']>;
};

export type UserAssetResponse = {
  __typename?: 'UserAssetResponse';
  count: Scalars['Int']['output'];
  data?: Maybe<Array<Maybe<UserWithAsset>>>;
  success: Scalars['Boolean']['output'];
};

export type UserBankDetails = {
  __typename?: 'UserBankDetails';
  _id: Scalars['ID']['output'];
  accountNumber: Scalars['String']['output'];
  bankName: Scalars['String']['output'];
  bank_code: Scalars['String']['output'];
  name: Scalars['String']['output'];
};

export type UserDetailResponse = {
  __typename?: 'UserDetailResponse';
  data?: Maybe<UserDetails>;
  success: Scalars['Boolean']['output'];
};

export type UserDetails = {
  __typename?: 'UserDetails';
  Networth?: Maybe<Scalars['Float']['output']>;
  _id: Scalars['ID']['output'];
  address?: Maybe<Scalars['String']['output']>;
  authToken: Scalars['String']['output'];
  bvn_verification_status?: Maybe<Scalars['Boolean']['output']>;
  country?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['Date']['output']>;
  date_of_birth?: Maybe<Scalars['Date']['output']>;
  email: Scalars['String']['output'];
  employment_status?: Maybe<Scalars['String']['output']>;
  facial_recognitation_verification_status?: Maybe<Scalars['Boolean']['output']>;
  firstName: Scalars['String']['output'];
  gender?: Maybe<Scalars['String']['output']>;
  is_processing?: Maybe<Scalars['Boolean']['output']>;
  kyc?: Maybe<Kyc>;
  kyc_verification_status?: Maybe<Scalars['Boolean']['output']>;
  lastName: Scalars['String']['output'];
  last_login?: Maybe<Scalars['Date']['output']>;
  marital_status?: Maybe<Scalars['String']['output']>;
  means_of_id_verification_status?: Maybe<Scalars['Boolean']['output']>;
  message: Scalars['String']['output'];
  nextofKin?: Maybe<NextofKin>;
  occupation?: Maybe<Scalars['String']['output']>;
  password: Scalars['String']['output'];
  phoneNumber: Scalars['String']['output'];
  profile_pic?: Maybe<Scalars['String']['output']>;
  referral_link?: Maybe<Scalars['String']['output']>;
  referral_status?: Maybe<Scalars['String']['output']>;
  subscriptions?: Maybe<Scalars['Int']['output']>;
  updatedAt?: Maybe<Scalars['Date']['output']>;
  userName: Scalars['String']['output'];
  verified: Scalars['Boolean']['output'];
  virtual_networth?: Maybe<Scalars['Float']['output']>;
  virtual_subscriptions?: Maybe<Scalars['Int']['output']>;
};

export type UserDetailsInput = {
  email?: InputMaybe<Scalars['String']['input']>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  phoneNumber?: InputMaybe<Scalars['String']['input']>;
};

export type UserPaymentDetailsInput = {
  amount_paid?: InputMaybe<Scalars['Int']['input']>;
  amount_payable?: InputMaybe<Scalars['Int']['input']>;
  asset_price?: InputMaybe<Scalars['Int']['input']>;
  balance?: InputMaybe<Scalars['Int']['input']>;
  default_amount?: InputMaybe<Scalars['Int']['input']>;
  document_amount_paid?: InputMaybe<Scalars['Int']['input']>;
  document_balance?: InputMaybe<Scalars['Int']['input']>;
  fullownerhsip_documentprice?: InputMaybe<Scalars['Int']['input']>;
  fullownerhsip_landprice?: InputMaybe<Scalars['Int']['input']>;
  month_remaining?: InputMaybe<Scalars['Int']['input']>;
  month_subscription?: InputMaybe<Scalars['Int']['input']>;
  months_covered?: InputMaybe<Scalars['Int']['input']>;
  next_date_of_payment?: InputMaybe<Scalars['Date']['input']>;
  no_of_units?: InputMaybe<Scalars['Int']['input']>;
  size?: InputMaybe<Scalars['Int']['input']>;
  start_date?: InputMaybe<Scalars['Date']['input']>;
  uniqueAssetId?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
};

export type UserReferralAdmin = {
  __typename?: 'UserReferralAdmin';
  _id: Scalars['ID']['output'];
  amount_brought?: Maybe<Scalars['Float']['output']>;
  amount_commissions?: Maybe<Scalars['Float']['output']>;
  email: Scalars['String']['output'];
  firstName: Scalars['String']['output'];
  gender?: Maybe<Scalars['String']['output']>;
  lastName: Scalars['String']['output'];
  no_of_referral?: Maybe<Scalars['Int']['output']>;
  phoneNumber: Scalars['String']['output'];
  profile_pic?: Maybe<Scalars['String']['output']>;
  userName: Scalars['String']['output'];
};

export type UserResponse = {
  __typename?: 'UserResponse';
  data?: Maybe<User>;
  success: Scalars['Boolean']['output'];
};

export type UserWithAsset = {
  __typename?: 'UserWithAsset';
  customer_assets?: Maybe<Array<Maybe<UserAssetData>>>;
  dateOfBirth?: Maybe<Scalars['Date']['output']>;
  email: Scalars['String']['output'];
  firstName: Scalars['String']['output'];
  gender?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  lastName: Scalars['String']['output'];
  occupation?: Maybe<Scalars['String']['output']>;
  phone?: Maybe<Scalars['String']['output']>;
  referral?: Maybe<ReferrerWithCombinedName>;
};

export type UserWithTicket = {
  __typename?: 'UserWithTicket';
  email?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  ticketId?: Maybe<Scalars['String']['output']>;
};

export type ViewAssetDetails = {
  __typename?: 'ViewAssetDetails';
  _id?: Maybe<Scalars['ID']['output']>;
  amenities?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  asset_documents?: Maybe<Scalars['JSON']['output']>;
  asset_history?: Maybe<Scalars['JSON']['output']>;
  asset_location?: Maybe<Scalars['String']['output']>;
  asset_name?: Maybe<Scalars['String']['output']>;
  asset_option?: Maybe<Array<Maybe<AssetOption>>>;
  asset_pictures?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  asset_price?: Maybe<Scalars['Float']['output']>;
  asset_purpose?: Maybe<Scalars['String']['output']>;
  asset_size?: Maybe<Scalars['Int']['output']>;
  asset_type?: Maybe<Scalars['String']['output']>;
  asset_unit?: Maybe<Scalars['Int']['output']>;
  basic_details?: Maybe<Array<Maybe<BasicDetails>>>;
  description?: Maybe<Scalars['String']['output']>;
  document_plan?: Maybe<DocumentPaymentPlan>;
  documents?: Maybe<Documents>;
  gogle_map?: Maybe<Scalars['String']['output']>;
  is_processing?: Maybe<Scalars['Boolean']['output']>;
  is_subscribed?: Maybe<Scalars['Boolean']['output']>;
  landmark?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  newAsset?: Maybe<Scalars['Boolean']['output']>;
  paymentDetails?: Maybe<PaymentDetails>;
  sold?: Maybe<Scalars['Boolean']['output']>;
  subscribed_asset_details?: Maybe<Array<Maybe<SubscribedAssetDetails>>>;
  title?: Maybe<Scalars['String']['output']>;
  topography?: Maybe<Scalars['String']['output']>;
};

export type ViewUserAssetResponse = {
  __typename?: 'ViewUserAssetResponse';
  subscribed_asset_details: Array<Maybe<SubscribedAssetDetailsForViewAsset>>;
};

export type Wallet = {
  __typename?: 'Wallet';
  _id: Scalars['ID']['output'];
  balance?: Maybe<Scalars['String']['output']>;
  bankDetails?: Maybe<BankDetails>;
  currency?: Maybe<Scalars['String']['output']>;
  inflow?: Maybe<Scalars['Float']['output']>;
  isActive?: Maybe<Scalars['Boolean']['output']>;
  outflow?: Maybe<Scalars['Float']['output']>;
  transaction?: Maybe<Array<Maybe<Transactions>>>;
};

export type WalletResponse = {
  __typename?: 'WalletResponse';
  data?: Maybe<Wallet>;
  success: Scalars['Boolean']['output'];
};

export type WithdrawInput = {
  amount?: InputMaybe<Scalars['String']['input']>;
  withdrawal_reason?: InputMaybe<Scalars['String']['input']>;
};

export type WithdrawOtpInput = {
  password?: InputMaybe<Scalars['String']['input']>;
  token?: InputMaybe<Scalars['String']['input']>;
  transactionId?: InputMaybe<Scalars['String']['input']>;
};

export type WithdrawTransferInput = {
  amount?: InputMaybe<Scalars['String']['input']>;
  password?: InputMaybe<Scalars['String']['input']>;
  token?: InputMaybe<Scalars['String']['input']>;
  withdrawal_reason?: InputMaybe<Scalars['String']['input']>;
};

export type WithdrawalDetails = {
  amount?: InputMaybe<Scalars['String']['input']>;
  password?: InputMaybe<Scalars['String']['input']>;
  token?: InputMaybe<Scalars['String']['input']>;
};

export type ZeroBalance = {
  __typename?: 'ZeroBalance';
  amount_paid?: Maybe<Scalars['Float']['output']>;
  asset_name?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  month_subscription?: Maybe<Scalars['Float']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  next_payment_date?: Maybe<Scalars['Date']['output']>;
  phone_number?: Maybe<Scalars['String']['output']>;
  price?: Maybe<Scalars['Float']['output']>;
  sales_person?: Maybe<Scalars['String']['output']>;
  size?: Maybe<Scalars['Int']['output']>;
  start_date?: Maybe<Scalars['Date']['output']>;
  unit?: Maybe<Scalars['Int']['output']>;
};

export type ZeroBalanceResponse = {
  __typename?: 'ZeroBalanceResponse';
  count: Scalars['Int']['output'];
  data: Array<ZeroBalance>;
  success: Scalars['Boolean']['output'];
};

export type AdminSigninInput = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
};

export type AdminSignupInput = {
  email: Scalars['String']['input'];
  password: Scalars['String']['input'];
  role: Scalars['String']['input'];
  userName: Scalars['String']['input'];
};

export type CustomersAsset = {
  __typename?: 'customersAsset';
  amount_paid?: Maybe<Scalars['Float']['output']>;
  asset_name?: Maybe<Scalars['String']['output']>;
  asset_price?: Maybe<Scalars['Float']['output']>;
  asset_size?: Maybe<Scalars['Float']['output']>;
  asset_type?: Maybe<Scalars['String']['output']>;
  balance?: Maybe<Scalars['Float']['output']>;
  development_price?: Maybe<Scalars['Float']['output']>;
  land_price?: Maybe<Scalars['Float']['output']>;
  month_covered?: Maybe<Scalars['Int']['output']>;
  month_subscription?: Maybe<Scalars['Int']['output']>;
  next_date_of_payment?: Maybe<Scalars['String']['output']>;
  start_date?: Maybe<Scalars['String']['output']>;
  unit_bought?: Maybe<Scalars['Int']['output']>;
};

export type InitializeRecurringFullOwnershipAssetPaystack = {
  amount?: InputMaybe<Scalars['String']['input']>;
  callback_url?: InputMaybe<Scalars['String']['input']>;
  unique_asset_id?: InputMaybe<Scalars['String']['input']>;
};

export type SubscribedCustomersDetails = {
  __typename?: 'subscribedCustomersDetails';
  _id?: Maybe<Scalars['ID']['output']>;
  assetName: Scalars['String']['output'];
  balance: Scalars['Float']['output'];
  createdAt?: Maybe<Scalars['String']['output']>;
  documentAmountPaid?: Maybe<Scalars['Float']['output']>;
  documentBalance?: Maybe<Scalars['Float']['output']>;
  documentPrice?: Maybe<Scalars['Float']['output']>;
  email: Scalars['String']['output'];
  isDefaulted: Scalars['Boolean']['output'];
  isSuspended?: Maybe<Scalars['Boolean']['output']>;
  isThirtyPercentPaid: Scalars['Boolean']['output'];
  landAmountPaid: Scalars['Float']['output'];
  landPrice: Scalars['Float']['output'];
  month_subscription: Scalars['Float']['output'];
  name: Scalars['String']['output'];
  nextPaymentDate?: Maybe<Scalars['String']['output']>;
  paymentPercentage: Scalars['String']['output'];
  phone_number: Scalars['String']['output'];
  referralEmail: Scalars['String']['output'];
  referralPhone: Scalars['String']['output'];
  salesPerson: Scalars['String']['output'];
  sizeBought: Scalars['Int']['output'];
  startDate?: Maybe<Scalars['String']['output']>;
  totalAssetPrice: Scalars['Float']['output'];
  unitPurchased: Scalars['Int']['output'];
};

export type WithdrawalPin = {
  withdrawal_pin: Scalars['String']['input'];
};

export type GetAdminDashboardDetailsQueryVariables = Exact<{
  startDate?: InputMaybe<Scalars['String']['input']>;
  endDate?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetAdminDashboardDetailsQuery = { __typename?: 'Query', getAdminDashboardDetails?: { __typename?: 'AdminDashboard', associate_pro_users?: number | null, associate_users?: number | null, default_users?: number | null, suspended_users?: number | null, monthly_recurring_revenue?: number | null, sales?: number | null, total_payable?: number | null, users?: number | null, total_asset?: number | null, inflow?: number | null, outflow?: number | null, total_wallet_balance?: number | null, suspended_payment_plans?: number | null, top_associates?: Array<{ __typename?: 'UserReferralAdmin', userName: string, email: string, gender?: string | null, amount_commissions?: number | null, amount_brought?: number | null, firstName: string, lastName: string, no_of_referral?: number | null } | null> | null, top_selling_prop?: Array<{ __typename?: 'AssetDashBoard', asset_name?: string | null, asset_pictures?: Array<string | null> | null, asset_location?: string | null, units_subscribed?: number | null, amount_broughtin?: number | null } | null> | null } | null };


export const GetAdminDashboardDetailsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAdminDashboardDetails"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getAdminDashboardDetails"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"startDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"endDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"associate_pro_users"}},{"kind":"Field","name":{"kind":"Name","value":"associate_users"}},{"kind":"Field","name":{"kind":"Name","value":"default_users"}},{"kind":"Field","name":{"kind":"Name","value":"suspended_users"}},{"kind":"Field","name":{"kind":"Name","value":"monthly_recurring_revenue"}},{"kind":"Field","name":{"kind":"Name","value":"sales"}},{"kind":"Field","name":{"kind":"Name","value":"top_associates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"gender"}},{"kind":"Field","name":{"kind":"Name","value":"amount_commissions"}},{"kind":"Field","name":{"kind":"Name","value":"amount_brought"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"no_of_referral"}}]}},{"kind":"Field","name":{"kind":"Name","value":"top_selling_prop"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"asset_name"}},{"kind":"Field","name":{"kind":"Name","value":"asset_pictures"}},{"kind":"Field","name":{"kind":"Name","value":"asset_location"}},{"kind":"Field","name":{"kind":"Name","value":"units_subscribed"}},{"kind":"Field","name":{"kind":"Name","value":"amount_broughtin"}}]}},{"kind":"Field","name":{"kind":"Name","value":"total_payable"}},{"kind":"Field","name":{"kind":"Name","value":"users"}},{"kind":"Field","name":{"kind":"Name","value":"total_asset"}},{"kind":"Field","name":{"kind":"Name","value":"inflow"}},{"kind":"Field","name":{"kind":"Name","value":"outflow"}},{"kind":"Field","name":{"kind":"Name","value":"total_wallet_balance"}},{"kind":"Field","name":{"kind":"Name","value":"suspended_payment_plans"}}]}}]}}]} as unknown as DocumentNode<GetAdminDashboardDetailsQuery, GetAdminDashboardDetailsQueryVariables>;