/* eslint-disable */
import type { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
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

export type AcademySignupInput = {
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

export type AcademySignupResponse = {
  __typename?: 'AcademySignupResponse';
  success: Scalars['Boolean']['output'];
  user_id?: Maybe<Scalars['String']['output']>;
};

export type AcademyUserProfile = {
  __typename?: 'AcademyUserProfile';
  email: Scalars['String']['output'];
  first_name: Scalars['String']['output'];
  last_name: Scalars['String']['output'];
  phone: Scalars['String']['output'];
  username: Scalars['String']['output'];
};

export type AcademyUserSearchResult = {
  __typename?: 'AcademyUserSearchResult';
  email: Scalars['String']['output'];
  first_name: Scalars['String']['output'];
  last_name: Scalars['String']['output'];
  phone: Scalars['String']['output'];
  username: Scalars['String']['output'];
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

export type AdminRecurringAssetTransferInput = {
  amount: Scalars['String']['input'];
  bank_name?: InputMaybe<Scalars['String']['input']>;
  clientId: Scalars['String']['input'];
  file?: InputMaybe<Scalars['String']['input']>;
  reference_no?: InputMaybe<Scalars['String']['input']>;
  unique_asset_id: Scalars['String']['input'];
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
  processing_type?: Maybe<Scalars['String']['output']>;
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

export type AgencyBuyAssetTransferInput = {
  address?: InputMaybe<Scalars['String']['input']>;
  amount?: InputMaybe<Scalars['String']['input']>;
  assetId?: InputMaybe<Scalars['String']['input']>;
  bank_name?: InputMaybe<Scalars['String']['input']>;
  clientId: Scalars['String']['input'];
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

export type AgencyClient = {
  __typename?: 'AgencyClient';
  dateJoined?: Maybe<Scalars['Date']['output']>;
  email: Scalars['String']['output'];
  name: Scalars['String']['output'];
  outstandingBalance: Scalars['Float']['output'];
  phone: Scalars['String']['output'];
  potentialCommission: Scalars['Float']['output'];
  totalAssetValue: Scalars['Float']['output'];
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

export type AgencyDashboardFilter = {
  asset_type?: InputMaybe<Scalars['String']['input']>;
  sort_by?: InputMaybe<Scalars['String']['input']>;
  time_period?: InputMaybe<Scalars['String']['input']>;
};

export type AgencyDashboardResponse = {
  __typename?: 'AgencyDashboardResponse';
  data: AgencyDashboard;
  success: Scalars['Boolean']['output'];
};

export type AgencyDetail = {
  __typename?: 'AgencyDetail';
  _id: Scalars['ID']['output'];
  address?: Maybe<Scalars['String']['output']>;
  agency_code?: Maybe<Scalars['String']['output']>;
  agency_name?: Maybe<Scalars['String']['output']>;
  city?: Maybe<Scalars['String']['output']>;
  commission_percentage?: Maybe<Scalars['Float']['output']>;
  communication_preference?: Maybe<Scalars['String']['output']>;
  country?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['Date']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  is_suspended?: Maybe<Scalars['Boolean']['output']>;
  phoneNumber?: Maybe<Scalars['String']['output']>;
  state?: Maybe<Scalars['String']['output']>;
  stats?: Maybe<AgencyStats>;
  status?: Maybe<Scalars['String']['output']>;
  verified?: Maybe<Scalars['Boolean']['output']>;
  wallet?: Maybe<AgencyWallet>;
};

export type AgencyListItem = {
  __typename?: 'AgencyListItem';
  _id: Scalars['ID']['output'];
  agency_name?: Maybe<Scalars['String']['output']>;
  commission_percentage?: Maybe<Scalars['Float']['output']>;
  contact?: Maybe<AgencyContact>;
  plots_sold?: Maybe<Scalars['Int']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  total_referrals?: Maybe<Scalars['Int']['output']>;
  total_sales_volume?: Maybe<Scalars['Float']['output']>;
};

export type AgencyRecurringAssetTransferInput = {
  amount?: InputMaybe<Scalars['String']['input']>;
  bank_name?: InputMaybe<Scalars['String']['input']>;
  clientId: Scalars['String']['input'];
  file?: InputMaybe<Scalars['String']['input']>;
  reference_no?: InputMaybe<Scalars['String']['input']>;
  unique_asset_id?: InputMaybe<Scalars['String']['input']>;
};

export type AgencyReferral = {
  __typename?: 'AgencyReferral';
  registered_date: Scalars['Date']['output'];
  total_commission_earned: Scalars['Float']['output'];
  total_transactions: Scalars['Int']['output'];
  user: UserAdmin;
};

export type AgencyReferralUser = {
  __typename?: 'AgencyReferralUser';
  _id: Scalars['ID']['output'];
  commission?: Maybe<Scalars['Float']['output']>;
  createdAt?: Maybe<Scalars['String']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  phoneNumber?: Maybe<Scalars['String']['output']>;
  referredByEmail?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  userReferralStatus?: Maybe<Scalars['String']['output']>;
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

export type AgencyStats = {
  __typename?: 'AgencyStats';
  active_clients?: Maybe<Scalars['Int']['output']>;
  commission_earned?: Maybe<Scalars['Float']['output']>;
  outstanding_balance?: Maybe<Scalars['Float']['output']>;
  plots_sold?: Maybe<Scalars['Int']['output']>;
  total_clients?: Maybe<Scalars['Int']['output']>;
  total_sales_value?: Maybe<Scalars['Float']['output']>;
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

export type AgencySystemMetrics = {
  __typename?: 'AgencySystemMetrics';
  active_agencies?: Maybe<Scalars['Int']['output']>;
  all_agencies_total_sales_volume?: Maybe<Scalars['Float']['output']>;
  total_agencies?: Maybe<Scalars['Int']['output']>;
  total_commission_paid?: Maybe<Scalars['Float']['output']>;
  total_users_under_agencies?: Maybe<Scalars['Int']['output']>;
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

export type AgencyWallet = {
  __typename?: 'AgencyWallet';
  balance?: Maybe<Scalars['Float']['output']>;
  currency?: Maybe<Scalars['String']['output']>;
};

export type AgencyWalletTransaction = {
  __typename?: 'AgencyWalletTransaction';
  _id: Scalars['ID']['output'];
  amount?: Maybe<Scalars['Float']['output']>;
  description?: Maybe<Scalars['String']['output']>;
  paystack_reference?: Maybe<Scalars['String']['output']>;
  status?: Maybe<Scalars['String']['output']>;
  time_of_transaction?: Maybe<Scalars['Date']['output']>;
  transaction_type?: Maybe<Scalars['String']['output']>;
  transfer_file?: Maybe<TransferFile>;
  transfer_reference?: Maybe<Scalars['String']['output']>;
  type?: Maybe<Scalars['String']['output']>;
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
  collectionEfficiencyRate?: Maybe<Scalars['Float']['output']>;
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

export type AssetAnalyticsDefaulting = {
  __typename?: 'AssetAnalyticsDefaulting';
  totalDefaultedAssetValue?: Maybe<Scalars['Float']['output']>;
  totalDefaultedOutstandingValue?: Maybe<Scalars['Float']['output']>;
  totalDefaultingCustomers?: Maybe<Scalars['Int']['output']>;
};

export type AssetAnalyticsResponse = {
  __typename?: 'AssetAnalyticsResponse';
  statistics?: Maybe<AssetAnalyticsStatistics>;
  success?: Maybe<Scalars['Boolean']['output']>;
};

export type AssetAnalyticsStatistics = {
  __typename?: 'AssetAnalyticsStatistics';
  defaulting?: Maybe<AssetAnalyticsDefaulting>;
  efficiencyRate?: Maybe<Scalars['Float']['output']>;
  remainingValue?: Maybe<Scalars['Float']['output']>;
  sizePlanBreakdown: Array<Maybe<AssetSizePlanGroup>>;
  terminated?: Maybe<AssetAnalyticsTerminated>;
  totalActiveCustomers?: Maybe<Scalars['Int']['output']>;
  totalInventory?: Maybe<Scalars['Float']['output']>;
  totalRealised?: Maybe<Scalars['Float']['output']>;
  totalSqmRemaining?: Maybe<Scalars['Float']['output']>;
  totalSqmSold?: Maybe<Scalars['Float']['output']>;
};

export type AssetAnalyticsTerminated = {
  __typename?: 'AssetAnalyticsTerminated';
  totalTerminatedAssetValue?: Maybe<Scalars['Float']['output']>;
  totalTerminatedBalance?: Maybe<Scalars['Float']['output']>;
  totalTerminatedCustomers?: Maybe<Scalars['Int']['output']>;
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

export type AssetCategoryMetrics = {
  __typename?: 'AssetCategoryMetrics';
  activeAssetCount?: Maybe<Scalars['Int']['output']>;
  category?: Maybe<Scalars['String']['output']>;
  collectionEfficiency?: Maybe<Scalars['Float']['output']>;
  defaulting?: Maybe<CategoryDefaulting>;
  grossRevenue?: Maybe<Scalars['Float']['output']>;
  occupancyRate?: Maybe<Scalars['Float']['output']>;
  totalActivePaymentPlans?: Maybe<Scalars['Int']['output']>;
  totalBalance?: Maybe<Scalars['Float']['output']>;
  totalMoneyReceived?: Maybe<Scalars['Float']['output']>;
  totalSqm?: Maybe<Scalars['Float']['output']>;
  totalSqmSold?: Maybe<Scalars['Float']['output']>;
  totalValueSold?: Maybe<Scalars['Float']['output']>;
};

export type AssetCommissionOverride = {
  __typename?: 'AssetCommissionOverride';
  _id: Scalars['ID']['output'];
  asset: AssetOverrideSummary;
  createdAt?: Maybe<Scalars['Date']['output']>;
  flexCommission?: Maybe<FlexCommissionConfigOptional>;
  flexRemoval?: Maybe<FlexRemovalConfigOptional>;
  fullOwnershipCommission?: Maybe<FullOwnershipCommissionConfigOptional>;
  fullOwnershipRemoval?: Maybe<FullOwnershipRemovalConfigOptional>;
  lastModifiedBy?: Maybe<Scalars['ID']['output']>;
  updatedAt?: Maybe<Scalars['Date']['output']>;
};

export type AssetCommissionOverrideListResponse = {
  __typename?: 'AssetCommissionOverrideListResponse';
  overrides: Array<AssetCommissionOverride>;
  pagination: PaginationInfo;
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
  assetsSummary?: Maybe<AssetSummary>;
  categories?: Maybe<Array<Maybe<AssetCategoryMetrics>>>;
  portfolio?: Maybe<PortfolioMetrics>;
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

export type AssetOverrideSummary = {
  __typename?: 'AssetOverrideSummary';
  _id: Scalars['ID']['output'];
  asset_name: Scalars['String']['output'];
  asset_type: Scalars['String']['output'];
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

export type AssetSizePlanBreakdown = {
  __typename?: 'AssetSizePlanBreakdown';
  efficiency?: Maybe<Scalars['Float']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  soldValue?: Maybe<Scalars['Float']['output']>;
  startValue?: Maybe<Scalars['Float']['output']>;
  totalBalance?: Maybe<Scalars['Float']['output']>;
  totalDefaultedValue?: Maybe<Scalars['Float']['output']>;
  totalDefaultingUsers?: Maybe<Scalars['Int']['output']>;
  totalPlans?: Maybe<Scalars['Int']['output']>;
  totalSqmRemaining?: Maybe<Scalars['Float']['output']>;
  totalSqmSold?: Maybe<Scalars['Float']['output']>;
  totalTerminatedBalance?: Maybe<Scalars['Float']['output']>;
  totalTerminatedPlans?: Maybe<Scalars['Int']['output']>;
  totalTerminatedValue?: Maybe<Scalars['Float']['output']>;
};

export type AssetSizePlanGroup = {
  __typename?: 'AssetSizePlanGroup';
  plans: Array<Maybe<AssetSizePlanBreakdown>>;
  size?: Maybe<Scalars['String']['output']>;
};

export type AssetSummary = {
  __typename?: 'AssetSummary';
  totalAssets?: Maybe<Scalars['Int']['output']>;
  totalFlexAssets?: Maybe<Scalars['Int']['output']>;
  totalFlexWorth?: Maybe<Scalars['Float']['output']>;
  totalFullOwnershipAssets?: Maybe<Scalars['Int']['output']>;
  totalFullOwnershipWorth?: Maybe<Scalars['Float']['output']>;
  totalWorth?: Maybe<Scalars['Float']['output']>;
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
  couponCode?: InputMaybe<Scalars['String']['input']>;
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

export type AssociateProProgress = {
  __typename?: 'AssociateProProgress';
  currentAssociatePro: Scalars['Int']['output'];
  percentageComplete: Scalars['Float']['output'];
  progressText: Scalars['String']['output'];
  targetAssociatePro: Scalars['Int']['output'];
};

export type AssociateProUpgradeDetail = {
  __typename?: 'AssociateProUpgradeDetail';
  adminStatus: Scalars['String']['output'];
  amountPaid: Scalars['Float']['output'];
  associateProSince?: Maybe<Scalars['Date']['output']>;
  associateSince?: Maybe<Scalars['Date']['output']>;
  referrerFullName?: Maybe<Scalars['String']['output']>;
  ticketId?: Maybe<Scalars['String']['output']>;
  upgradeId: Scalars['ID']['output'];
  userFullName?: Maybe<Scalars['String']['output']>;
  userId: Scalars['ID']['output'];
  userSince: Scalars['Date']['output'];
};

export type AssociateProUpgradeResponse = {
  __typename?: 'AssociateProUpgradeResponse';
  total: Scalars['Int']['output'];
  upgrades: Array<AssociateProUpgradeDetail>;
};

export type AssociateResponse = {
  __typename?: 'AssociateResponse';
  count: Scalars['Int']['output'];
  data: Array<Associate>;
  success: Scalars['Boolean']['output'];
};

export type AssociateToAssociateProMetrics = {
  __typename?: 'AssociateToAssociateProMetrics';
  conversionRate: Scalars['Float']['output'];
  convertedToAssociatePro: Scalars['Int']['output'];
  notConverted: Scalars['Int']['output'];
  totalAssociates: Scalars['Int']['output'];
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

export type CampaignDashboard = {
  __typename?: 'CampaignDashboard';
  associateProProgress: AssociateProProgress;
  campaignPeriod: CampaignPeriod;
  conversionMetrics: ConversionMetrics;
  graphs: CampaignGraphs;
  revenueMetrics: RevenueMetrics;
  ticketMetrics: CampaignTicketMetrics;
};

export type CampaignGraphs = {
  __typename?: 'CampaignGraphs';
  conversionGraph: ConversionGraph;
  revenueGraph: RevenueGraph;
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

export type CampaignPeriod = {
  __typename?: 'CampaignPeriod';
  daysElapsed: Scalars['Int']['output'];
  daysRemaining: Scalars['Int']['output'];
  endDate: Scalars['Date']['output'];
  startDate: Scalars['Date']['output'];
  totalDays: Scalars['Int']['output'];
};

export type CampaignTicketMetrics = {
  __typename?: 'CampaignTicketMetrics';
  referralTickets: Scalars['Int']['output'];
  totalTicketsIssued: Scalars['Int']['output'];
  userTickets: Scalars['Int']['output'];
};

export type CategoryDefaulting = {
  __typename?: 'CategoryDefaulting';
  defaultedAssetValue?: Maybe<Scalars['Float']['output']>;
  defaultersOwing?: Maybe<Scalars['Float']['output']>;
  defaultersPaid?: Maybe<Scalars['Float']['output']>;
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

export type ClientAssetItem = {
  __typename?: 'ClientAssetItem';
  amountPaid: Scalars['Float']['output'];
  assetName: Scalars['String']['output'];
  balance: Scalars['Float']['output'];
  completedAt?: Maybe<Scalars['String']['output']>;
  dueDate?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  location: Scalars['String']['output'];
  missedPaymentsStreak: Scalars['Int']['output'];
  missedPaymentsSummary: Scalars['String']['output'];
  nextPaymentAmount?: Maybe<Scalars['Float']['output']>;
  nextPaymentDate?: Maybe<Scalars['String']['output']>;
  outstandingBalance: Scalars['Float']['output'];
  progress: Scalars['Int']['output'];
  size: Scalars['Float']['output'];
  status: Scalars['String']['output'];
  totalValue: Scalars['Float']['output'];
  type: Scalars['String']['output'];
};

export type ClientAssetList = {
  __typename?: 'ClientAssetList';
  items: Array<ClientAssetItem>;
  page: Scalars['Int']['output'];
  pageSize: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type ClientAssetListResponse = {
  __typename?: 'ClientAssetListResponse';
  data: ClientAssetList;
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type ClientAssetsBreakdown = {
  __typename?: 'ClientAssetsBreakdown';
  count: Scalars['Int']['output'];
  status: Scalars['String']['output'];
};

export type ClientDashboardOverview = {
  __typename?: 'ClientDashboardOverview';
  assetsBreakdown: Array<ClientAssetsBreakdown>;
  performance: ClientPerformance;
  riskStatus: Scalars['String']['output'];
  upcomingPaymentsCount: Scalars['Int']['output'];
};

export type ClientDashboardOverviewResponse = {
  __typename?: 'ClientDashboardOverviewResponse';
  data: ClientDashboardOverview;
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type ClientGrowthMonth = {
  __typename?: 'ClientGrowthMonth';
  clientsOnboarded: Scalars['Int']['output'];
  month: Scalars['String']['output'];
  year: Scalars['Int']['output'];
};

export type ClientInfo = {
  __typename?: 'ClientInfo';
  amountPaid: Scalars['Float']['output'];
  dateJoined: Scalars['Date']['output'];
  email: Scalars['String']['output'];
  fullyPaidAssets: Scalars['Int']['output'];
  isActive: Scalars['Boolean']['output'];
  location: Scalars['String']['output'];
  name: Scalars['String']['output'];
  netWorth: Scalars['Float']['output'];
  outstandingBalance: Scalars['Float']['output'];
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

export type ClientInstallment = {
  __typename?: 'ClientInstallment';
  amount: Scalars['Float']['output'];
  dueDate: Scalars['String']['output'];
  installmentNumber: Scalars['Int']['output'];
  paidAt?: Maybe<Scalars['String']['output']>;
  status: Scalars['String']['output'];
};

export type ClientOverviewData = {
  __typename?: 'ClientOverviewData';
  assetTypeDistribution: AssetTypeDistribution;
  clientGrowth: Array<ClientGrowthMonth>;
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
  atRiskClients: Scalars['Int']['output'];
  avgAssetsPerClient: Scalars['Float']['output'];
  avgNetWorth: Scalars['Float']['output'];
  avgPortfolioSize: Scalars['Float']['output'];
  defaultedClients: Scalars['Int']['output'];
  inactiveClients: Scalars['Int']['output'];
  outstandingBalance: Scalars['Float']['output'];
  potentialCommission: Scalars['Float']['output'];
  totalAmountPaid: Scalars['Float']['output'];
  totalClients: Scalars['Int']['output'];
};

export type ClientOverviewResponse = {
  __typename?: 'ClientOverviewResponse';
  data: ClientOverviewData;
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type ClientPaymentScheduleResponse = {
  __typename?: 'ClientPaymentScheduleResponse';
  data: Array<ClientInstallment>;
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type ClientPerformance = {
  __typename?: 'ClientPerformance';
  totalAmountPaid: Scalars['Float']['output'];
  totalAssetValue: Scalars['Float']['output'];
  totalAssets: Scalars['Int']['output'];
  totalCommissionGenerated: Scalars['Float']['output'];
  totalOutstanding: Scalars['Float']['output'];
};

export type ClientRequestFilters = {
  dateRange?: InputMaybe<DateRangeInput>;
  paymentStatus?: InputMaybe<Scalars['String']['input']>;
  requestType?: InputMaybe<Scalars['String']['input']>;
  searchQuery?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
};

export type ClientTransactionItem = {
  __typename?: 'ClientTransactionItem';
  amount: Scalars['Float']['output'];
  assetName: Scalars['String']['output'];
  date: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  method: Scalars['String']['output'];
  reference?: Maybe<Scalars['String']['output']>;
  status: Scalars['String']['output'];
};

export type ClientTransactionList = {
  __typename?: 'ClientTransactionList';
  items: Array<ClientTransactionItem>;
  page: Scalars['Int']['output'];
  pageSize: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
};

export type ClientTransactionListResponse = {
  __typename?: 'ClientTransactionListResponse';
  data: ClientTransactionList;
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type CommissionConfig = {
  __typename?: 'CommissionConfig';
  _id: Scalars['ID']['output'];
  associateProFee: Scalars['Float']['output'];
  createdAt?: Maybe<Scalars['Date']['output']>;
  flexCommission: FlexCommissionConfig;
  flexRemoval: FlexRemovalConfig;
  fullOwnershipCommission: FullOwnershipCommissionConfig;
  fullOwnershipRemoval: FullOwnershipRemovalConfig;
  highCommissionAlertThreshold: Scalars['Float']['output'];
  lastModifiedBy?: Maybe<Scalars['ID']['output']>;
  updatedAt?: Maybe<Scalars['Date']['output']>;
  upgradeCommissionPercentage: Scalars['Float']['output'];
  version: Scalars['Int']['output'];
  whtPercentage: Scalars['Float']['output'];
};

export type CommissionConfigHistoryEntry = {
  __typename?: 'CommissionConfigHistoryEntry';
  _id: Scalars['ID']['output'];
  changeDescription: Scalars['String']['output'];
  changedBy: Scalars['ID']['output'];
  changedByEmail: Scalars['String']['output'];
  changedFields: Array<Scalars['String']['output']>;
  configSnapshot: Scalars['String']['output'];
  createdAt?: Maybe<Scalars['Date']['output']>;
  updatedAt?: Maybe<Scalars['Date']['output']>;
  version: Scalars['Int']['output'];
};

export type CommissionConfigHistoryResponse = {
  __typename?: 'CommissionConfigHistoryResponse';
  history: Array<CommissionConfigHistoryEntry>;
  pagination: PaginationInfo;
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

export type ConversionDataPoint = {
  __typename?: 'ConversionDataPoint';
  count: Scalars['Int']['output'];
  cumulativeCount: Scalars['Int']['output'];
  date: Scalars['String']['output'];
};

export type ConversionGraph = {
  __typename?: 'ConversionGraph';
  associateToAssociateProConversions: ConversionGraphData;
  newSignups: ConversionGraphData;
  userToAssociateProConversions: ConversionGraphData;
};

export type ConversionGraphData = {
  __typename?: 'ConversionGraphData';
  averageDaily: Scalars['Float']['output'];
  chartData: Array<ConversionDataPoint>;
  peakDay?: Maybe<ConversionDataPoint>;
  total: Scalars['Int']['output'];
};

export type ConversionMetrics = {
  __typename?: 'ConversionMetrics';
  associateToAssociatePro: AssociateToAssociateProMetrics;
  overallConversionRate: Scalars['Float']['output'];
  totalAssociatePro: Scalars['Int']['output'];
  userToAssociatePro: UserToAssociateProMetrics;
};

export type Coupon = {
  __typename?: 'Coupon';
  _id: Scalars['ID']['output'];
  activeImmediately: Scalars['Boolean']['output'];
  couponCode: Scalars['String']['output'];
  createdAt: Scalars['Date']['output'];
  discountPercentage: Scalars['Float']['output'];
  endDate?: Maybe<Scalars['Date']['output']>;
  expiryDate?: Maybe<Scalars['Date']['output']>;
  expiryType: ExpiryType;
  startDate: Scalars['Date']['output'];
  status?: Maybe<CouponStatus>;
  updatedAt: Scalars['Date']['output'];
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
  couponCode?: InputMaybe<Scalars['String']['input']>;
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
  auto_approved_transaction?: Maybe<Scalars['Float']['output']>;
  auto_failed_transaction?: Maybe<Scalars['Float']['output']>;
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
  couponCode?: InputMaybe<Scalars['String']['input']>;
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

export type EditAgencyProfileInput = {
  commission_percentage?: InputMaybe<Scalars['Float']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  phone?: InputMaybe<Scalars['String']['input']>;
};

export type EditAgencyWalletInput = {
  id: Scalars['ID']['input'];
  new_amount: Scalars['String']['input'];
  reason: Scalars['String']['input'];
};

export type EditAgencyWalletResponse = {
  __typename?: 'EditAgencyWalletResponse';
  _id: Scalars['ID']['output'];
  wallet?: Maybe<AgencyWallet>;
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
  address?: Maybe<Scalars['String']['output']>;
  country?: Maybe<Scalars['String']['output']>;
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

export type FlexCommissionConfig = {
  __typename?: 'FlexCommissionConfig';
  direct: FlexDirectRates;
};

export type FlexCommissionConfigOptional = {
  __typename?: 'FlexCommissionConfigOptional';
  direct?: Maybe<FlexDirectRatesOptional>;
};

export type FlexCommissionInput = {
  direct?: InputMaybe<FlexDirectRatesInput>;
};

export type FlexDirectRates = {
  __typename?: 'FlexDirectRates';
  associate_pro: Scalars['Float']['output'];
  default: Scalars['Float']['output'];
  founder: Scalars['Float']['output'];
  premium: Scalars['Float']['output'];
};

export type FlexDirectRatesInput = {
  associate_pro?: InputMaybe<Scalars['Float']['input']>;
  default?: InputMaybe<Scalars['Float']['input']>;
  founder?: InputMaybe<Scalars['Float']['input']>;
  premium?: InputMaybe<Scalars['Float']['input']>;
};

export type FlexDirectRatesOptional = {
  __typename?: 'FlexDirectRatesOptional';
  associate_pro?: Maybe<Scalars['Float']['output']>;
  default?: Maybe<Scalars['Float']['output']>;
  founder?: Maybe<Scalars['Float']['output']>;
  premium?: Maybe<Scalars['Float']['output']>;
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

export type FlexRemovalConfig = {
  __typename?: 'FlexRemovalConfig';
  direct: FlexRemovalDirectRates;
};

export type FlexRemovalConfigOptional = {
  __typename?: 'FlexRemovalConfigOptional';
  direct?: Maybe<FlexRemovalDirectRatesOptional>;
};

export type FlexRemovalDirectRates = {
  __typename?: 'FlexRemovalDirectRates';
  associate_pro: Scalars['Float']['output'];
  default: Scalars['Float']['output'];
};

export type FlexRemovalDirectRatesInput = {
  associate_pro?: InputMaybe<Scalars['Float']['input']>;
  default?: InputMaybe<Scalars['Float']['input']>;
};

export type FlexRemovalDirectRatesOptional = {
  __typename?: 'FlexRemovalDirectRatesOptional';
  associate_pro?: Maybe<Scalars['Float']['output']>;
  default?: Maybe<Scalars['Float']['output']>;
};

export type FlexRemovalInput = {
  direct?: InputMaybe<FlexRemovalDirectRatesInput>;
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

export type FullOwnershipCommissionConfig = {
  __typename?: 'FullOwnershipCommissionConfig';
  direct: FullOwnershipDirectRates;
  topline: FullOwnershipToplineRates;
  upline: FullOwnershipUplineRates;
};

export type FullOwnershipCommissionConfigOptional = {
  __typename?: 'FullOwnershipCommissionConfigOptional';
  direct?: Maybe<FullOwnershipDirectRatesOptional>;
  topline?: Maybe<FullOwnershipToplineRatesOptional>;
  upline?: Maybe<FullOwnershipUplineRatesOptional>;
};

export type FullOwnershipCommissionInput = {
  direct?: InputMaybe<FullOwnershipDirectRatesInput>;
  topline?: InputMaybe<FullOwnershipToplineRatesInput>;
  upline?: InputMaybe<FullOwnershipUplineRatesInput>;
};

export type FullOwnershipDirectRates = {
  __typename?: 'FullOwnershipDirectRates';
  associate_pro: Scalars['Float']['output'];
  default: Scalars['Float']['output'];
  founder: Scalars['Float']['output'];
  premium: Scalars['Float']['output'];
};

export type FullOwnershipDirectRatesInput = {
  associate_pro?: InputMaybe<Scalars['Float']['input']>;
  default?: InputMaybe<Scalars['Float']['input']>;
  founder?: InputMaybe<Scalars['Float']['input']>;
  premium?: InputMaybe<Scalars['Float']['input']>;
};

export type FullOwnershipDirectRatesOptional = {
  __typename?: 'FullOwnershipDirectRatesOptional';
  associate_pro?: Maybe<Scalars['Float']['output']>;
  default?: Maybe<Scalars['Float']['output']>;
  founder?: Maybe<Scalars['Float']['output']>;
  premium?: Maybe<Scalars['Float']['output']>;
};

export type FullOwnershipRemovalConfig = {
  __typename?: 'FullOwnershipRemovalConfig';
  direct: FullOwnershipRemovalDirectRates;
  topline: Scalars['Float']['output'];
  upline: Scalars['Float']['output'];
};

export type FullOwnershipRemovalConfigOptional = {
  __typename?: 'FullOwnershipRemovalConfigOptional';
  direct?: Maybe<FullOwnershipRemovalDirectRatesOptional>;
  topline?: Maybe<Scalars['Float']['output']>;
  upline?: Maybe<Scalars['Float']['output']>;
};

export type FullOwnershipRemovalDirectRates = {
  __typename?: 'FullOwnershipRemovalDirectRates';
  associate_pro: Scalars['Float']['output'];
  default: Scalars['Float']['output'];
};

export type FullOwnershipRemovalDirectRatesInput = {
  associate_pro?: InputMaybe<Scalars['Float']['input']>;
  default?: InputMaybe<Scalars['Float']['input']>;
};

export type FullOwnershipRemovalDirectRatesOptional = {
  __typename?: 'FullOwnershipRemovalDirectRatesOptional';
  associate_pro?: Maybe<Scalars['Float']['output']>;
  default?: Maybe<Scalars['Float']['output']>;
};

export type FullOwnershipRemovalInput = {
  direct?: InputMaybe<FullOwnershipRemovalDirectRatesInput>;
  topline?: InputMaybe<Scalars['Float']['input']>;
  upline?: InputMaybe<Scalars['Float']['input']>;
};

export type FullOwnershipToplineRates = {
  __typename?: 'FullOwnershipToplineRates';
  associate_pro: Scalars['Float']['output'];
  founder: Scalars['Float']['output'];
};

export type FullOwnershipToplineRatesInput = {
  associate_pro?: InputMaybe<Scalars['Float']['input']>;
  founder?: InputMaybe<Scalars['Float']['input']>;
};

export type FullOwnershipToplineRatesOptional = {
  __typename?: 'FullOwnershipToplineRatesOptional';
  associate_pro?: Maybe<Scalars['Float']['output']>;
  founder?: Maybe<Scalars['Float']['output']>;
};

export type FullOwnershipUplineRates = {
  __typename?: 'FullOwnershipUplineRates';
  associate_pro: Scalars['Float']['output'];
  founder: Scalars['Float']['output'];
  premium: Scalars['Float']['output'];
};

export type FullOwnershipUplineRatesInput = {
  associate_pro?: InputMaybe<Scalars['Float']['input']>;
  founder?: InputMaybe<Scalars['Float']['input']>;
  premium?: InputMaybe<Scalars['Float']['input']>;
};

export type FullOwnershipUplineRatesOptional = {
  __typename?: 'FullOwnershipUplineRatesOptional';
  associate_pro?: Maybe<Scalars['Float']['output']>;
  founder?: Maybe<Scalars['Float']['output']>;
  premium?: Maybe<Scalars['Float']['output']>;
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

export type HowYouHeardBreakdown = {
  __typename?: 'HowYouHeardBreakdown';
  breakdown: Array<HowYouHeardSource>;
  totalResponses: Scalars['Int']['output'];
};

export type HowYouHeardSource = {
  __typename?: 'HowYouHeardSource';
  count: Scalars['Int']['output'];
  percentage: Scalars['Float']['output'];
  source: Scalars['String']['output'];
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

export type ManualUpgradeData = {
  __typename?: 'ManualUpgradeData';
  commissionAmount?: Maybe<Scalars['Float']['output']>;
  commissionProcessed: Scalars['Boolean']['output'];
  transaction: ManualUpgradeTransactionInfo;
  user: ManualUpgradeUserInfo;
};

export type ManualUpgradeResponse = {
  __typename?: 'ManualUpgradeResponse';
  data?: Maybe<ManualUpgradeData>;
  message: Scalars['String']['output'];
  success: Scalars['Boolean']['output'];
};

export type ManualUpgradeTransactionInfo = {
  __typename?: 'ManualUpgradeTransactionInfo';
  amount: Scalars['Float']['output'];
  reference_no: Scalars['String']['output'];
  status: Scalars['String']['output'];
};

export type ManualUpgradeUserInfo = {
  __typename?: 'ManualUpgradeUserInfo';
  email: Scalars['String']['output'];
  firstName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  lastName: Scalars['String']['output'];
  referral_status: Scalars['String']['output'];
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
  academyUserSignup: AcademySignupResponse;
  addBankDetails: Scalars['String']['output'];
  addReferralByAdmin: Scalars['String']['output'];
  addUserAssetByAdmin: Scalars['String']['output'];
  adminRecurringAssetPaymentTransfer: Scalars['String']['output'];
  adminRecurringFullOwnershipAssetPaymentTransfer: Scalars['String']['output'];
  adminSignupUser: AdminSignupResponse;
  agencyBuyFlexAssetWithTransfer: Scalars['String']['output'];
  agencyBuyFullOwnershipAssetWithTransfer: Scalars['String']['output'];
  agencyRecurringAssetPaymentTransfer: Scalars['String']['output'];
  agencyRecurringFullOwnershipAssetPaymentTransfer: Scalars['String']['output'];
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
  deleteAssetCommissionOverride: Scalars['Boolean']['output'];
  deleteCoupon: DeleteCouponResponse;
  deleteUserFlexAsset: Scalars['String']['output'];
  deleteUserFullOwnershipAsset: Scalars['String']['output'];
  disableAsset: Scalars['String']['output'];
  documentPaymentPaystack: DocumentFullownershipResponse;
  documentPaymentTransfer: Scalars['String']['output'];
  documentPaymentWallet: Scalars['String']['output'];
  editAgencyProfile: AgencyResponse;
  editAgencyWallet: EditAgencyWalletResponse;
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
  manualUpgradeToAssociatePro: ManualUpgradeResponse;
  modifyUserReferralStatus: Scalars['String']['output'];
  processCommission: Scalars['String']['output'];
  processReceipt: Scalars['String']['output'];
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
  suspendAgency: SuspendAgencyResponse;
  suspendPaymentPlan: Scalars['String']['output'];
  suspendUser: Scalars['String']['output'];
  systemApproveAssetUpdateRequest: SystemApproveAssetUpdateRequestResponse;
  systemApproveDocumentChangeRequest: SystemApproveDocumentChangeRequestResponse;
  systemApproveLocationChangeRequest: SystemApproveLocationChangeRequestResponse;
  topUpWallet: Scalars['String']['output'];
  topUpWalletTransfer: Scalars['String']['output'];
  topWalletUp: TopUpResponse;
  unSuspendPaymentPlan: Scalars['String']['output'];
  unsuspendAgency: SuspendAgencyResponse;
  unsuspendUser: Scalars['String']['output'];
  updateAdminPassword: Scalars['String']['output'];
  updateAdminRole: Scalars['String']['output'];
  updateAsset: Scalars['String']['output'];
  updateCommissionConfig: CommissionConfig;
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
  upsertAssetCommissionOverride: AssetCommissionOverride;
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


export type MutationAcademyUserSignupArgs = {
  input: AcademySignupInput;
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


export type MutationAdminRecurringAssetPaymentTransferArgs = {
  input: AdminRecurringAssetTransferInput;
};


export type MutationAdminRecurringFullOwnershipAssetPaymentTransferArgs = {
  input: AdminRecurringAssetTransferInput;
};


export type MutationAdminSignupUserArgs = {
  adminSignupInput: AdminSignupInput;
};


export type MutationAgencyBuyFlexAssetWithTransferArgs = {
  buyAssetTransferInput: AgencyBuyAssetTransferInput;
};


export type MutationAgencyBuyFullOwnershipAssetWithTransferArgs = {
  buyAssetTransferInput: AgencyBuyAssetTransferInput;
};


export type MutationAgencyRecurringAssetPaymentTransferArgs = {
  recurringAssetTransferInput: AgencyRecurringAssetTransferInput;
};


export type MutationAgencyRecurringFullOwnershipAssetPaymentTransferArgs = {
  recurringAssetTransferInput: AgencyRecurringAssetTransferInput;
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


export type MutationDeleteAssetCommissionOverrideArgs = {
  assetId: Scalars['ID']['input'];
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


export type MutationEditAgencyProfileArgs = {
  id: Scalars['ID']['input'];
  input: EditAgencyProfileInput;
};


export type MutationEditAgencyWalletArgs = {
  editAgencyWalletInput: EditAgencyWalletInput;
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
  couponCode?: InputMaybe<Scalars['String']['input']>;
};


export type MutationJoinCommunityEmailArgs = {
  joinCommunityInput?: InputMaybe<JoinCommunityInput>;
};


export type MutationManualUpgradeToAssociateProArgs = {
  amount: Scalars['Float']['input'];
  commissionableAmount?: InputMaybe<Scalars['Float']['input']>;
  email: Scalars['String']['input'];
  payCommission: Scalars['Boolean']['input'];
  paymentUrl: Scalars['String']['input'];
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
  batchSize?: InputMaybe<Scalars['Int']['input']>;
  pauseSeconds?: InputMaybe<Scalars['Int']['input']>;
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
  id: Scalars['ID']['input'];
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


export type MutationUnsuspendAgencyArgs = {
  id: Scalars['ID']['input'];
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


export type MutationUpdateAssetArgs = {
  updateAssetInput: UpdateFlexAssetInput;
};


export type MutationUpdateCommissionConfigArgs = {
  input: UpdateCommissionConfigInput;
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
  couponCode?: InputMaybe<Scalars['String']['input']>;
  file_Url: Scalars['String']['input'];
  reference_no: Scalars['String']['input'];
};


export type MutationUpsertAssetCommissionOverrideArgs = {
  input: UpsertAssetCommissionOverrideInput;
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
  clients: Array<AgencyClient>;
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
  limit: Scalars['Int']['output'];
  page: Scalars['Int']['output'];
  pages: Scalars['Int']['output'];
  total: Scalars['Int']['output'];
  totalClients: Scalars['Int']['output'];
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

export type PortfolioDefaulting = {
  __typename?: 'PortfolioDefaulting';
  amountPaidByDefaulters?: Maybe<Scalars['Float']['output']>;
  amountStillOwing?: Maybe<Scalars['Float']['output']>;
  defaultedAssetValue?: Maybe<Scalars['Float']['output']>;
  defaultingCustomers?: Maybe<Scalars['Int']['output']>;
};

export type PortfolioMetrics = {
  __typename?: 'PortfolioMetrics';
  activeCustomers?: Maybe<Scalars['Int']['output']>;
  defaulting?: Maybe<PortfolioDefaulting>;
  overallEfficiency?: Maybe<Scalars['Float']['output']>;
  totalBalanceOwed?: Maybe<Scalars['Float']['output']>;
  totalCapacitySqm?: Maybe<Scalars['Float']['output']>;
  totalMoneyReceived?: Maybe<Scalars['Float']['output']>;
  totalPortfolioValue?: Maybe<Scalars['Float']['output']>;
  totalSqmSold?: Maybe<Scalars['Float']['output']>;
  totalValueSold?: Maybe<Scalars['Float']['output']>;
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
  clientAssets: ClientAssetListResponse;
  clientDashboardOverview: ClientDashboardOverviewResponse;
  clientPaymentSchedule: ClientPaymentScheduleResponse;
  clientTransactions: ClientTransactionListResponse;
  eligibleClientsForLand: EligibleClientsForLandResponse;
  flexQualifiedUsers?: Maybe<QualifiedUsersResponse>;
  fullownershipQualifiedUsers?: Maybe<QualifiedUsersResponse>;
  generateAdminOtp?: Maybe<Scalars['String']['output']>;
  getAcademyUserProfile?: Maybe<AcademyUserProfile>;
  getActiveCoupons: CouponsResponse;
  getAdminDashboardDetails?: Maybe<AdminDashboard>;
  getAdminTransactionDetails?: Maybe<Transactions>;
  getAdminWithRole: SingleAdminWithRoleResponse;
  getAgencies: AgenciesResponse;
  getAgencyById: AgencyResponse;
  getAgencyDashboard: AgencyDashboardResponse;
  getAgencyReferrals: Array<Maybe<AgencyReferralUser>>;
  getAgencySystemMetrics: AgencySystemMetrics;
  getAgencyTransactions: Array<Maybe<AgencyWalletTransaction>>;
  getAllAdminAssets?: Maybe<AssetAdminResponse>;
  getAllAdminLogs?: Maybe<LogAdminResponse>;
  getAllAdminWithRoles: AdminRoleResponse;
  getAllClientRequests: Scalars['JSON']['output'];
  getAllCoupons: CouponsResponse;
  getAllDefaultUsers?: Maybe<UserAdminResponse>;
  getAllPermissions: PermissionResponse;
  getAllRoles: RoleResponse;
  getAllSuspendedUsers?: Maybe<UserAdminResponse>;
  getAllUpgradeRequests: UpgradeRequestsResponse;
  getAllUsers?: Maybe<UserAdminResponse>;
  getAllUsersWithFilters?: Maybe<FilteredUserAdminResponse>;
  getAssetAnalytics?: Maybe<AssetAnalyticsResponse>;
  getAssetCommissionOverride?: Maybe<AssetCommissionOverride>;
  getAssetCommissionOverrides: AssetCommissionOverrideListResponse;
  getAssetInventoryData?: Maybe<AssetInventoryResponse>;
  getAssetTransaction?: Maybe<TransactionAdminResponse>;
  getAssetTransactionData?: Maybe<TransactionAdminAssetResponse>;
  getAssociateProUpgrades: AssociateProUpgradeResponse;
  getAvailableAssets?: Maybe<AssetResponse>;
  getCampaignDashboard: CampaignDashboard;
  getCampaignHampers?: Maybe<CampaignHamperResponse>;
  getCampaignPaymentPlans?: Maybe<CampaignPaymentPlansResponse>;
  getClientOverview: ClientOverviewResponse;
  getCommissionConfig: CommissionConfig;
  getCommissionConfigHistory: CommissionConfigHistoryResponse;
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
  getReferralAnalytics: ReferralAnalytics;
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
  searchAcademyUsers: Array<AcademyUserSearchResult>;
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


export type QueryClientAssetsArgs = {
  page?: InputMaybe<Scalars['Int']['input']>;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
};


export type QueryClientPaymentScheduleArgs = {
  paymentPlanId: Scalars['String']['input'];
};


export type QueryClientTransactionsArgs = {
  page?: InputMaybe<Scalars['Int']['input']>;
  pageSize?: InputMaybe<Scalars['Int']['input']>;
};


export type QueryEligibleClientsForLandArgs = {
  filters?: InputMaybe<FiltersInput>;
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
};


export type QueryGetAcademyUserProfileArgs = {
  username: Scalars['String']['input'];
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


export type QueryGetAgenciesArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>;
  page?: InputMaybe<Scalars['Int']['input']>;
  query?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetAgencyByIdArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetAgencyDashboardArgs = {
  filter?: InputMaybe<AgencyDashboardFilter>;
};


export type QueryGetAgencyReferralsArgs = {
  agencyId: Scalars['ID']['input'];
  statusFilter?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetAgencyTransactionsArgs = {
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
  endDate?: InputMaybe<Scalars['String']['input']>;
  hasAsset?: InputMaybe<Scalars['Boolean']['input']>;
  hasReferral?: InputMaybe<Scalars['Boolean']['input']>;
  howDidYouHearAboutUs?: InputMaybe<Scalars['String']['input']>;
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
  referralStatus?: InputMaybe<Scalars['String']['input']>;
  searchQuery?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetAllUsersWithFiltersArgs = {
  hasAsset?: InputMaybe<Scalars['Boolean']['input']>;
  hasReferral?: InputMaybe<Scalars['Boolean']['input']>;
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
  referralStatus?: InputMaybe<Scalars['String']['input']>;
  searchQuery?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetAssetAnalyticsArgs = {
  assetId: Scalars['ID']['input'];
  endDate?: InputMaybe<Scalars['Date']['input']>;
  filter: Scalars['String']['input'];
  startDate?: InputMaybe<Scalars['Date']['input']>;
};


export type QueryGetAssetCommissionOverrideArgs = {
  assetId: Scalars['ID']['input'];
};


export type QueryGetAssetCommissionOverridesArgs = {
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
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
  searchQuery?: InputMaybe<Scalars['String']['input']>;
  sortBy?: InputMaybe<Scalars['String']['input']>;
  sortOrder?: InputMaybe<Scalars['String']['input']>;
};


export type QueryGetCommissionConfigHistoryArgs = {
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
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


export type QueryGetSalesDashboardArgs = {
  endDate?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['String']['input']>;
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


export type QueryGetSystemUsersOverviewArgs = {
  endDate?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['String']['input']>;
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


export type QuerySearchAcademyUsersArgs = {
  query: Scalars['String']['input'];
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

export type ReferralAnalytics = {
  __typename?: 'ReferralAnalytics';
  howYouHeardBreakdown: HowYouHeardBreakdown;
  revenueLeaders: RevenueLeadersResponse;
  ticketHolders: TicketHoldersResponse;
  topReferrers: TopReferrersResponse;
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

export type ReferralUpgradePaginationInfo = {
  __typename?: 'ReferralUpgradePaginationInfo';
  currentPage: Scalars['Int']['output'];
  limit: Scalars['Int']['output'];
  totalCount: Scalars['Int']['output'];
  totalPages: Scalars['Int']['output'];
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

export type RevenueDataPoint = {
  __typename?: 'RevenueDataPoint';
  amount: Scalars['Float']['output'];
  cumulativeAmount: Scalars['Float']['output'];
  date: Scalars['String']['output'];
};

export type RevenueGraph = {
  __typename?: 'RevenueGraph';
  averageDailyRevenue: Scalars['Float']['output'];
  chartData: Array<RevenueDataPoint>;
  peakDay?: Maybe<RevenueDataPoint>;
  totalRevenue: Scalars['Float']['output'];
};

export type RevenueLeader = {
  __typename?: 'RevenueLeader';
  referrerEmail?: Maybe<Scalars['String']['output']>;
  referrerFullName?: Maybe<Scalars['String']['output']>;
  referrerId: Scalars['ID']['output'];
  totalRevenue: Scalars['Float']['output'];
};

export type RevenueLeadersResponse = {
  __typename?: 'RevenueLeadersResponse';
  leaders: Array<RevenueLeader>;
  total: Scalars['Int']['output'];
};

export type RevenueMetrics = {
  __typename?: 'RevenueMetrics';
  percentageComplete: Scalars['Float']['output'];
  progressText: Scalars['String']['output'];
  revenueGoal: Scalars['Float']['output'];
  revenueRemaining: Scalars['Float']['output'];
  totalRevenue: Scalars['Float']['output'];
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
  endDate?: InputMaybe<Scalars['Date']['input']>;
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
  batchSize?: Maybe<Scalars['Int']['output']>;
  batches?: Maybe<Scalars['Int']['output']>;
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

export type SuspendAgencyResponse = {
  __typename?: 'SuspendAgencyResponse';
  _id: Scalars['ID']['output'];
  is_suspended?: Maybe<Scalars['Boolean']['output']>;
  status?: Maybe<Scalars['String']['output']>;
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

export type TicketDetail = {
  __typename?: 'TicketDetail';
  amountPaid: Scalars['Float']['output'];
  createdDate: Scalars['Date']['output'];
  isActive: Scalars['Boolean']['output'];
  referrerFullName?: Maybe<Scalars['String']['output']>;
  ticketId: Scalars['String']['output'];
  ticketType: Scalars['String']['output'];
  userEmail?: Maybe<Scalars['String']['output']>;
  userFullName?: Maybe<Scalars['String']['output']>;
  userId: Scalars['ID']['output'];
};

export type TicketHoldersResponse = {
  __typename?: 'TicketHoldersResponse';
  tickets: Array<TicketDetail>;
  totalTickets: Scalars['Int']['output'];
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

export type TopReferrer = {
  __typename?: 'TopReferrer';
  referrerEmail?: Maybe<Scalars['String']['output']>;
  referrerFullName?: Maybe<Scalars['String']['output']>;
  referrerId: Scalars['ID']['output'];
  totalReferrals: Scalars['Int']['output'];
};

export type TopReferrersResponse = {
  __typename?: 'TopReferrersResponse';
  referrers: Array<TopReferrer>;
  total: Scalars['Int']['output'];
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
  processing_type?: Maybe<Scalars['String']['output']>;
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
  assetType: Scalars['String']['output'];
  clientName: Scalars['String']['output'];
  dueDate: Scalars['Date']['output'];
  potentialCommission: Scalars['Float']['output'];
  size: Scalars['Float']['output'];
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

export type UpdateCommissionConfigInput = {
  associateProFee?: InputMaybe<Scalars['Float']['input']>;
  changeDescription: Scalars['String']['input'];
  flexCommission?: InputMaybe<FlexCommissionInput>;
  flexRemoval?: InputMaybe<FlexRemovalInput>;
  fullOwnershipCommission?: InputMaybe<FullOwnershipCommissionInput>;
  fullOwnershipRemoval?: InputMaybe<FullOwnershipRemovalInput>;
  highCommissionAlertThreshold?: InputMaybe<Scalars['Float']['input']>;
  upgradeCommissionPercentage?: InputMaybe<Scalars['Float']['input']>;
  whtPercentage?: InputMaybe<Scalars['Float']['input']>;
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
  pagination: ReferralUpgradePaginationInfo;
  upgradeRequests: Array<Maybe<ReferralUpgrade>>;
};

export type UpgradeTypeStats = {
  __typename?: 'UpgradeTypeStats';
  count: Scalars['Int']['output'];
  percentage: Scalars['Float']['output'];
};

export type UpsertAssetCommissionOverrideInput = {
  assetId: Scalars['ID']['input'];
  changeDescription: Scalars['String']['input'];
  flexCommission?: InputMaybe<FlexCommissionInput>;
  flexRemoval?: InputMaybe<FlexRemovalInput>;
  fullOwnershipCommission?: InputMaybe<FullOwnershipCommissionInput>;
  fullOwnershipRemoval?: InputMaybe<FullOwnershipRemovalInput>;
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
  referral_status?: Maybe<Scalars['String']['output']>;
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

export type UserToAssociateProMetrics = {
  __typename?: 'UserToAssociateProMetrics';
  conversionRate: Scalars['Float']['output'];
  convertedToAssociatePro: Scalars['Int']['output'];
  notConverted: Scalars['Int']['output'];
  totalUsers: Scalars['Int']['output'];
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

export type AdminLogsRowFragmentFragment = { __typename?: 'LogAdmin', _id: string, timestamp?: any | null, description?: string | null, action?: string | null, adminEmail?: string | null, adminId?: string | null, metadata?: any | null, oldState?: any | null } & { ' $fragmentName'?: 'AdminLogsRowFragmentFragment' };

export type ExportAdminLogsQueryVariables = Exact<{
  page: Scalars['Int']['input'];
  limit: Scalars['Int']['input'];
  adminEmail?: InputMaybe<Scalars['String']['input']>;
  action?: InputMaybe<Scalars['String']['input']>;
}>;


export type ExportAdminLogsQuery = { __typename?: 'Query', getAllAdminLogs?: { __typename?: 'LogAdminResponse', data?: Array<{ __typename?: 'LogAdmin', timestamp?: any | null, description?: string | null, action?: string | null, adminEmail?: string | null, adminId?: string | null, metadata?: any | null, oldState?: any | null, _id: string } | null> | null } | null };

export type GetAllAdminLogsQueryVariables = Exact<{
  page: Scalars['Int']['input'];
  limit: Scalars['Int']['input'];
  adminEmail?: InputMaybe<Scalars['String']['input']>;
  action?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetAllAdminLogsQuery = { __typename?: 'Query', getAllAdminLogs?: { __typename?: 'LogAdminResponse', count?: number | null, data?: Array<(
      { __typename?: 'LogAdmin' }
      & { ' $fragmentRefs'?: { 'AdminLogsRowFragmentFragment': AdminLogsRowFragmentFragment } }
    ) | null> | null } | null };

export type AllocationAssetOptionFragmentFragment = { __typename?: 'Asset', _id?: string | null, asset_name?: string | null, asset_type?: string | null } & { ' $fragmentName'?: 'AllocationAssetOptionFragmentFragment' };

export type AllocationTableRowFragmentFragment = { __typename?: 'EligibleClient', allocation?: string | null, allocationStatus?: string | null, allocationDate?: string | null, amountPaid?: number | null, assetName?: string | null, assetSize?: number | null, assetType?: string | null, duration?: number | null, email?: string | null, end_date?: string | null, firstName?: string | null, lastName?: string | null, location?: string | null, paymentPlan?: string | null, paymentPercentage?: string | null, phoneNumber?: string | null, referral?: string | null, referralStatus?: string | null, totalPrice?: number | null, unit?: number | null } & { ' $fragmentName'?: 'AllocationTableRowFragmentFragment' };

export type AllocateLandMutationVariables = Exact<{
  paymentPlanId: Scalars['String']['input'];
  block: Scalars['String']['input'];
  plot: Scalars['String']['input'];
}>;


export type AllocateLandMutation = { __typename?: 'Mutation', allocateLand: { __typename?: 'AllocateLandResponse', success: boolean, message: string, block: string, plot: string, assetName: string, previousAllocation?: { __typename?: 'PreviousAllocation', block: string, plot: string } | null } };

export type GetAllocationAssetsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAllocationAssetsQuery = { __typename?: 'Query', getAllAdminAssets?: { __typename?: 'AssetAdminResponse', data: Array<(
      { __typename?: 'Asset' }
      & { ' $fragmentRefs'?: { 'AllocationAssetOptionFragmentFragment': AllocationAssetOptionFragmentFragment } }
    ) | null> } | null };

export type EligibleClientsForLandQueryVariables = Exact<{
  page: Scalars['Int']['input'];
  limit: Scalars['Int']['input'];
  filters?: InputMaybe<FiltersInput>;
}>;


export type EligibleClientsForLandQuery = { __typename?: 'Query', eligibleClientsForLand: { __typename?: 'EligibleClientsForLandResponse', count: number, limit: number, page: number, data: Array<(
      { __typename?: 'EligibleClient' }
      & { ' $fragmentRefs'?: { 'AllocationTableRowFragmentFragment': AllocationTableRowFragmentFragment } }
    )> } };

export type ExportEligibleClientsForLandQueryVariables = Exact<{
  limit: Scalars['Int']['input'];
  filters?: InputMaybe<FiltersInput>;
}>;


export type ExportEligibleClientsForLandQuery = { __typename?: 'Query', eligibleClientsForLand: { __typename?: 'EligibleClientsForLandResponse', count: number, data: Array<(
      { __typename?: 'EligibleClient' }
      & { ' $fragmentRefs'?: { 'AllocationTableRowFragmentFragment': AllocationTableRowFragmentFragment } }
    )> } };

export type AssetCategoryHealth_StatisticsFragment = { __typename?: 'AssetInventoryStatistics', categories?: Array<{ __typename?: 'AssetCategoryMetrics', category?: string | null, activeAssetCount?: number | null, totalSqm?: number | null, grossRevenue?: number | null, collectionEfficiency?: number | null, occupancyRate?: number | null, totalValueSold?: number | null, totalSqmSold?: number | null, totalMoneyReceived?: number | null, totalBalance?: number | null, defaulting?: { __typename?: 'CategoryDefaulting', defaultedAssetValue?: number | null, defaultersPaid?: number | null, defaultersOwing?: number | null } | null } | null> | null } & { ' $fragmentName'?: 'AssetCategoryHealth_StatisticsFragment' };

export type AssetFlexTable_AssetFragment = { __typename?: 'Asset', _id?: string | null, asset_name?: string | null, asset_location?: string | null, sold?: boolean | null, asset_type?: string | null, collectionEfficiencyRate?: number | null, asset_option?: Array<{ __typename?: 'AssetOption', size?: number | null, unit?: string | null, price?: number | null, flex_payment_plans?: Array<{ __typename?: 'FlexPaymentPlan', price?: number | null, unit?: number | null } | null> | null } | null> | null } & { ' $fragmentName'?: 'AssetFlexTable_AssetFragment' };

export type AssetFullOwnershipTable_AssetFragment = { __typename?: 'Asset', _id?: string | null, asset_name?: string | null, asset_location?: string | null, sold?: boolean | null, asset_type?: string | null, collectionEfficiencyRate?: number | null, asset_option?: Array<{ __typename?: 'AssetOption', size?: number | null, unit?: string | null, zero_months?: number | null } | null> | null } & { ' $fragmentName'?: 'AssetFullOwnershipTable_AssetFragment' };

export type AssetInventoryOverview_StatisticsFragment = { __typename?: 'AssetInventoryStatistics', assetsSummary?: { __typename?: 'AssetSummary', totalAssets?: number | null, totalWorth?: number | null, totalFlexAssets?: number | null, totalFlexWorth?: number | null, totalFullOwnershipAssets?: number | null, totalFullOwnershipWorth?: number | null } | null } & { ' $fragmentName'?: 'AssetInventoryOverview_StatisticsFragment' };

export type InventoryHealthBar_StatisticsFragment = { __typename?: 'AssetInventoryStatistics', portfolio?: { __typename?: 'PortfolioMetrics', totalPortfolioValue?: number | null, totalCapacitySqm?: number | null, activeCustomers?: number | null, overallEfficiency?: number | null, totalValueSold?: number | null, totalSqmSold?: number | null, totalMoneyReceived?: number | null, totalBalanceOwed?: number | null, defaulting?: { __typename?: 'PortfolioDefaulting', defaultingCustomers?: number | null, defaultedAssetValue?: number | null, amountPaidByDefaulters?: number | null, amountStillOwing?: number | null } | null } | null } & { ' $fragmentName'?: 'InventoryHealthBar_StatisticsFragment' };

export type AssetHealthBar_StatisticsFragment = { __typename?: 'AssetAnalyticsStatistics', totalInventory?: number | null, totalRealised?: number | null, remainingValue?: number | null, totalSqmSold?: number | null, totalSqmRemaining?: number | null, efficiencyRate?: number | null, totalActiveCustomers?: number | null, defaulting?: { __typename?: 'AssetAnalyticsDefaulting', totalDefaultingCustomers?: number | null, totalDefaultedAssetValue?: number | null, totalDefaultedOutstandingValue?: number | null } | null, terminated?: { __typename?: 'AssetAnalyticsTerminated', totalTerminatedCustomers?: number | null, totalTerminatedAssetValue?: number | null, totalTerminatedBalance?: number | null } | null } & { ' $fragmentName'?: 'AssetHealthBar_StatisticsFragment' };

export type PaymentPlanMatrix_StatisticsFragment = { __typename?: 'AssetAnalyticsStatistics', sizePlanBreakdown: Array<{ __typename?: 'AssetSizePlanGroup', size?: string | null, plans: Array<{ __typename?: 'AssetSizePlanBreakdown', name?: string | null, startValue?: number | null, soldValue?: number | null, totalSqmSold?: number | null, totalSqmRemaining?: number | null, totalPlans?: number | null, totalDefaultingUsers?: number | null, totalDefaultedValue?: number | null, totalBalance?: number | null, totalTerminatedPlans?: number | null, totalTerminatedValue?: number | null, totalTerminatedBalance?: number | null, efficiency?: number | null } | null> } | null> } & { ' $fragmentName'?: 'PaymentPlanMatrix_StatisticsFragment' };

export type ViewSubscribedCustomersOnAssetQueryVariables = Exact<{
  assetName: Scalars['String']['input'];
  assetType?: InputMaybe<Scalars['String']['input']>;
  filter?: InputMaybe<Scalars['String']['input']>;
  size?: InputMaybe<Scalars['Int']['input']>;
  startDate?: InputMaybe<Scalars['String']['input']>;
  endDate?: InputMaybe<Scalars['String']['input']>;
  subscriberType?: InputMaybe<Scalars['String']['input']>;
}>;


export type ViewSubscribedCustomersOnAssetQuery = { __typename?: 'Query', viewSubscribedCustomersOnAsset: { __typename?: 'SubscribedCustomerDetailsResponse', totalSubscribers: number, unitSold: number, earningReceived: number, expectedEarning: number, defaultedUsers: number, suspendedUsers: number, completedPayments: number, totalPlotsSold: number, userDetails: Array<{ __typename?: 'subscribedCustomersDetails', _id?: string | null, name: string, email: string, phone_number: string, salesPerson: string, assetName: string, sizeBought: number, unitPurchased: number, landPrice: number, landAmountPaid: number, documentPrice?: number | null, documentAmountPaid?: number | null, month_subscription: number, startDate?: string | null, nextPaymentDate?: string | null, isDefaulted: boolean, isSuspended?: boolean | null }> } };

export type GetFeatureAdminAssetsQueryVariables = Exact<{
  page: Scalars['Int']['input'];
  limit: Scalars['Int']['input'];
}>;


export type GetFeatureAdminAssetsQuery = { __typename?: 'Query', getAllAdminAssets?: { __typename?: 'AssetAdminResponse', count?: number | null, data: Array<(
      { __typename?: 'Asset', _id?: string | null }
      & { ' $fragmentRefs'?: { 'AssetFlexTable_AssetFragment': AssetFlexTable_AssetFragment;'AssetFullOwnershipTable_AssetFragment': AssetFullOwnershipTable_AssetFragment } }
    ) | null> } | null };

export type FeatureAssetStatisticsQueryVariables = Exact<{ [key: string]: never; }>;


export type FeatureAssetStatisticsQuery = { __typename?: 'Query', getAssetInventoryData?: { __typename?: 'AssetInventoryResponse', statistics?: (
      { __typename?: 'AssetInventoryStatistics' }
      & { ' $fragmentRefs'?: { 'AssetInventoryOverview_StatisticsFragment': AssetInventoryOverview_StatisticsFragment;'InventoryHealthBar_StatisticsFragment': InventoryHealthBar_StatisticsFragment;'AssetCategoryHealth_StatisticsFragment': AssetCategoryHealth_StatisticsFragment } }
    ) | null } | null };

export type GetAssetAnalyticsQueryVariables = Exact<{
  assetId: Scalars['ID']['input'];
  filter: Scalars['String']['input'];
  startDate?: InputMaybe<Scalars['Date']['input']>;
  endDate?: InputMaybe<Scalars['Date']['input']>;
}>;


export type GetAssetAnalyticsQuery = { __typename?: 'Query', getAssetAnalytics?: { __typename?: 'AssetAnalyticsResponse', statistics?: (
      { __typename?: 'AssetAnalyticsStatistics' }
      & { ' $fragmentRefs'?: { 'AssetHealthBar_StatisticsFragment': AssetHealthBar_StatisticsFragment;'PaymentPlanMatrix_StatisticsFragment': PaymentPlanMatrix_StatisticsFragment } }
    ) | null } | null };

export type ViewAssetByNameQueryVariables = Exact<{
  assetName: Scalars['String']['input'];
  assetType?: InputMaybe<Scalars['String']['input']>;
}>;


export type ViewAssetByNameQuery = { __typename?: 'Query', viewAssetByName?: { __typename?: 'AssetDetailByNameResponse', available_unit?: number | null, unit_sold?: number | null, expected_return?: number | null, total_value?: number | null, sizes?: Array<number> | null } | null };

export type ViewAssetOptionDataByNameQueryVariables = Exact<{
  assetName: Scalars['String']['input'];
  assetType: Scalars['String']['input'];
}>;


export type ViewAssetOptionDataByNameQuery = { __typename?: 'Query', viewAssetOptionDataByName?: { __typename?: 'AssetSizeDetailsResponse', sizes: Array<{ __typename?: 'AssetSizeDetails', size: number, available_unit: number, value: number, unit_sold: number, expected_return: number }> } | null };

export type ViewAssetQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ViewAssetQuery = { __typename?: 'Query', viewAsset: { __typename?: 'Asset', _id?: string | null, asset_name?: string | null, asset_location?: string | null, asset_type?: string | null, description?: string | null, title?: string | null, asset_pictures?: Array<string | null> | null, amenities?: Array<string | null> | null, asset_history?: any | null, basic_details?: Array<{ __typename?: 'BasicDetails', allocation_qualification?: number | null } | null> | null, documents?: { __typename?: 'Documents', deed_of_assignment?: string | null, survey?: string | null, contract_of_sales?: string | null, estate_layout?: string | null } | null, asset_option?: Array<{ __typename?: 'AssetOption', size?: number | null, unit?: string | null, price?: number | null, zero_months?: number | null, three_months?: number | null, six_months?: number | null, twelve_months?: number | null, one_month?: number | null, five_months?: number | null, seven_months?: number | null, development_fee?: number | null, initial_payment?: number | null, monthly_installment?: number | null, one_month_initial_payment?: number | null, five_months_initial_payment?: number | null, seven_months_initial_payment?: number | null, flex_payment_plans?: Array<{ __typename?: 'FlexPaymentPlan', description?: string | null, duration_months: number, initial_payment?: number | null, monthly_installment: number, price?: number | null, unit?: number | null } | null> | null } | null> | null } };

export type CreateFlexAssetMutationVariables = Exact<{
  createFlexAssetInput: CreateFlexAssetInput;
}>;


export type CreateFlexAssetMutation = { __typename?: 'Mutation', createFlexAsset: { __typename?: 'Asset', _id?: string | null, asset_name?: string | null } };

export type CreateFullOwnershipAssetMutationVariables = Exact<{
  createFullOwnershipAssetInput: CreateFullOwnershipAssetInput;
}>;


export type CreateFullOwnershipAssetMutation = { __typename?: 'Mutation', createFullOwnershipAsset: { __typename?: 'AdminAsset', _id: string, asset_name?: string | null } };

export type UpdateAssetMutationVariables = Exact<{
  updateAssetInput: UpdateFlexAssetInput;
}>;


export type UpdateAssetMutation = { __typename?: 'Mutation', updateAsset: string };

export type UpgradeRowFragmentFragment = { __typename?: 'ReferralUpgrade', _id: string, admin_status?: string | null, createdAt?: string | null, fee_amount?: number | null, transaction_type?: string | null, user_upgrade_type?: string | null, file_Url?: string | null, user?: { __typename?: 'User', _id: string, firstName: string, lastName: string, email: string } | null, associate?: { __typename?: 'User', _id: string, firstName: string, lastName: string, email: string } | null } & { ' $fragmentName'?: 'UpgradeRowFragmentFragment' };

export type ApproveUpgradeToAssociateMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ApproveUpgradeToAssociateMutation = { __typename?: 'Mutation', approveUpgradeToAssociate: string };

export type ApproveUpgradeToAssociateProMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type ApproveUpgradeToAssociateProMutation = { __typename?: 'Mutation', approveUpgradeToAssociatePro: string };

export type GetActiveCouponsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetActiveCouponsQuery = { __typename?: 'Query', getActiveCoupons: { __typename?: 'CouponsResponse', count: number, data: Array<{ __typename?: 'Coupon', _id: string, couponCode: string, discountPercentage: number, startDate: any, endDate?: any | null, expiryDate?: any | null, expiryType: ExpiryType, usageLimit?: number | null, usageLimitType: UsageLimitType, status?: CouponStatus | null, activeImmediately: boolean, createdAt: any, updatedAt: any }> } };

export type CreateCouponMutationVariables = Exact<{
  input: CreateCouponInput;
}>;


export type CreateCouponMutation = { __typename?: 'Mutation', createCoupon: { __typename?: 'CouponResponse', success: boolean, message?: string | null, data?: { __typename?: 'Coupon', _id: string } | null } };

export type UpdateCouponStatusMutationVariables = Exact<{
  input: UpdateCouponStatusInput;
}>;


export type UpdateCouponStatusMutation = { __typename?: 'Mutation', updateCouponStatus: { __typename?: 'CouponResponse', message?: string | null, success: boolean } };

export type DeleteCouponMutationVariables = Exact<{
  couponCode: Scalars['String']['input'];
}>;


export type DeleteCouponMutation = { __typename?: 'Mutation', deleteCoupon: { __typename?: 'DeleteCouponResponse', message: string, success: boolean } };

export type UpdateCouponMutationVariables = Exact<{
  input: UpdateCouponInput;
}>;


export type UpdateCouponMutation = { __typename?: 'Mutation', updateCoupon: { __typename?: 'CouponResponse', message?: string | null, success: boolean, data?: { __typename?: 'Coupon', _id: string } | null } };

export type ManualUpgradeToAssociateProMutationVariables = Exact<{
  email: Scalars['String']['input'];
  amount: Scalars['Float']['input'];
  payCommission: Scalars['Boolean']['input'];
  paymentUrl: Scalars['String']['input'];
  commissionableAmount?: InputMaybe<Scalars['Float']['input']>;
}>;


export type ManualUpgradeToAssociateProMutation = { __typename?: 'Mutation', manualUpgradeToAssociatePro: { __typename?: 'ManualUpgradeResponse', success: boolean, message: string } };

export type DeclineUpgradeRequestMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type DeclineUpgradeRequestMutation = { __typename?: 'Mutation', declineUpgradeRequest: string };

export type GetAllUpgradeRequestsQueryVariables = Exact<{
  page: Scalars['Int']['input'];
  limit: Scalars['Int']['input'];
  adminStatus?: InputMaybe<AdminStatus>;
}>;


export type GetAllUpgradeRequestsQuery = { __typename?: 'Query', getAllUpgradeRequests: { __typename?: 'UpgradeRequestsResponse', upgradeRequests: Array<(
      { __typename?: 'ReferralUpgrade' }
      & { ' $fragmentRefs'?: { 'UpgradeRowFragmentFragment': UpgradeRowFragmentFragment } }
    ) | null>, pagination: { __typename?: 'ReferralUpgradePaginationInfo', currentPage: number, limit: number, totalCount: number, totalPages: number } } };

export type SearchUpgradeUsersQueryVariables = Exact<{
  searchQuery?: InputMaybe<Scalars['String']['input']>;
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
}>;


export type SearchUpgradeUsersQuery = { __typename?: 'Query', getAllUsers?: { __typename?: 'UserAdminResponse', data?: Array<{ __typename?: 'UserAdmin', _id: string, firstName: string, lastName: string, email: string } | null> | null } | null };

export type TopAssociatesTableRowFragmentFragment = { __typename?: 'Associate', name?: string | null, status?: string | null, email?: string | null, sales_person?: string | null, no_of_clients?: number | null, units_sold?: number | null, size_sold?: number | null, expected_revenue?: number | null, received_revenue?: number | null, commission?: number | null } & { ' $fragmentName'?: 'TopAssociatesTableRowFragmentFragment' };

export type GetTopAssociatesQueryVariables = Exact<{
  page: Scalars['Int']['input'];
  limit: Scalars['Int']['input'];
  sortBy?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetTopAssociatesQuery = { __typename?: 'Query', getTopAssociates?: { __typename?: 'AssociateResponse', count: number, data: Array<(
      { __typename?: 'Associate' }
      & { ' $fragmentRefs'?: { 'TopAssociatesTableRowFragmentFragment': TopAssociatesTableRowFragmentFragment } }
    )> } | null };

export type AssociateProMetricsSection_DashboardFragment = { __typename?: 'CampaignDashboard', associateProProgress: { __typename?: 'AssociateProProgress', currentAssociatePro: number, percentageComplete: number, targetAssociatePro: number }, revenueMetrics: { __typename?: 'RevenueMetrics', totalRevenue: number, revenueGoal: number, percentageComplete: number }, campaignPeriod: { __typename?: 'CampaignPeriod', daysRemaining: number, endDate: any }, ticketMetrics: { __typename?: 'CampaignTicketMetrics', totalTicketsIssued: number }, conversionMetrics: { __typename?: 'ConversionMetrics', overallConversionRate: number, userToAssociatePro: { __typename?: 'UserToAssociateProMetrics', totalUsers: number, convertedToAssociatePro: number, conversionRate: number }, associateToAssociatePro: { __typename?: 'AssociateToAssociateProMetrics', totalAssociates: number, convertedToAssociatePro: number, conversionRate: number } }, graphs: { __typename?: 'CampaignGraphs', revenueGraph: { __typename?: 'RevenueGraph', chartData: Array<{ __typename?: 'RevenueDataPoint', date: string, amount: number }> }, conversionGraph: { __typename?: 'ConversionGraph', userToAssociateProConversions: { __typename?: 'ConversionGraphData', chartData: Array<{ __typename?: 'ConversionDataPoint', date: string, count: number }> } } } } & { ' $fragmentName'?: 'AssociateProMetricsSection_DashboardFragment' };

export type AssociateProUpgradeDetailFragment = { __typename?: 'AssociateProUpgradeDetail', upgradeId: string, userFullName?: string | null, userSince: any, associateSince?: any | null, associateProSince?: any | null, referrerFullName?: string | null, amountPaid: number, adminStatus: string, ticketId?: string | null } & { ' $fragmentName'?: 'AssociateProUpgradeDetailFragment' };

export type AssociateProTopReferrerFragment = { __typename?: 'TopReferrer', referrerId: string, referrerFullName?: string | null, referrerEmail?: string | null, totalReferrals: number } & { ' $fragmentName'?: 'AssociateProTopReferrerFragment' };

export type AssociateProRevenueLeaderFragment = { __typename?: 'RevenueLeader', referrerId: string, referrerFullName?: string | null, referrerEmail?: string | null, totalRevenue: number } & { ' $fragmentName'?: 'AssociateProRevenueLeaderFragment' };

export type AssociateProSourceBreakdownFragment = { __typename?: 'HowYouHeardSource', source: string, count: number, percentage: number } & { ' $fragmentName'?: 'AssociateProSourceBreakdownFragment' };

export type AssociateProTicketHolderFragment = { __typename?: 'TicketDetail', ticketId: string, ticketType: string, userFullName?: string | null, userEmail?: string | null, referrerFullName?: string | null, amountPaid: number, createdDate: any, isActive: boolean } & { ' $fragmentName'?: 'AssociateProTicketHolderFragment' };

export type AssociateProReferralAnalyticsFragment = { __typename?: 'ReferralAnalytics', topReferrers: { __typename?: 'TopReferrersResponse', referrers: Array<(
      { __typename?: 'TopReferrer' }
      & { ' $fragmentRefs'?: { 'AssociateProTopReferrerFragment': AssociateProTopReferrerFragment } }
    )> }, revenueLeaders: { __typename?: 'RevenueLeadersResponse', leaders: Array<(
      { __typename?: 'RevenueLeader' }
      & { ' $fragmentRefs'?: { 'AssociateProRevenueLeaderFragment': AssociateProRevenueLeaderFragment } }
    )> }, howYouHeardBreakdown: { __typename?: 'HowYouHeardBreakdown', totalResponses: number, breakdown: Array<(
      { __typename?: 'HowYouHeardSource' }
      & { ' $fragmentRefs'?: { 'AssociateProSourceBreakdownFragment': AssociateProSourceBreakdownFragment } }
    )> } } & { ' $fragmentName'?: 'AssociateProReferralAnalyticsFragment' };

export type AssociateProRecruitmentUserFragment = { __typename?: 'FilteredUserAdminDetail', _id?: string | null, firstName?: string | null, lastName?: string | null, email?: string | null, createdAt?: any | null, referral?: { __typename?: 'Referrer', firstName: string, lastName: string, email?: string | null } | null } & { ' $fragmentName'?: 'AssociateProRecruitmentUserFragment' };

export type HamperSalesMetricsFragment = { __typename?: 'SalesMetricsHamper', dailySqmTargetRemaining?: number | null, percentageSold?: number | null, sqmRemainingToSell?: number | null, targetSqm?: number | null, totalSqmSold?: number | null } & { ' $fragmentName'?: 'HamperSalesMetricsFragment' };

export type HamperFinancialMetricsFragment = { __typename?: 'FinancialMetricsHamper', totalRevenueGenerated?: number | null, totalAssetValueSold?: number | null, averagePaymentPerPlan?: number | null, totalBalance?: number | null } & { ' $fragmentName'?: 'HamperFinancialMetricsFragment' };

export type HamperAssetBreakdownFragment = { __typename?: 'AssetBreakdownHamper', assetName?: string | null, percentageOfTotal?: number | null, totalSqmSold?: number | null, totalHampers?: number | null } & { ' $fragmentName'?: 'HamperAssetBreakdownFragment' };

export type HamperReferrerFragment = { __typename?: 'ReferrerWithHampers', name?: string | null, email?: string | null, hamperCount?: number | null, totalSqmReferred?: number | null } & { ' $fragmentName'?: 'HamperReferrerFragment' };

export type RaffleSalesMetricsFragment = { __typename?: 'SalesMetrics', dailySqmTargetRemaining?: number | null, percentageSold?: number | null, sqmRemainingToSell?: number | null, targetSqm?: number | null, totalSqmSold?: number | null } & { ' $fragmentName'?: 'RaffleSalesMetricsFragment' };

export type RaffleFinancialMetricsFragment = { __typename?: 'FinancialMetrics', totalRevenueGenerated?: number | null, totalAssetValueSold?: number | null, averagePaymentPerPlan?: number | null, totalBalance?: number | null } & { ' $fragmentName'?: 'RaffleFinancialMetricsFragment' };

export type RaffleAssetBreakdownFragment = { __typename?: 'AssetBreakdown', assetName?: string | null, percentageOfTotal?: number | null, totalSqmSold?: number | null, totalTickets?: number | null } & { ' $fragmentName'?: 'RaffleAssetBreakdownFragment' };

export type RaffleUserTicketFragment = { __typename?: 'UserWithTicket', email?: string | null, name?: string | null, ticketId?: string | null } & { ' $fragmentName'?: 'RaffleUserTicketFragment' };

export type ViewAssetRaffledrawPerformanceQueryVariables = Exact<{ [key: string]: never; }>;


export type ViewAssetRaffledrawPerformanceQuery = { __typename?: 'Query', viewAssetRaffledrawPerformance?: { __typename?: 'AssetRafflePerformanceResponse', salesMetrics?: (
      { __typename?: 'SalesMetrics' }
      & { ' $fragmentRefs'?: { 'RaffleSalesMetricsFragment': RaffleSalesMetricsFragment } }
    ) | null, financialMetrics?: (
      { __typename?: 'FinancialMetrics' }
      & { ' $fragmentRefs'?: { 'RaffleFinancialMetricsFragment': RaffleFinancialMetricsFragment } }
    ) | null, assetBreakdown?: Array<(
      { __typename?: 'AssetBreakdown' }
      & { ' $fragmentRefs'?: { 'RaffleAssetBreakdownFragment': RaffleAssetBreakdownFragment } }
    ) | null> | null, usersWithTickets?: Array<(
      { __typename?: 'UserWithTicket' }
      & { ' $fragmentRefs'?: { 'RaffleUserTicketFragment': RaffleUserTicketFragment } }
    ) | null> | null } | null };

export type ViewAssetHamperPerformanceQueryVariables = Exact<{ [key: string]: never; }>;


export type ViewAssetHamperPerformanceQuery = { __typename?: 'Query', viewAssetHamperPerformance?: { __typename?: 'AssetHamperPerformanceResponse', assetBreakdown?: Array<(
      { __typename?: 'AssetBreakdownHamper' }
      & { ' $fragmentRefs'?: { 'HamperAssetBreakdownFragment': HamperAssetBreakdownFragment } }
    ) | null> | null, financialMetrics?: (
      { __typename?: 'FinancialMetricsHamper' }
      & { ' $fragmentRefs'?: { 'HamperFinancialMetricsFragment': HamperFinancialMetricsFragment } }
    ) | null, salesMetrics?: (
      { __typename?: 'SalesMetricsHamper' }
      & { ' $fragmentRefs'?: { 'HamperSalesMetricsFragment': HamperSalesMetricsFragment } }
    ) | null, referrersWithHampers?: Array<(
      { __typename?: 'ReferrerWithHampers' }
      & { ' $fragmentRefs'?: { 'HamperReferrerFragment': HamperReferrerFragment } }
    ) | null> | null } | null };

export type Campaign2000DashboardQueryVariables = Exact<{ [key: string]: never; }>;


export type Campaign2000DashboardQuery = { __typename?: 'Query', getCampaignDashboard: (
    { __typename?: 'CampaignDashboard' }
    & { ' $fragmentRefs'?: { 'AssociateProMetricsSection_DashboardFragment': AssociateProMetricsSection_DashboardFragment } }
  ), getAssociateProUpgrades: { __typename?: 'AssociateProUpgradeResponse', total: number, upgrades: Array<(
      { __typename?: 'AssociateProUpgradeDetail' }
      & { ' $fragmentRefs'?: { 'AssociateProUpgradeDetailFragment': AssociateProUpgradeDetailFragment } }
    )> }, getReferralAnalytics: (
    { __typename?: 'ReferralAnalytics', ticketHolders: { __typename?: 'TicketHoldersResponse', tickets: Array<(
        { __typename?: 'TicketDetail' }
        & { ' $fragmentRefs'?: { 'AssociateProTicketHolderFragment': AssociateProTicketHolderFragment } }
      )> } }
    & { ' $fragmentRefs'?: { 'AssociateProReferralAnalyticsFragment': AssociateProReferralAnalyticsFragment } }
  ) };

export type GetAssociateRecruitmentAnalyticsQueryVariables = Exact<{
  page: Scalars['Int']['input'];
  limit: Scalars['Int']['input'];
  hasReferral?: InputMaybe<Scalars['Boolean']['input']>;
  referralStatus?: InputMaybe<Scalars['String']['input']>;
  searchQuery?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetAssociateRecruitmentAnalyticsQuery = { __typename?: 'Query', getAllUsersWithFilters?: { __typename?: 'FilteredUserAdminResponse', count?: number | null, data?: Array<(
      { __typename?: 'FilteredUserAdminDetail' }
      & { ' $fragmentRefs'?: { 'AssociateProRecruitmentUserFragment': AssociateProRecruitmentUserFragment } }
    ) | null> | null } | null };

export type GetCampaignPaymentPlansQueryVariables = Exact<{
  page: Scalars['Int']['input'];
  limit: Scalars['Int']['input'];
}>;


export type GetCampaignPaymentPlansQuery = { __typename?: 'Query', getCampaignPaymentPlans?: { __typename?: 'CampaignPaymentPlansResponse', count?: number | null, data?: Array<{ __typename?: 'CampaignPaymentPlan', assetName: string, dateStarted?: any | null, documentAmountPaid: number, documentPrice: number, email: string, landAmountPaid: number, landPrice: number, monthsOfSubscription: number, nextDateOfPayment?: any | null, name: string, size: number, unit: number, userId: string } | null> | null } | null };

export type GetRaffleTicketsQueryVariables = Exact<{
  ticketType?: InputMaybe<TicketTypeFilter>;
}>;


export type GetRaffleTicketsQuery = { __typename?: 'Query', getRaffleTickets?: { __typename?: 'RaffleTicketResponse', data: Array<{ __typename?: 'RaffleTicket', asset_name: string, ticket_id: string, total_size: number, units_purchased: number, size_purchased: number, created_date: any, referral_ticket?: { __typename?: 'RaffleTicket', ticket_id: string, user_id?: { __typename?: 'RaffleUsers', firstName: string, lastName: string, email: string, phoneNumber?: string | null } | null } | null, user_id?: { __typename?: 'RaffleUsers', firstName: string, lastName: string, email: string, phoneNumber?: string | null } | null }> } | null };

export type GetHamperTransactionsQueryVariables = Exact<{
  page: Scalars['Int']['input'];
  limit: Scalars['Int']['input'];
}>;


export type GetHamperTransactionsQuery = { __typename?: 'Query', getCampaignPaymentPlans?: { __typename?: 'CampaignPaymentPlansResponse', count?: number | null, data?: Array<{ __typename?: 'CampaignPaymentPlan', assetName: string, dateStarted?: any | null, documentAmountPaid: number, documentPrice: number, email: string, landAmountPaid: number, landPrice: number, monthsOfSubscription: number, nextDateOfPayment?: any | null, name: string, size: number, unit: number, userId: string } | null> | null } | null };

export type GetHamperLeaderboardQueryVariables = Exact<{
  startDate?: InputMaybe<Scalars['String']['input']>;
  endDate?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetHamperLeaderboardQuery = { __typename?: 'Query', getHamperLeaderboard: Array<{ __typename?: 'HamperLeaderboardEntry', email: string, hamperCount: number, name: string, numberOfReferredUsers: number, phoneNumber: string, referrerId: string, totalAmountPaid: number, totalAssetValue: number, totalBalance: number, totalLandPrice: number, totalSqmSold: number }> };

export type DashboardQuickOverview_DataFragment = { __typename?: 'AdminDashboard', users?: number | null, monthly_recurring_revenue?: number | null, associate_users?: number | null, associate_pro_users?: number | null, total_asset?: number | null, default_users?: number | null, suspended_users?: number | null, suspended_payment_plans?: number | null, total_payable?: number | null, sales?: number | null, inflow?: number | null, outflow?: number | null, total_wallet_balance?: number | null } & { ' $fragmentName'?: 'DashboardQuickOverview_DataFragment' };

export type TopAssociates_DataFragment = { __typename?: 'UserReferralAdmin', userName: string, email: string, firstName: string, lastName: string, amount_brought?: number | null, no_of_referral?: number | null, phoneNumber: string } & { ' $fragmentName'?: 'TopAssociates_DataFragment' };

export type TopSellingProducts_DataFragment = { __typename?: 'AssetDashBoard', asset_name?: string | null, asset_pictures?: Array<string | null> | null, asset_location?: string | null, units_subscribed?: number | null, amount_broughtin?: number | null } & { ' $fragmentName'?: 'TopSellingProducts_DataFragment' };

export type GetAdminDashboardDetailsQueryVariables = Exact<{
  startDate?: InputMaybe<Scalars['String']['input']>;
  endDate?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetAdminDashboardDetailsQuery = { __typename?: 'Query', getAdminDashboardDetails?: (
    { __typename?: 'AdminDashboard', top_associates?: Array<(
      { __typename?: 'UserReferralAdmin' }
      & { ' $fragmentRefs'?: { 'TopAssociates_DataFragment': TopAssociates_DataFragment } }
    ) | null> | null, top_selling_prop?: Array<(
      { __typename?: 'AssetDashBoard' }
      & { ' $fragmentRefs'?: { 'TopSellingProducts_DataFragment': TopSellingProducts_DataFragment } }
    ) | null> | null }
    & { ' $fragmentRefs'?: { 'DashboardQuickOverview_DataFragment': DashboardQuickOverview_DataFragment } }
  ) | null };

export type InviteAdminMutationVariables = Exact<{
  input: SubAdminInput;
}>;


export type InviteAdminMutation = { __typename?: 'Mutation', createSubAdmin: string };

export type UpdateRequestStatusMutationVariables = Exact<{
  updateRequestInput: UpdateRequestInput;
}>;


export type UpdateRequestStatusMutation = { __typename?: 'Mutation', updateRequestStatus: { __typename?: 'UpdateRequestResponse', success: boolean, message: string } };

export type SystemApproveLocationChangeRequestMutationVariables = Exact<{
  requestId: Scalars['ID']['input'];
}>;


export type SystemApproveLocationChangeRequestMutation = { __typename?: 'Mutation', systemApproveLocationChangeRequest: { __typename?: 'SystemApproveLocationChangeRequestResponse', success: boolean, message: string } };

export type SystemApproveDocumentChangeRequestMutationVariables = Exact<{
  requestId: Scalars['ID']['input'];
}>;


export type SystemApproveDocumentChangeRequestMutation = { __typename?: 'Mutation', systemApproveDocumentChangeRequest: { __typename?: 'SystemApproveDocumentChangeRequestResponse', success: boolean, message: string } };

export type GetRequestStatisticsQueryVariables = Exact<{
  from?: InputMaybe<Scalars['Date']['input']>;
  to?: InputMaybe<Scalars['Date']['input']>;
}>;


export type GetRequestStatisticsQuery = { __typename?: 'Query', getRequestStatistics: { __typename?: 'RequestStatistics', totalRequests?: number | null, pendingRequests?: number | null, approvedRequests?: number | null, declinedRequests?: number | null, locationChangeRequests?: number | null, documentChangeRequests?: number | null, assetUpdateRequests?: number | null, customRequests?: number | null, totalFeesCollected?: number | null, paidRequests?: number | null, unpaidRequests?: number | null } };

export type AdminDetailFragmentFragment = { __typename?: 'AdminRoles', adminEmail: string, adminId: string, adminName: string, permissions: Array<string>, role: string, roleId: string } & { ' $fragmentName'?: 'AdminDetailFragmentFragment' };

export type AdminRowFragmentFragment = { __typename?: 'AdminRoles', adminEmail: string, adminId: string, adminName: string, permissions: Array<string>, role: string, roleId: string } & { ' $fragmentName'?: 'AdminRowFragmentFragment' };

export type PermissionOptionFragmentFragment = { __typename?: 'Permission', _id: string, name: string, description?: string | null } & { ' $fragmentName'?: 'PermissionOptionFragmentFragment' };

export type RoleCardFragmentFragment = { __typename?: 'Role', _id: string, name: string, description?: string | null, permissions: Array<string> } & { ' $fragmentName'?: 'RoleCardFragmentFragment' };

export type GetAdminWithRoleQueryVariables = Exact<{
  adminId: Scalars['String']['input'];
}>;


export type GetAdminWithRoleQuery = { __typename?: 'Query', getAdminWithRole: { __typename?: 'SingleAdminWithRoleResponse', data: (
      { __typename?: 'AdminRoles' }
      & { ' $fragmentRefs'?: { 'AdminDetailFragmentFragment': AdminDetailFragmentFragment } }
    ) } };

export type GetAllAdminWithRolesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAllAdminWithRolesQuery = { __typename?: 'Query', getAllAdminWithRoles: { __typename?: 'AdminRoleResponse', data: Array<(
      { __typename?: 'AdminRoles' }
      & { ' $fragmentRefs'?: { 'AdminRowFragmentFragment': AdminRowFragmentFragment } }
    )> } };

export type CreateRoleMutationVariables = Exact<{
  input: CreateRoleInput;
}>;


export type CreateRoleMutation = { __typename?: 'Mutation', createRole: { __typename?: 'Role', _id: string, name: string, description?: string | null, permissions: Array<string> } };

export type GetAllPermissionsQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAllPermissionsQuery = { __typename?: 'Query', getAllPermissions: { __typename?: 'PermissionResponse', data: Array<(
      { __typename?: 'Permission' }
      & { ' $fragmentRefs'?: { 'PermissionOptionFragmentFragment': PermissionOptionFragmentFragment } }
    )> } };

export type GetAllRolesQueryVariables = Exact<{ [key: string]: never; }>;


export type GetAllRolesQuery = { __typename?: 'Query', getAllRoles: { __typename?: 'RoleResponse', data: Array<(
      { __typename?: 'Role' }
      & { ' $fragmentRefs'?: { 'RoleCardFragmentFragment': RoleCardFragmentFragment } }
    )> } };

export type UpdateAdminRoleMutationVariables = Exact<{
  input: UpdateAdminRoleInput;
}>;


export type UpdateAdminRoleMutation = { __typename?: 'Mutation', updateAdminRole: string };

export type SalesRowFragmentFragment = { __typename?: 'SalesRecord', user_firstName?: string | null, user_lastName?: string | null, email?: string | null, user_phone?: string | null, referrer_name?: string | null, referrer_email?: string | null, referrer_phone?: string | null, asset_name?: string | null, asset_type?: string | null, no_of_units?: number | null, document_amount_paid?: number | null, fullownerhsip_documentprice?: number | null, month_subscription?: number | null, size?: number | null, price?: number | null, amount_paid?: number | null, start_date?: any | null, next_date?: any | null } & { ' $fragmentName'?: 'SalesRowFragmentFragment' };

export type SummaryCards_DashboardFragment = { __typename?: 'SalesDashboard', totalTransactionValue?: number | null, expectedTransactionValue?: number | null, totalReceivedTransactionValue?: number | null, outstandingTransactionValue?: number | null, totalFlexTransactionValue?: number | null, expectedFlexTransactionValue?: number | null, totalReceivedFlexTransactionValue?: number | null, outstandingFlexTransactionValue?: number | null, totalFullOwnershipTransactionValue?: number | null, expectedFullOwnershipTransactionValue?: number | null, totalReceivedFullOwnershipTransactionValue?: number | null, outstandingFullOwnershipTransactionValue?: number | null } & { ' $fragmentName'?: 'SummaryCards_DashboardFragment' };

export type ExportSalesQueryVariables = Exact<{
  filters?: InputMaybe<SalesRecordFilters>;
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
}>;


export type ExportSalesQuery = { __typename?: 'Query', getSalesRecord?: { __typename?: 'SalesRecordResponse', data?: Array<{ __typename?: 'SalesRecord', user_firstName?: string | null, user_lastName?: string | null, email?: string | null, user_phone?: string | null, referrer_name?: string | null, referrer_email?: string | null, referrer_phone?: string | null, asset_name?: string | null, asset_type?: string | null, no_of_units?: number | null, size?: number | null, price?: number | null, amount_paid?: number | null, fullownerhsip_documentprice?: number | null, document_amount_paid?: number | null, month_subscription?: number | null, start_date?: any | null, next_date?: any | null } | null> | null } | null };

export type GetSalesRecordQueryVariables = Exact<{
  filters?: InputMaybe<SalesRecordFilters>;
  limit: Scalars['Int']['input'];
  page: Scalars['Int']['input'];
}>;


export type GetSalesRecordQuery = { __typename?: 'Query', getSalesRecord?: { __typename?: 'SalesRecordResponse', count?: number | null, data?: Array<(
      { __typename?: 'SalesRecord' }
      & { ' $fragmentRefs'?: { 'SalesRowFragmentFragment': SalesRowFragmentFragment } }
    ) | null> | null } | null };

export type GetSalesDashboardQueryVariables = Exact<{
  startDate?: InputMaybe<Scalars['String']['input']>;
  endDate?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetSalesDashboardQuery = { __typename?: 'Query', getSalesDashboard?: (
    { __typename?: 'SalesDashboard' }
    & { ' $fragmentRefs'?: { 'SummaryCards_DashboardFragment': SummaryCards_DashboardFragment } }
  ) | null };

export type AssetTransactionsTable_DataFragment = { __typename?: 'AdminTransactions', _id: string, amount?: string | null, description?: string | null, admin_status?: string | null, plot_size?: string | null, asset_type?: string | null, referral?: string | null, transaction_type?: string | null, time_of_transaction?: any | null, transfer_file?: { __typename?: 'TransferFile', file?: string | null } | null, user?: { __typename?: 'UserAdmin', firstName: string, lastName: string, _id: string } | null } & { ' $fragmentName'?: 'AssetTransactionsTable_DataFragment' };

export type CommissionTransactionsTable_DataFragment = { __typename?: 'AdminTransactions', _id: string, tin?: string | null, admin_status?: string | null, amount?: string | null, asset_type?: string | null, description?: string | null, plot_size?: string | null, status?: string | null, referral?: string | null, transaction_type?: string | null, time_of_transaction?: any | null, user?: { __typename?: 'UserAdmin', _id: string, firstName: string, lastName: string, referrer?: string | null, referral_status?: string | null, email: string, tin?: string | null } | null } & { ' $fragmentName'?: 'CommissionTransactionsTable_DataFragment' };

export type CompleteAssetPaymentsTable_DataFragment = { __typename?: 'ZeroBalance', name?: string | null, email?: string | null, phone_number?: string | null, sales_person?: string | null, asset_name?: string | null, unit?: number | null, size?: number | null, price?: number | null, amount_paid?: number | null, month_subscription?: number | null, start_date?: any | null, next_payment_date?: any | null } & { ' $fragmentName'?: 'CompleteAssetPaymentsTable_DataFragment' };

export type DocumentTransactionsTable_DataFragment = { __typename?: 'AdminTransactions', _id: string, amount?: string | null, description?: string | null, admin_status?: string | null, plot_size?: string | null, asset_type?: string | null, referral?: string | null, transaction_type?: string | null, time_of_transaction?: any | null, transfer_file?: { __typename?: 'TransferFile', file?: string | null } | null, user?: { __typename?: 'UserAdmin', firstName: string, lastName: string, _id: string } | null } & { ' $fragmentName'?: 'DocumentTransactionsTable_DataFragment' };

export type TopupTransactionsTable_DataFragment = { __typename?: 'AdminTransactions', _id: string, amount?: string | null, status?: string | null, admin_status?: string | null, time_of_transaction?: any | null, transaction_type?: string | null, transfer_file?: { __typename?: 'TransferFile', file?: string | null } | null, user?: { __typename?: 'UserAdmin', firstName: string, lastName: string, _id: string } | null } & { ' $fragmentName'?: 'TopupTransactionsTable_DataFragment' };

export type WithdrawalTransactionsTable_DataFragment = { __typename?: 'AdminTransactions', _id: string, admin_status?: string | null, amount?: string | null, time_of_transaction?: any | null, processing_type?: string | null, tin?: string | null, bank_details?: { __typename?: 'UserBankDetails', accountNumber: string, bankName: string, name: string } | null, user?: { __typename?: 'UserAdmin', firstName: string, lastName: string, _id: string, tin?: string | null } | null } & { ' $fragmentName'?: 'WithdrawalTransactionsTable_DataFragment' };

export type ExportCommissionTransactionsQueryVariables = Exact<{
  page: Scalars['Int']['input'];
  limit: Scalars['Int']['input'];
  startDate?: InputMaybe<Scalars['String']['input']>;
  endDate?: InputMaybe<Scalars['String']['input']>;
}>;


export type ExportCommissionTransactionsQuery = { __typename?: 'Query', getCommissionTransactions?: { __typename?: 'TransactionAdminResponse', count?: number | null, data?: Array<{ __typename?: 'AdminTransactions', _id: string, admin_status?: string | null, amount?: string | null, asset_type?: string | null, description?: string | null, plot_size?: string | null, status?: string | null, referral?: string | null, transaction_type?: string | null, time_of_transaction?: any | null, user?: { __typename?: 'UserAdmin', _id: string, firstName: string, lastName: string, referrer?: string | null, referral_status?: string | null, email: string, tin?: string | null } | null } | null> | null } | null };

export type GetUsersWithZeroBalanceQueryVariables = Exact<{
  page: Scalars['Int']['input'];
  limit: Scalars['Int']['input'];
}>;


export type GetUsersWithZeroBalanceQuery = { __typename?: 'Query', getUsersWithZeroBalance: { __typename?: 'ZeroBalanceResponse', count: number, data: Array<(
      { __typename?: 'ZeroBalance' }
      & { ' $fragmentRefs'?: { 'CompleteAssetPaymentsTable_DataFragment': CompleteAssetPaymentsTable_DataFragment } }
    )> } };

export type ExportDocumentTransactionsQueryVariables = Exact<{
  page: Scalars['Int']['input'];
  limit: Scalars['Int']['input'];
  status?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['Date']['input']>;
  endDate?: InputMaybe<Scalars['Date']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
}>;


export type ExportDocumentTransactionsQuery = { __typename?: 'Query', getDocumentTransaction?: { __typename?: 'TransactionAdminResponse', count?: number | null, data?: Array<{ __typename?: 'AdminTransactions', _id: string, amount?: string | null, description?: string | null, admin_status?: string | null, plot_size?: string | null, asset_type?: string | null, referral?: string | null, transaction_type?: string | null, time_of_transaction?: any | null, user?: { __typename?: 'UserAdmin', firstName: string, lastName: string, email: string, phoneNumber?: string | null, referral_status?: string | null, _id: string } | null } | null> | null } | null };

export type ApproveTransactionMutationVariables = Exact<{
  approveTransactionId: Scalars['ID']['input'];
}>;


export type ApproveTransactionMutation = { __typename?: 'Mutation', approveTransaction: string };

export type DeclineTransactionMutationVariables = Exact<{
  declineTransactionInput: DeclineTransactionInput;
}>;


export type DeclineTransactionMutation = { __typename?: 'Mutation', declineTransaction?: string | null };

export type ApprovePaystackTransactionMutationVariables = Exact<{
  approvePaystackTransactionId: Scalars['ID']['input'];
}>;


export type ApprovePaystackTransactionMutation = { __typename?: 'Mutation', approvePaystackTransaction: string };

export type ApproveAssetTransactionMutationVariables = Exact<{
  approveAssetTransactionId: Scalars['ID']['input'];
}>;


export type ApproveAssetTransactionMutation = { __typename?: 'Mutation', approveAssetTransaction: string };

export type DeclineDocumentTransactionMutationVariables = Exact<{
  declineTransactionInput: DeclineTransactionInput;
}>;


export type DeclineDocumentTransactionMutation = { __typename?: 'Mutation', declineDocumentTransaction: string };

export type ProcessCommissionMutationVariables = Exact<{
  processCommissionInput: ProcessCommissionInput;
}>;


export type ProcessCommissionMutation = { __typename?: 'Mutation', processCommission: string };

export type ProcessReceiptMutationVariables = Exact<{
  processReceiptInput: ProcessReceiptInput;
}>;


export type ProcessReceiptMutation = { __typename?: 'Mutation', processReceipt: string };

export type DeclineAssetTransactionMutationVariables = Exact<{
  declineTransactionInput: DeclineTransactionInput;
}>;


export type DeclineAssetTransactionMutation = { __typename?: 'Mutation', declineAssetTransaction: string };

export type GetTopupTransactionQueryVariables = Exact<{
  page: Scalars['Int']['input'];
  limit: Scalars['Int']['input'];
}>;


export type GetTopupTransactionQuery = { __typename?: 'Query', getTopupTransaction?: { __typename?: 'TransactionAdminResponse', count?: number | null, data?: Array<(
      { __typename?: 'AdminTransactions' }
      & { ' $fragmentRefs'?: { 'TopupTransactionsTable_DataFragment': TopupTransactionsTable_DataFragment } }
    ) | null> | null } | null };

export type GetWithdrawalTransactionQueryVariables = Exact<{
  page: Scalars['Int']['input'];
  limit: Scalars['Int']['input'];
  status?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetWithdrawalTransactionQuery = { __typename?: 'Query', getWithdrawalTransaction?: { __typename?: 'TransactionAdminResponse', count?: number | null, data?: Array<(
      { __typename?: 'AdminTransactions' }
      & { ' $fragmentRefs'?: { 'WithdrawalTransactionsTable_DataFragment': WithdrawalTransactionsTable_DataFragment } }
    ) | null> | null } | null };

export type GetDocumentTransactionQueryVariables = Exact<{
  page: Scalars['Int']['input'];
  limit: Scalars['Int']['input'];
  status?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['Date']['input']>;
  endDate?: InputMaybe<Scalars['Date']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetDocumentTransactionQuery = { __typename?: 'Query', getDocumentTransaction?: { __typename?: 'TransactionAdminResponse', count?: number | null, data?: Array<(
      { __typename?: 'AdminTransactions' }
      & { ' $fragmentRefs'?: { 'DocumentTransactionsTable_DataFragment': DocumentTransactionsTable_DataFragment } }
    ) | null> | null } | null };

export type GetCommissionTransactionsQueryVariables = Exact<{
  page: Scalars['Int']['input'];
  limit: Scalars['Int']['input'];
  startDate?: InputMaybe<Scalars['String']['input']>;
  endDate?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetCommissionTransactionsQuery = { __typename?: 'Query', getCommissionTransactions?: { __typename?: 'TransactionAdminResponse', count?: number | null, data?: Array<(
      { __typename?: 'AdminTransactions' }
      & { ' $fragmentRefs'?: { 'CommissionTransactionsTable_DataFragment': CommissionTransactionsTable_DataFragment } }
    ) | null> | null } | null };

export type AdminTransactionDataPointQueryVariables = Exact<{
  dataPointInput: DataPointInput;
}>;


export type AdminTransactionDataPointQuery = { __typename?: 'Query', adminTransactionDataPoint?: { __typename?: 'DataPointResponse', pending_transaction?: number | null, approved_transaction?: number | null, rejected_transaction?: number | null, commission_transaction?: number | null, users_wallet_balance?: number | null, auto_approved_transaction?: number | null, auto_failed_transaction?: number | null } | null };

export type GetAssetTransactionQueryVariables = Exact<{
  assetType?: InputMaybe<Scalars['String']['input']>;
  transactionType?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['Date']['input']>;
  endDate?: InputMaybe<Scalars['Date']['input']>;
  salesType?: InputMaybe<Scalars['String']['input']>;
  page: Scalars['Int']['input'];
  limit: Scalars['Int']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetAssetTransactionQuery = { __typename?: 'Query', getAssetTransaction?: { __typename?: 'TransactionAdminResponse', count?: number | null, data?: Array<(
      { __typename?: 'AdminTransactions' }
      & { ' $fragmentRefs'?: { 'AssetTransactionsTable_DataFragment': AssetTransactionsTable_DataFragment } }
    ) | null> | null } | null };

export type GetAssetTransactionsStatisticsQueryVariables = Exact<{
  filters?: InputMaybe<AssetTransactionFilters>;
}>;


export type GetAssetTransactionsStatisticsQuery = { __typename?: 'Query', getAssetTransactionData?: { __typename?: 'TransactionAdminAssetResponse', statistics?: { __typename?: 'TransactionStatistics', totalTransactions?: number | null, approvedTransactions?: number | null, totalApprovedAmount?: number | null, pendingTransactions?: number | null, totalPendingAmount?: number | null, declinedTransactions?: number | null, totalDeclinedAmount?: number | null, new_sales?: number | null, total_new_sales?: number | null, flexTransactions?: number | null, totalFlexAmount?: number | null, new_flex_sales?: number | null, flex_recurring_sales?: number | null, total_flex_recurring_sales?: number | null, fullOwnershipTransactions?: number | null, totalFullOwnershipAmount?: number | null, new_fullOwnership_sales?: number | null, total_new_fullOwnership_sales?: number | null, fullOwnership_recurring_sales?: number | null, total_fullOwnership_recurring_sales?: number | null } | null } | null };

export type UsersTableFragmentFragment = { __typename?: 'UserAdmin', _id: string, firstName: string, lastName: string, email: string, createdAt?: any | null, referral_status?: string | null, referrer?: string | null, howYouHearAboutUs?: string | null, virtual_subscriptions?: number | null, virtual_networth?: number | null } & { ' $fragmentName'?: 'UsersTableFragmentFragment' };

export type DefaultUsersRow_UserFragment = { __typename?: 'UserAdmin', _id: string, firstName: string, lastName: string, email: string, phoneNumber?: string | null, createdAt?: any | null, referrer?: string | null, subscriptions?: number | null, Networth?: number | null } & { ' $fragmentName'?: 'DefaultUsersRow_UserFragment' };

export type SuspendedPaymentPlansRow_PlanFragment = { __typename?: 'SuspendedPaymentPlans', firstName?: string | null, lastName?: string | null, email?: string | null, phoneNumber?: string | null, referrer?: string | null, asset_name?: string | null, size?: number | null, asset_type?: string | null, no_of_units?: number | null, amount_paid?: number | null, balance?: number | null, start_date?: any | null, next_date?: any | null } & { ' $fragmentName'?: 'SuspendedPaymentPlansRow_PlanFragment' };

export type SuspendedUsersRow_UserFragment = { __typename?: 'UserAdmin', _id: string, firstName: string, lastName: string, email: string, phoneNumber?: string | null, createdAt?: any | null, referrer?: string | null, subscriptions?: number | null, is_suspended?: boolean | null, referral_status?: string | null, gender?: string | null, country?: string | null, Networth?: number | null } & { ' $fragmentName'?: 'SuspendedUsersRow_UserFragment' };

export type GetAllDefaultUsersQueryVariables = Exact<{
  page: Scalars['Int']['input'];
  limit: Scalars['Int']['input'];
}>;


export type GetAllDefaultUsersQuery = { __typename?: 'Query', getAllDefaultUsers?: { __typename?: 'UserAdminResponse', count?: number | null, data?: Array<(
      { __typename?: 'UserAdmin' }
      & { ' $fragmentRefs'?: { 'DefaultUsersRow_UserFragment': DefaultUsersRow_UserFragment } }
    ) | null> | null } | null };

export type ExportDefaultUsersQueryVariables = Exact<{
  page: Scalars['Int']['input'];
  limit: Scalars['Int']['input'];
}>;


export type ExportDefaultUsersQuery = { __typename?: 'Query', getAllDefaultUsers?: { __typename?: 'UserAdminResponse', data?: Array<(
      { __typename?: 'UserAdmin' }
      & { ' $fragmentRefs'?: { 'DefaultUsersRow_UserFragment': DefaultUsersRow_UserFragment } }
    ) | null> | null } | null };

export type GetSuspendedPaymentPlansQueryVariables = Exact<{
  page: Scalars['Int']['input'];
  limit: Scalars['Int']['input'];
  searchQuery?: InputMaybe<Scalars['String']['input']>;
  assetType?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetSuspendedPaymentPlansQuery = { __typename?: 'Query', getSuspendedPaymentPlans?: { __typename?: 'SuspendedPaymentPlansResponse', count?: number | null, data?: Array<(
      { __typename?: 'SuspendedPaymentPlans' }
      & { ' $fragmentRefs'?: { 'SuspendedPaymentPlansRow_PlanFragment': SuspendedPaymentPlansRow_PlanFragment } }
    ) | null> | null } | null };

export type ExportSuspendedPaymentPlansQueryVariables = Exact<{
  page: Scalars['Int']['input'];
  limit: Scalars['Int']['input'];
  searchQuery?: InputMaybe<Scalars['String']['input']>;
  assetType?: InputMaybe<Scalars['String']['input']>;
}>;


export type ExportSuspendedPaymentPlansQuery = { __typename?: 'Query', getSuspendedPaymentPlans?: { __typename?: 'SuspendedPaymentPlansResponse', data?: Array<(
      { __typename?: 'SuspendedPaymentPlans' }
      & { ' $fragmentRefs'?: { 'SuspendedPaymentPlansRow_PlanFragment': SuspendedPaymentPlansRow_PlanFragment } }
    ) | null> | null } | null };

export type GetAllSuspendedUsersQueryVariables = Exact<{
  page: Scalars['Int']['input'];
  limit: Scalars['Int']['input'];
}>;


export type GetAllSuspendedUsersQuery = { __typename?: 'Query', getAllSuspendedUsers?: { __typename?: 'UserAdminResponse', count?: number | null, data?: Array<(
      { __typename?: 'UserAdmin' }
      & { ' $fragmentRefs'?: { 'SuspendedUsersRow_UserFragment': SuspendedUsersRow_UserFragment } }
    ) | null> | null } | null };

export type ExportSuspendedUsersQueryVariables = Exact<{
  page: Scalars['Int']['input'];
  limit: Scalars['Int']['input'];
}>;


export type ExportSuspendedUsersQuery = { __typename?: 'Query', getAllSuspendedUsers?: { __typename?: 'UserAdminResponse', data?: Array<(
      { __typename?: 'UserAdmin' }
      & { ' $fragmentRefs'?: { 'SuspendedUsersRow_UserFragment': SuspendedUsersRow_UserFragment } }
    ) | null> | null } | null };

export type UnsuspendUserMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type UnsuspendUserMutation = { __typename?: 'Mutation', unsuspendUser: string };

export type EditUserDetailsByAdminMutationVariables = Exact<{
  userDetailsInput: UserDetailsInput;
}>;


export type EditUserDetailsByAdminMutation = { __typename?: 'Mutation', editUserDetailsByAdmin: string };

export type EditUserWalletDetailsByAdminMutationVariables = Exact<{
  adminWalletInput: AdminWalletInput;
}>;


export type EditUserWalletDetailsByAdminMutation = { __typename?: 'Mutation', editUserWalletDetailsByAdmin: string };

export type ModifyUserReferralStatusMutationVariables = Exact<{
  modifyReferralInput: ModifyReferralInput;
}>;


export type ModifyUserReferralStatusMutation = { __typename?: 'Mutation', modifyUserReferralStatus: string };

export type EditWalletCommissionMutationVariables = Exact<{
  adminWalletCommissionInput: AdminWalletCommissionInput;
}>;


export type EditWalletCommissionMutation = { __typename?: 'Mutation', editWalletCommission: string };

export type UpdateUserTinMutationVariables = Exact<{
  updateUserTinInput: UpdateUserTinInput;
}>;


export type UpdateUserTinMutation = { __typename?: 'Mutation', updateUserTin: { __typename?: 'UpdateTinResponse', success: boolean, message: string } };

export type ClearUserTinMutationVariables = Exact<{
  clearUserTinInput: ClearUserTinInput;
}>;


export type ClearUserTinMutation = { __typename?: 'Mutation', clearUserTin: { __typename?: 'ClearTinResponse', success: boolean, message: string } };

export type SuspendUserMutationVariables = Exact<{
  id: Scalars['ID']['input'];
}>;


export type SuspendUserMutation = { __typename?: 'Mutation', suspendUser: string };

export type ViewUserReferralsByAdminQueryVariables = Exact<{
  viewUserReferralsByAdminId: Scalars['ID']['input'];
}>;


export type ViewUserReferralsByAdminQuery = { __typename?: 'Query', viewUserReferralsByAdmin?: Array<{ __typename?: 'AdminReferral', _id: string, commission?: number | null, createdAt?: any | null, userReferralStatus?: string | null, email?: string | null, name?: string | null, phoneNumber?: string | null, status?: string | null } | null> | null };

export type RemoveReferralByAdminMutationVariables = Exact<{
  referralUpdateInput: ReferralUpdateInput;
}>;


export type RemoveReferralByAdminMutation = { __typename?: 'Mutation', removeReferralByAdmin: string };

export type GetAllUsersQueryVariables = Exact<{
  page: Scalars['Int']['input'];
  searchQuery?: InputMaybe<Scalars['String']['input']>;
  limit: Scalars['Int']['input'];
  hasReferral?: InputMaybe<Scalars['Boolean']['input']>;
  hasAsset?: InputMaybe<Scalars['Boolean']['input']>;
  referralStatus?: InputMaybe<Scalars['String']['input']>;
  howDidYouHearAboutUs?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['String']['input']>;
  endDate?: InputMaybe<Scalars['String']['input']>;
}>;


export type GetAllUsersQuery = { __typename?: 'Query', getAllUsers?: { __typename?: 'UserAdminResponse', count?: number | null, data?: Array<(
      { __typename?: 'UserAdmin' }
      & { ' $fragmentRefs'?: { 'UsersTableFragmentFragment': UsersTableFragmentFragment } }
    ) | null> | null } | null };

export type GetUserDetailsByAdminQueryVariables = Exact<{
  getUserDetailsByAdminId: Scalars['ID']['input'];
}>;


export type GetUserDetailsByAdminQuery = { __typename?: 'Query', getUserDetailsByAdmin?: { __typename?: 'UserAdminDetail', Networth?: number | null, virtual_networth?: number | null, virtual_subscriptions?: number | null, _id: string, address?: string | null, amount_paid?: number | null, amount_payable?: number | null, balance_payable?: number | null, referral_status?: string | null, country?: string | null, date_of_birth?: any | null, email: string, last_login?: any | null, default_status?: string | null, employment_status?: string | null, firstName: string, gender?: string | null, lastName: string, marital_status?: string | null, occupation?: string | null, phoneNumber: string, is_suspended?: boolean | null, profile_pic?: string | null, subscriptions?: number | null, units_purchased?: number | null, userName: string, next_date_of_payment?: any | null, referral?: { __typename?: 'Referrer', lastName: string, firstName: string, email?: string | null } | null, kyc?: { __typename?: 'Kyc', tin?: string | null } | null, transaction?: Array<{ __typename?: 'Transactions', _id: string, time_of_transaction?: any | null, amount?: string | null, type?: string | null, status?: string | null, description?: string | null, transaction_type?: string | null, paystack_reference?: string | null, transfer_reference?: string | null, transfer_file?: { __typename?: 'TransferFile', file?: string | null } | null } | null> | null, wallet?: { __typename?: 'AdminWallet', balance?: string | null } | null } | null };

export type MetricsQueryVariables = Exact<{
  startDate?: InputMaybe<Scalars['String']['input']>;
  endDate?: InputMaybe<Scalars['String']['input']>;
}>;


export type MetricsQuery = { __typename?: 'Query', getSystemUsersOverview: { __typename?: 'SystemUsersOverviewResponse', metrics: { __typename?: 'SystemUsersMetrics', totalUsers: number, noReferralUsers: number, users_with_assets: number, flexSubscribers: number, fullOwnershipSubscribers: number, defaultUsers: number, overdueUsers: number, active_associate: number, active_associate_pro: number, referralStatusCounts: { __typename?: 'ReferralStatusCounts', user: number, associate: number, associatePro: number } } } };

export type SendAssetStatementsToAdminMutationVariables = Exact<{
  assetId: Scalars['ID']['input'];
  adminEmail: Scalars['String']['input'];
}>;


export type SendAssetStatementsToAdminMutation = { __typename?: 'Mutation', sendAssetStatementsToAdmin: { __typename?: 'StatementSendResponse', success: boolean, statementsCount: number } };

export type GetAllAdminAssetsQueryVariables = Exact<{
  page: Scalars['Int']['input'];
  limit: Scalars['Int']['input'];
}>;


export type GetAllAdminAssetsQuery = { __typename?: 'Query', getAllAdminAssets?: { __typename?: 'AssetAdminResponse', count?: number | null, data: Array<{ __typename?: 'Asset', _id?: string | null, asset_location?: string | null, asset_name?: string | null, asset_price?: number | null, asset_size?: number | null, asset_type?: string | null, asset_unit?: number | null, asset_pictures?: Array<string | null> | null, sold?: boolean | null, description?: string | null, title?: string | null, newAsset?: boolean | null, asset_option?: Array<{ __typename?: 'AssetOption', size?: number | null, unit?: string | null, price?: number | null, zero_months?: number | null, three_months?: number | null, six_months?: number | null, five_months?: number | null, seven_months?: number | null, one_month?: number | null, one_month_initial_payment?: number | null, twelve_months?: number | null, initial_payment?: number | null, five_months_initial_payment?: number | null, seven_months_initial_payment?: number | null, development_fee?: number | null, monthly_installment?: number | null, flex_payment_plans?: Array<{ __typename?: 'FlexPaymentPlan', description?: string | null, duration_months: number, initial_payment?: number | null, monthly_installment: number, price?: number | null, unit?: number | null } | null> | null } | null> | null } | null> } | null };

export type StatisticsQueryVariables = Exact<{ [key: string]: never; }>;


export type StatisticsQuery = { __typename?: 'Query', getAssetInventoryData?: { __typename?: 'AssetInventoryResponse', statistics?: { __typename?: 'AssetInventoryStatistics', assetsSummary?: { __typename?: 'AssetSummary', totalAssets?: number | null, totalWorth?: number | null, totalFlexAssets?: number | null, totalFlexWorth?: number | null, totalFullOwnershipAssets?: number | null, totalFullOwnershipWorth?: number | null } | null } | null } | null };

export const AdminLogsRowFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AdminLogsRowFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LogAdmin"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"action"}},{"kind":"Field","name":{"kind":"Name","value":"adminEmail"}},{"kind":"Field","name":{"kind":"Name","value":"adminId"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"}},{"kind":"Field","name":{"kind":"Name","value":"oldState"}}]}}]} as unknown as DocumentNode<AdminLogsRowFragmentFragment, unknown>;
export const AllocationAssetOptionFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AllocationAssetOptionFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Asset"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"asset_name"}},{"kind":"Field","name":{"kind":"Name","value":"asset_type"}}]}}]} as unknown as DocumentNode<AllocationAssetOptionFragmentFragment, unknown>;
export const AllocationTableRowFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AllocationTableRowFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EligibleClient"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"allocation"}},{"kind":"Field","name":{"kind":"Name","value":"allocationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"allocationDate"}},{"kind":"Field","name":{"kind":"Name","value":"amountPaid"}},{"kind":"Field","name":{"kind":"Name","value":"assetName"}},{"kind":"Field","name":{"kind":"Name","value":"assetSize"}},{"kind":"Field","name":{"kind":"Name","value":"assetType"}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"end_date"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"paymentPlan"}},{"kind":"Field","name":{"kind":"Name","value":"paymentPercentage"}},{"kind":"Field","name":{"kind":"Name","value":"phoneNumber"}},{"kind":"Field","name":{"kind":"Name","value":"referral"}},{"kind":"Field","name":{"kind":"Name","value":"referralStatus"}},{"kind":"Field","name":{"kind":"Name","value":"totalPrice"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}}]}}]} as unknown as DocumentNode<AllocationTableRowFragmentFragment, unknown>;
export const AssetCategoryHealth_StatisticsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AssetCategoryHealth_statistics"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AssetInventoryStatistics"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"categories"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"activeAssetCount"}},{"kind":"Field","name":{"kind":"Name","value":"totalSqm"}},{"kind":"Field","name":{"kind":"Name","value":"grossRevenue"}},{"kind":"Field","name":{"kind":"Name","value":"collectionEfficiency"}},{"kind":"Field","name":{"kind":"Name","value":"occupancyRate"}},{"kind":"Field","name":{"kind":"Name","value":"totalValueSold"}},{"kind":"Field","name":{"kind":"Name","value":"totalSqmSold"}},{"kind":"Field","name":{"kind":"Name","value":"totalMoneyReceived"}},{"kind":"Field","name":{"kind":"Name","value":"totalBalance"}},{"kind":"Field","name":{"kind":"Name","value":"defaulting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"defaultedAssetValue"}},{"kind":"Field","name":{"kind":"Name","value":"defaultersPaid"}},{"kind":"Field","name":{"kind":"Name","value":"defaultersOwing"}}]}}]}}]}}]} as unknown as DocumentNode<AssetCategoryHealth_StatisticsFragment, unknown>;
export const AssetFlexTable_AssetFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AssetFlexTable_asset"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Asset"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"asset_name"}},{"kind":"Field","name":{"kind":"Name","value":"asset_location"}},{"kind":"Field","name":{"kind":"Name","value":"sold"}},{"kind":"Field","name":{"kind":"Name","value":"asset_type"}},{"kind":"Field","name":{"kind":"Name","value":"collectionEfficiencyRate"}},{"kind":"Field","name":{"kind":"Name","value":"asset_option"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"flex_payment_plans"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}}]}}]}}]}}]} as unknown as DocumentNode<AssetFlexTable_AssetFragment, unknown>;
export const AssetFullOwnershipTable_AssetFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AssetFullOwnershipTable_asset"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Asset"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"asset_name"}},{"kind":"Field","name":{"kind":"Name","value":"asset_location"}},{"kind":"Field","name":{"kind":"Name","value":"sold"}},{"kind":"Field","name":{"kind":"Name","value":"asset_type"}},{"kind":"Field","name":{"kind":"Name","value":"collectionEfficiencyRate"}},{"kind":"Field","name":{"kind":"Name","value":"asset_option"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"zero_months"}}]}}]}}]} as unknown as DocumentNode<AssetFullOwnershipTable_AssetFragment, unknown>;
export const AssetInventoryOverview_StatisticsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AssetInventoryOverview_statistics"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AssetInventoryStatistics"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"assetsSummary"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalAssets"}},{"kind":"Field","name":{"kind":"Name","value":"totalWorth"}},{"kind":"Field","name":{"kind":"Name","value":"totalFlexAssets"}},{"kind":"Field","name":{"kind":"Name","value":"totalFlexWorth"}},{"kind":"Field","name":{"kind":"Name","value":"totalFullOwnershipAssets"}},{"kind":"Field","name":{"kind":"Name","value":"totalFullOwnershipWorth"}}]}}]}}]} as unknown as DocumentNode<AssetInventoryOverview_StatisticsFragment, unknown>;
export const InventoryHealthBar_StatisticsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"InventoryHealthBar_statistics"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AssetInventoryStatistics"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"portfolio"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalPortfolioValue"}},{"kind":"Field","name":{"kind":"Name","value":"totalCapacitySqm"}},{"kind":"Field","name":{"kind":"Name","value":"activeCustomers"}},{"kind":"Field","name":{"kind":"Name","value":"overallEfficiency"}},{"kind":"Field","name":{"kind":"Name","value":"totalValueSold"}},{"kind":"Field","name":{"kind":"Name","value":"totalSqmSold"}},{"kind":"Field","name":{"kind":"Name","value":"totalMoneyReceived"}},{"kind":"Field","name":{"kind":"Name","value":"totalBalanceOwed"}},{"kind":"Field","name":{"kind":"Name","value":"defaulting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"defaultingCustomers"}},{"kind":"Field","name":{"kind":"Name","value":"defaultedAssetValue"}},{"kind":"Field","name":{"kind":"Name","value":"amountPaidByDefaulters"}},{"kind":"Field","name":{"kind":"Name","value":"amountStillOwing"}}]}}]}}]}}]} as unknown as DocumentNode<InventoryHealthBar_StatisticsFragment, unknown>;
export const AssetHealthBar_StatisticsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AssetHealthBar_statistics"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AssetAnalyticsStatistics"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalInventory"}},{"kind":"Field","name":{"kind":"Name","value":"totalRealised"}},{"kind":"Field","name":{"kind":"Name","value":"remainingValue"}},{"kind":"Field","name":{"kind":"Name","value":"totalSqmSold"}},{"kind":"Field","name":{"kind":"Name","value":"totalSqmRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"efficiencyRate"}},{"kind":"Field","name":{"kind":"Name","value":"totalActiveCustomers"}},{"kind":"Field","name":{"kind":"Name","value":"defaulting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalDefaultingCustomers"}},{"kind":"Field","name":{"kind":"Name","value":"totalDefaultedAssetValue"}},{"kind":"Field","name":{"kind":"Name","value":"totalDefaultedOutstandingValue"}}]}},{"kind":"Field","name":{"kind":"Name","value":"terminated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalTerminatedCustomers"}},{"kind":"Field","name":{"kind":"Name","value":"totalTerminatedAssetValue"}},{"kind":"Field","name":{"kind":"Name","value":"totalTerminatedBalance"}}]}}]}}]} as unknown as DocumentNode<AssetHealthBar_StatisticsFragment, unknown>;
export const PaymentPlanMatrix_StatisticsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaymentPlanMatrix_statistics"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AssetAnalyticsStatistics"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sizePlanBreakdown"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"plans"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"startValue"}},{"kind":"Field","name":{"kind":"Name","value":"soldValue"}},{"kind":"Field","name":{"kind":"Name","value":"totalSqmSold"}},{"kind":"Field","name":{"kind":"Name","value":"totalSqmRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"totalPlans"}},{"kind":"Field","name":{"kind":"Name","value":"totalDefaultingUsers"}},{"kind":"Field","name":{"kind":"Name","value":"totalDefaultedValue"}},{"kind":"Field","name":{"kind":"Name","value":"totalBalance"}},{"kind":"Field","name":{"kind":"Name","value":"totalTerminatedPlans"}},{"kind":"Field","name":{"kind":"Name","value":"totalTerminatedValue"}},{"kind":"Field","name":{"kind":"Name","value":"totalTerminatedBalance"}},{"kind":"Field","name":{"kind":"Name","value":"efficiency"}}]}}]}}]}}]} as unknown as DocumentNode<PaymentPlanMatrix_StatisticsFragment, unknown>;
export const UpgradeRowFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UpgradeRowFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ReferralUpgrade"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"admin_status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"fee_amount"}},{"kind":"Field","name":{"kind":"Name","value":"transaction_type"}},{"kind":"Field","name":{"kind":"Name","value":"user_upgrade_type"}},{"kind":"Field","name":{"kind":"Name","value":"file_Url"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}},{"kind":"Field","name":{"kind":"Name","value":"associate"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]} as unknown as DocumentNode<UpgradeRowFragmentFragment, unknown>;
export const TopAssociatesTableRowFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TopAssociatesTableRowFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Associate"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"sales_person"}},{"kind":"Field","name":{"kind":"Name","value":"no_of_clients"}},{"kind":"Field","name":{"kind":"Name","value":"units_sold"}},{"kind":"Field","name":{"kind":"Name","value":"size_sold"}},{"kind":"Field","name":{"kind":"Name","value":"expected_revenue"}},{"kind":"Field","name":{"kind":"Name","value":"received_revenue"}},{"kind":"Field","name":{"kind":"Name","value":"commission"}}]}}]} as unknown as DocumentNode<TopAssociatesTableRowFragmentFragment, unknown>;
export const AssociateProMetricsSection_DashboardFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AssociateProMetricsSection_dashboard"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CampaignDashboard"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"associateProProgress"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currentAssociatePro"}},{"kind":"Field","name":{"kind":"Name","value":"percentageComplete"}},{"kind":"Field","name":{"kind":"Name","value":"targetAssociatePro"}}]}},{"kind":"Field","name":{"kind":"Name","value":"revenueMetrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalRevenue"}},{"kind":"Field","name":{"kind":"Name","value":"revenueGoal"}},{"kind":"Field","name":{"kind":"Name","value":"percentageComplete"}}]}},{"kind":"Field","name":{"kind":"Name","value":"campaignPeriod"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"daysRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}}]}},{"kind":"Field","name":{"kind":"Name","value":"ticketMetrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalTicketsIssued"}}]}},{"kind":"Field","name":{"kind":"Name","value":"conversionMetrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"overallConversionRate"}},{"kind":"Field","name":{"kind":"Name","value":"userToAssociatePro"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalUsers"}},{"kind":"Field","name":{"kind":"Name","value":"convertedToAssociatePro"}},{"kind":"Field","name":{"kind":"Name","value":"conversionRate"}}]}},{"kind":"Field","name":{"kind":"Name","value":"associateToAssociatePro"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalAssociates"}},{"kind":"Field","name":{"kind":"Name","value":"convertedToAssociatePro"}},{"kind":"Field","name":{"kind":"Name","value":"conversionRate"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"graphs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"revenueGraph"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"chartData"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"conversionGraph"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userToAssociateProConversions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"chartData"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<AssociateProMetricsSection_DashboardFragment, unknown>;
export const AssociateProUpgradeDetailFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AssociateProUpgradeDetail"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AssociateProUpgradeDetail"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upgradeId"}},{"kind":"Field","name":{"kind":"Name","value":"userFullName"}},{"kind":"Field","name":{"kind":"Name","value":"userSince"}},{"kind":"Field","name":{"kind":"Name","value":"associateSince"}},{"kind":"Field","name":{"kind":"Name","value":"associateProSince"}},{"kind":"Field","name":{"kind":"Name","value":"referrerFullName"}},{"kind":"Field","name":{"kind":"Name","value":"amountPaid"}},{"kind":"Field","name":{"kind":"Name","value":"adminStatus"}},{"kind":"Field","name":{"kind":"Name","value":"ticketId"}}]}}]} as unknown as DocumentNode<AssociateProUpgradeDetailFragment, unknown>;
export const AssociateProTicketHolderFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AssociateProTicketHolder"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TicketDetail"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ticketId"}},{"kind":"Field","name":{"kind":"Name","value":"ticketType"}},{"kind":"Field","name":{"kind":"Name","value":"userFullName"}},{"kind":"Field","name":{"kind":"Name","value":"userEmail"}},{"kind":"Field","name":{"kind":"Name","value":"referrerFullName"}},{"kind":"Field","name":{"kind":"Name","value":"amountPaid"}},{"kind":"Field","name":{"kind":"Name","value":"createdDate"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}}]}}]} as unknown as DocumentNode<AssociateProTicketHolderFragment, unknown>;
export const AssociateProTopReferrerFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AssociateProTopReferrer"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TopReferrer"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"referrerId"}},{"kind":"Field","name":{"kind":"Name","value":"referrerFullName"}},{"kind":"Field","name":{"kind":"Name","value":"referrerEmail"}},{"kind":"Field","name":{"kind":"Name","value":"totalReferrals"}}]}}]} as unknown as DocumentNode<AssociateProTopReferrerFragment, unknown>;
export const AssociateProRevenueLeaderFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AssociateProRevenueLeader"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RevenueLeader"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"referrerId"}},{"kind":"Field","name":{"kind":"Name","value":"referrerFullName"}},{"kind":"Field","name":{"kind":"Name","value":"referrerEmail"}},{"kind":"Field","name":{"kind":"Name","value":"totalRevenue"}}]}}]} as unknown as DocumentNode<AssociateProRevenueLeaderFragment, unknown>;
export const AssociateProSourceBreakdownFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AssociateProSourceBreakdown"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"HowYouHeardSource"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"percentage"}}]}}]} as unknown as DocumentNode<AssociateProSourceBreakdownFragment, unknown>;
export const AssociateProReferralAnalyticsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AssociateProReferralAnalytics"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ReferralAnalytics"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"topReferrers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"referrers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AssociateProTopReferrer"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"revenueLeaders"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"leaders"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AssociateProRevenueLeader"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"howYouHeardBreakdown"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalResponses"}},{"kind":"Field","name":{"kind":"Name","value":"breakdown"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AssociateProSourceBreakdown"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AssociateProTopReferrer"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TopReferrer"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"referrerId"}},{"kind":"Field","name":{"kind":"Name","value":"referrerFullName"}},{"kind":"Field","name":{"kind":"Name","value":"referrerEmail"}},{"kind":"Field","name":{"kind":"Name","value":"totalReferrals"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AssociateProRevenueLeader"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RevenueLeader"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"referrerId"}},{"kind":"Field","name":{"kind":"Name","value":"referrerFullName"}},{"kind":"Field","name":{"kind":"Name","value":"referrerEmail"}},{"kind":"Field","name":{"kind":"Name","value":"totalRevenue"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AssociateProSourceBreakdown"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"HowYouHeardSource"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"percentage"}}]}}]} as unknown as DocumentNode<AssociateProReferralAnalyticsFragment, unknown>;
export const AssociateProRecruitmentUserFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AssociateProRecruitmentUser"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FilteredUserAdminDetail"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"referral"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]} as unknown as DocumentNode<AssociateProRecruitmentUserFragment, unknown>;
export const HamperSalesMetricsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"HamperSalesMetrics"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SalesMetricsHamper"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dailySqmTargetRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"percentageSold"}},{"kind":"Field","name":{"kind":"Name","value":"sqmRemainingToSell"}},{"kind":"Field","name":{"kind":"Name","value":"targetSqm"}},{"kind":"Field","name":{"kind":"Name","value":"totalSqmSold"}}]}}]} as unknown as DocumentNode<HamperSalesMetricsFragment, unknown>;
export const HamperFinancialMetricsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"HamperFinancialMetrics"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FinancialMetricsHamper"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalRevenueGenerated"}},{"kind":"Field","name":{"kind":"Name","value":"totalAssetValueSold"}},{"kind":"Field","name":{"kind":"Name","value":"averagePaymentPerPlan"}},{"kind":"Field","name":{"kind":"Name","value":"totalBalance"}}]}}]} as unknown as DocumentNode<HamperFinancialMetricsFragment, unknown>;
export const HamperAssetBreakdownFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"HamperAssetBreakdown"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AssetBreakdownHamper"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"assetName"}},{"kind":"Field","name":{"kind":"Name","value":"percentageOfTotal"}},{"kind":"Field","name":{"kind":"Name","value":"totalSqmSold"}},{"kind":"Field","name":{"kind":"Name","value":"totalHampers"}}]}}]} as unknown as DocumentNode<HamperAssetBreakdownFragment, unknown>;
export const HamperReferrerFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"HamperReferrer"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ReferrerWithHampers"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"hamperCount"}},{"kind":"Field","name":{"kind":"Name","value":"totalSqmReferred"}}]}}]} as unknown as DocumentNode<HamperReferrerFragment, unknown>;
export const RaffleSalesMetricsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RaffleSalesMetrics"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SalesMetrics"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dailySqmTargetRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"percentageSold"}},{"kind":"Field","name":{"kind":"Name","value":"sqmRemainingToSell"}},{"kind":"Field","name":{"kind":"Name","value":"targetSqm"}},{"kind":"Field","name":{"kind":"Name","value":"totalSqmSold"}}]}}]} as unknown as DocumentNode<RaffleSalesMetricsFragment, unknown>;
export const RaffleFinancialMetricsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RaffleFinancialMetrics"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FinancialMetrics"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalRevenueGenerated"}},{"kind":"Field","name":{"kind":"Name","value":"totalAssetValueSold"}},{"kind":"Field","name":{"kind":"Name","value":"averagePaymentPerPlan"}},{"kind":"Field","name":{"kind":"Name","value":"totalBalance"}}]}}]} as unknown as DocumentNode<RaffleFinancialMetricsFragment, unknown>;
export const RaffleAssetBreakdownFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RaffleAssetBreakdown"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AssetBreakdown"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"assetName"}},{"kind":"Field","name":{"kind":"Name","value":"percentageOfTotal"}},{"kind":"Field","name":{"kind":"Name","value":"totalSqmSold"}},{"kind":"Field","name":{"kind":"Name","value":"totalTickets"}}]}}]} as unknown as DocumentNode<RaffleAssetBreakdownFragment, unknown>;
export const RaffleUserTicketFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RaffleUserTicket"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserWithTicket"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"ticketId"}}]}}]} as unknown as DocumentNode<RaffleUserTicketFragment, unknown>;
export const DashboardQuickOverview_DataFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DashboardQuickOverview_data"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AdminDashboard"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"users"}},{"kind":"Field","name":{"kind":"Name","value":"monthly_recurring_revenue"}},{"kind":"Field","name":{"kind":"Name","value":"associate_users"}},{"kind":"Field","name":{"kind":"Name","value":"associate_pro_users"}},{"kind":"Field","name":{"kind":"Name","value":"total_asset"}},{"kind":"Field","name":{"kind":"Name","value":"default_users"}},{"kind":"Field","name":{"kind":"Name","value":"suspended_users"}},{"kind":"Field","name":{"kind":"Name","value":"suspended_payment_plans"}},{"kind":"Field","name":{"kind":"Name","value":"total_payable"}},{"kind":"Field","name":{"kind":"Name","value":"sales"}},{"kind":"Field","name":{"kind":"Name","value":"inflow"}},{"kind":"Field","name":{"kind":"Name","value":"outflow"}},{"kind":"Field","name":{"kind":"Name","value":"total_wallet_balance"}}]}}]} as unknown as DocumentNode<DashboardQuickOverview_DataFragment, unknown>;
export const TopAssociates_DataFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TopAssociates_data"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserReferralAdmin"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"amount_brought"}},{"kind":"Field","name":{"kind":"Name","value":"no_of_referral"}},{"kind":"Field","name":{"kind":"Name","value":"phoneNumber"}}]}}]} as unknown as DocumentNode<TopAssociates_DataFragment, unknown>;
export const TopSellingProducts_DataFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TopSellingProducts_data"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AssetDashBoard"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"asset_name"}},{"kind":"Field","name":{"kind":"Name","value":"asset_pictures"}},{"kind":"Field","name":{"kind":"Name","value":"asset_location"}},{"kind":"Field","name":{"kind":"Name","value":"units_subscribed"}},{"kind":"Field","name":{"kind":"Name","value":"amount_broughtin"}}]}}]} as unknown as DocumentNode<TopSellingProducts_DataFragment, unknown>;
export const AdminDetailFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AdminDetailFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AdminRoles"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminEmail"}},{"kind":"Field","name":{"kind":"Name","value":"adminId"}},{"kind":"Field","name":{"kind":"Name","value":"adminName"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"roleId"}}]}}]} as unknown as DocumentNode<AdminDetailFragmentFragment, unknown>;
export const AdminRowFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AdminRowFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AdminRoles"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminEmail"}},{"kind":"Field","name":{"kind":"Name","value":"adminId"}},{"kind":"Field","name":{"kind":"Name","value":"adminName"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"roleId"}}]}}]} as unknown as DocumentNode<AdminRowFragmentFragment, unknown>;
export const PermissionOptionFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PermissionOptionFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Permission"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]} as unknown as DocumentNode<PermissionOptionFragmentFragment, unknown>;
export const RoleCardFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RoleCardFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Role"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}}]}}]} as unknown as DocumentNode<RoleCardFragmentFragment, unknown>;
export const SalesRowFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SalesRowFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SalesRecord"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user_firstName"}},{"kind":"Field","name":{"kind":"Name","value":"user_lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"user_phone"}},{"kind":"Field","name":{"kind":"Name","value":"referrer_name"}},{"kind":"Field","name":{"kind":"Name","value":"referrer_email"}},{"kind":"Field","name":{"kind":"Name","value":"referrer_phone"}},{"kind":"Field","name":{"kind":"Name","value":"asset_name"}},{"kind":"Field","name":{"kind":"Name","value":"asset_type"}},{"kind":"Field","name":{"kind":"Name","value":"no_of_units"}},{"kind":"Field","name":{"kind":"Name","value":"document_amount_paid"}},{"kind":"Field","name":{"kind":"Name","value":"fullownerhsip_documentprice"}},{"kind":"Field","name":{"kind":"Name","value":"month_subscription"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"amount_paid"}},{"kind":"Field","name":{"kind":"Name","value":"start_date"}},{"kind":"Field","name":{"kind":"Name","value":"next_date"}}]}}]} as unknown as DocumentNode<SalesRowFragmentFragment, unknown>;
export const SummaryCards_DashboardFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SummaryCards_dashboard"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SalesDashboard"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalTransactionValue"}},{"kind":"Field","name":{"kind":"Name","value":"expectedTransactionValue"}},{"kind":"Field","name":{"kind":"Name","value":"totalReceivedTransactionValue"}},{"kind":"Field","name":{"kind":"Name","value":"outstandingTransactionValue"}},{"kind":"Field","name":{"kind":"Name","value":"totalFlexTransactionValue"}},{"kind":"Field","name":{"kind":"Name","value":"expectedFlexTransactionValue"}},{"kind":"Field","name":{"kind":"Name","value":"totalReceivedFlexTransactionValue"}},{"kind":"Field","name":{"kind":"Name","value":"outstandingFlexTransactionValue"}},{"kind":"Field","name":{"kind":"Name","value":"totalFullOwnershipTransactionValue"}},{"kind":"Field","name":{"kind":"Name","value":"expectedFullOwnershipTransactionValue"}},{"kind":"Field","name":{"kind":"Name","value":"totalReceivedFullOwnershipTransactionValue"}},{"kind":"Field","name":{"kind":"Name","value":"outstandingFullOwnershipTransactionValue"}}]}}]} as unknown as DocumentNode<SummaryCards_DashboardFragment, unknown>;
export const AssetTransactionsTable_DataFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AssetTransactionsTable_data"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AdminTransactions"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"admin_status"}},{"kind":"Field","name":{"kind":"Name","value":"plot_size"}},{"kind":"Field","name":{"kind":"Name","value":"asset_type"}},{"kind":"Field","name":{"kind":"Name","value":"referral"}},{"kind":"Field","name":{"kind":"Name","value":"transaction_type"}},{"kind":"Field","name":{"kind":"Name","value":"transfer_file"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"file"}}]}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"_id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"time_of_transaction"}}]}}]} as unknown as DocumentNode<AssetTransactionsTable_DataFragment, unknown>;
export const CommissionTransactionsTable_DataFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CommissionTransactionsTable_data"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AdminTransactions"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"tin"}},{"kind":"Field","name":{"kind":"Name","value":"admin_status"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"asset_type"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"referrer"}},{"kind":"Field","name":{"kind":"Name","value":"referral_status"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"tin"}}]}},{"kind":"Field","name":{"kind":"Name","value":"plot_size"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"referral"}},{"kind":"Field","name":{"kind":"Name","value":"transaction_type"}},{"kind":"Field","name":{"kind":"Name","value":"time_of_transaction"}}]}}]} as unknown as DocumentNode<CommissionTransactionsTable_DataFragment, unknown>;
export const CompleteAssetPaymentsTable_DataFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CompleteAssetPaymentsTable_data"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ZeroBalance"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone_number"}},{"kind":"Field","name":{"kind":"Name","value":"sales_person"}},{"kind":"Field","name":{"kind":"Name","value":"asset_name"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"amount_paid"}},{"kind":"Field","name":{"kind":"Name","value":"month_subscription"}},{"kind":"Field","name":{"kind":"Name","value":"start_date"}},{"kind":"Field","name":{"kind":"Name","value":"next_payment_date"}}]}}]} as unknown as DocumentNode<CompleteAssetPaymentsTable_DataFragment, unknown>;
export const DocumentTransactionsTable_DataFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DocumentTransactionsTable_data"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AdminTransactions"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"admin_status"}},{"kind":"Field","name":{"kind":"Name","value":"plot_size"}},{"kind":"Field","name":{"kind":"Name","value":"asset_type"}},{"kind":"Field","name":{"kind":"Name","value":"referral"}},{"kind":"Field","name":{"kind":"Name","value":"transaction_type"}},{"kind":"Field","name":{"kind":"Name","value":"transfer_file"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"file"}}]}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"_id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"time_of_transaction"}}]}}]} as unknown as DocumentNode<DocumentTransactionsTable_DataFragment, unknown>;
export const TopupTransactionsTable_DataFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TopupTransactionsTable_data"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AdminTransactions"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"admin_status"}},{"kind":"Field","name":{"kind":"Name","value":"time_of_transaction"}},{"kind":"Field","name":{"kind":"Name","value":"transaction_type"}},{"kind":"Field","name":{"kind":"Name","value":"transfer_file"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"file"}}]}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"_id"}}]}}]}}]} as unknown as DocumentNode<TopupTransactionsTable_DataFragment, unknown>;
export const WithdrawalTransactionsTable_DataFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"WithdrawalTransactionsTable_data"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AdminTransactions"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"admin_status"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"time_of_transaction"}},{"kind":"Field","name":{"kind":"Name","value":"processing_type"}},{"kind":"Field","name":{"kind":"Name","value":"tin"}},{"kind":"Field","name":{"kind":"Name","value":"bank_details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountNumber"}},{"kind":"Field","name":{"kind":"Name","value":"bankName"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"tin"}}]}}]}}]} as unknown as DocumentNode<WithdrawalTransactionsTable_DataFragment, unknown>;
export const UsersTableFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UsersTableFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserAdmin"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"referral_status"}},{"kind":"Field","name":{"kind":"Name","value":"referrer"}},{"kind":"Field","name":{"kind":"Name","value":"howYouHearAboutUs"}},{"kind":"Field","name":{"kind":"Name","value":"virtual_subscriptions"}},{"kind":"Field","name":{"kind":"Name","value":"virtual_networth"}}]}}]} as unknown as DocumentNode<UsersTableFragmentFragment, unknown>;
export const DefaultUsersRow_UserFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DefaultUsersRow_user"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserAdmin"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phoneNumber"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"referrer"}},{"kind":"Field","name":{"kind":"Name","value":"subscriptions"}},{"kind":"Field","name":{"kind":"Name","value":"Networth"}}]}}]} as unknown as DocumentNode<DefaultUsersRow_UserFragment, unknown>;
export const SuspendedPaymentPlansRow_PlanFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SuspendedPaymentPlansRow_plan"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SuspendedPaymentPlans"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phoneNumber"}},{"kind":"Field","name":{"kind":"Name","value":"referrer"}},{"kind":"Field","name":{"kind":"Name","value":"asset_name"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"asset_type"}},{"kind":"Field","name":{"kind":"Name","value":"no_of_units"}},{"kind":"Field","name":{"kind":"Name","value":"amount_paid"}},{"kind":"Field","name":{"kind":"Name","value":"balance"}},{"kind":"Field","name":{"kind":"Name","value":"start_date"}},{"kind":"Field","name":{"kind":"Name","value":"next_date"}}]}}]} as unknown as DocumentNode<SuspendedPaymentPlansRow_PlanFragment, unknown>;
export const SuspendedUsersRow_UserFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SuspendedUsersRow_user"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserAdmin"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phoneNumber"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"referrer"}},{"kind":"Field","name":{"kind":"Name","value":"subscriptions"}},{"kind":"Field","name":{"kind":"Name","value":"is_suspended"}},{"kind":"Field","name":{"kind":"Name","value":"referral_status"}},{"kind":"Field","name":{"kind":"Name","value":"gender"}},{"kind":"Field","name":{"kind":"Name","value":"country"}},{"kind":"Field","name":{"kind":"Name","value":"Networth"}}]}}]} as unknown as DocumentNode<SuspendedUsersRow_UserFragment, unknown>;
export const ExportAdminLogsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ExportAdminLogs"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"adminEmail"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"action"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getAllAdminLogs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"adminEmail"},"value":{"kind":"Variable","name":{"kind":"Name","value":"adminEmail"}}},{"kind":"Argument","name":{"kind":"Name","value":"action"},"value":{"kind":"Variable","name":{"kind":"Name","value":"action"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"action"}},{"kind":"Field","name":{"kind":"Name","value":"adminEmail"}},{"kind":"Field","name":{"kind":"Name","value":"adminId"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"}},{"kind":"Field","name":{"kind":"Name","value":"oldState"}},{"kind":"Field","name":{"kind":"Name","value":"_id"}}]}}]}}]}}]} as unknown as DocumentNode<ExportAdminLogsQuery, ExportAdminLogsQueryVariables>;
export const GetAllAdminLogsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAllAdminLogs"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"adminEmail"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"action"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getAllAdminLogs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"adminEmail"},"value":{"kind":"Variable","name":{"kind":"Name","value":"adminEmail"}}},{"kind":"Argument","name":{"kind":"Name","value":"action"},"value":{"kind":"Variable","name":{"kind":"Name","value":"action"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AdminLogsRowFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AdminLogsRowFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"LogAdmin"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"timestamp"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"action"}},{"kind":"Field","name":{"kind":"Name","value":"adminEmail"}},{"kind":"Field","name":{"kind":"Name","value":"adminId"}},{"kind":"Field","name":{"kind":"Name","value":"metadata"}},{"kind":"Field","name":{"kind":"Name","value":"oldState"}}]}}]} as unknown as DocumentNode<GetAllAdminLogsQuery, GetAllAdminLogsQueryVariables>;
export const AllocateLandDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AllocateLand"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paymentPlanId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"block"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"plot"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"allocateLand"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"paymentPlanId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paymentPlanId"}}},{"kind":"Argument","name":{"kind":"Name","value":"block"},"value":{"kind":"Variable","name":{"kind":"Name","value":"block"}}},{"kind":"Argument","name":{"kind":"Name","value":"plot"},"value":{"kind":"Variable","name":{"kind":"Name","value":"plot"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"block"}},{"kind":"Field","name":{"kind":"Name","value":"plot"}},{"kind":"Field","name":{"kind":"Name","value":"assetName"}},{"kind":"Field","name":{"kind":"Name","value":"previousAllocation"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"block"}},{"kind":"Field","name":{"kind":"Name","value":"plot"}}]}}]}}]}}]} as unknown as DocumentNode<AllocateLandMutation, AllocateLandMutationVariables>;
export const GetAllocationAssetsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAllocationAssets"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getAllAdminAssets"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"IntValue","value":"1"}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"IntValue","value":"1000"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AllocationAssetOptionFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AllocationAssetOptionFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Asset"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"asset_name"}},{"kind":"Field","name":{"kind":"Name","value":"asset_type"}}]}}]} as unknown as DocumentNode<GetAllocationAssetsQuery, GetAllocationAssetsQueryVariables>;
export const EligibleClientsForLandDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"EligibleClientsForLand"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"FiltersInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"eligibleClientsForLand"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AllocationTableRowFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"limit"}},{"kind":"Field","name":{"kind":"Name","value":"page"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AllocationTableRowFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EligibleClient"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"allocation"}},{"kind":"Field","name":{"kind":"Name","value":"allocationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"allocationDate"}},{"kind":"Field","name":{"kind":"Name","value":"amountPaid"}},{"kind":"Field","name":{"kind":"Name","value":"assetName"}},{"kind":"Field","name":{"kind":"Name","value":"assetSize"}},{"kind":"Field","name":{"kind":"Name","value":"assetType"}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"end_date"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"paymentPlan"}},{"kind":"Field","name":{"kind":"Name","value":"paymentPercentage"}},{"kind":"Field","name":{"kind":"Name","value":"phoneNumber"}},{"kind":"Field","name":{"kind":"Name","value":"referral"}},{"kind":"Field","name":{"kind":"Name","value":"referralStatus"}},{"kind":"Field","name":{"kind":"Name","value":"totalPrice"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}}]}}]} as unknown as DocumentNode<EligibleClientsForLandQuery, EligibleClientsForLandQueryVariables>;
export const ExportEligibleClientsForLandDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ExportEligibleClientsForLand"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"FiltersInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"eligibleClientsForLand"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"IntValue","value":"1"}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AllocationTableRowFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AllocationTableRowFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"EligibleClient"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"allocation"}},{"kind":"Field","name":{"kind":"Name","value":"allocationStatus"}},{"kind":"Field","name":{"kind":"Name","value":"allocationDate"}},{"kind":"Field","name":{"kind":"Name","value":"amountPaid"}},{"kind":"Field","name":{"kind":"Name","value":"assetName"}},{"kind":"Field","name":{"kind":"Name","value":"assetSize"}},{"kind":"Field","name":{"kind":"Name","value":"assetType"}},{"kind":"Field","name":{"kind":"Name","value":"duration"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"end_date"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"location"}},{"kind":"Field","name":{"kind":"Name","value":"paymentPlan"}},{"kind":"Field","name":{"kind":"Name","value":"paymentPercentage"}},{"kind":"Field","name":{"kind":"Name","value":"phoneNumber"}},{"kind":"Field","name":{"kind":"Name","value":"referral"}},{"kind":"Field","name":{"kind":"Name","value":"referralStatus"}},{"kind":"Field","name":{"kind":"Name","value":"totalPrice"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}}]}}]} as unknown as DocumentNode<ExportEligibleClientsForLandQuery, ExportEligibleClientsForLandQueryVariables>;
export const ViewSubscribedCustomersOnAssetDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ViewSubscribedCustomersOnAsset"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"assetName"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"assetType"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"size"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"subscriberType"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"viewSubscribedCustomersOnAsset"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"assetName"},"value":{"kind":"Variable","name":{"kind":"Name","value":"assetName"}}},{"kind":"Argument","name":{"kind":"Name","value":"assetType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"assetType"}}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}},{"kind":"Argument","name":{"kind":"Name","value":"size"},"value":{"kind":"Variable","name":{"kind":"Name","value":"size"}}},{"kind":"Argument","name":{"kind":"Name","value":"startDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"endDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"subscriberType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"subscriberType"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalSubscribers"}},{"kind":"Field","name":{"kind":"Name","value":"userDetails"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone_number"}},{"kind":"Field","name":{"kind":"Name","value":"salesPerson"}},{"kind":"Field","name":{"kind":"Name","value":"assetName"}},{"kind":"Field","name":{"kind":"Name","value":"sizeBought"}},{"kind":"Field","name":{"kind":"Name","value":"unitPurchased"}},{"kind":"Field","name":{"kind":"Name","value":"landPrice"}},{"kind":"Field","name":{"kind":"Name","value":"landAmountPaid"}},{"kind":"Field","name":{"kind":"Name","value":"documentPrice"}},{"kind":"Field","name":{"kind":"Name","value":"documentAmountPaid"}},{"kind":"Field","name":{"kind":"Name","value":"month_subscription"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"nextPaymentDate"}},{"kind":"Field","name":{"kind":"Name","value":"isDefaulted"}},{"kind":"Field","name":{"kind":"Name","value":"isSuspended"}}]}},{"kind":"Field","name":{"kind":"Name","value":"unitSold"}},{"kind":"Field","name":{"kind":"Name","value":"earningReceived"}},{"kind":"Field","name":{"kind":"Name","value":"expectedEarning"}},{"kind":"Field","name":{"kind":"Name","value":"defaultedUsers"}},{"kind":"Field","name":{"kind":"Name","value":"suspendedUsers"}},{"kind":"Field","name":{"kind":"Name","value":"completedPayments"}},{"kind":"Field","name":{"kind":"Name","value":"totalPlotsSold"}}]}}]}}]} as unknown as DocumentNode<ViewSubscribedCustomersOnAssetQuery, ViewSubscribedCustomersOnAssetQueryVariables>;
export const GetFeatureAdminAssetsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetFeatureAdminAssets"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getAllAdminAssets"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AssetFlexTable_asset"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AssetFullOwnershipTable_asset"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AssetFlexTable_asset"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Asset"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"asset_name"}},{"kind":"Field","name":{"kind":"Name","value":"asset_location"}},{"kind":"Field","name":{"kind":"Name","value":"sold"}},{"kind":"Field","name":{"kind":"Name","value":"asset_type"}},{"kind":"Field","name":{"kind":"Name","value":"collectionEfficiencyRate"}},{"kind":"Field","name":{"kind":"Name","value":"asset_option"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"flex_payment_plans"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AssetFullOwnershipTable_asset"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Asset"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"asset_name"}},{"kind":"Field","name":{"kind":"Name","value":"asset_location"}},{"kind":"Field","name":{"kind":"Name","value":"sold"}},{"kind":"Field","name":{"kind":"Name","value":"asset_type"}},{"kind":"Field","name":{"kind":"Name","value":"collectionEfficiencyRate"}},{"kind":"Field","name":{"kind":"Name","value":"asset_option"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"zero_months"}}]}}]}}]} as unknown as DocumentNode<GetFeatureAdminAssetsQuery, GetFeatureAdminAssetsQueryVariables>;
export const FeatureAssetStatisticsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"FeatureAssetStatistics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getAssetInventoryData"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"statistics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AssetInventoryOverview_statistics"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"InventoryHealthBar_statistics"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"AssetCategoryHealth_statistics"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AssetInventoryOverview_statistics"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AssetInventoryStatistics"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"assetsSummary"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalAssets"}},{"kind":"Field","name":{"kind":"Name","value":"totalWorth"}},{"kind":"Field","name":{"kind":"Name","value":"totalFlexAssets"}},{"kind":"Field","name":{"kind":"Name","value":"totalFlexWorth"}},{"kind":"Field","name":{"kind":"Name","value":"totalFullOwnershipAssets"}},{"kind":"Field","name":{"kind":"Name","value":"totalFullOwnershipWorth"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"InventoryHealthBar_statistics"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AssetInventoryStatistics"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"portfolio"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalPortfolioValue"}},{"kind":"Field","name":{"kind":"Name","value":"totalCapacitySqm"}},{"kind":"Field","name":{"kind":"Name","value":"activeCustomers"}},{"kind":"Field","name":{"kind":"Name","value":"overallEfficiency"}},{"kind":"Field","name":{"kind":"Name","value":"totalValueSold"}},{"kind":"Field","name":{"kind":"Name","value":"totalSqmSold"}},{"kind":"Field","name":{"kind":"Name","value":"totalMoneyReceived"}},{"kind":"Field","name":{"kind":"Name","value":"totalBalanceOwed"}},{"kind":"Field","name":{"kind":"Name","value":"defaulting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"defaultingCustomers"}},{"kind":"Field","name":{"kind":"Name","value":"defaultedAssetValue"}},{"kind":"Field","name":{"kind":"Name","value":"amountPaidByDefaulters"}},{"kind":"Field","name":{"kind":"Name","value":"amountStillOwing"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AssetCategoryHealth_statistics"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AssetInventoryStatistics"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"categories"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"category"}},{"kind":"Field","name":{"kind":"Name","value":"activeAssetCount"}},{"kind":"Field","name":{"kind":"Name","value":"totalSqm"}},{"kind":"Field","name":{"kind":"Name","value":"grossRevenue"}},{"kind":"Field","name":{"kind":"Name","value":"collectionEfficiency"}},{"kind":"Field","name":{"kind":"Name","value":"occupancyRate"}},{"kind":"Field","name":{"kind":"Name","value":"totalValueSold"}},{"kind":"Field","name":{"kind":"Name","value":"totalSqmSold"}},{"kind":"Field","name":{"kind":"Name","value":"totalMoneyReceived"}},{"kind":"Field","name":{"kind":"Name","value":"totalBalance"}},{"kind":"Field","name":{"kind":"Name","value":"defaulting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"defaultedAssetValue"}},{"kind":"Field","name":{"kind":"Name","value":"defaultersPaid"}},{"kind":"Field","name":{"kind":"Name","value":"defaultersOwing"}}]}}]}}]}}]} as unknown as DocumentNode<FeatureAssetStatisticsQuery, FeatureAssetStatisticsQueryVariables>;
export const GetAssetAnalyticsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAssetAnalytics"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"assetId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filter"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Date"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Date"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getAssetAnalytics"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"assetId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"assetId"}}},{"kind":"Argument","name":{"kind":"Name","value":"filter"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filter"}}},{"kind":"Argument","name":{"kind":"Name","value":"startDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"endDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"statistics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AssetHealthBar_statistics"}},{"kind":"FragmentSpread","name":{"kind":"Name","value":"PaymentPlanMatrix_statistics"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AssetHealthBar_statistics"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AssetAnalyticsStatistics"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalInventory"}},{"kind":"Field","name":{"kind":"Name","value":"totalRealised"}},{"kind":"Field","name":{"kind":"Name","value":"remainingValue"}},{"kind":"Field","name":{"kind":"Name","value":"totalSqmSold"}},{"kind":"Field","name":{"kind":"Name","value":"totalSqmRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"efficiencyRate"}},{"kind":"Field","name":{"kind":"Name","value":"totalActiveCustomers"}},{"kind":"Field","name":{"kind":"Name","value":"defaulting"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalDefaultingCustomers"}},{"kind":"Field","name":{"kind":"Name","value":"totalDefaultedAssetValue"}},{"kind":"Field","name":{"kind":"Name","value":"totalDefaultedOutstandingValue"}}]}},{"kind":"Field","name":{"kind":"Name","value":"terminated"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalTerminatedCustomers"}},{"kind":"Field","name":{"kind":"Name","value":"totalTerminatedAssetValue"}},{"kind":"Field","name":{"kind":"Name","value":"totalTerminatedBalance"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PaymentPlanMatrix_statistics"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AssetAnalyticsStatistics"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sizePlanBreakdown"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"plans"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"startValue"}},{"kind":"Field","name":{"kind":"Name","value":"soldValue"}},{"kind":"Field","name":{"kind":"Name","value":"totalSqmSold"}},{"kind":"Field","name":{"kind":"Name","value":"totalSqmRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"totalPlans"}},{"kind":"Field","name":{"kind":"Name","value":"totalDefaultingUsers"}},{"kind":"Field","name":{"kind":"Name","value":"totalDefaultedValue"}},{"kind":"Field","name":{"kind":"Name","value":"totalBalance"}},{"kind":"Field","name":{"kind":"Name","value":"totalTerminatedPlans"}},{"kind":"Field","name":{"kind":"Name","value":"totalTerminatedValue"}},{"kind":"Field","name":{"kind":"Name","value":"totalTerminatedBalance"}},{"kind":"Field","name":{"kind":"Name","value":"efficiency"}}]}}]}}]}}]} as unknown as DocumentNode<GetAssetAnalyticsQuery, GetAssetAnalyticsQueryVariables>;
export const ViewAssetByNameDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ViewAssetByName"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"assetName"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"assetType"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"viewAssetByName"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"assetName"},"value":{"kind":"Variable","name":{"kind":"Name","value":"assetName"}}},{"kind":"Argument","name":{"kind":"Name","value":"assetType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"assetType"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"available_unit"}},{"kind":"Field","name":{"kind":"Name","value":"unit_sold"}},{"kind":"Field","name":{"kind":"Name","value":"expected_return"}},{"kind":"Field","name":{"kind":"Name","value":"total_value"}},{"kind":"Field","name":{"kind":"Name","value":"sizes"}}]}}]}}]} as unknown as DocumentNode<ViewAssetByNameQuery, ViewAssetByNameQueryVariables>;
export const ViewAssetOptionDataByNameDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ViewAssetOptionDataByName"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"assetName"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"assetType"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"viewAssetOptionDataByName"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"assetName"},"value":{"kind":"Variable","name":{"kind":"Name","value":"assetName"}}},{"kind":"Argument","name":{"kind":"Name","value":"assetType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"assetType"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sizes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"available_unit"}},{"kind":"Field","name":{"kind":"Name","value":"value"}},{"kind":"Field","name":{"kind":"Name","value":"unit_sold"}},{"kind":"Field","name":{"kind":"Name","value":"expected_return"}}]}}]}}]}}]} as unknown as DocumentNode<ViewAssetOptionDataByNameQuery, ViewAssetOptionDataByNameQueryVariables>;
export const ViewAssetDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ViewAsset"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"viewAsset"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"asset_name"}},{"kind":"Field","name":{"kind":"Name","value":"asset_location"}},{"kind":"Field","name":{"kind":"Name","value":"asset_type"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"basic_details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"allocation_qualification"}}]}},{"kind":"Field","name":{"kind":"Name","value":"asset_pictures"}},{"kind":"Field","name":{"kind":"Name","value":"amenities"}},{"kind":"Field","name":{"kind":"Name","value":"asset_history"}},{"kind":"Field","name":{"kind":"Name","value":"documents"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deed_of_assignment"}},{"kind":"Field","name":{"kind":"Name","value":"survey"}},{"kind":"Field","name":{"kind":"Name","value":"contract_of_sales"}},{"kind":"Field","name":{"kind":"Name","value":"estate_layout"}}]}},{"kind":"Field","name":{"kind":"Name","value":"asset_option"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"flex_payment_plans"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"duration_months"}},{"kind":"Field","name":{"kind":"Name","value":"initial_payment"}},{"kind":"Field","name":{"kind":"Name","value":"monthly_installment"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}}]}},{"kind":"Field","name":{"kind":"Name","value":"zero_months"}},{"kind":"Field","name":{"kind":"Name","value":"three_months"}},{"kind":"Field","name":{"kind":"Name","value":"six_months"}},{"kind":"Field","name":{"kind":"Name","value":"twelve_months"}},{"kind":"Field","name":{"kind":"Name","value":"one_month"}},{"kind":"Field","name":{"kind":"Name","value":"five_months"}},{"kind":"Field","name":{"kind":"Name","value":"seven_months"}},{"kind":"Field","name":{"kind":"Name","value":"development_fee"}},{"kind":"Field","name":{"kind":"Name","value":"initial_payment"}},{"kind":"Field","name":{"kind":"Name","value":"monthly_installment"}},{"kind":"Field","name":{"kind":"Name","value":"one_month_initial_payment"}},{"kind":"Field","name":{"kind":"Name","value":"five_months_initial_payment"}},{"kind":"Field","name":{"kind":"Name","value":"seven_months_initial_payment"}}]}}]}}]}}]} as unknown as DocumentNode<ViewAssetQuery, ViewAssetQueryVariables>;
export const CreateFlexAssetDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateFlexAsset"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createFlexAssetInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateFlexAssetInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createFlexAsset"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"createFlexAssetInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createFlexAssetInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"asset_name"}}]}}]}}]} as unknown as DocumentNode<CreateFlexAssetMutation, CreateFlexAssetMutationVariables>;
export const CreateFullOwnershipAssetDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateFullOwnershipAsset"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"createFullOwnershipAssetInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateFullOwnershipAssetInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createFullOwnershipAsset"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"createFullOwnershipAssetInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"createFullOwnershipAssetInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"asset_name"}}]}}]}}]} as unknown as DocumentNode<CreateFullOwnershipAssetMutation, CreateFullOwnershipAssetMutationVariables>;
export const UpdateAssetDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateAsset"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"updateAssetInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateFlexAssetInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateAsset"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"updateAssetInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"updateAssetInput"}}}]}]}}]} as unknown as DocumentNode<UpdateAssetMutation, UpdateAssetMutationVariables>;
export const ApproveUpgradeToAssociateDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ApproveUpgradeToAssociate"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"approveUpgradeToAssociate"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<ApproveUpgradeToAssociateMutation, ApproveUpgradeToAssociateMutationVariables>;
export const ApproveUpgradeToAssociateProDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ApproveUpgradeToAssociatePro"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"approveUpgradeToAssociatePro"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<ApproveUpgradeToAssociateProMutation, ApproveUpgradeToAssociateProMutationVariables>;
export const GetActiveCouponsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetActiveCoupons"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getActiveCoupons"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"couponCode"}},{"kind":"Field","name":{"kind":"Name","value":"discountPercentage"}},{"kind":"Field","name":{"kind":"Name","value":"startDate"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}},{"kind":"Field","name":{"kind":"Name","value":"expiryDate"}},{"kind":"Field","name":{"kind":"Name","value":"expiryType"}},{"kind":"Field","name":{"kind":"Name","value":"usageLimit"}},{"kind":"Field","name":{"kind":"Name","value":"usageLimitType"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"activeImmediately"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}}]}}]} as unknown as DocumentNode<GetActiveCouponsQuery, GetActiveCouponsQueryVariables>;
export const CreateCouponDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateCoupon"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateCouponInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createCoupon"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"createCouponInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}}]}}]}}]}}]} as unknown as DocumentNode<CreateCouponMutation, CreateCouponMutationVariables>;
export const UpdateCouponStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateCouponStatus"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateCouponStatusInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateCouponStatus"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"updateCouponStatusInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]}}]} as unknown as DocumentNode<UpdateCouponStatusMutation, UpdateCouponStatusMutationVariables>;
export const DeleteCouponDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteCoupon"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"couponCode"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteCoupon"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"couponCode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"couponCode"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"success"}}]}}]}}]} as unknown as DocumentNode<DeleteCouponMutation, DeleteCouponMutationVariables>;
export const UpdateCouponDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateCoupon"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateCouponInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateCoupon"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"updateCouponInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateCouponMutation, UpdateCouponMutationVariables>;
export const ManualUpgradeToAssociateProDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ManualUpgradeToAssociatePro"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"email"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"amount"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"payCommission"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paymentUrl"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"commissionableAmount"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Float"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"manualUpgradeToAssociatePro"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"email"},"value":{"kind":"Variable","name":{"kind":"Name","value":"email"}}},{"kind":"Argument","name":{"kind":"Name","value":"amount"},"value":{"kind":"Variable","name":{"kind":"Name","value":"amount"}}},{"kind":"Argument","name":{"kind":"Name","value":"payCommission"},"value":{"kind":"Variable","name":{"kind":"Name","value":"payCommission"}}},{"kind":"Argument","name":{"kind":"Name","value":"paymentUrl"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paymentUrl"}}},{"kind":"Argument","name":{"kind":"Name","value":"commissionableAmount"},"value":{"kind":"Variable","name":{"kind":"Name","value":"commissionableAmount"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<ManualUpgradeToAssociateProMutation, ManualUpgradeToAssociateProMutationVariables>;
export const DeclineUpgradeRequestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeclineUpgradeRequest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"declineUpgradeRequest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DeclineUpgradeRequestMutation, DeclineUpgradeRequestMutationVariables>;
export const GetAllUpgradeRequestsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAllUpgradeRequests"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"adminStatus"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"AdminStatus"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getAllUpgradeRequests"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"adminStatus"},"value":{"kind":"Variable","name":{"kind":"Name","value":"adminStatus"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upgradeRequests"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UpgradeRowFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"pagination"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currentPage"}},{"kind":"Field","name":{"kind":"Name","value":"limit"}},{"kind":"Field","name":{"kind":"Name","value":"totalCount"}},{"kind":"Field","name":{"kind":"Name","value":"totalPages"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UpgradeRowFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ReferralUpgrade"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"admin_status"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"fee_amount"}},{"kind":"Field","name":{"kind":"Name","value":"transaction_type"}},{"kind":"Field","name":{"kind":"Name","value":"user_upgrade_type"}},{"kind":"Field","name":{"kind":"Name","value":"file_Url"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}},{"kind":"Field","name":{"kind":"Name","value":"associate"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]} as unknown as DocumentNode<GetAllUpgradeRequestsQuery, GetAllUpgradeRequestsQueryVariables>;
export const SearchUpgradeUsersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"SearchUpgradeUsers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"searchQuery"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getAllUsers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"searchQuery"},"value":{"kind":"Variable","name":{"kind":"Name","value":"searchQuery"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]}}]} as unknown as DocumentNode<SearchUpgradeUsersQuery, SearchUpgradeUsersQueryVariables>;
export const GetTopAssociatesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTopAssociates"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sortBy"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getTopAssociates"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"sortBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sortBy"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TopAssociatesTableRowFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TopAssociatesTableRowFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Associate"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"sales_person"}},{"kind":"Field","name":{"kind":"Name","value":"no_of_clients"}},{"kind":"Field","name":{"kind":"Name","value":"units_sold"}},{"kind":"Field","name":{"kind":"Name","value":"size_sold"}},{"kind":"Field","name":{"kind":"Name","value":"expected_revenue"}},{"kind":"Field","name":{"kind":"Name","value":"received_revenue"}},{"kind":"Field","name":{"kind":"Name","value":"commission"}}]}}]} as unknown as DocumentNode<GetTopAssociatesQuery, GetTopAssociatesQueryVariables>;
export const ViewAssetRaffledrawPerformanceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ViewAssetRaffledrawPerformance"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"viewAssetRaffledrawPerformance"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"salesMetrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RaffleSalesMetrics"}}]}},{"kind":"Field","name":{"kind":"Name","value":"financialMetrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RaffleFinancialMetrics"}}]}},{"kind":"Field","name":{"kind":"Name","value":"assetBreakdown"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RaffleAssetBreakdown"}}]}},{"kind":"Field","name":{"kind":"Name","value":"usersWithTickets"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RaffleUserTicket"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RaffleSalesMetrics"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SalesMetrics"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dailySqmTargetRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"percentageSold"}},{"kind":"Field","name":{"kind":"Name","value":"sqmRemainingToSell"}},{"kind":"Field","name":{"kind":"Name","value":"targetSqm"}},{"kind":"Field","name":{"kind":"Name","value":"totalSqmSold"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RaffleFinancialMetrics"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FinancialMetrics"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalRevenueGenerated"}},{"kind":"Field","name":{"kind":"Name","value":"totalAssetValueSold"}},{"kind":"Field","name":{"kind":"Name","value":"averagePaymentPerPlan"}},{"kind":"Field","name":{"kind":"Name","value":"totalBalance"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RaffleAssetBreakdown"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AssetBreakdown"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"assetName"}},{"kind":"Field","name":{"kind":"Name","value":"percentageOfTotal"}},{"kind":"Field","name":{"kind":"Name","value":"totalSqmSold"}},{"kind":"Field","name":{"kind":"Name","value":"totalTickets"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RaffleUserTicket"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserWithTicket"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"ticketId"}}]}}]} as unknown as DocumentNode<ViewAssetRaffledrawPerformanceQuery, ViewAssetRaffledrawPerformanceQueryVariables>;
export const ViewAssetHamperPerformanceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ViewAssetHamperPerformance"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"viewAssetHamperPerformance"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"assetBreakdown"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"HamperAssetBreakdown"}}]}},{"kind":"Field","name":{"kind":"Name","value":"financialMetrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"HamperFinancialMetrics"}}]}},{"kind":"Field","name":{"kind":"Name","value":"salesMetrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"HamperSalesMetrics"}}]}},{"kind":"Field","name":{"kind":"Name","value":"referrersWithHampers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"HamperReferrer"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"HamperAssetBreakdown"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AssetBreakdownHamper"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"assetName"}},{"kind":"Field","name":{"kind":"Name","value":"percentageOfTotal"}},{"kind":"Field","name":{"kind":"Name","value":"totalSqmSold"}},{"kind":"Field","name":{"kind":"Name","value":"totalHampers"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"HamperFinancialMetrics"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FinancialMetricsHamper"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalRevenueGenerated"}},{"kind":"Field","name":{"kind":"Name","value":"totalAssetValueSold"}},{"kind":"Field","name":{"kind":"Name","value":"averagePaymentPerPlan"}},{"kind":"Field","name":{"kind":"Name","value":"totalBalance"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"HamperSalesMetrics"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SalesMetricsHamper"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"dailySqmTargetRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"percentageSold"}},{"kind":"Field","name":{"kind":"Name","value":"sqmRemainingToSell"}},{"kind":"Field","name":{"kind":"Name","value":"targetSqm"}},{"kind":"Field","name":{"kind":"Name","value":"totalSqmSold"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"HamperReferrer"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ReferrerWithHampers"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"hamperCount"}},{"kind":"Field","name":{"kind":"Name","value":"totalSqmReferred"}}]}}]} as unknown as DocumentNode<ViewAssetHamperPerformanceQuery, ViewAssetHamperPerformanceQueryVariables>;
export const Campaign2000DashboardDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Campaign2000Dashboard"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getCampaignDashboard"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AssociateProMetricsSection_dashboard"}}]}},{"kind":"Field","name":{"kind":"Name","value":"getAssociateProUpgrades"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"total"}},{"kind":"Field","name":{"kind":"Name","value":"upgrades"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AssociateProUpgradeDetail"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"getReferralAnalytics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AssociateProReferralAnalytics"}},{"kind":"Field","name":{"kind":"Name","value":"ticketHolders"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"tickets"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AssociateProTicketHolder"}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AssociateProTopReferrer"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TopReferrer"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"referrerId"}},{"kind":"Field","name":{"kind":"Name","value":"referrerFullName"}},{"kind":"Field","name":{"kind":"Name","value":"referrerEmail"}},{"kind":"Field","name":{"kind":"Name","value":"totalReferrals"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AssociateProRevenueLeader"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"RevenueLeader"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"referrerId"}},{"kind":"Field","name":{"kind":"Name","value":"referrerFullName"}},{"kind":"Field","name":{"kind":"Name","value":"referrerEmail"}},{"kind":"Field","name":{"kind":"Name","value":"totalRevenue"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AssociateProSourceBreakdown"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"HowYouHeardSource"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"percentage"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AssociateProMetricsSection_dashboard"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"CampaignDashboard"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"associateProProgress"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"currentAssociatePro"}},{"kind":"Field","name":{"kind":"Name","value":"percentageComplete"}},{"kind":"Field","name":{"kind":"Name","value":"targetAssociatePro"}}]}},{"kind":"Field","name":{"kind":"Name","value":"revenueMetrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalRevenue"}},{"kind":"Field","name":{"kind":"Name","value":"revenueGoal"}},{"kind":"Field","name":{"kind":"Name","value":"percentageComplete"}}]}},{"kind":"Field","name":{"kind":"Name","value":"campaignPeriod"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"daysRemaining"}},{"kind":"Field","name":{"kind":"Name","value":"endDate"}}]}},{"kind":"Field","name":{"kind":"Name","value":"ticketMetrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalTicketsIssued"}}]}},{"kind":"Field","name":{"kind":"Name","value":"conversionMetrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"overallConversionRate"}},{"kind":"Field","name":{"kind":"Name","value":"userToAssociatePro"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalUsers"}},{"kind":"Field","name":{"kind":"Name","value":"convertedToAssociatePro"}},{"kind":"Field","name":{"kind":"Name","value":"conversionRate"}}]}},{"kind":"Field","name":{"kind":"Name","value":"associateToAssociatePro"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalAssociates"}},{"kind":"Field","name":{"kind":"Name","value":"convertedToAssociatePro"}},{"kind":"Field","name":{"kind":"Name","value":"conversionRate"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"graphs"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"revenueGraph"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"chartData"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"conversionGraph"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userToAssociateProConversions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"chartData"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}}]}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AssociateProUpgradeDetail"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AssociateProUpgradeDetail"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"upgradeId"}},{"kind":"Field","name":{"kind":"Name","value":"userFullName"}},{"kind":"Field","name":{"kind":"Name","value":"userSince"}},{"kind":"Field","name":{"kind":"Name","value":"associateSince"}},{"kind":"Field","name":{"kind":"Name","value":"associateProSince"}},{"kind":"Field","name":{"kind":"Name","value":"referrerFullName"}},{"kind":"Field","name":{"kind":"Name","value":"amountPaid"}},{"kind":"Field","name":{"kind":"Name","value":"adminStatus"}},{"kind":"Field","name":{"kind":"Name","value":"ticketId"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AssociateProReferralAnalytics"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ReferralAnalytics"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"topReferrers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"referrers"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AssociateProTopReferrer"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"revenueLeaders"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"leaders"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AssociateProRevenueLeader"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"howYouHeardBreakdown"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalResponses"}},{"kind":"Field","name":{"kind":"Name","value":"breakdown"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AssociateProSourceBreakdown"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AssociateProTicketHolder"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"TicketDetail"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ticketId"}},{"kind":"Field","name":{"kind":"Name","value":"ticketType"}},{"kind":"Field","name":{"kind":"Name","value":"userFullName"}},{"kind":"Field","name":{"kind":"Name","value":"userEmail"}},{"kind":"Field","name":{"kind":"Name","value":"referrerFullName"}},{"kind":"Field","name":{"kind":"Name","value":"amountPaid"}},{"kind":"Field","name":{"kind":"Name","value":"createdDate"}},{"kind":"Field","name":{"kind":"Name","value":"isActive"}}]}}]} as unknown as DocumentNode<Campaign2000DashboardQuery, Campaign2000DashboardQueryVariables>;
export const GetAssociateRecruitmentAnalyticsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAssociateRecruitmentAnalytics"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"hasReferral"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"referralStatus"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"searchQuery"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getAllUsersWithFilters"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"hasReferral"},"value":{"kind":"Variable","name":{"kind":"Name","value":"hasReferral"}}},{"kind":"Argument","name":{"kind":"Name","value":"referralStatus"},"value":{"kind":"Variable","name":{"kind":"Name","value":"referralStatus"}}},{"kind":"Argument","name":{"kind":"Name","value":"searchQuery"},"value":{"kind":"Variable","name":{"kind":"Name","value":"searchQuery"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AssociateProRecruitmentUser"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AssociateProRecruitmentUser"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"FilteredUserAdminDetail"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"referral"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]} as unknown as DocumentNode<GetAssociateRecruitmentAnalyticsQuery, GetAssociateRecruitmentAnalyticsQueryVariables>;
export const GetCampaignPaymentPlansDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCampaignPaymentPlans"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getCampaignPaymentPlans"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"assetName"}},{"kind":"Field","name":{"kind":"Name","value":"dateStarted"}},{"kind":"Field","name":{"kind":"Name","value":"documentAmountPaid"}},{"kind":"Field","name":{"kind":"Name","value":"documentPrice"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"landAmountPaid"}},{"kind":"Field","name":{"kind":"Name","value":"landPrice"}},{"kind":"Field","name":{"kind":"Name","value":"monthsOfSubscription"}},{"kind":"Field","name":{"kind":"Name","value":"nextDateOfPayment"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}}]}}]}}]}}]} as unknown as DocumentNode<GetCampaignPaymentPlansQuery, GetCampaignPaymentPlansQueryVariables>;
export const GetRaffleTicketsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetRaffleTickets"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"ticketType"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"TicketTypeFilter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getRaffleTickets"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"ticketType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"ticketType"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"referral_ticket"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"ticket_id"}},{"kind":"Field","name":{"kind":"Name","value":"user_id"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phoneNumber"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"user_id"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phoneNumber"}}]}},{"kind":"Field","name":{"kind":"Name","value":"asset_name"}},{"kind":"Field","name":{"kind":"Name","value":"ticket_id"}},{"kind":"Field","name":{"kind":"Name","value":"total_size"}},{"kind":"Field","name":{"kind":"Name","value":"units_purchased"}},{"kind":"Field","name":{"kind":"Name","value":"size_purchased"}},{"kind":"Field","name":{"kind":"Name","value":"created_date"}}]}}]}}]}}]} as unknown as DocumentNode<GetRaffleTicketsQuery, GetRaffleTicketsQueryVariables>;
export const GetHamperTransactionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetHamperTransactions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getCampaignPaymentPlans"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"assetName"}},{"kind":"Field","name":{"kind":"Name","value":"dateStarted"}},{"kind":"Field","name":{"kind":"Name","value":"documentAmountPaid"}},{"kind":"Field","name":{"kind":"Name","value":"documentPrice"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"landAmountPaid"}},{"kind":"Field","name":{"kind":"Name","value":"landPrice"}},{"kind":"Field","name":{"kind":"Name","value":"monthsOfSubscription"}},{"kind":"Field","name":{"kind":"Name","value":"nextDateOfPayment"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}}]}}]}}]}}]} as unknown as DocumentNode<GetHamperTransactionsQuery, GetHamperTransactionsQueryVariables>;
export const GetHamperLeaderboardDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetHamperLeaderboard"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getHamperLeaderboard"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"startDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"endDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"hamperCount"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"numberOfReferredUsers"}},{"kind":"Field","name":{"kind":"Name","value":"phoneNumber"}},{"kind":"Field","name":{"kind":"Name","value":"referrerId"}},{"kind":"Field","name":{"kind":"Name","value":"totalAmountPaid"}},{"kind":"Field","name":{"kind":"Name","value":"totalAssetValue"}},{"kind":"Field","name":{"kind":"Name","value":"totalBalance"}},{"kind":"Field","name":{"kind":"Name","value":"totalLandPrice"}},{"kind":"Field","name":{"kind":"Name","value":"totalSqmSold"}}]}}]}}]} as unknown as DocumentNode<GetHamperLeaderboardQuery, GetHamperLeaderboardQueryVariables>;
export const GetAdminDashboardDetailsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAdminDashboardDetails"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getAdminDashboardDetails"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"startDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"endDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DashboardQuickOverview_data"}},{"kind":"Field","name":{"kind":"Name","value":"top_associates"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TopAssociates_data"}}]}},{"kind":"Field","name":{"kind":"Name","value":"top_selling_prop"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TopSellingProducts_data"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DashboardQuickOverview_data"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AdminDashboard"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"users"}},{"kind":"Field","name":{"kind":"Name","value":"monthly_recurring_revenue"}},{"kind":"Field","name":{"kind":"Name","value":"associate_users"}},{"kind":"Field","name":{"kind":"Name","value":"associate_pro_users"}},{"kind":"Field","name":{"kind":"Name","value":"total_asset"}},{"kind":"Field","name":{"kind":"Name","value":"default_users"}},{"kind":"Field","name":{"kind":"Name","value":"suspended_users"}},{"kind":"Field","name":{"kind":"Name","value":"suspended_payment_plans"}},{"kind":"Field","name":{"kind":"Name","value":"total_payable"}},{"kind":"Field","name":{"kind":"Name","value":"sales"}},{"kind":"Field","name":{"kind":"Name","value":"inflow"}},{"kind":"Field","name":{"kind":"Name","value":"outflow"}},{"kind":"Field","name":{"kind":"Name","value":"total_wallet_balance"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TopAssociates_data"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserReferralAdmin"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"userName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"amount_brought"}},{"kind":"Field","name":{"kind":"Name","value":"no_of_referral"}},{"kind":"Field","name":{"kind":"Name","value":"phoneNumber"}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TopSellingProducts_data"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AssetDashBoard"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"asset_name"}},{"kind":"Field","name":{"kind":"Name","value":"asset_pictures"}},{"kind":"Field","name":{"kind":"Name","value":"asset_location"}},{"kind":"Field","name":{"kind":"Name","value":"units_subscribed"}},{"kind":"Field","name":{"kind":"Name","value":"amount_broughtin"}}]}}]} as unknown as DocumentNode<GetAdminDashboardDetailsQuery, GetAdminDashboardDetailsQueryVariables>;
export const InviteAdminDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"InviteAdmin"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SubAdminInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createSubAdmin"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"subAdminInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<InviteAdminMutation, InviteAdminMutationVariables>;
export const UpdateRequestStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateRequestStatus"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"updateRequestInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateRequestInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateRequestStatus"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"updateRequestInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"updateRequestInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<UpdateRequestStatusMutation, UpdateRequestStatusMutationVariables>;
export const SystemApproveLocationChangeRequestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SystemApproveLocationChangeRequest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"requestId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"systemApproveLocationChangeRequest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"requestId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"requestId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<SystemApproveLocationChangeRequestMutation, SystemApproveLocationChangeRequestMutationVariables>;
export const SystemApproveDocumentChangeRequestDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SystemApproveDocumentChangeRequest"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"requestId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"systemApproveDocumentChangeRequest"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"requestId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"requestId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<SystemApproveDocumentChangeRequestMutation, SystemApproveDocumentChangeRequestMutationVariables>;
export const GetRequestStatisticsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetRequestStatistics"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"from"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Date"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"to"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Date"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getRequestStatistics"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"dateRange"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"from"},"value":{"kind":"Variable","name":{"kind":"Name","value":"from"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"to"},"value":{"kind":"Variable","name":{"kind":"Name","value":"to"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalRequests"}},{"kind":"Field","name":{"kind":"Name","value":"pendingRequests"}},{"kind":"Field","name":{"kind":"Name","value":"approvedRequests"}},{"kind":"Field","name":{"kind":"Name","value":"declinedRequests"}},{"kind":"Field","name":{"kind":"Name","value":"locationChangeRequests"}},{"kind":"Field","name":{"kind":"Name","value":"documentChangeRequests"}},{"kind":"Field","name":{"kind":"Name","value":"assetUpdateRequests"}},{"kind":"Field","name":{"kind":"Name","value":"customRequests"}},{"kind":"Field","name":{"kind":"Name","value":"totalFeesCollected"}},{"kind":"Field","name":{"kind":"Name","value":"paidRequests"}},{"kind":"Field","name":{"kind":"Name","value":"unpaidRequests"}}]}}]}}]} as unknown as DocumentNode<GetRequestStatisticsQuery, GetRequestStatisticsQueryVariables>;
export const GetAdminWithRoleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAdminWithRole"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"adminId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getAdminWithRole"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"adminId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"adminId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AdminDetailFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AdminDetailFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AdminRoles"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminEmail"}},{"kind":"Field","name":{"kind":"Name","value":"adminId"}},{"kind":"Field","name":{"kind":"Name","value":"adminName"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"roleId"}}]}}]} as unknown as DocumentNode<GetAdminWithRoleQuery, GetAdminWithRoleQueryVariables>;
export const GetAllAdminWithRolesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAllAdminWithRoles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getAllAdminWithRoles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AdminRowFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AdminRowFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AdminRoles"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminEmail"}},{"kind":"Field","name":{"kind":"Name","value":"adminId"}},{"kind":"Field","name":{"kind":"Name","value":"adminName"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"roleId"}}]}}]} as unknown as DocumentNode<GetAllAdminWithRolesQuery, GetAllAdminWithRolesQueryVariables>;
export const CreateRoleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateRole"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CreateRoleInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createRole"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"createRoleInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}}]}}]}}]} as unknown as DocumentNode<CreateRoleMutation, CreateRoleMutationVariables>;
export const GetAllPermissionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAllPermissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getAllPermissions"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"PermissionOptionFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"PermissionOptionFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Permission"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}}]}}]} as unknown as DocumentNode<GetAllPermissionsQuery, GetAllPermissionsQueryVariables>;
export const GetAllRolesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAllRoles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getAllRoles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"RoleCardFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"RoleCardFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Role"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"permissions"}}]}}]} as unknown as DocumentNode<GetAllRolesQuery, GetAllRolesQueryVariables>;
export const UpdateAdminRoleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateAdminRole"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"input"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateAdminRoleInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateAdminRole"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"updateAdminRoleInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"input"}}}]}]}}]} as unknown as DocumentNode<UpdateAdminRoleMutation, UpdateAdminRoleMutationVariables>;
export const ExportSalesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ExportSales"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"SalesRecordFilters"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getSalesRecord"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user_firstName"}},{"kind":"Field","name":{"kind":"Name","value":"user_lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"user_phone"}},{"kind":"Field","name":{"kind":"Name","value":"referrer_name"}},{"kind":"Field","name":{"kind":"Name","value":"referrer_email"}},{"kind":"Field","name":{"kind":"Name","value":"referrer_phone"}},{"kind":"Field","name":{"kind":"Name","value":"asset_name"}},{"kind":"Field","name":{"kind":"Name","value":"asset_type"}},{"kind":"Field","name":{"kind":"Name","value":"no_of_units"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"amount_paid"}},{"kind":"Field","name":{"kind":"Name","value":"fullownerhsip_documentprice"}},{"kind":"Field","name":{"kind":"Name","value":"document_amount_paid"}},{"kind":"Field","name":{"kind":"Name","value":"month_subscription"}},{"kind":"Field","name":{"kind":"Name","value":"start_date"}},{"kind":"Field","name":{"kind":"Name","value":"next_date"}}]}}]}}]}}]} as unknown as DocumentNode<ExportSalesQuery, ExportSalesQueryVariables>;
export const GetSalesRecordDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetSalesRecord"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"SalesRecordFilters"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getSalesRecord"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SalesRowFragment"}}]}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SalesRowFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SalesRecord"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user_firstName"}},{"kind":"Field","name":{"kind":"Name","value":"user_lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"user_phone"}},{"kind":"Field","name":{"kind":"Name","value":"referrer_name"}},{"kind":"Field","name":{"kind":"Name","value":"referrer_email"}},{"kind":"Field","name":{"kind":"Name","value":"referrer_phone"}},{"kind":"Field","name":{"kind":"Name","value":"asset_name"}},{"kind":"Field","name":{"kind":"Name","value":"asset_type"}},{"kind":"Field","name":{"kind":"Name","value":"no_of_units"}},{"kind":"Field","name":{"kind":"Name","value":"document_amount_paid"}},{"kind":"Field","name":{"kind":"Name","value":"fullownerhsip_documentprice"}},{"kind":"Field","name":{"kind":"Name","value":"month_subscription"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"amount_paid"}},{"kind":"Field","name":{"kind":"Name","value":"start_date"}},{"kind":"Field","name":{"kind":"Name","value":"next_date"}}]}}]} as unknown as DocumentNode<GetSalesRecordQuery, GetSalesRecordQueryVariables>;
export const GetSalesDashboardDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetSalesDashboard"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getSalesDashboard"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"startDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"endDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SummaryCards_dashboard"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SummaryCards_dashboard"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SalesDashboard"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalTransactionValue"}},{"kind":"Field","name":{"kind":"Name","value":"expectedTransactionValue"}},{"kind":"Field","name":{"kind":"Name","value":"totalReceivedTransactionValue"}},{"kind":"Field","name":{"kind":"Name","value":"outstandingTransactionValue"}},{"kind":"Field","name":{"kind":"Name","value":"totalFlexTransactionValue"}},{"kind":"Field","name":{"kind":"Name","value":"expectedFlexTransactionValue"}},{"kind":"Field","name":{"kind":"Name","value":"totalReceivedFlexTransactionValue"}},{"kind":"Field","name":{"kind":"Name","value":"outstandingFlexTransactionValue"}},{"kind":"Field","name":{"kind":"Name","value":"totalFullOwnershipTransactionValue"}},{"kind":"Field","name":{"kind":"Name","value":"expectedFullOwnershipTransactionValue"}},{"kind":"Field","name":{"kind":"Name","value":"totalReceivedFullOwnershipTransactionValue"}},{"kind":"Field","name":{"kind":"Name","value":"outstandingFullOwnershipTransactionValue"}}]}}]} as unknown as DocumentNode<GetSalesDashboardQuery, GetSalesDashboardQueryVariables>;
export const ExportCommissionTransactionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ExportCommissionTransactions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getCommissionTransactions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}},{"kind":"Argument","name":{"kind":"Name","value":"startDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"endDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"admin_status"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"asset_type"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"referrer"}},{"kind":"Field","name":{"kind":"Name","value":"referral_status"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"tin"}}]}},{"kind":"Field","name":{"kind":"Name","value":"plot_size"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"referral"}},{"kind":"Field","name":{"kind":"Name","value":"transaction_type"}},{"kind":"Field","name":{"kind":"Name","value":"time_of_transaction"}}]}}]}}]}}]} as unknown as DocumentNode<ExportCommissionTransactionsQuery, ExportCommissionTransactionsQueryVariables>;
export const GetUsersWithZeroBalanceDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUsersWithZeroBalance"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getUsersWithZeroBalance"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CompleteAssetPaymentsTable_data"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CompleteAssetPaymentsTable_data"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"ZeroBalance"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phone_number"}},{"kind":"Field","name":{"kind":"Name","value":"sales_person"}},{"kind":"Field","name":{"kind":"Name","value":"asset_name"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"amount_paid"}},{"kind":"Field","name":{"kind":"Name","value":"month_subscription"}},{"kind":"Field","name":{"kind":"Name","value":"start_date"}},{"kind":"Field","name":{"kind":"Name","value":"next_payment_date"}}]}}]} as unknown as DocumentNode<GetUsersWithZeroBalanceQuery, GetUsersWithZeroBalanceQueryVariables>;
export const ExportDocumentTransactionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ExportDocumentTransactions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Date"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Date"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getDocumentTransaction"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}},{"kind":"Argument","name":{"kind":"Name","value":"startDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"endDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"admin_status"}},{"kind":"Field","name":{"kind":"Name","value":"plot_size"}},{"kind":"Field","name":{"kind":"Name","value":"asset_type"}},{"kind":"Field","name":{"kind":"Name","value":"referral"}},{"kind":"Field","name":{"kind":"Name","value":"transaction_type"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phoneNumber"}},{"kind":"Field","name":{"kind":"Name","value":"referral_status"}},{"kind":"Field","name":{"kind":"Name","value":"_id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"time_of_transaction"}}]}}]}}]}}]} as unknown as DocumentNode<ExportDocumentTransactionsQuery, ExportDocumentTransactionsQueryVariables>;
export const ApproveTransactionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ApproveTransaction"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"approveTransactionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"approveTransaction"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"approveTransactionId"}}}]}]}}]} as unknown as DocumentNode<ApproveTransactionMutation, ApproveTransactionMutationVariables>;
export const DeclineTransactionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeclineTransaction"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"declineTransactionInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeclineTransactionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"declineTransaction"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"declineTransactionInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"declineTransactionInput"}}}]}]}}]} as unknown as DocumentNode<DeclineTransactionMutation, DeclineTransactionMutationVariables>;
export const ApprovePaystackTransactionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ApprovePaystackTransaction"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"approvePaystackTransactionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"approvePaystackTransaction"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"approvePaystackTransactionId"}}}]}]}}]} as unknown as DocumentNode<ApprovePaystackTransactionMutation, ApprovePaystackTransactionMutationVariables>;
export const ApproveAssetTransactionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ApproveAssetTransaction"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"approveAssetTransactionId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"approveAssetTransaction"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"approveAssetTransactionId"}}}]}]}}]} as unknown as DocumentNode<ApproveAssetTransactionMutation, ApproveAssetTransactionMutationVariables>;
export const DeclineDocumentTransactionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeclineDocumentTransaction"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"declineTransactionInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeclineTransactionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"declineDocumentTransaction"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"declineTransactionInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"declineTransactionInput"}}}]}]}}]} as unknown as DocumentNode<DeclineDocumentTransactionMutation, DeclineDocumentTransactionMutationVariables>;
export const ProcessCommissionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ProcessCommission"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"processCommissionInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ProcessCommissionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"processCommission"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"processCommissionInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"processCommissionInput"}}}]}]}}]} as unknown as DocumentNode<ProcessCommissionMutation, ProcessCommissionMutationVariables>;
export const ProcessReceiptDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ProcessReceipt"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"processReceiptInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ProcessReceiptInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"processReceipt"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"processReceiptInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"processReceiptInput"}}}]}]}}]} as unknown as DocumentNode<ProcessReceiptMutation, ProcessReceiptMutationVariables>;
export const DeclineAssetTransactionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeclineAssetTransaction"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"declineTransactionInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DeclineTransactionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"declineAssetTransaction"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"declineTransactionInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"declineTransactionInput"}}}]}]}}]} as unknown as DocumentNode<DeclineAssetTransactionMutation, DeclineAssetTransactionMutationVariables>;
export const GetTopupTransactionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetTopupTransaction"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getTopupTransaction"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"TopupTransactionsTable_data"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"TopupTransactionsTable_data"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AdminTransactions"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"admin_status"}},{"kind":"Field","name":{"kind":"Name","value":"time_of_transaction"}},{"kind":"Field","name":{"kind":"Name","value":"transaction_type"}},{"kind":"Field","name":{"kind":"Name","value":"transfer_file"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"file"}}]}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"_id"}}]}}]}}]} as unknown as DocumentNode<GetTopupTransactionQuery, GetTopupTransactionQueryVariables>;
export const GetWithdrawalTransactionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetWithdrawalTransaction"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getWithdrawalTransaction"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"WithdrawalTransactionsTable_data"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"WithdrawalTransactionsTable_data"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AdminTransactions"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"admin_status"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"time_of_transaction"}},{"kind":"Field","name":{"kind":"Name","value":"processing_type"}},{"kind":"Field","name":{"kind":"Name","value":"tin"}},{"kind":"Field","name":{"kind":"Name","value":"bank_details"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"accountNumber"}},{"kind":"Field","name":{"kind":"Name","value":"bankName"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"tin"}}]}}]}}]} as unknown as DocumentNode<GetWithdrawalTransactionQuery, GetWithdrawalTransactionQueryVariables>;
export const GetDocumentTransactionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetDocumentTransaction"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Date"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Date"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getDocumentTransaction"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}},{"kind":"Argument","name":{"kind":"Name","value":"startDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"endDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DocumentTransactionsTable_data"}}]}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DocumentTransactionsTable_data"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AdminTransactions"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"admin_status"}},{"kind":"Field","name":{"kind":"Name","value":"plot_size"}},{"kind":"Field","name":{"kind":"Name","value":"asset_type"}},{"kind":"Field","name":{"kind":"Name","value":"referral"}},{"kind":"Field","name":{"kind":"Name","value":"transaction_type"}},{"kind":"Field","name":{"kind":"Name","value":"transfer_file"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"file"}}]}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"_id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"time_of_transaction"}}]}}]} as unknown as DocumentNode<GetDocumentTransactionQuery, GetDocumentTransactionQueryVariables>;
export const GetCommissionTransactionsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetCommissionTransactions"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getCommissionTransactions"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}},{"kind":"Argument","name":{"kind":"Name","value":"startDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"endDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"CommissionTransactionsTable_data"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CommissionTransactionsTable_data"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AdminTransactions"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"tin"}},{"kind":"Field","name":{"kind":"Name","value":"admin_status"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"asset_type"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"referrer"}},{"kind":"Field","name":{"kind":"Name","value":"referral_status"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"tin"}}]}},{"kind":"Field","name":{"kind":"Name","value":"plot_size"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"referral"}},{"kind":"Field","name":{"kind":"Name","value":"transaction_type"}},{"kind":"Field","name":{"kind":"Name","value":"time_of_transaction"}}]}}]} as unknown as DocumentNode<GetCommissionTransactionsQuery, GetCommissionTransactionsQueryVariables>;
export const AdminTransactionDataPointDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AdminTransactionDataPoint"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"dataPointInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"DataPointInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"adminTransactionDataPoint"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"dataPointInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"dataPointInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"pending_transaction"}},{"kind":"Field","name":{"kind":"Name","value":"approved_transaction"}},{"kind":"Field","name":{"kind":"Name","value":"rejected_transaction"}},{"kind":"Field","name":{"kind":"Name","value":"commission_transaction"}},{"kind":"Field","name":{"kind":"Name","value":"users_wallet_balance"}},{"kind":"Field","name":{"kind":"Name","value":"auto_approved_transaction"}},{"kind":"Field","name":{"kind":"Name","value":"auto_failed_transaction"}}]}}]}}]} as unknown as DocumentNode<AdminTransactionDataPointQuery, AdminTransactionDataPointQueryVariables>;
export const GetAssetTransactionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAssetTransaction"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"assetType"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"transactionType"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"status"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Date"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Date"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"salesType"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"search"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getAssetTransaction"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"assetType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"assetType"}}},{"kind":"Argument","name":{"kind":"Name","value":"transactionType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"transactionType"}}},{"kind":"Argument","name":{"kind":"Name","value":"status"},"value":{"kind":"Variable","name":{"kind":"Name","value":"status"}}},{"kind":"Argument","name":{"kind":"Name","value":"startDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"endDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"salesType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"salesType"}}},{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"search"},"value":{"kind":"Variable","name":{"kind":"Name","value":"search"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"AssetTransactionsTable_data"}}]}},{"kind":"Field","name":{"kind":"Name","value":"count"}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"AssetTransactionsTable_data"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"AdminTransactions"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"admin_status"}},{"kind":"Field","name":{"kind":"Name","value":"plot_size"}},{"kind":"Field","name":{"kind":"Name","value":"asset_type"}},{"kind":"Field","name":{"kind":"Name","value":"referral"}},{"kind":"Field","name":{"kind":"Name","value":"transaction_type"}},{"kind":"Field","name":{"kind":"Name","value":"transfer_file"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"file"}}]}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"_id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"time_of_transaction"}}]}}]} as unknown as DocumentNode<GetAssetTransactionQuery, GetAssetTransactionQueryVariables>;
export const GetAssetTransactionsStatisticsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAssetTransactionsStatistics"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"filters"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"AssetTransactionFilters"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getAssetTransactionData"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"filters"},"value":{"kind":"Variable","name":{"kind":"Name","value":"filters"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"statistics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalTransactions"}},{"kind":"Field","name":{"kind":"Name","value":"approvedTransactions"}},{"kind":"Field","name":{"kind":"Name","value":"totalApprovedAmount"}},{"kind":"Field","name":{"kind":"Name","value":"pendingTransactions"}},{"kind":"Field","name":{"kind":"Name","value":"totalPendingAmount"}},{"kind":"Field","name":{"kind":"Name","value":"declinedTransactions"}},{"kind":"Field","name":{"kind":"Name","value":"totalDeclinedAmount"}},{"kind":"Field","name":{"kind":"Name","value":"new_sales"}},{"kind":"Field","name":{"kind":"Name","value":"total_new_sales"}},{"kind":"Field","name":{"kind":"Name","value":"flexTransactions"}},{"kind":"Field","name":{"kind":"Name","value":"totalFlexAmount"}},{"kind":"Field","name":{"kind":"Name","value":"new_flex_sales"}},{"kind":"Field","name":{"kind":"Name","value":"flex_recurring_sales"}},{"kind":"Field","name":{"kind":"Name","value":"total_flex_recurring_sales"}},{"kind":"Field","name":{"kind":"Name","value":"fullOwnershipTransactions"}},{"kind":"Field","name":{"kind":"Name","value":"totalFullOwnershipAmount"}},{"kind":"Field","name":{"kind":"Name","value":"new_fullOwnership_sales"}},{"kind":"Field","name":{"kind":"Name","value":"total_new_fullOwnership_sales"}},{"kind":"Field","name":{"kind":"Name","value":"fullOwnership_recurring_sales"}},{"kind":"Field","name":{"kind":"Name","value":"total_fullOwnership_recurring_sales"}}]}}]}}]}}]} as unknown as DocumentNode<GetAssetTransactionsStatisticsQuery, GetAssetTransactionsStatisticsQueryVariables>;
export const GetAllDefaultUsersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAllDefaultUsers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getAllDefaultUsers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DefaultUsersRow_user"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DefaultUsersRow_user"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserAdmin"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phoneNumber"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"referrer"}},{"kind":"Field","name":{"kind":"Name","value":"subscriptions"}},{"kind":"Field","name":{"kind":"Name","value":"Networth"}}]}}]} as unknown as DocumentNode<GetAllDefaultUsersQuery, GetAllDefaultUsersQueryVariables>;
export const ExportDefaultUsersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ExportDefaultUsers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getAllDefaultUsers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"DefaultUsersRow_user"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"DefaultUsersRow_user"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserAdmin"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phoneNumber"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"referrer"}},{"kind":"Field","name":{"kind":"Name","value":"subscriptions"}},{"kind":"Field","name":{"kind":"Name","value":"Networth"}}]}}]} as unknown as DocumentNode<ExportDefaultUsersQuery, ExportDefaultUsersQueryVariables>;
export const GetSuspendedPaymentPlansDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetSuspendedPaymentPlans"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"searchQuery"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"assetType"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getSuspendedPaymentPlans"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"searchQuery"},"value":{"kind":"Variable","name":{"kind":"Name","value":"searchQuery"}}},{"kind":"Argument","name":{"kind":"Name","value":"assetType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"assetType"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SuspendedPaymentPlansRow_plan"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SuspendedPaymentPlansRow_plan"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SuspendedPaymentPlans"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phoneNumber"}},{"kind":"Field","name":{"kind":"Name","value":"referrer"}},{"kind":"Field","name":{"kind":"Name","value":"asset_name"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"asset_type"}},{"kind":"Field","name":{"kind":"Name","value":"no_of_units"}},{"kind":"Field","name":{"kind":"Name","value":"amount_paid"}},{"kind":"Field","name":{"kind":"Name","value":"balance"}},{"kind":"Field","name":{"kind":"Name","value":"start_date"}},{"kind":"Field","name":{"kind":"Name","value":"next_date"}}]}}]} as unknown as DocumentNode<GetSuspendedPaymentPlansQuery, GetSuspendedPaymentPlansQueryVariables>;
export const ExportSuspendedPaymentPlansDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ExportSuspendedPaymentPlans"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"searchQuery"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"assetType"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getSuspendedPaymentPlans"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"searchQuery"},"value":{"kind":"Variable","name":{"kind":"Name","value":"searchQuery"}}},{"kind":"Argument","name":{"kind":"Name","value":"assetType"},"value":{"kind":"Variable","name":{"kind":"Name","value":"assetType"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SuspendedPaymentPlansRow_plan"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SuspendedPaymentPlansRow_plan"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"SuspendedPaymentPlans"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phoneNumber"}},{"kind":"Field","name":{"kind":"Name","value":"referrer"}},{"kind":"Field","name":{"kind":"Name","value":"asset_name"}},{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"asset_type"}},{"kind":"Field","name":{"kind":"Name","value":"no_of_units"}},{"kind":"Field","name":{"kind":"Name","value":"amount_paid"}},{"kind":"Field","name":{"kind":"Name","value":"balance"}},{"kind":"Field","name":{"kind":"Name","value":"start_date"}},{"kind":"Field","name":{"kind":"Name","value":"next_date"}}]}}]} as unknown as DocumentNode<ExportSuspendedPaymentPlansQuery, ExportSuspendedPaymentPlansQueryVariables>;
export const GetAllSuspendedUsersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAllSuspendedUsers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getAllSuspendedUsers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SuspendedUsersRow_user"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SuspendedUsersRow_user"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserAdmin"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phoneNumber"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"referrer"}},{"kind":"Field","name":{"kind":"Name","value":"subscriptions"}},{"kind":"Field","name":{"kind":"Name","value":"is_suspended"}},{"kind":"Field","name":{"kind":"Name","value":"referral_status"}},{"kind":"Field","name":{"kind":"Name","value":"gender"}},{"kind":"Field","name":{"kind":"Name","value":"country"}},{"kind":"Field","name":{"kind":"Name","value":"Networth"}}]}}]} as unknown as DocumentNode<GetAllSuspendedUsersQuery, GetAllSuspendedUsersQueryVariables>;
export const ExportSuspendedUsersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ExportSuspendedUsers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getAllSuspendedUsers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"SuspendedUsersRow_user"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"SuspendedUsersRow_user"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserAdmin"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"phoneNumber"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"referrer"}},{"kind":"Field","name":{"kind":"Name","value":"subscriptions"}},{"kind":"Field","name":{"kind":"Name","value":"is_suspended"}},{"kind":"Field","name":{"kind":"Name","value":"referral_status"}},{"kind":"Field","name":{"kind":"Name","value":"gender"}},{"kind":"Field","name":{"kind":"Name","value":"country"}},{"kind":"Field","name":{"kind":"Name","value":"Networth"}}]}}]} as unknown as DocumentNode<ExportSuspendedUsersQuery, ExportSuspendedUsersQueryVariables>;
export const UnsuspendUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UnsuspendUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"unsuspendUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<UnsuspendUserMutation, UnsuspendUserMutationVariables>;
export const EditUserDetailsByAdminDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EditUserDetailsByAdmin"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"userDetailsInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UserDetailsInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"editUserDetailsByAdmin"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"userDetailsInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"userDetailsInput"}}}]}]}}]} as unknown as DocumentNode<EditUserDetailsByAdminMutation, EditUserDetailsByAdminMutationVariables>;
export const EditUserWalletDetailsByAdminDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EditUserWalletDetailsByAdmin"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"adminWalletInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AdminWalletInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"editUserWalletDetailsByAdmin"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"adminWalletInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"adminWalletInput"}}}]}]}}]} as unknown as DocumentNode<EditUserWalletDetailsByAdminMutation, EditUserWalletDetailsByAdminMutationVariables>;
export const ModifyUserReferralStatusDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ModifyUserReferralStatus"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"modifyReferralInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ModifyReferralInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"modifyUserReferralStatus"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"modifyReferralInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"modifyReferralInput"}}}]}]}}]} as unknown as DocumentNode<ModifyUserReferralStatusMutation, ModifyUserReferralStatusMutationVariables>;
export const EditWalletCommissionDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"EditWalletCommission"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"adminWalletCommissionInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"AdminWalletCommissionInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"editWalletCommission"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"adminWalletCommissionInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"adminWalletCommissionInput"}}}]}]}}]} as unknown as DocumentNode<EditWalletCommissionMutation, EditWalletCommissionMutationVariables>;
export const UpdateUserTinDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateUserTin"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"updateUserTinInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UpdateUserTinInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateUserTin"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"updateUserTinInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"updateUserTinInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<UpdateUserTinMutation, UpdateUserTinMutationVariables>;
export const ClearUserTinDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"ClearUserTin"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"clearUserTinInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ClearUserTinInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"clearUserTin"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"clearUserTinInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"clearUserTinInput"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<ClearUserTinMutation, ClearUserTinMutationVariables>;
export const SuspendUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SuspendUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"suspendUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<SuspendUserMutation, SuspendUserMutationVariables>;
export const ViewUserReferralsByAdminDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ViewUserReferralsByAdmin"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"viewUserReferralsByAdminId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"viewUserReferralsByAdmin"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"viewUserReferralsByAdminId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"commission"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"userReferralStatus"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"phoneNumber"}},{"kind":"Field","name":{"kind":"Name","value":"status"}}]}}]}}]} as unknown as DocumentNode<ViewUserReferralsByAdminQuery, ViewUserReferralsByAdminQueryVariables>;
export const RemoveReferralByAdminDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RemoveReferralByAdmin"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"referralUpdateInput"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ReferralUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"removeReferralByAdmin"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"referralUpdateInput"},"value":{"kind":"Variable","name":{"kind":"Name","value":"referralUpdateInput"}}}]}]}}]} as unknown as DocumentNode<RemoveReferralByAdminMutation, RemoveReferralByAdminMutationVariables>;
export const GetAllUsersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAllUsers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"searchQuery"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"hasReferral"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"hasAsset"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"referralStatus"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"howDidYouHearAboutUs"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getAllUsers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}},{"kind":"Argument","name":{"kind":"Name","value":"searchQuery"},"value":{"kind":"Variable","name":{"kind":"Name","value":"searchQuery"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}},{"kind":"Argument","name":{"kind":"Name","value":"hasReferral"},"value":{"kind":"Variable","name":{"kind":"Name","value":"hasReferral"}}},{"kind":"Argument","name":{"kind":"Name","value":"hasAsset"},"value":{"kind":"Variable","name":{"kind":"Name","value":"hasAsset"}}},{"kind":"Argument","name":{"kind":"Name","value":"referralStatus"},"value":{"kind":"Variable","name":{"kind":"Name","value":"referralStatus"}}},{"kind":"Argument","name":{"kind":"Name","value":"howDidYouHearAboutUs"},"value":{"kind":"Variable","name":{"kind":"Name","value":"howDidYouHearAboutUs"}}},{"kind":"Argument","name":{"kind":"Name","value":"startDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"endDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"FragmentSpread","name":{"kind":"Name","value":"UsersTableFragment"}}]}}]}}]}},{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UsersTableFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"UserAdmin"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"referral_status"}},{"kind":"Field","name":{"kind":"Name","value":"referrer"}},{"kind":"Field","name":{"kind":"Name","value":"howYouHearAboutUs"}},{"kind":"Field","name":{"kind":"Name","value":"virtual_subscriptions"}},{"kind":"Field","name":{"kind":"Name","value":"virtual_networth"}}]}}]} as unknown as DocumentNode<GetAllUsersQuery, GetAllUsersQueryVariables>;
export const GetUserDetailsByAdminDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetUserDetailsByAdmin"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"getUserDetailsByAdminId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getUserDetailsByAdmin"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"getUserDetailsByAdminId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"Networth"}},{"kind":"Field","name":{"kind":"Name","value":"virtual_networth"}},{"kind":"Field","name":{"kind":"Name","value":"virtual_subscriptions"}},{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"address"}},{"kind":"Field","name":{"kind":"Name","value":"amount_paid"}},{"kind":"Field","name":{"kind":"Name","value":"amount_payable"}},{"kind":"Field","name":{"kind":"Name","value":"balance_payable"}},{"kind":"Field","name":{"kind":"Name","value":"referral_status"}},{"kind":"Field","name":{"kind":"Name","value":"country"}},{"kind":"Field","name":{"kind":"Name","value":"date_of_birth"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"last_login"}},{"kind":"Field","name":{"kind":"Name","value":"default_status"}},{"kind":"Field","name":{"kind":"Name","value":"employment_status"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"gender"}},{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"marital_status"}},{"kind":"Field","name":{"kind":"Name","value":"occupation"}},{"kind":"Field","name":{"kind":"Name","value":"phoneNumber"}},{"kind":"Field","name":{"kind":"Name","value":"is_suspended"}},{"kind":"Field","name":{"kind":"Name","value":"profile_pic"}},{"kind":"Field","name":{"kind":"Name","value":"referral"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"lastName"}},{"kind":"Field","name":{"kind":"Name","value":"firstName"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}},{"kind":"Field","name":{"kind":"Name","value":"kyc"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"tin"}}]}},{"kind":"Field","name":{"kind":"Name","value":"subscriptions"}},{"kind":"Field","name":{"kind":"Name","value":"transaction"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"time_of_transaction"}},{"kind":"Field","name":{"kind":"Name","value":"amount"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"transaction_type"}},{"kind":"Field","name":{"kind":"Name","value":"paystack_reference"}},{"kind":"Field","name":{"kind":"Name","value":"transfer_reference"}},{"kind":"Field","name":{"kind":"Name","value":"transfer_file"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"file"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"wallet"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"balance"}}]}},{"kind":"Field","name":{"kind":"Name","value":"units_purchased"}},{"kind":"Field","name":{"kind":"Name","value":"userName"}},{"kind":"Field","name":{"kind":"Name","value":"next_date_of_payment"}}]}}]}}]} as unknown as DocumentNode<GetUserDetailsByAdminQuery, GetUserDetailsByAdminQueryVariables>;
export const MetricsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Metrics"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getSystemUsersOverview"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"startDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"startDate"}}},{"kind":"Argument","name":{"kind":"Name","value":"endDate"},"value":{"kind":"Variable","name":{"kind":"Name","value":"endDate"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"metrics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalUsers"}},{"kind":"Field","name":{"kind":"Name","value":"referralStatusCounts"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"user"}},{"kind":"Field","name":{"kind":"Name","value":"associate"}},{"kind":"Field","name":{"kind":"Name","value":"associatePro"}}]}},{"kind":"Field","name":{"kind":"Name","value":"noReferralUsers"}},{"kind":"Field","name":{"kind":"Name","value":"users_with_assets"}},{"kind":"Field","name":{"kind":"Name","value":"flexSubscribers"}},{"kind":"Field","name":{"kind":"Name","value":"fullOwnershipSubscribers"}},{"kind":"Field","name":{"kind":"Name","value":"defaultUsers"}},{"kind":"Field","name":{"kind":"Name","value":"overdueUsers"}},{"kind":"Field","name":{"kind":"Name","value":"active_associate"}},{"kind":"Field","name":{"kind":"Name","value":"active_associate_pro"}}]}}]}}]}}]} as unknown as DocumentNode<MetricsQuery, MetricsQueryVariables>;
export const SendAssetStatementsToAdminDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"SendAssetStatementsToAdmin"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"assetId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ID"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"adminEmail"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"sendAssetStatementsToAdmin"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"assetId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"assetId"}}},{"kind":"Argument","name":{"kind":"Name","value":"adminEmail"},"value":{"kind":"Variable","name":{"kind":"Name","value":"adminEmail"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"success"}},{"kind":"Field","name":{"kind":"Name","value":"statementsCount"}}]}}]}}]} as unknown as DocumentNode<SendAssetStatementsToAdminMutation, SendAssetStatementsToAdminMutationVariables>;
export const GetAllAdminAssetsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"GetAllAdminAssets"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"page"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"limit"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getAllAdminAssets"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"page"},"value":{"kind":"Variable","name":{"kind":"Name","value":"page"}}},{"kind":"Argument","name":{"kind":"Name","value":"limit"},"value":{"kind":"Variable","name":{"kind":"Name","value":"limit"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"count"}},{"kind":"Field","name":{"kind":"Name","value":"data"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"_id"}},{"kind":"Field","name":{"kind":"Name","value":"asset_location"}},{"kind":"Field","name":{"kind":"Name","value":"asset_name"}},{"kind":"Field","name":{"kind":"Name","value":"asset_price"}},{"kind":"Field","name":{"kind":"Name","value":"asset_size"}},{"kind":"Field","name":{"kind":"Name","value":"asset_type"}},{"kind":"Field","name":{"kind":"Name","value":"asset_unit"}},{"kind":"Field","name":{"kind":"Name","value":"asset_pictures"}},{"kind":"Field","name":{"kind":"Name","value":"sold"}},{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"title"}},{"kind":"Field","name":{"kind":"Name","value":"newAsset"}},{"kind":"Field","name":{"kind":"Name","value":"asset_option"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"size"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"zero_months"}},{"kind":"Field","name":{"kind":"Name","value":"three_months"}},{"kind":"Field","name":{"kind":"Name","value":"six_months"}},{"kind":"Field","name":{"kind":"Name","value":"five_months"}},{"kind":"Field","name":{"kind":"Name","value":"seven_months"}},{"kind":"Field","name":{"kind":"Name","value":"one_month"}},{"kind":"Field","name":{"kind":"Name","value":"one_month_initial_payment"}},{"kind":"Field","name":{"kind":"Name","value":"twelve_months"}},{"kind":"Field","name":{"kind":"Name","value":"initial_payment"}},{"kind":"Field","name":{"kind":"Name","value":"five_months_initial_payment"}},{"kind":"Field","name":{"kind":"Name","value":"seven_months_initial_payment"}},{"kind":"Field","name":{"kind":"Name","value":"development_fee"}},{"kind":"Field","name":{"kind":"Name","value":"monthly_installment"}},{"kind":"Field","name":{"kind":"Name","value":"flex_payment_plans"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"description"}},{"kind":"Field","name":{"kind":"Name","value":"duration_months"}},{"kind":"Field","name":{"kind":"Name","value":"initial_payment"}},{"kind":"Field","name":{"kind":"Name","value":"monthly_installment"}},{"kind":"Field","name":{"kind":"Name","value":"price"}},{"kind":"Field","name":{"kind":"Name","value":"unit"}}]}}]}}]}}]}}]}}]} as unknown as DocumentNode<GetAllAdminAssetsQuery, GetAllAdminAssetsQueryVariables>;
export const StatisticsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"Statistics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"getAssetInventoryData"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"statistics"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"assetsSummary"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"totalAssets"}},{"kind":"Field","name":{"kind":"Name","value":"totalWorth"}},{"kind":"Field","name":{"kind":"Name","value":"totalFlexAssets"}},{"kind":"Field","name":{"kind":"Name","value":"totalFlexWorth"}},{"kind":"Field","name":{"kind":"Name","value":"totalFullOwnershipAssets"}},{"kind":"Field","name":{"kind":"Name","value":"totalFullOwnershipWorth"}}]}}]}}]}}]}}]} as unknown as DocumentNode<StatisticsQuery, StatisticsQueryVariables>;