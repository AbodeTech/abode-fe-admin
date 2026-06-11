
import { execute } from '@/lib/graphql-client';
import { graphql } from '@/lib/gql';
// @ts-ignore
import { Parser } from 'json2csv';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { SalesFilters } from './use-sales';

const EXPORT_SALES_QUERY = graphql(`
  query ExportSales($filters: SalesRecordFilters, $limit: Int!, $page: Int!) {
    getSalesRecord(filters: $filters, limit: $limit, page: $page) {
      data {
        user_firstName
        user_lastName
        email
        user_phone
        referrer_name
        referrer_email
        referrer_phone
        asset_name
        asset_type
        no_of_units
        size
        price
        amount_paid
        fullownerhsip_documentprice
        document_amount_paid
        month_subscription
        start_date
        next_date
        default_amount
        is_suspended
        amount_payable
        balance
        payment_plan_id
        unique_asset_id
        months_covered
        month_remaining
        allocation_status
        payment_plan_created_at
        payment_plan_updated_at
      }
    }
  }
`);

export type SalesExportFormat = 'csv' | 'xlsx';

// Kept for backward compatibility if needed, though we seem to only use raw fetching now
export const downloadSalesData = async ({ payload }: { payload: SalesFilters }) => {
  const { search, startDate, endDate, assetType } = payload;
  const res = await execute(EXPORT_SALES_QUERY, {
    page: 1,
    limit: 1_000_000,
    filters: {
      search,
      startDate,
      endDate,
      assetType,
    },
  });
  return res;
};
