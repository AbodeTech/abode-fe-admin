import { fetchGraphql } from "@/lib/graphql-client";
import { ReadonlyURLSearchParams } from "next/navigation";
import { graphql } from "@/lib/gql";

const GET_ADMIN_DASHBOARD_DETAILS_QUERY = graphql(`
  query GetAdminDashboardDetails($startDate: String, $endDate: String) {
    getAdminDashboardDetails(startDate: $startDate, endDate: $endDate) {
      associate_pro_users
      associate_users
      default_users
      suspended_users
      monthly_recurring_revenue
      sales
      top_associates {
        userName
        email
        gender
        amount_commissions
        amount_brought
        firstName
        lastName
        no_of_referral
      }
      top_selling_prop {
        asset_name
        asset_pictures
        asset_location
        units_subscribed
        amount_broughtin
      }
      total_payable
      users
      total_asset
      inflow
      outflow
      total_wallet_balance
      suspended_payment_plans
    }
  }
`);

export type DashboardData = NonNullable<
  Awaited<ReturnType<typeof getAdminDashboardDetails>>
>;

export const getAdminDashboardDetails = async (searchParams?: ReadonlyURLSearchParams) => {
  const startDate = searchParams?.get("start_date") || null;
  const endDate = searchParams?.get("end_date") || null;

  const variables = {
    startDate,
    endDate
  };

  // Remove nulls
  const cleanVariables = Object.fromEntries(
    Object.entries(variables).filter(([_, v]) => v !== null)
  );

  const response = await fetchGraphql(
    GET_ADMIN_DASHBOARD_DETAILS_QUERY,
    cleanVariables
  );

  return response.getAdminDashboardDetails;
};
