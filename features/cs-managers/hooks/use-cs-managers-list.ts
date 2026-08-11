"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { execute } from "@/lib/graphql-client";
import { graphql } from "@/lib/gql";
import type { AdminOption } from "../types";

/**
 * List + queue reads for the CS Manager admin surface — wired to live BE
 * (guidelines/CS_Manager_Dashboard.md).
 *
 * Admin picker queries getAllAdminWithRoles directly (inline fields, no
 * fragment) so the result is straight data — no need to unwrap through
 * useFragment. We normalize to AdminOption and cross-reference active
 * CSMs to compute isCSManager.
 */

const LIST_ADMINS_FOR_CSM_PICKER_QUERY = graphql(`
  query ListAdminsForCSMPicker {
    getAllAdminWithRoles {
      data {
        adminId
        adminName
        adminEmail
        role
      }
    }
  }
`);

const LIST_CS_MANAGERS_QUERY = graphql(`
  query ListCSManagers {
    listCSManagers {
      _id
      manager {
        _id
        userName
        email
        role
      }
      assignedCustomersCount
      assignedPlansCount
      currentPeriodScore
      activeSince
    }
  }
`);

const LIST_UNASSIGNED_CUSTOMERS_QUERY = graphql(`
  query ListUnassignedCustomers($page: Int, $limit: Int) {
    listUnassignedCustomers(page: $page, limit: $limit) {
      count
      results {
        _id
        firstName
        lastName
        email
        phone
        firstPurchaseAt
        daysUnassigned
        planCount
      }
    }
  }
`);

export const csManagersListKeys = {
  managers: () => ["cs-managers", "list"] as const,
  unassigned: (page?: number, limit?: number) =>
    ["cs-managers", "unassigned", page ?? null, limit ?? null] as const,
  adminOptions: (q: string, excludeCSManagers: boolean) =>
    ["cs-managers", "admin-options", q, excludeCSManagers] as const,
};

export const useCSManagersList = () => {
  return useQuery({
    queryKey: csManagersListKeys.managers(),
    queryFn: () => execute(LIST_CS_MANAGERS_QUERY, {}),
    select: (data) => data.listCSManagers,
  });
};

export interface UseUnassignedCustomersParams {
  page?: number;
  limit?: number;
}

export const useUnassignedCustomers = (params?: UseUnassignedCustomersParams) => {
  const page = params?.page;
  const limit = params?.limit;
  return useQuery({
    queryKey: csManagersListKeys.unassigned(page, limit),
    queryFn: () =>
      execute(LIST_UNASSIGNED_CUSTOMERS_QUERY, {
        page: page ?? null,
        limit: limit ?? null,
      }),
    select: (data) => data.listUnassignedCustomers,
  });
};

/** Best-effort split of "First Last" (or "Last First" via userName) into
 * separate name fields. BE's AdminRoles row only gives us a single
 * adminName string; we split on the first whitespace so consumers can
 * render initials + full name consistently with the rest of the app. */
const splitAdminName = (adminName: string) => {
  const parts = adminName.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { firstName: null, lastName: null };
  if (parts.length === 1) return { firstName: parts[0], lastName: null };
  const [firstName, ...rest] = parts;
  return { firstName, lastName: rest.join(" ") };
};

/** Admin picker — normalizes the AdminRoles row shape into AdminOption
 * and cross-references active CSMs to compute isCSManager. Optionally
 * excludes existing CSMs (used by the promotion dialog). */
export const useAdminOptions = (
  query: string,
  opts?: { excludeCSManagers?: boolean }
) => {
  const excludeCSManagers = opts?.excludeCSManagers ?? false;
  const { data: adminsData, isLoading: adminsLoading, error: adminsError } =
    useQuery({
      queryKey: ["cs-managers", "admin-picker-source"] as const,
      queryFn: () => execute(LIST_ADMINS_FOR_CSM_PICKER_QUERY, {}),
      select: (data) => data.getAllAdminWithRoles?.data ?? [],
    });
  const { data: csManagers = [], isLoading: csmLoading } = useCSManagersList();

  const activeCSMIds = useMemo(
    () => new Set(csManagers.map((c) => c.manager._id)),
    [csManagers]
  );

  const options = useMemo<AdminOption[]>(() => {
    const q = query.trim().toLowerCase();
    return (adminsData ?? [])
      .map<AdminOption>((row) => {
        const { firstName, lastName } = splitAdminName(row.adminName);
        return {
          _id: row.adminId,
          firstName,
          lastName,
          email: row.adminEmail,
          role: row.role,
          isCSManager: activeCSMIds.has(row.adminId),
        };
      })
      .filter((a) => {
        if (excludeCSManagers && a.isCSManager) return false;
        if (!q) return true;
        const name = `${a.firstName ?? ""} ${a.lastName ?? ""}`.toLowerCase();
        return name.includes(q) || a.email.toLowerCase().includes(q);
      });
  }, [adminsData, activeCSMIds, query, excludeCSManagers]);

  return {
    data: options,
    isLoading: adminsLoading || csmLoading,
    error: adminsError,
  };
};
