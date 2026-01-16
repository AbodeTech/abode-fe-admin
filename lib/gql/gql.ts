/* eslint-disable */
import * as types from './graphql';
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';

/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 * Learn more about it here: https://the-guild.dev/graphql/codegen/plugins/presets/preset-client#reducing-bundle-size
 */
type Documents = {
    "\n  query GetAdminDashboardDetails($startDate: String, $endDate: String) {\n    getAdminDashboardDetails(startDate: $startDate, endDate: $endDate) {\n      associate_pro_users\n      associate_users\n      default_users\n      suspended_users\n      monthly_recurring_revenue\n      sales\n      top_associates {\n        userName\n        email\n        gender\n        amount_commissions\n        amount_brought\n        firstName\n        lastName\n        no_of_referral\n      }\n      top_selling_prop {\n        asset_name\n        asset_pictures\n        asset_location\n        units_subscribed\n        amount_broughtin\n      }\n      total_payable\n      users\n      total_asset\n      inflow\n      outflow\n      total_wallet_balance\n      suspended_payment_plans\n    }\n  }\n": typeof types.GetAdminDashboardDetailsDocument,
};
const documents: Documents = {
    "\n  query GetAdminDashboardDetails($startDate: String, $endDate: String) {\n    getAdminDashboardDetails(startDate: $startDate, endDate: $endDate) {\n      associate_pro_users\n      associate_users\n      default_users\n      suspended_users\n      monthly_recurring_revenue\n      sales\n      top_associates {\n        userName\n        email\n        gender\n        amount_commissions\n        amount_brought\n        firstName\n        lastName\n        no_of_referral\n      }\n      top_selling_prop {\n        asset_name\n        asset_pictures\n        asset_location\n        units_subscribed\n        amount_broughtin\n      }\n      total_payable\n      users\n      total_asset\n      inflow\n      outflow\n      total_wallet_balance\n      suspended_payment_plans\n    }\n  }\n": types.GetAdminDashboardDetailsDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 *
 *
 * @example
 * ```ts
 * const query = graphql(`query GetUser($id: ID!) { user(id: $id) { name } }`);
 * ```
 *
 * The query argument is unknown!
 * Please regenerate the types.
 */
export function graphql(source: string): unknown;

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "\n  query GetAdminDashboardDetails($startDate: String, $endDate: String) {\n    getAdminDashboardDetails(startDate: $startDate, endDate: $endDate) {\n      associate_pro_users\n      associate_users\n      default_users\n      suspended_users\n      monthly_recurring_revenue\n      sales\n      top_associates {\n        userName\n        email\n        gender\n        amount_commissions\n        amount_brought\n        firstName\n        lastName\n        no_of_referral\n      }\n      top_selling_prop {\n        asset_name\n        asset_pictures\n        asset_location\n        units_subscribed\n        amount_broughtin\n      }\n      total_payable\n      users\n      total_asset\n      inflow\n      outflow\n      total_wallet_balance\n      suspended_payment_plans\n    }\n  }\n"): (typeof documents)["\n  query GetAdminDashboardDetails($startDate: String, $endDate: String) {\n    getAdminDashboardDetails(startDate: $startDate, endDate: $endDate) {\n      associate_pro_users\n      associate_users\n      default_users\n      suspended_users\n      monthly_recurring_revenue\n      sales\n      top_associates {\n        userName\n        email\n        gender\n        amount_commissions\n        amount_brought\n        firstName\n        lastName\n        no_of_referral\n      }\n      top_selling_prop {\n        asset_name\n        asset_pictures\n        asset_location\n        units_subscribed\n        amount_broughtin\n      }\n      total_payable\n      users\n      total_asset\n      inflow\n      outflow\n      total_wallet_balance\n      suspended_payment_plans\n    }\n  }\n"];

export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}

export type DocumentType<TDocumentNode extends DocumentNode<any, any>> = TDocumentNode extends DocumentNode<  infer TType,  any>  ? TType  : never;