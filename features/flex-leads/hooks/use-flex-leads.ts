"use client";

import { useQuery } from "@tanstack/react-query";

import { executeRaw } from "@/lib/graphql-client";

import { flexLeadKeys, type FlexLeadListFilters } from "./query-keys";
import type { FlexLeadRow, FlexLeadStatus, FlexLeadType } from "./types";

export type { FlexLeadRow, FlexLeadStatus, FlexLeadType };

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

export const DEFAULT_FLEX_LEADS_LIMIT = 10;

type ApiFlexLead = {
  id: string;
  type: string;
  fullName: string;
  email: string;
  phone: string;
  location?: string | null;
  status: string;
  adminNotes?: string | null;
  createdAt?: string | number | null;
  updatedAt?: string | number | null;
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
  value === "site_inspection" ? "site_inspection" : "brochure";

export function useFlexLeads(filters: FlexLeadListFilters) {
  return useQuery({
    queryKey: flexLeadKeys.list(filters),
    queryFn: async (): Promise<{ count: number; data: FlexLeadRow[] }> => {
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
        data: data.getFlexLeads.data.map((row) => ({
          id: row.id,
          type: toType(row.type),
          fullName: row.fullName.trim() || "Unknown",
          email: row.email,
          phone: row.phone,
          location: row.location?.trim() || null,
          status: toStatus(row.status),
          adminNotes: row.adminNotes ?? null,
          createdAt: toIsoDate(row.createdAt) ?? "",
          updatedAt: toIsoDate(row.updatedAt),
        })),
      };
    },
  });
}

export function useFlexLeadCounts() {
  return useQuery({
    queryKey: flexLeadKeys.counts(),
    queryFn: async () => {
      const data = await executeRaw<FlexLeadCountsResponse>(
        FLEX_LEAD_COUNTS_QUERY
      );
      return data.flexLeadCounts;
    },
  });
}
