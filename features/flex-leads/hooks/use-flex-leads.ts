"use client";

import { useQuery } from "@tanstack/react-query";

import { executeRaw } from "@/lib/graphql-client";

import {
  getDummyFlexLeadCounts,
  getDummyFlexLeads,
  USE_DUMMY_FLEX_LEADS,
} from "./dummy-flex-leads";
import { flexLeadKeys, type FlexLeadListFilters } from "./query-keys";
import type { FlexLeadRow, FlexLeadStatus, FlexLeadType } from "./types";

export type { FlexLeadRow, FlexLeadStatus, FlexLeadType };

/* ============================================================
 * Flex Leads — brochure downloads + site-inspection bookings.
 *
 * Matches the public Flex form payload on abode-v2
 * (fullName, email, phone, location for inspections).
 *
 * Expected BE GraphQL (swap executeRaw → graphql() + codegen when live):
 *   getFlexLeads(page, limit, filters) → { count, data }
 *   flexLeadCounts → { new, contacted, scheduled, completed, closed }
 *
 * While USE_DUMMY_FLEX_LEADS is true, hooks serve in-memory sample data
 * so the admin UI can be reviewed before the API exists.
 * ============================================================ */

export const DEFAULT_FLEX_LEADS_LIMIT = 10;

type ApiFlexLead = {
  id?: string;
  _id?: string;
  type?: string;
  leadType?: string;
  fullName?: string;
  full_name?: string;
  email?: string;
  phone?: string;
  location?: string | null;
  status?: string;
  adminNotes?: string | null;
  admin_notes?: string | null;
  createdAt?: string | number | null;
  created_at?: string | number | null;
  updatedAt?: string | number | null;
  updated_at?: string | number | null;
};

type GetFlexLeadsResponse = {
  getFlexLeads: {
    count: number;
    data: ApiFlexLead[];
  };
};

type FlexLeadCountsResponse = {
  flexLeadCounts: {
    new: number;
    contacted: number;
    scheduled: number;
    completed: number;
    closed: number;
  };
};

const GET_FLEX_LEADS_QUERY = `
  query GetFlexLeads($page: Int, $limit: Int, $filters: FlexLeadFilters) {
    getFlexLeads(page: $page, limit: $limit, filters: $filters) {
      count
      data {
        id
        type
        fullName
        email
        phone
        location
        status
        adminNotes
        createdAt
        updatedAt
      }
    }
  }
`;

const FLEX_LEAD_COUNTS_QUERY = `
  query FlexLeadCounts {
    flexLeadCounts {
      new
      contacted
      scheduled
      completed
      closed
    }
  }
`;

const STATUS_SET = new Set<FlexLeadStatus>([
  "new",
  "contacted",
  "scheduled",
  "completed",
  "closed",
]);

const toIsoDate = (value: unknown): string | null => {
  if (value == null) return null;
  let input = value;
  if (typeof input === "string" && /^\d+$/.test(input)) input = Number(input);
  if (typeof input === "string" || typeof input === "number") {
    const date = new Date(input);
    return Number.isNaN(date.getTime()) ? null : date.toISOString();
  }
  return null;
};

const toStatus = (value: string | undefined): FlexLeadStatus =>
  value && STATUS_SET.has(value as FlexLeadStatus)
    ? (value as FlexLeadStatus)
    : "new";

const toType = (value: string | undefined): FlexLeadType =>
  value === "site_inspection" || value === "site-inspection"
    ? "site_inspection"
    : "brochure";

function mapRow(row: ApiFlexLead): FlexLeadRow {
  return {
    id: String(row.id ?? row._id ?? ""),
    type: toType(row.type ?? row.leadType),
    fullName: (row.fullName ?? row.full_name ?? "").trim() || "Unknown",
    email: row.email ?? "",
    phone: row.phone ?? "",
    location: row.location?.trim() || null,
    status: toStatus(row.status),
    adminNotes: row.adminNotes ?? row.admin_notes ?? null,
    createdAt: toIsoDate(row.createdAt ?? row.created_at) ?? "",
    updatedAt: toIsoDate(row.updatedAt ?? row.updated_at),
  };
}

export function useFlexLeads(filters: FlexLeadListFilters) {
  return useQuery({
    queryKey: flexLeadKeys.list(filters),
    queryFn: async (): Promise<{ count: number; data: FlexLeadRow[] }> => {
      if (USE_DUMMY_FLEX_LEADS) {
        return getDummyFlexLeads(filters);
      }
      const data = await executeRaw<GetFlexLeadsResponse>(GET_FLEX_LEADS_QUERY, {
        page: filters.page,
        limit: filters.limit,
        filters: {
          status: filters.status === "all" ? undefined : filters.status,
          type: filters.type === "all" ? undefined : filters.type,
          search: filters.search.trim() || undefined,
        },
      });
      return {
        count: data.getFlexLeads.count,
        data: data.getFlexLeads.data.map(mapRow),
      };
    },
  });
}

export function useFlexLeadCounts() {
  return useQuery({
    queryKey: flexLeadKeys.counts(),
    queryFn: async () => {
      if (USE_DUMMY_FLEX_LEADS) {
        return getDummyFlexLeadCounts();
      }
      const data = await executeRaw<FlexLeadCountsResponse>(
        FLEX_LEAD_COUNTS_QUERY
      );
      return data.flexLeadCounts;
    },
  });
}
